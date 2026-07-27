import { domainAnswers, type DomainAnswer } from '$lib/data/domainAnswers';
import { iconMappings, keywords } from '$lib/data/keywords';
import { ruleAnswers, type RuleAnswer } from '$lib/data/ruleAnswers';
import { spiritforgedFaq } from '$lib/data/spiritforgedFaq';
import type { Card } from '$lib/types/card';

export type QAAnswer = {
	category: string;
	question: string;
	answer: string;
};

export type PhaseAnswer = {
	title: string;
	aliases: string[];
	text: string;
};

export type ScoredRule = {
	rule: RuleAnswer;
	score: number;
};

export type ScoredDomain = {
	domain: DomainAnswer;
	score: number;
};

export type ScoredCard = {
	card: Card;
	score: number;
};

export type ScoredKeyword = {
	keyword: (typeof keywords)[number];
	score: number;
};

export type ScoredQA = {
	item: QAAnswer;
	score: number;
};

export type ScoredPhase = {
	phase: PhaseAnswer;
	score: number;
};

export const qaAnswers: QAAnswer[] = [
	...spiritforgedFaq,
	{
		category: 'Keywords & Abilities',
		question: 'สกิล Soaring Scout ที่เขียนว่า DEATHKNELL: Channel 1 rune exhausted ทำงานอย่างไร?',
		answer:
			'เมื่อ Soaring Scout ตาย Deathknell จะทำให้ Channel rune 1 ใบเข้ามาในสนามแบบ exhausted จึงยังใช้ Energy จากรูนนั้นในเทิร์นนั้นทันทีไม่ได้'
	},
	{
		category: 'Card Mechanics',
		question: 'Consult the Past ที่มี Hidden ต้องจ่ายและวางไว้ตรงไหน?',
		answer:
			'ตามข้อมูล Q&A ในเว็บ การ์ด Hidden สามารถจ่ายล่วงหน้าโดย recycle rune 1 ใบเพื่อวางคว่ำไว้ที่ battlefield ที่เลือก แล้วค่อยเปิดใช้จาก facedown ภายหลัง'
	},
	{
		category: 'Keywords & Abilities',
		question: 'Reaction ใช้ตอนไหนได้บ้าง?',
		answer:
			'Reaction ใช้เพื่อสวนกลับหรือขัดจังหวะได้เมื่อมี priority รวมถึงในเทิร์นคู่แข่งและช่วงต่อสู้ ตามข้อมูลในเว็บใช้ตอบสิ่งที่อยู่บน chain ได้'
	},
	{
		category: 'Rules & Combat',
		question: 'Spirit Token ที่เพิ่งเสกออกมาเปิด Showdown ในเทิร์นนั้นได้ไหม?',
		answer:
			'ไม่ได้ ถ้า token เข้ามาแบบ exhausted จะยังสั่ง exhaust เพื่อเปิด Showdown ไม่ได้ ต้องรอให้พร้อมก่อน แต่ยังนับ Might เพื่อร่วมตั้งรับได้'
	},
	{
		category: 'Card Mechanics',
		question: 'Cull the Weak ร่ายได้ไหมถ้าบอร์ดเราว่าง?',
		answer:
			'ร่ายได้ ตามข้อมูล Q&A ระบบจะทำตามเอฟเฟกต์ให้ได้มากที่สุด เราไม่มี unit ให้ทำลายก็ไม่ต้องทำลายอะไร ส่วนอีกฝ่ายยังต้องเลือกทำลาย unit ของตัวเองถ้ามี'
	},
	{
		category: 'Rules & Scoring',
		question: 'Hold และ Ahri, Alluring ได้แต้มตอนไหน?',
		answer:
			'ข้อมูลในเว็บระบุว่า Hold scoring และสกิลที่เกี่ยวข้องเกิดช่วงเริ่มเทิร์นของคุณ ถ้าคุม battlefield อยู่จะได้แต้มตามเงื่อนไขของกฎหรือการ์ด'
	},
	{
		category: 'Keywords & Abilities',
		question: 'Stun จำกัดอะไร และหายตอนไหน?',
		answer:
			'ยูนิตที่ติด Stun จะไม่สามารถโจมตี เคลื่อนที่ หรือใช้ activated ability ที่ต้อง exhaust ได้ตามปกติ และจะหายตาม timing ที่กฎหรือเอฟเฟกต์กำหนด'
	},
	{
		category: 'Rules & Healing',
		question: 'Heal ล้างดาเมจสะสมตอนไหน?',
		answer:
			'ข้อมูลในเว็บสรุปว่า damage ที่สะสมบน unit จะถูกล้างตามช่วง cleanup/จบ combat หรือ end of turn ตาม timing ที่กฎและเอฟเฟกต์ระบุ'
	},
	{
		category: 'Rules & Movement',
		question: 'Move unit ข้ามจาก battlefield หนึ่งไปอีก battlefield ได้ไหม?',
		answer:
			'การ move ปกติไม่ได้ข้าม battlefield เอง แต่ถ้าการ์ดหรือ ability สั่ง Move a unit ก็สามารถข้ามข้อจำกัดปกติได้ตามข้อความการ์ด'
	},
	{
		category: 'Rules & Timing',
		question: 'Action กับ Reaction ต่างกันยังไง?',
		answer:
			'Action ใช้ตอบ chain ไม่ได้และต้องเล่นตอนที่ timing เปิดให้ทำ action ส่วน Reaction ใช้ตอนมี priority และใช้ตอบสิ่งที่อยู่บน chain ได้'
	},
	{
		category: 'Rules & Showdown',
		question: 'Showdown เกิดขึ้นเมื่อไหร่?',
		answer:
			'ข้อมูลในเว็บสรุปว่า Showdown เกี่ยวกับการ contest battlefield และในกฎล่าสุด Showdown จะถูก staged ระหว่าง cleanup หลัง battlefield ได้รับสถานะ Contested'
	},
	{
		category: 'Rules & Chain',
		question: 'Chain เกิดจากอะไร?',
		answer:
			'Chain เกิดจากการเล่น spell, activated ability หรือ triggered ability ที่ต้องเข้าลำดับการ resolve ผู้เล่นจึงมีจังหวะใช้ Reaction ตาม priority'
	},
	{
		category: 'Rules & Resources',
		question: 'Recycle rune ที่ exhausted ได้ไหม?',
		answer:
			'ข้อมูล Q&A ในเว็บระบุว่าสามารถ recycle rune ที่ exhausted อยู่ได้ ไม่จำเป็นต้องเลือกรูนที่ ready เท่านั้น'
	},
	{
		category: 'Rules & Targeting',
		question: 'อะไรถือว่าเป็น target?',
		answer:
			'โดยสรุป target มักเป็น object หรือผู้เล่นใน public zone ที่ถูกผู้เล่นคนเดียวเลือกให้ spell หรือ ability กระทบโดยตรง การให้ผู้เล่นแต่ละคนเลือกของตัวเองมักไม่ถือว่า target'
	},
	{
		category: 'Rules & Tokens',
		question: 'Token ที่ไม่มี cost ถือว่า cost เท่าไหร่?',
		answer:
			'สำหรับเอฟเฟกต์ที่ต้องดู cost ของ token ข้อมูลในเว็บสรุปให้ถือว่า token มี cost เป็น 0'
	},
	{
		category: 'Rules & Multiplayer',
		question: 'ใน 2v2 friendly unit หมายถึงอะไร?',
		answer:
			'Friendly unit หมายถึง unit ของคุณและ unit ของเพื่อนร่วมทีม แต่คำว่า your units โดยทั่วไปหมายถึง unit ที่คุณควบคุมเอง'
	}
];

