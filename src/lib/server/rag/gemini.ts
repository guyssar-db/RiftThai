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

export async function generateRagAnswer(question: string, context: string) {
	const config = getRagConfig();
	if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is missing');

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': config.geminiApiKey
			},
			body: JSON.stringify({
				system_instruction: {
					parts: {
						text:
							'คุณคือผู้ช่วยตอบคำถาม Riftbound ภาษาไทย ตอบจาก CONTEXT เท่านั้น ถ้าข้อมูลไม่พอให้บอกว่าไม่พบข้อมูลพอในฐานความรู้ ห้ามเดา ruling ใหม่เอง และให้ตอบกระชับ อ่านง่าย' +
							' ตอบเฉพาะสิ่งที่ผู้ใช้ถาม ถ้าถามประเภท/โดเมน/cost/ชุด/rarity/tag ให้ตอบแค่ค่านั้น ไม่ต้องสรุปข้อมูลการ์ดทั้งใบ'
					}
				},
				contents: [
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
				],
				generationConfig: {
					temperature: 0.2,
					topP: 0.9,
					maxOutputTokens: 1200
				}
			})
		}
	);

	const data = (await response.json()) as GeminiGenerateResponse;
	if (!response.ok) throw new Error(data.error?.message ?? 'Gemini generation failed');

	const text = data.candidates?.[0]?.content?.parts
		?.map((part) => part.text ?? '')
		.join('')
		.trim();
	if (!text) throw new Error('Gemini generation response is empty');

	return text;
}
