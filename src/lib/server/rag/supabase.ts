import { getRagConfig } from './config';

export type RagMatch = {
	id: string;
	document_id: string;
	content: string;
	source: string;
	source_type: string;
	title: string;
	metadata: Record<string, unknown>;
	similarity: number;
};

type SupabaseDocument = {
	id: string;
	content_hash: string;
};

type ChatUsageRow = {
	user_id: string;
	usage_date: string;
	count: number;
};

export function vectorToSql(values: number[]) {
	return `[${values.join(',')}]`;
}

export async function matchRagChunks(embedding: number[]) {
	const config = getRagConfig();
	const data = await supabaseRequest<RagMatch[]>('/rest/v1/rpc/match_rag_chunks', {
		method: 'POST',
		body: JSON.stringify({
			query_embedding: vectorToSql(embedding),
			match_threshold: config.matchThreshold,
			match_count: config.matchCount
		})
	});

	return data ?? [];
}

export async function upsertRagDocument(input: {
	source: string;
	source_type: string;
	title: string;
	content_hash: string;
	metadata: Record<string, unknown>;
}) {
	const rows = await supabaseRequest<SupabaseDocument[]>(
		`/rest/v1/rag_documents?on_conflict=content_hash&select=id,content_hash`,
		{
			method: 'POST',
			headers: {
				Prefer: 'resolution=merge-duplicates,return=representation'
			},
			body: JSON.stringify({
				...input,
				updated_at: new Date().toISOString()
			})
		}
	);

	const document = rows?.[0];
	if (!document) throw new Error(`Could not upsert RAG document: ${input.source}`);
	return document;
}

export async function replaceRagChunks(
	documentId: string,
	chunks: Array<{
		chunk_index: number;
		content: string;
		embedding: number[];
		token_count: number;
		metadata: Record<string, unknown>;
	}>
) {
	await supabaseRequest(`/rest/v1/rag_chunks?document_id=eq.${documentId}`, {
		method: 'DELETE'
	});

	if (chunks.length === 0) return;

	await supabaseRequest('/rest/v1/rag_chunks', {
		method: 'POST',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify(
			chunks.map((chunk) => ({
				document_id: documentId,
				chunk_index: chunk.chunk_index,
				content: chunk.content,
				embedding: vectorToSql(chunk.embedding),
				token_count: chunk.token_count,
				metadata: chunk.metadata
			}))
		)
	});
}

export async function countRagChunks() {
	const response = await rawSupabaseRequest('/rest/v1/rag_chunks?select=id', {
		method: 'HEAD',
		headers: {
			Prefer: 'count=exact'
		}
	});

	return Number(response.headers.get('content-range')?.split('/')?.[1] ?? 0);
}

export async function countRagChunksForDocument(documentId: string) {
	const response = await rawSupabaseRequest(`/rest/v1/rag_chunks?document_id=eq.${documentId}&select=id`, {
		method: 'HEAD',
		headers: {
			Prefer: 'count=exact'
		}
	});

	return Number(response.headers.get('content-range')?.split('/')?.[1] ?? 0);
}

export async function getChatUsage(userId: string, usageDate = getUsageDate()) {
	const rows = await supabaseRequest<ChatUsageRow[]>(
		`/rest/v1/rag_chat_usage?user_id=eq.${encodeURIComponent(userId)}&usage_date=eq.${usageDate}&select=user_id,usage_date,count`
	);

	return rows?.[0]?.count ?? 0;
}

export async function incrementChatUsage(userId: string, usageDate = getUsageDate()) {
	const current = await getChatUsage(userId, usageDate);
	const next = current + 1;

	await supabaseRequest('/rest/v1/rag_chat_usage?on_conflict=user_id,usage_date', {
		method: 'POST',
		headers: {
			Prefer: 'resolution=merge-duplicates,return=minimal'
		},
		body: JSON.stringify({
			user_id: userId,
			usage_date: usageDate,
			count: next,
			updated_at: new Date().toISOString()
		})
	});

	return next;
}

export function getUsageDate() {
	return getBangkokUsageDate(new Date());
}

export function getBangkokUsageDate(now: Date) {
	const bangkokTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
	const resetMinutes = 15 * 60 + 30;
	const currentMinutes = bangkokTime.getUTCHours() * 60 + bangkokTime.getUTCMinutes();

	if (currentMinutes >= resetMinutes) {
		bangkokTime.setUTCDate(bangkokTime.getUTCDate() + 1);
	}

	return bangkokTime.toISOString().slice(0, 10);
}

async function supabaseRequest<T = unknown>(path: string, init: RequestInit = {}) {
	const response = await rawSupabaseRequest(path, init);
	if (response.status === 204) return undefined as T;
	const text = await response.text();
	if (!text) return undefined as T;
	return JSON.parse(text) as T;
}

async function rawSupabaseRequest(path: string, init: RequestInit = {}) {
	const config = getRagConfig();
	if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
		throw new Error('Supabase URL or service role key is missing');
	}

	const response = await fetch(`${config.supabaseUrl}${path}`, {
		...init,
		headers: {
			apikey: config.supabaseServiceRoleKey,
			Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
			'Content-Type': 'application/json',
			...(init.headers ?? {})
		}
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Supabase request failed (${response.status}): ${text}`);
	}

	return response;
}