export const phaseAnswers: PhaseAnswer[] = [
	{
		title: 'Awaken Phase',
		aliases: ['awaken', 'ready', 'เฟสเตรียมพร้อม', 'ตั้งตรง', 'stun หาย'],
		text: 'Awaken Phase คือช่วงเตรียมพร้อม: ถอด Stun และทำให้การ์ดที่ exhausted อยู่ เช่น units, runes, champions และ gear กลับมา ready'
	},
	{
		title: 'Beginning Phase',
		aliases: ['beginning', 'start', 'start of turn', 'เฟสเริ่มต้น', 'hold'],
		text: 'Beginning Phase คือช่วงเริ่มเทิร์น ใช้ตรวจ Hold scoring และให้ความสามารถประเภท start of turn ทำงาน'
	},
	{
		title: 'Channel Phase',
		aliases: ['channel', 'rune', 'เฟสรูน', 'รูน'],
		text: 'Channel Phase คือช่วงนำ rune จาก Rune Deck เข้าสู่สนาม โดยข้อมูลในเว็บระบุว่าปกติ channel 2 ใบ และผู้เล่นคนที่สองในเทิร์นแรกได้เพิ่มเป็น 3 ใบ'
	},
	{
		title: 'Draw Phase',
		aliases: ['draw', 'เฟสจั่ว', 'จั่ว'],
		text: 'Draw Phase คือช่วงจั่วการ์ด 1 ใบจาก Main Deck ขึ้นมือ'
	},
	{
		title: 'Action Phase',
		aliases: ['action phase', 'เฟสหลัก', 'play card', 'set hidden', 'use ability', 'move unit'],
		text: 'Action Phase คือเฟสหลัก ผู้เล่นสามารถ play card, set hidden, use ability และ move unit ได้ตามทรัพยากรและ timing ที่อนุญาต'
	},
	{
		title: 'End Of Turn',
		aliases: ['end', 'end of turn', 'เฟสจบเทิร์น', 'จบเทิร์น', 'global heal'],
		text: 'End of Turn คือช่วงจบเทิร์น ผลแบบ this turn หมดลง มีการล้าง damage ตามข้อมูล flow ในเว็บ และส่งเทิร์นให้ผู้เล่นถัดไป'
	},
	{
		title: 'Combat Timeline',
		aliases: ['combat', 'showdown', 'assign damage', 'deathknell', 'contested check', 'ต่อสู้'],
		text: 'Combat timeline ในเว็บเรียงเป็น Pre-Combat Window, Assign Damage, Combat Cleanup & Deathknell, Contested Check และ Global Heal'
	},
	{
		title: 'Card Speeds',
		aliases: ['normal speed', 'action speed', 'reaction speed', 'speed', 'ความเร็ว'],
		text: 'ข้อมูลหน้า phases แบ่งความเร็วเป็น Normal Speed, Action Speed และ Reaction Speed โดย Reaction ใช้ตอบ chain ได้ ส่วน Action ต้องรอ chain ว่าง'
	}
];

