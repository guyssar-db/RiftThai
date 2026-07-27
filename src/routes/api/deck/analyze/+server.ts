import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getRagConfig } from '$lib/server/rag/config';
import { generateGeminiContent } from '$lib/server/rag/gemini';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';
import cardsData from '$lib/data/cards.json';

type Card = {
	code: string;
	name_th: string;
	name_en: string;
	type: string;
	cost_energy?: number | null;
	cost_power?: string | null;
	domains?: string[];
	ability_th?: string;
	ability_en?: string;
};

export const POST = async ({ cookies, request, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบเพื่อใช้งานระบบวิเคราะห์เด็คด้วย AI' }, { status: 401 });

	const config = getRagConfig();
	if (!config.geminiApiKey) {
		return json({ error: 'ระบบ AI ยังไม่ได้ตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์' }, { status: 503 });
	}

	// Rate Limiting (user and IP)
	let ip = 'unknown';
	try {
		ip = getClientAddress();
	} catch {}

	const cleanIp = clientKey(ip);
	const ipLimit = checkRateLimit(`deck-analyze:ip:${cleanIp}`, { windowMs: 120_000, max: 6 });
	const userLimit = checkRateLimit(`deck-analyze:user:${user.id}`, { windowMs: 120_000, max: 3 });

	const limited = ipLimit.limited ? ipLimit : userLimit;
	if (limited.limited) {
		return json(
			{ error: 'คุณเรียกใช้งานวิเคราะห์เด็คถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง' },
			{ status: 429, headers: rateLimitHeaders(limited.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ error: 'ข้อมูลคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const entries = body.entries as Array<{ code: string; quantity: number }> || [];
	const championCode = body.championCode as string || '';

	if (!entries.length && !championCode) {
		return json({ error: 'ไม่พบข้อมูลการ์ดในเด็ค' }, { status: 400 });
	}

	// Limit entries length (distinct cards)
	if (entries.length > 100) {
		return json({ error: 'จำนวนการ์ดประเภทต่างๆ ในเด็คมากเกินไป' }, { status: 400 });
	}

	// Validate inputs
	if (typeof championCode === 'string' && championCode.length > 100) {
		return json({ error: 'ข้อมูล Champion ไม่ถูกต้อง' }, { status: 400 });
	}

	let totalQuantity = 0;
	for (const entry of entries) {
		if (typeof entry.code !== 'string' || entry.code.length > 100) {
			return json({ error: 'รหัสการ์ดไม่ถูกต้อง' }, { status: 400 });
		}
		if (typeof entry.quantity !== 'number' || entry.quantity < 1 || entry.quantity > 10) {
			return json({ error: 'จำนวนการ์ดต้องอยู่ระหว่าง 1 ถึง 10 ใบต่อหนึ่งประเภท' }, { status: 400 });
		}
		totalQuantity += entry.quantity;
	}

	if (totalQuantity > 150) {
		return json({ error: 'จำนวนการ์ดทั้งหมดในเด็คต้องไม่เกิน 150 ใบ' }, { status: 400 });
	}

	const cards = cardsData as Card[];

	// Resolve champion details
	const champion = cards.find((c) => c.code === championCode) || null;

	// Resolve main deck and rune cards details
	const resolvedEntries = entries.map((entry) => {
		const card = cards.find((c) => c.code === entry.code);
		return {
			card,
			quantity: entry.quantity
		};
	}).filter((e) => e.card);

	const mainDeck = resolvedEntries.filter((e) => e.card?.type !== 'Rune');
	const runeDeck = resolvedEntries.filter((e) => e.card?.type === 'Rune');

	// Compute quick stats for prompt context
	const totalMainCards = mainDeck.reduce((sum, e) => sum + e.quantity, 0);
	const totalRuneCards = runeDeck.reduce((sum, e) => sum + e.quantity, 0);
	
	const energyCosts = mainDeck
		.filter((e) => typeof e.card?.cost_energy === 'number')
		.map((e) => (e.card?.cost_energy as number) * e.quantity);
	const avgEnergy = energyCosts.length ? (energyCosts.reduce((s, c) => s + c, 0) / energyCosts.length).toFixed(2) : '0';

	// Count domains/elements distribution
	const domainCounts: Record<string, number> = {};
	mainDeck.forEach((e) => {
		const cardDomains = e.card?.domains || [];
		cardDomains.forEach((domain) => {
			domainCounts[domain] = (domainCounts[domain] || 0) + e.quantity;
		});
	});

	// Compile the deck structure text for Gemini
	const deckSummaryText = [
		`Champion: ${champion ? `${champion.name_th} (${champion.name_en})` : 'ไม่ระบุ'}`,
		`สถิติเด็ค:`,
		`- การ์ดเด็คหลักทั้งหมด: ${totalMainCards} ใบ`,
		`- การ์ดรูนทั้งหมด: ${totalRuneCards} ใบ`,
		`- ค่าเฉลี่ย Energy: ${avgEnergy}`,
		`- สัดส่วนธาตุ/โดเมนหลัก: ${Object.entries(domainCounts).map(([k, v]) => `${k} (${v} ใบ)`).join(', ')}`,
		``,
		`รายชื่อการ์ดในเด็คหลัก (Main Deck):`,
		...mainDeck.map((e) => {
			const c = e.card!;
			return `- [${e.quantity} ใบ] ${c.name_th} (${c.name_en}) | ประเภท: ${c.type} | Cost: Energy ${c.cost_energy ?? 0}${c.cost_power ? `, Rune ${c.cost_power}` : ''} | ธาตุ: ${c.domains?.join('/') ?? 'ไม่มี'}\n  ความสามารถ: ${c.ability_th || c.ability_en || 'ไม่มี'}`;
		}),
		``,
		`รายชื่อการ์ดรูน (Rune Deck):`,
		...runeDeck.map((e) => {
			const c = e.card!;
			return `- [${e.quantity} ใบ] ${c.name_th} (${c.name_en}) | ธาตุ: ${c.domains?.join('/') ?? 'ไม่มี'}\n  ความสามารถ: ${c.ability_th || c.ability_en || 'ไม่มี'}`;
		})
	].join('\n');

	// Call Gemini API to generate critique
	try {
		const systemInstruction = 
			'คุณคือโค้ดผู้เชี่ยวชาญการวิเคราะห์และจัดเด็คเกม Riftbound TCG ภาษาไทย ' +
			'ทำหน้าที่วิเคราะห์เชิงลึกให้กับเด็คของผู้เล่นโดยละเอียด ให้ใช้โครงสร้างการรายงานเป็นภาษาไทยในรูปแบบ Markdown ' +
			'ที่สะอาดตา เป็นระเบียบ และสวยงามตามหลักเกณฑ์ต่อไปนี้:\n\n' +
			'1. โครงสร้างหัวข้อที่ชัดเจน:\n' +
			'   - ใช้ `##` สำหรับหัวข้อหลัก (เช่น `## 📊 ภาพรวมและสถิติเด็ค`, `## 💪 จุดเด่นและการทำงานร่วมกัน`, `## ⚠️ จุดอ่อนและโครงสร้างทรัพยากร`, `## 💡 ข้อเสนอแนะและการปรับปรุง`, `## 🌟 การ์ดแนะนำเพิ่มเติม 3 ใบ`)\n' +
			'   - ใช้ `###` สำหรับหัวข้อย่อย\n' +
			'   - ใช้ `**ตัวหนา**` เพื่อเน้นคำสำคัญ หรือเน้นการ์ดสำคัญ\n' +
			'   - ใช้ `* หัวข้อย่อย` หรือ `- หัวข้อย่อย` เพื่อทำรายการแสดงรายละเอียด\n' +
			'   - ใช้เครื่องหมายคำพูด หรือ blockquote ในจุดที่เหมาะสม\n\n' +
			'2. เกณฑ์การวิเคราะห์เนื้อหา:\n' +
			'   - **Energy Curve**: วิเคราะห์ว่าค่าเฉลี่ยของ Energy สูงหรือต่ำเกินไปหรือไม่ (ค่าเฉลี่ย > 2.5 ถือว่าค่อนข้างหนัก อาจจมเทิร์นแรกๆ ได้, < 1.5 ถือว่าเบาแต่อาจขาดพลังช่วงท้ายเกม)\n' +
			'   - **Rune & Domain Alignment**: ตรวจสอบว่าโดเมน/ธาตุของการ์ดในเด็คหลัก สอดคล้องกับการ์ดรูนที่จัดไว้ใน Rune Deck หรือไม่ มีความขัดแย้งของธาตุ (ธาตุไม่พอใช้) หรือไม่\n' +
			'   - **Champion Synergy**: Champion ที่เลือกสอดคล้องกับแนวทางเด็คหรือไม่\n' +
			'   - **การ์ดแนะนำ 3 ใบ**: ระบุการ์ดแนะนำ 3 ใบที่ไม่อยู่ในเด็คปัจจุบัน แต่อาจเข้ามาช่วยปิดจุดอ่อนหรือเสริมจุดแข็งได้ดีที่สุด โดยต้องระบุชื่อการ์ดเป็น `**ชื่อไทย (ชื่ออังกฤษ)**` พร้อมอธิบายบทบาทและเหตุผลการทำงานร่วมกันชัดเจน';

		const contents = [
			{
				role: 'user',
				parts: [
					{
						text: [
							`ช่วยวิเคราะห์เด็ค Riftbound นี้อย่างละเอียดตามหลักเกณฑ์ของคุณด้วย:\n`,
							deckSummaryText,
							`\nโปรดส่งรายงานการวิเคราะห์ที่จัดรูปแบบอย่างสวยงาม จัดกลุ่มข้อมูลด้วย bullet point หรือตารางย่อยหากจำเป็น เพื่อให้อ่านง่ายและเป็นมืออาชีพที่สุด`
						].join('\n')
					}
				]
			}
		];

		const analysis = await generateGeminiContent(systemInstruction, contents, {
			temperature: 0.7,
			topP: 0.9,
			maxOutputTokens: 2048
		});

		return json({ analysis });
	} catch (error) {
		console.error('AI Deck analysis failed:', error);
		const message = error instanceof Error ? error.message : 'ระบบ AI เกิดข้อผิดพลาดในการประมวลผล';
		return json({ error: message }, { status: 500 });
	}
};
