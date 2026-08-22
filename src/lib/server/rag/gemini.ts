import { RAG_EMBEDDING_DIMENSIONS, getRagConfig } from './config';

type GeminiPart = {
	text?: string;
};

type GeminiGenerateResponse = {
	candidates?: Array<{
		content?: {
			parts?: GeminiPart[];
		};
	}>;
	error?: {
		message?: string;
	};
};

type GeminiEmbedResponse = {
	embedding?: {
		values?: number[];
	};
	error?: {
		message?: string;
	};
};

export async function embedText(text: string) {
	const config = getRagConfig();
	if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is missing');

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiEmbeddingModel}:embedContent`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': config.geminiApiKey
			},
			body: JSON.stringify({
				content: {
					parts: [{ text }]
				},
				output_dimensionality: RAG_EMBEDDING_DIMENSIONS
			})
		}
	);

	const data = (await response.json()) as GeminiEmbedResponse;
	if (!response.ok) throw new Error(data.error?.message ?? 'Gemini embedding failed');

	const values = data.embedding?.values;
	if (!values?.length) throw new Error('Gemini embedding response is empty');
	if (values.length !== RAG_EMBEDDING_DIMENSIONS) {
		throw new Error(
			`Gemini embedding returned ${values.length} dimensions, expected ${RAG_EMBEDDING_DIMENSIONS}`
		);
	}

	return values;
}

export async function generateGeminiContent(
	systemInstruction: string,
	contents: any[],
	generationConfig: {
		temperature?: number;
		topP?: number;
		maxOutputTokens?: number;
	} = {}
): Promise<string> {
	const config = getRagConfig();
	if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is missing');

	const primaryModel = config.geminiModel || 'gemini-2.5-flash';
	const candidates = [
		primaryModel,
		'gemini-2.5-flash',
		'gemini-1.5-flash',
		'gemini-1.5-pro',
		'gemini-2.5-pro'
	];

	// Deduplicate candidates preserving order
	const models = Array.from(new Set(candidates));
	let lastError: Error | null = null;

	for (const model of models) {
		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-goog-api-key': config.geminiApiKey
					},
					body: JSON.stringify({
						system_instruction: {
							parts: {
								text: systemInstruction
							}
						},
						contents,
						generationConfig: {
							temperature: generationConfig.temperature ?? 0.2,
							topP: generationConfig.topP ?? 0.9,
							maxOutputTokens: generationConfig.maxOutputTokens ?? 2048
						}
					})
				}
			);

			const data = (await response.json()) as GeminiGenerateResponse;

			if (!response.ok) {
				const errMsg = data.error?.message ?? `HTTP ${response.status}`;
				const isTransient =
					response.status === 429 ||
					response.status === 503 ||
					response.status === 500 ||
					errMsg.toLowerCase().includes('demand') ||
					errMsg.toLowerCase().includes('rate limit') ||
					errMsg.toLowerCase().includes('quota') ||
					errMsg.toLowerCase().includes('temporary');

				if (isTransient) {
					lastError = new Error(errMsg);
					continue;
				} else {
					throw new Error(errMsg);
				}
			}

			const text = data.candidates?.[0]?.content?.parts
				?.map((part) => part.text ?? '')
				.join('')
				.trim();

			if (!text) {
				throw new Error('Gemini returned an empty response');
			}

			return text;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			const msg = lastError.message.toLowerCase();
			const isNetworkOrTransient =
				msg.includes('fetch') ||
				msg.includes('network') ||
				msg.includes('demand') ||
				msg.includes('rate limit') ||
				msg.includes('quota') ||
				msg.includes('temporary') ||
				msg.includes('503') ||
				msg.includes('429') ||
				msg.includes('500');

			if (isNetworkOrTransient) {
				continue;
			} else {
				throw lastError;
			}
		}
	}

	throw lastError || new Error('All Gemini models failed to generate content');
}

export async function generateRagAnswer(question: string, context: string) {
	const systemInstruction =
		'คุณคือผู้ช่วยตอบคำถาม Riftbound ภาษาไทย ตอบจาก CONTEXT เท่านั้น ถ้าข้อมูลไม่พอให้บอกว่าไม่พบข้อมูลพอในฐานความรู้ ห้ามเดา ruling ใหม่เอง และให้ตอบกระชับ อ่านง่าย' +
		' ตอบเฉพาะสิ่งที่ผู้ใช้ถาม ถ้าถามประเภท/โดเมน/cost/ชุด/rarity/tag ให้ตอบแค่ค่านั้น ไม่ต้องสรุปข้อมูลการ์ดทั้งใบ';

	const contents = [
		{
			role: 'user',
			parts: [
				{
					text: [
						'CONTEXT:',
						context,
						'',
						`QUESTION: ${question}`,
						'',
						'ตอบเป็นภาษาไทย ตอบเฉพาะคำถาม ไม่ต้องใส่ข้อมูลเสริมที่ไม่ได้ถาม และปิดท้ายด้วยหัวข้อ "อ้างอิง" แบบ bullet จาก source ที่ใช้'
					].join('\n')
				}
			]
		}
	];

	return generateGeminiContent(systemInstruction, contents, {
		temperature: 0.2,
		topP: 0.9,
		maxOutputTokens: 1200
	});
}