export const stopWords = new Set([
	'คือ',
	'อะไร',
	'ยังไง',
	'อย่างไร',
	'ได้ไหม',
	'มั้ย',
	'ไหม',
	'การ',
	'ของ',
	'ที่',
	'ใน',
	'และ',
	'หรือ',
	'ถ้า',
	'can',
	'what',
	'when',
	'how',
	'does',
	'the',
	'a',
	'an',
	'is',
	'to',
	'of',
	'domain'
]);

export const cardSearchStopWords = new Set([
	...stopWords,
	'เป็น',
	'อะไร',
	'ไหม',
	'มั้ย',
	'ใบนี้',
	'การ์ด',
	'ประเภท',
	'ชนิด',
	'สี',
	'ชุด',
	'ค่าร่าย',
	'ทำอะไร',
	'สกิล',
	'ความสามารถ',
	'type',
	'domain',
	'cost',
	'energy',
	'set',
	'rarity',
	'tag',
	'tags',
	'ability',
	'power',
	'might',
	'card'
]);

export const noAnswerText =
	'ข้อนี้ผมยังตอบให้มั่นใจไม่ได้จากข้อมูลที่มีในเว็บ เลยไม่อยากเดาให้ผิด ถ้าเป็นเคสเฉพาะการ์ด ให้ลองเช็กข้อความบนการ์ดหรือ official rules เพิ่มอีกชั้น';

export const aiDisclaimer =
	'หมายเหตุ: คำตอบจาก AI และข้อมูลใน RiftThai อาจไม่ถูกต้อง 100% สำหรับการตัดสินกฎ การแข่งขัน หรือเคสที่มีผลต่อเกมจริง ควรตรวจสอบ Official Rules และเว็บไซต์ทางการ https://riftbound.com/ ประกอบเสมอ';

export function normalize(value: unknown) {
	return String(value ?? '')
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[_\-/:()[\].,]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function sanitizeUrl(url: string): string {
	const trimmed = url.trim();
	if (/^(https?:\/\/)/i.test(trimmed) || (trimmed.startsWith('/') && !trimmed.startsWith('//'))) {
		return trimmed;
	}
	return '#';
}

export function parseAnswerText(text: string) {
	let processed = escapeHtml(text);
	const placeholders: Record<string, string> = {};
	let placeholderIndex = 0;
	const domainIconByName = new Map(
		domainAnswers.map((domain) => [domain.name.toLowerCase(), domain.iconToken])
	);

	function addPlaceholder(html: string) {
		const id = `___CHAT_PH_${placeholderIndex++}___`;
		placeholders[id] = html;
		return id;
	}

	processed = processed.replace(/\[c\]/gi, () =>
		addPlaceholder(
			'<img src="/images/icons/rune_rainbow.svg" class="chat-inline-icon" title="Any Rune" alt="Any Rune" />'
		)
	);

	processed = processed.replace(/:rb_energy_(\d+):/g, (_match, value) =>
		addPlaceholder(`<span class="chat-energy-circle" title="Energy: ${value}">${value}</span>`)
	);

	Object.entries(iconMappings).forEach(([token, value]) => {
		processed = processed.replaceAll(
			token,
			addPlaceholder(
				`<img src="/images/icons/${value.icon}" class="chat-inline-icon" title="${escapeHtml(value.hint)}" alt="${escapeHtml(token)}" />`
			)
		);
	});

	processed = processed.replace(/\b(Fury|Calm|Mind|Body|Chaos|Order)\b/g, (match) => {
		const token = domainIconByName.get(String(match).toLowerCase());
		const icon = token ? iconMappings[token] : null;
		if (!icon) return match;

		return addPlaceholder(
			`<span class="chat-domain-name"><img src="/images/icons/${icon.icon}" class="chat-inline-icon" title="${escapeHtml(icon.hint)}" alt="${escapeHtml(match)} domain" /><span>${escapeHtml(match)}</span></span>`
		);
	});

	processed = processed.replace(/\[([^\]]+)\]/g, (_match, keywordText) => {
		const displayText = String(keywordText).trim();
		const keywordName = displayText.split(' ')[0];
		const keyword = keywords.find(
			(item) =>
				normalize(item.name_en) === normalize(keywordName) ||
				normalize(item.name_th) === normalize(keywordName)
		);
		if (!keyword) return `[${displayText}]`;
		const color = keyword?.color ?? '#107361';

		return addPlaceholder(
			`<span class="chat-keyword-badge" style="background-color: ${color};"><span>${escapeHtml(displayText)}</span></span>`
		);
	});

	// Inline Markdown (Bold, Italic, Code, Links)
	processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-white">$1</strong>');
	processed = processed.replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>');
	processed = processed.replace(/`([^`]+)`/g, '<code class="bg-slate-900 border border-white/10 text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
	processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
		const safeUrl = sanitizeUrl(url);
		return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline font-bold">${text}</a>`;
	});

	// Block-level Markdown (Headers, lists, paragraphs)
	const blocks = processed.split(/\n\n+/);
	const parsedBlocks = blocks.map((block) => {
		block = block.trim();
		if (!block) return '';

		// 1. Headers
		if (block.startsWith('#### ')) {
			return `<h4 class="text-xs font-black text-violet-300 mt-4 mb-1.5 uppercase tracking-wider">${block.slice(5)}</h4>`;
		}
		if (block.startsWith('### ')) {
			return `<h3 class="text-sm font-black text-violet-300 mt-5 mb-2 uppercase tracking-wide flex items-center gap-1.5">${block.slice(4)}</h3>`;
		}
		if (block.startsWith('## ')) {
			return `<h2 class="text-base font-black text-violet-200 mt-6 mb-3 pb-1 border-b border-white/10 flex items-center gap-2">${block.slice(3)}</h2>`;
		}
		if (block.startsWith('# ')) {
			return `<h1 class="text-lg font-black text-violet-100 mt-6 mb-4 pb-2 border-b-2 border-violet-500/20">${block.slice(2)}</h1>`;
		}

		// 2. Line-by-line list processing inside block
		const lines = block.split('\n');
		let html = '';
		let inUl = false;
		let inOl = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
				if (inOl) {
					html += '</ol>\n';
					inOl = false;
				}
				if (!inUl) {
					html += '<ul class="space-y-1 my-2 list-inside">\n';
					inUl = true;
				}
				const content = trimmed.slice(2);
				html += `<li class="ml-4 list-disc pl-1 py-0.5 text-slate-300 leading-relaxed">${content}</li>\n`;
			} else {
				const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
				if (olMatch) {
					if (inUl) {
						html += '</ul>\n';
						inUl = false;
					}
					if (!inOl) {
						html += '<ol class="space-y-1 my-2 list-inside">\n';
						inOl = true;
					}
					const num = olMatch[1];
					const content = olMatch[2];
					html += `<li class="ml-4 list-decimal pl-1 py-0.5 text-slate-300 leading-relaxed"><span class="font-bold text-violet-400 mr-1">${num}.</span>${content}</li>\n`;
				} else {
					if (inUl) {
						html += '</ul>\n';
						inUl = false;
					}
					if (inOl) {
						html += '</ol>\n';
						inOl = false;
					}
					if (trimmed) {
						// Group consecutive plain lines to form one paragraph block
						let pContent = trimmed;
						while (i + 1 < lines.length) {
							const nextTrimmed = lines[i + 1].trim();
							if (
								nextTrimmed &&
								!nextTrimmed.startsWith('- ') &&
								!nextTrimmed.startsWith('* ') &&
								!/^\d+\.\s+/.test(nextTrimmed)
							) {
								pContent += ' ' + nextTrimmed;
								i++;
							} else {
								break;
							}
						}
						html += `<p class="mb-2 leading-relaxed text-slate-300">${pContent}</p>\n`;
					}
				}
			}
		}

		if (inUl) html += '</ul>\n';
		if (inOl) html += '</ol>\n';

		return html;
	});

	processed = parsedBlocks.filter(Boolean).join('\n');

	// Restore placeholders
	Object.entries(placeholders).forEach(([id, html]) => {
		processed = processed.replaceAll(id, html);
	});

	return processed;
}

