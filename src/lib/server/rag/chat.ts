import { isGeminiConfigured, isSupabaseConfigured } from './config';
import { buildRagChunks } from './documents';
import { embedText, generateRagAnswer } from './gemini';
import { matchRagChunks, type RagMatch } from './supabase';
import { normalizeSearchText, repairThaiMojibake, scoreLexical } from './text';

export type RagChatResult = {
	answer: string;
	sources: Array<{
		source: string;
		title: string;
		source_type: string;
		similarity?: number;
	}>;
	mode: 'rag' | 'local' | 'setup_required';
};

export async function answerRagQuestion(question: string): Promise<RagChatResult> {
	const cleanQuestion = question.trim();
	if (!cleanQuestion) throw new Error('Question is required');

	if (!isGeminiConfigured()) {
		return {
			answer:
				'ยังไม่ได้ตั้งค่า GEMINI_API_KEY จึงยังเรียก Gemini Pro ไม่ได้ ตั้งค่า env แล้วค่อยเรียก /api/rag/ingest เพื่อสร้าง embedding ใน Supabase',
			sources: [],
			mode: 'setup_required'
		};
	}

	const matches = await retrieveMatches(cleanQuestion);
	if (matches.length === 0) {
		return {
			answer: 'ไม่พบข้อมูลที่เกี่ยวข้องพอในฐานความรู้ของ RiftThai',
			sources: [],
			mode: isSupabaseConfigured() ? 'rag' : 'local'
		};
	}

	const context = matches
		.map((match, index) => {
			const similarity = typeof match.similarity === 'number' ? ` | similarity ${match.similarity.toFixed(3)}` : '';
			return [
				`[${index + 1}] ${match.title} (${match.source_type}:${match.source}${similarity})`,
				match.content
			].join('\n');
		})
		.join('\n\n---\n\n');

	let answer: string;
	try {
		answer = await generateRagAnswer(cleanQuestion, context);
	} catch (error) {
		console.warn('Gemini generation failed, returning extractive RAG answer', error);
		answer = buildExtractiveAnswer(matches);
	}

	return {
		answer,
		sources: dedupeSources(selectRelevantMatches(matches)),
		mode: isSupabaseConfigured() ? 'rag' : 'local'
	};
}

function buildExtractiveAnswer(matches: RagMatch[]) {
	const relevantMatches = selectRelevantMatches(matches);
	const primary = relevantMatches[0];
	const summary = primary ? summarizeMatch(primary) : 'ไม่พบข้อมูลที่เกี่ยวข้องพอในฐานความรู้';
	const related = relevantMatches
		.slice(1)
		.map((match) => `- ${repairThaiMojibake(match.title)}`)
		.join('\n');

	const sources = dedupeSources(relevantMatches)
		.map((source) => `- ${source.title}`)
		.join('\n');

	return [
		'คำตอบ:',
		summary,
		related ? '\nข้อมูลที่เกี่ยวข้อง:\n' + related : '',
		'',
		'อ้างอิง:',
		sources
	]
		.filter(Boolean)
		.join('\n');
}

function summarizeMatch(match: RagMatch) {
	const content = repairThaiMojibake(match.content);
	const title = repairThaiMojibake(match.title);
	const fields = parseContentFields(content);

	if (match.source_type === 'keyword') {
		const name = fields.Keyword || title.replace(/^Keyword:\s*/i, '');
		const thai = fields.Thai ? ` (${fields.Thai})` : '';
		const description = fields.Description || content;
		return `${name}${thai}: ${description}`;
	}

	if (match.source_type === 'rule') {
		const answer = fields.Answer || content.replace(/^Rule:\s*[^\n]+\n?/i, '').trim();
		return `${title}: ${answer}`;
	}

	if (match.source_type === 'card') {
		const card = fields.Card || title;
		const type = fields.Type ? ` ${fields.Type}` : '';
		const cost = fields.Energy ? ` ค่าเล่น ${fields.Energy}` : '';
		const domains = fields.Domains ? ` โดเมน ${fields.Domains}` : '';
		const ability = fields['Thai ability'] || fields['English ability'] || 'ไม่มี ability text ในฐานข้อมูล';
		return `${card}:${type}${cost}${domains}\n${ability}`;
	}

	return content.length > 700 ? `${content.slice(0, 700).trim()}...` : content;
}

function parseContentFields(content: string) {
	const fields: Record<string, string> = {};
	let currentKey = '';

	for (const line of content.split('\n')) {
		const match = line.match(/^([^:]+):\s*(.*)$/);
		if (match) {
			currentKey = match[1].trim();
			fields[currentKey] = match[2].trim();
		} else if (currentKey && line.trim()) {
			fields[currentKey] = `${fields[currentKey]}\n${line.trim()}`;
		}
	}

	return fields;
}

function selectRelevantMatches(matches: RagMatch[]) {
	const topScore = matches[0]?.similarity ?? 0;
	if (topScore <= 0) return matches.slice(0, 3);

	return matches
		.filter((match) => match.similarity >= topScore * 0.65)
		.slice(0, 3);
}