export function getTokens(value: string) {
	return normalize(value)
		.split(' ')
		.filter((token) => token.length >= 2 && !stopWords.has(token));
}

export function getCardTokens(value: string) {
	return normalize(value)
		.split(' ')
		.filter((token) => token.length >= 2 && !cardSearchStopWords.has(token));
}

export function scoreText(text: string, tokens: string[]) {
	const normalized = normalize(text);
	return tokens.reduce((score, token) => {
		if (normalized === token) return score + 80;
		if (normalized.startsWith(token)) return score + 18;
		if (normalized.includes(token)) return score + 8;
		if (token.length >= 4 && normalized.includes(token.slice(0, -1))) return score + 3;
		return score;
	}, 0);
}

export function scoreDomain(domain: DomainAnswer, query: string, tokens: string[]) {
	const normalizedQuery = normalize(query);
	const searchText = [
		domain.name,
		domain.colorName,
		domain.summary,
		domain.bestFor,
		domain.strengths.join(' '),
		domain.pros.join(' '),
		domain.cons.join(' '),
		domain.description.join(' '),
		...domain.aliases
	].join(' ');

	let score = 0;

	for (const alias of domain.aliases) {
		const normalizedAlias = normalize(alias);
		if (!normalizedAlias) continue;
		if (normalizedQuery === normalizedAlias) score += 120;
		if (normalizedQuery.includes(normalizedAlias)) score += 58;
		score += scoreText(normalizedAlias, tokens) * 3;
	}

	score += scoreText(domain.name, tokens) * 4;
	score += scoreText(domain.colorName, tokens) * 2;
	score += scoreText(domain.summary, tokens);
	score += scoreText(domain.bestFor, tokens);

	if (normalizedQuery.includes('domain') || normalizedQuery.includes('โดเมน')) score += 18;
	if (normalize(searchText).includes(normalizedQuery)) score += 25;

	return score;
}

export function findDomains(query: string) {
	const tokens = getTokens(query);
	const normalizedQuery = normalize(query);
	if (
		tokens.length === 0 &&
		!normalizedQuery.includes('domain') &&
		!normalizedQuery.includes('โดเมน')
	)
		return [];

	return domainAnswers
		.map((domain): ScoredDomain => ({ domain, score: scoreDomain(domain, query, tokens) }))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score);
}