async function retrieveMatches(question: string): Promise<RagMatch[]> {
	if (isSupabaseConfigured()) {
		try {
			const embedding = await embedText(question);
			return mergeMatches(matchRagChunks(embedding), getLocalLexicalMatches(question));
		} catch (error) {
			console.warn('Vector retrieval failed, falling back to local lexical retrieval', error);
		}
	}

	return getLocalLexicalMatches(question);
}

function getLocalLexicalMatches(question: string) {
	return buildRagChunks()
		.map((chunk) => ({
			id: `${chunk.source}:${chunk.chunk_index}`,
			document_id: chunk.content_hash,
			content: chunk.chunk_content,
			source: chunk.source,
			source_type: chunk.source_type,
			title: chunk.title,
			metadata: chunk.metadata,
			similarity:
				scoreLexical(question, `${chunk.title}\n${chunk.chunk_content}`) +
				sourceTypeBoost(question, chunk.source_type) +
				exactMatchBoost(question, chunk.title, chunk.source)
		}))
		.filter((match) => match.similarity > 0)
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, 8);
}

function exactMatchBoost(question: string, title: string, source: string) {
	const normalizedQuestion = normalizeSearchText(question);
	const normalizedTitle = normalizeSearchText(title.replace(/^(Keyword|Rule|Domain|Card):\s*/i, ''));
	const normalizedSource = normalizeSearchText(source.split(':').pop() ?? source);
	const plainQuestion = question.toLowerCase();
	const plainTitle = title.replace(/^(Keyword|Rule|Domain|Card):\s*/i, '').toLowerCase();
	const plainSource = (source.split(':').pop() ?? source).toLowerCase();
	const questionTokens = new Set(normalizedQuestion.split(/\s+/).filter(Boolean));

	if (isExactQuestionMatch(normalizedTitle, normalizedQuestion, questionTokens)) return 220;
	if (isExactQuestionMatch(normalizedSource, normalizedQuestion, questionTokens)) return 180;
	if (isExactQuestionMatch(plainTitle, plainQuestion, questionTokens)) return 220;
	if (isExactQuestionMatch(plainSource, plainQuestion, questionTokens)) return 180;
	return 0;
}

function isExactQuestionMatch(term: string, normalizedQuestion: string, questionTokens: Set<string>) {
	if (!term) return false;
	if (/^[a-z0-9-]+$/i.test(term)) return questionTokens.has(term);
	return normalizedQuestion.includes(term);
}

function sourceTypeBoost(question: string, sourceType: string) {
	const normalized = question.toLowerCase();
	const asksDefinition =
		normalized.includes('คือ') ||
		normalized.includes('อะไร') ||
		normalized.includes('meaning') ||
		normalized.includes('define') ||
		normalized.includes('keyword') ||
		normalized.includes('rule');

	if (!asksDefinition) return 0;
	if (sourceType === 'keyword') return 80;
	if (sourceType === 'rule') return 60;
	if (sourceType === 'domain') return 40;
	if (sourceType === 'card') return -10;
	return 0;
}

async function mergeMatches(vectorMatchesPromise: Promise<RagMatch[]>, localMatches: RagMatch[]) {
	const vectorMatches = await vectorMatchesPromise;
	const byKey = new Map<string, { match: RagMatch; vectorRank: number; localRank: number }>();

	const getKey = (m: RagMatch) => `${m.source_type}:${m.source}:${m.content.slice(0, 80)}`;

	// Rank vector matches
	vectorMatches.forEach((match, index) => {
		const key = getKey(match);
		byKey.set(key, { match, vectorRank: index + 1, localRank: Infinity });
	});

	// Rank local lexical matches
	localMatches.forEach((match, index) => {
		const key = getKey(match);
		const existing = byKey.get(key);
		if (existing) {
			existing.localRank = index + 1;
		} else {
			byKey.set(key, { match, vectorRank: Infinity, localRank: index + 1 });
		}
	});

	const k = 60;
	// Calculate RRF score for each item and normalize to similarity float
	const scored = Array.from(byKey.values()).map(({ match, vectorRank, localRank }) => {
		const vScore = vectorRank === Infinity ? 0 : 1 / (k + vectorRank);
		const lScore = localRank === Infinity ? 0 : 1 / (k + localRank);
		const rrfScore = vScore + lScore;
		
		// Normalize RRF score to [0, 1] range. Max theoretical RRF score is 2 / 61.
		const normalizedSimilarity = rrfScore * (61 / 2);

		return {
			match: {
				...match,
				similarity: normalizedSimilarity
			},
			rrfScore
		};
	});

	// Sort by RRF score descending
	scored.sort((a, b) => b.rrfScore - a.rrfScore);

	return scored.slice(0, 8).map((item) => item.match);
}

function dedupeSources(matches: RagMatch[]) {
	const seen = new Set<string>();
	return matches
		.filter((match) => {
			const key = `${match.source_type}:${match.source}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.slice(0, 5)
		.map((match) => ({
			source: match.source,
			title: repairThaiMojibake(match.title),
			source_type: match.source_type,
			similarity: typeof match.similarity === 'number' ? match.similarity : undefined
		}));
}