export function isDomainIntent(query: string) {
	const normalizedQuery = normalize(query);
	if (!normalizedQuery) return false;

	if (normalizedQuery.includes('domain') || normalizedQuery.includes('โดเมน')) return true;

	return domainAnswers.some((domain) =>
		[domain.name, domain.colorName, ...domain.aliases].some((term) => {
			const normalizedTerm = normalize(term);
			return normalizedTerm ? normalizedQuery.includes(normalizedTerm) : false;
		})
	);
}

export function isGenericDomainIntent(query: string) {
	const normalizedQuery = normalize(query);
	return normalizedQuery.includes('domain') || normalizedQuery.includes('โดเมน');
}

export function scoreRule(rule: RuleAnswer, query: string, tokens: string[]) {
	const normalizedQuery = normalize(query);
	let score = 0;

	for (const key of rule.keys) {
		const normalizedKey = normalize(key);
		if (normalizedQuery === normalizedKey) score += 120;
		if (normalizedQuery.includes(normalizedKey)) score += 55;
		score += scoreText(normalizedKey, tokens) * 3;
	}

	score += scoreText(rule.title, tokens) * 2;
	score += scoreText(rule.text, tokens);

	return score;
}

export function scoreQA(item: QAAnswer, query: string, tokens: string[]) {
	const normalizedQuery = normalize(query);
	let score =
		scoreText(item.question, tokens) * 3 +
		scoreText(item.answer, tokens) +
		scoreText(item.category, tokens);

	if (normalize(item.question).includes(normalizedQuery)) score += 35;
	if (normalize(item.answer).includes(normalizedQuery)) score += 18;

	return score;
}

export function findQA(query: string): ScoredQA[] {
	const tokens = getTokens(query);
	if (tokens.length === 0) return [];

	return qaAnswers
		.map((item): ScoredQA => ({ item, score: scoreQA(item, query, tokens) }))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);
}

export function scorePhase(phase: PhaseAnswer, query: string, tokens: string[]) {
	const normalizedQuery = normalize(query);
	let score = scoreText(phase.title, tokens) * 3 + scoreText(phase.text, tokens);

	for (const alias of phase.aliases) {
		const normalizedAlias = normalize(alias);
		if (normalizedQuery === normalizedAlias) score += 120;
		if (normalizedQuery.includes(normalizedAlias)) score += 58;
		score += scoreText(alias, tokens) * 3;
	}

	if (normalizedQuery.includes('phase') || normalizedQuery.includes('เฟส')) score += 16;

	return score;
}

export function findPhases(query: string): ScoredPhase[] {
	const tokens = getTokens(query);
	const normalizedQuery = normalize(query);
	if (
		tokens.length === 0 &&
		!normalizedQuery.includes('phase') &&
		!normalizedQuery.includes('เฟส')
	)
		return [];

	return phaseAnswers
		.map((phase): ScoredPhase => ({ phase, score: scorePhase(phase, query, tokens) }))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);
}

export function findRules(query: string) {
	const tokens = getTokens(query);
	if (tokens.length === 0) return [];

	return ruleAnswers
		.map((rule): ScoredRule => ({ rule, score: scoreRule(rule, query, tokens) }))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);
}

export function findKeyword(query: string): ScoredKeyword | undefined {
	const tokens = getTokens(query);
	const normalizedQuery = normalize(query);

	return keywords
		.map((keyword) => {
			const score =
				scoreText(keyword.name_en, tokens) * 3 +
				scoreText(keyword.name_th, tokens) * 2 +
				scoreText(keyword.id, tokens) * 3 +
				scoreText(keyword.description_th, tokens) +
				(normalizedQuery.includes(normalize(keyword.name_en)) ? 40 : 0);

			return { keyword, score };
		})
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)[0];
}

export function isDirectKeywordQuestion(query: string, result: ScoredKeyword | undefined) {
	if (!result) return false;

	const normalizedQuery = normalize(query);
	const allKeywordMatches = keywords.filter((keyword) =>
		[keyword.name_en, keyword.name_th, keyword.id].some((term) => {
			const normalizedTerm = normalize(term);
			return normalizedTerm ? normalizedQuery.includes(normalizedTerm) : false;
		})
	);

	if (allKeywordMatches.length !== 1) return false;

	const keywordTerms = [result.keyword.name_en, result.keyword.name_th, result.keyword.id].map(
		normalize
	);
	const hasKeyword = keywordTerms.some((term) => term && normalizedQuery.includes(term));
	const isShortQuestion = getTokens(query).length <= 3;

	return (
		hasKeyword &&
		(isShortQuestion || normalizedQuery.includes('คือ') || normalizedQuery.includes('keyword'))
	);
}

export function searchableCardText(card: Card) {
	return normalize(
		[
			card.name_en,
			card.name_th,
			card.code,
			card.type,
			card.rarity,
			card.set_name,
			card.ability_en,
			card.ability_th,
			...(card.domains ?? []),
			...(card.tags ?? [])
		].join(' ')
	);
}

export function getCardNameTerms(card: Card) {
	return [card.name_en, card.name_th]
		.map((name) => normalize(name))
		.filter((name, index, names) => name && names.indexOf(name) === index);
}

export function scoreCard(card: Card, query: string, queryTokens: string[]) {
	const normalizedQuery = normalize(query);
	const names = getCardNameTerms(card);
	const code = normalize(card.code);
	const allText = searchableCardText(card);

	let score = 0;

	for (const name of names) {
		if (normalizedQuery === name) score += 260;
		else if (normalizedQuery.includes(name)) score += 220;
		else if (name.includes(normalizedQuery) && normalizedQuery.length >= 5) score += 90;
	}

	if (code) {
		if (normalizedQuery === code) score += 260;
		else if (normalizedQuery.includes(code)) score += 220;
	}

	return queryTokens.reduce((currentScore, token) => {
		if (names.some((name) => name === token) || code === token) return currentScore + 100;
		if (names.some((name) => name.includes(token))) return currentScore + 38;
		if (code.includes(token)) return currentScore + 30;
		if (token.length >= 4 && allText.includes(token)) return currentScore + 4;
		return currentScore;
	}, score);
}

export function findExactCard(cards: Card[], query: string) {
	const normalizedQuery = normalize(query);
	return cards.find((card) => {
		const names = getCardNameTerms(card);
		const code = normalize(card.code);
		return (
			names.some((name) => normalizedQuery === name || normalizedQuery.includes(name)) ||
			(code && normalizedQuery.includes(code))
		);
	});
}

export function findCards(query: string, cards: Card[]): ScoredCard[] {
	const tokens = getCardTokens(query);
	const exactCard = findExactCard(cards, query);
	if (exactCard) {
		const related = cards
			.filter((card) => card.code !== exactCard.code)
			.map((card) => ({ card, score: scoreCard(card, query, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 2);

		return [{ card: exactCard, score: 300 }, ...related];
	}

	if (tokens.length === 0) return [];

	return cards
		.map((card) => ({ card, score: scoreCard(card, query, tokens) }))
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);
}

export function formatRules(results: ScoredRule[]) {
	if (results.length === 0) return '';

	const [best, ...related] = results;
	const relatedText = related.length
		? `\n\nเรื่องที่อาจเกี่ยวข้อง:\n${related.map(({ rule }) => `- ${rule.title}: ${rule.text}`).join('\n')}`
		: '';

	return `ถ้าถามเรื่อง ${best.rule.title} คำตอบคือ: ${best.rule.text}${relatedText}`;
}

export function formatQA(results: ScoredQA[]) {
	const [best, ...related] = results;
	const relatedText = related.length
		? `\n\nคำถามใกล้เคียงใน Q&A:\n${related.map(({ item }) => `- ${item.question}`).join('\n')}`
		: '';

	return `เจอคำตอบจาก Q&A ในเว็บ:\n${best.item.question}\n\n${best.item.answer}${relatedText}`;
}

export function formatPhases(results: ScoredPhase[]) {
	const [best, ...related] = results;
	const relatedText = related.length
		? `\n\nหัวข้อ phase ที่เกี่ยวข้อง:\n${related.map(({ phase }) => `- ${phase.title}: ${phase.text}`).join('\n')}`
		: '';

	return `${best.phase.title}: ${best.phase.text}${relatedText}`;
}

export function formatDomains(results: ScoredDomain[], query: string) {
	if (results.length === 0) return '';

	const normalizedQuery = normalize(query);
	const isGenericDomainQuestion =
		normalizedQuery.includes('domain') ||
		normalizedQuery.includes('โดเมน') ||
		normalizedQuery === 'domain' ||
		normalizedQuery === 'โดเมน';

	if (isGenericDomainQuestion && results[0].score < 90) {
		return [
			'ใน Riftbound มี domain หลัก 6 แบบ: Fury, Calm, Mind, Body, Chaos และ Order.',
			'',
			'สรุปแบบเร็ว ๆ คือ:',
			...domainAnswers.map(
				(domain) => `${domain.iconToken} ${domain.name} (${domain.colorName}) - ${domain.summary}`
			)
		].join('\n');
	}

	const [best, ...related] = results;
	const relatedText = related.length
		? `\n\nคำตอบที่เกี่ยวข้อง:\n${related
				.slice(0, 2)
				.map(
					({ domain }) =>
						`- ${domain.iconToken} ${domain.name}: ${domain.summary} | เหมาะกับ: ${domain.bestFor}`
				)
				.join('\n')}`
		: '';

	return [
		`${best.domain.iconToken} ${best.domain.name} เป็น domain สี ${best.domain.colorName}. ${best.domain.summary}`,
		`โดยรวมเหมาะกับ ${best.domain.bestFor}`,
		`จุดเด่นหลักคือ ${best.domain.strengths.join(', ')}`,
		`ข้อดี: ${best.domain.pros.join(' | ')}`,
		`จุดที่ต้องระวัง: ${best.domain.cons.join(' | ')}`,
		'',
		...best.domain.description,
		relatedText,
		'',
		'หมายเหตุ: ผมตอบจากข้อมูลสรุปในเว็บ ถ้าเป็นเคสแข่งหรือ ruling ละเอียดควรเช็ก official rules อีกครั้ง'
	]
		.filter(Boolean)
		.join('\n');
}

export function formatCards(matches: ScoredCard[]) {
	return matches
		.map(({ card }, index) => {
			const domains = card.domains?.length ? ` | ${card.domains.join(', ')}` : '';
			const tags = card.tags?.length ? ` | #${card.tags.join(' #')}` : '';
			const ability = card.ability_th || card.ability_en || 'ไม่มี ability text';
			return `${index + 1}. ${card.name_en} (${card.code})\n${card.type} - ${card.rarity}${domains}${tags}\n${ability}`;
		})
		.join('\n\n');
}

export function getCardFieldIntents(query: string) {
	const normalizedQuery = normalize(query);
	const hasAny = (terms: string[]) =>
		terms.some((term) => normalizedQuery.includes(normalize(term)));

	return {
		type: hasAny(['type', 'ประเภท', 'ชนิด']),
		domain: hasAny(['domain', 'โดเมน', 'สีอะไร', 'สีไหน']),
		cost: hasAny(['cost', 'energy', 'ค่าร่าย']),
		set: hasAny(['set', 'ชุด', 'อยู่ชุด']),
		rarity: hasAny(['rarity', 'ระดับความหายาก', 'หายาก']),
		tags: hasAny(['tag', 'tags', 'แท็ก', 'เผ่า']),
		ability: hasAny(['ability', 'ทำอะไร', 'ความสามารถ', 'สกิล']),
		power: hasAny(['power', 'might', 'พลัง', 'ไมท์']),
		code: hasAny(['code', 'รหัส', 'เลขการ์ด']),
		image: hasAny(['image', 'รูป', 'ภาพ'])
	};
}

export function isCardIdentityQuestion(query: string) {
	const normalizedQuery = normalize(query);
	return ['คืออะไร', 'เป็นการ์ดอะไร', 'ข้อมูล', 'รายละเอียด', 'what is'].some((term) =>
		normalizedQuery.includes(normalize(term))
	);
}

export function cardValue(value: unknown, fallback = 'ไม่ระบุ') {
	if (value === null || value === undefined || value === '') return fallback;
	return String(value);
}

export function cardPowerLabel(card: Card) {
	return card.power?.label ?? card.power?.value?.label ?? null;
}

export function formatCardSummary(card: Card) {
	const domains = card.domains?.length ? card.domains.join(', ') : 'ไม่ระบุ';
	const cost = card.energy ?? 0;
	const tags = card.tags?.length ? ` | tags: ${card.tags.join(', ')}` : '';
	return `${card.name_en} คือการ์ด ${cardValue(card.type)} | cost ${cost} | domain ${domains} | set ${cardValue(card.set_name)}${tags}`;
}

export function formatCardFieldAnswer(query: string, card: Card) {
	const intents = getCardFieldIntents(query);
	const cardName = card.name_en || card.name_th || card.code;
	const domains = card.domains?.length ? card.domains.join(', ') : 'ไม่ระบุ';
	const tags = card.tags?.length ? card.tags.join(', ') : 'ไม่ระบุ';
	const ability = card.ability_th || card.ability_en || 'ไม่มี ability text';
	const image = card.image_url || 'ไม่ระบุ';
	const power = cardPowerLabel(card) ?? 'ไม่ระบุ';
	const answers: string[] = [];

	if (intents.type) answers.push(`${cardName} เป็นประเภท ${cardValue(card.type)}`);
	if (intents.domain) answers.push(`${cardName} มี domain ${domains}`);
	if (intents.cost) answers.push(`${cardName} มี cost ${card.energy ?? 0}`);
	if (intents.set) answers.push(`${cardName} อยู่ในชุด ${cardValue(card.set_name)}`);
	if (intents.rarity) answers.push(`${cardName} มี rarity ${cardValue(card.rarity)}`);
	if (intents.tags) answers.push(`${cardName} มี tag ${tags}`);
	if (intents.power) answers.push(`${cardName} มี power/might ${power}`);
	if (intents.code) answers.push(`${cardName} มีรหัสการ์ด ${cardValue(card.code)}`);
	if (intents.image) answers.push(`${cardName} รูปการ์ด: ${image}`);
	if (intents.ability) answers.push(`${cardName}: ${ability}`);

	if (answers.length > 0) return answers.join('\n');
	if (isCardIdentityQuestion(query)) return formatCardSummary(card);

	return '';
}

export function formatFocusedCardAnswer(query: string, matches: ScoredCard[]) {
	const best = matches[0];
	if (!best || best.score < 80) return '';

	const preciseAnswer = formatCardFieldAnswer(query, best.card);
	if (preciseAnswer) return preciseAnswer;

	const card = best.card;
	const normalizedQuery = normalize(query);
	const cardName = card.name_en || card.name_th || card.code;
	const asksType =
		normalizedQuery.includes('type') ||
		normalizedQuery.includes('ประเภท') ||
		normalizedQuery.includes('ชนิด');
	const asksDomain =
		normalizedQuery.includes('domain') ||
		normalizedQuery.includes('โดเมน') ||
		normalizedQuery.includes('สีอะไร') ||
		normalizedQuery.includes('สีไหน');
	const asksCost =
		normalizedQuery.includes('cost') ||
		normalizedQuery.includes('energy') ||
		normalizedQuery.includes('ค่าร่าย');
	const asksSet =
		normalizedQuery.includes('set') ||
		normalizedQuery.includes('ชุด') ||
		normalizedQuery.includes('อยู่ชุด');
	const asksRarity =
		normalizedQuery.includes('rarity') ||
		normalizedQuery.includes('ระดับความหายาก') ||
		normalizedQuery.includes('หายาก');
	const asksTags =
		normalizedQuery.includes('tag') ||
		normalizedQuery.includes('แท็ก') ||
		normalizedQuery.includes('เผ่า');
	const asksAbility =
		normalizedQuery.includes('ability') ||
		normalizedQuery.includes('ทำอะไร') ||
		normalizedQuery.includes('ความสามารถ') ||
		normalizedQuery.includes('สกิล');

	if (asksType) return `${cardName} เป็นประเภท ${card.type || 'ไม่ระบุ'}`;
	if (asksDomain)
		return `${cardName} มี domain ${card.domains?.length ? card.domains.join(', ') : 'ไม่ระบุ'}`;
	if (asksCost) return `${cardName} มี cost ${card.energy ?? 0}`;
	if (asksSet) return `${cardName} อยู่ในชุด ${card.set_name || 'ไม่ระบุ'}`;
	if (asksRarity) return `${cardName} มี rarity ${card.rarity || 'ไม่ระบุ'}`;
	if (asksTags)
		return `${cardName} มี tag ${card.tags?.length ? card.tags.join(', ') : 'ไม่ระบุ'}`;
	if (asksAbility)
		return `${cardName}: ${card.ability_th || card.ability_en || 'ไม่มี ability text'}`;

	return '';
}

export function withAiDisclaimer(answer: string) {
	if (answer.includes(aiDisclaimer)) return answer;
	return `${answer}\n\n${aiDisclaimer}`;
}

export function getCanonicalQuickAnswer(query: string) {
	const normalizedQuery = normalize(query);
	const asksRecycle = normalizedQuery.includes('recycle') || normalizedQuery.includes('รีไซเคิล');
	const asksOfficial =
		normalizedQuery.includes('official') ||
		normalizedQuery.includes('เว็บทางการ') ||
		normalizedQuery.includes('เว็บ official') ||
		(normalizedQuery.includes('เว็บ') && normalizedQuery.includes('riftbound'));

	if (asksOfficial) {
		return 'เว็บ official ของ Riftbound คือ https://riftbound.com/';
	}

	if (asksRecycle) {
		return 'Recycle คือ การนำการ์ดรูนหรือการ์ดจากมือ ตามที่มาของการ์ดนั้น ส่งกลับเข้าใต้กอง';
	}

	return '';
}

export async function buildAnswer(query: string, cards: Card[]) {
	const quickAnswer = getCanonicalQuickAnswer(query);
	if (quickAnswer) return quickAnswer;

	const matches = findCards(query, cards);
	const focusedCardAnswer = formatFocusedCardAnswer(query, matches);
	if (focusedCardAnswer) return focusedCardAnswer;

	if (matches.length > 0 && matches[0].score >= 60) {
		return `ผมเจอการ์ดที่น่าจะเกี่ยวข้องกับคำถามนี้:\n${formatCards(matches)}`;
	}

	const keyword = findKeyword(query);
	if (isDirectKeywordQuestion(query, keyword) && keyword && keyword.score >= 45) {
		return `${keyword.keyword.name_en} คือ ${keyword.keyword.description_th}\n\nถ้าเป็นเคสซับซ้อน ให้เทียบกับข้อความบนการ์ดและ official rules อีกครั้ง`;
	}

	const qa = findQA(query);
	if (qa.length > 0 && qa[0].score >= 45) {
		return formatQA(qa);
	}

	const phases = findPhases(query);
	if (phases.length > 0 && phases[0].score >= 45) {
		return formatPhases(phases);
	}

	const rules = findRules(query);
	if (rules.length > 0 && rules[0].score >= 55) {
		return `${formatRules(rules)}\n\nหมายเหตุ: ผมตอบจากข้อมูลสรุปในเว็บ ถ้าเป็นเคสแข่งหรือ ruling ละเอียดควรเช็ก official rules อีกครั้ง`;
	}

	if (keyword && keyword.score >= 55) {
		return `${keyword.keyword.name_en} คือ ${keyword.keyword.description_th}\n\nถ้าเป็นเคสซับซ้อน ให้เทียบกับข้อความบนการ์ดและ official rules อีกครั้ง`;
	}

	const domainIntent = isDomainIntent(query);
	const domains = findDomains(query);
	if (domainIntent) {
		if (domains.length > 0 && (isGenericDomainIntent(query) || domains[0].score >= 55)) {
			return formatDomains(domains, query);
		}

		if (isGenericDomainIntent(query)) {
			return [
				'ใน Riftbound มี domain หลัก 6 แบบ: Fury, Calm, Mind, Body, Chaos และ Order.',
				'',
				'สรุปแบบเร็ว ๆ คือ:',
				...domainAnswers.map(
					(domain) =>
						`${domain.iconToken} ${domain.name} (${domain.colorName}) - ${domain.summary}`
				)
			].join('\n');
		}
	}

	if (matches.length > 0 && matches[0].score >= 30) {
		return `ผมเจอการ์ดที่อาจเกี่ยวข้องกับคำถามนี้:\n${formatCards(matches)}`;
	}

	return noAnswerText;
}
