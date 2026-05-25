import { json } from '@sveltejs/kit';

import { buildRagChunks } from '$lib/server/rag/documents';
import { embedText } from '$lib/server/rag/gemini';
import { countRagChunksForDocument, replaceRagChunks, upsertRagDocument } from '$lib/server/rag/supabase';
import { getRagConfig } from '$lib/server/rag/config';

export const POST = async ({ request }) => {
	const config = getRagConfig();
	const authHeader = request.headers.get('authorization') ?? '';
	const providedSecret = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

	if (!config.ingestSecret || providedSecret !== config.ingestSecret) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	try {
		const chunks = buildRagChunks();
		const chunksByDocument = new Map<string, typeof chunks>();
		for (const chunk of chunks) {
			const existing = chunksByDocument.get(chunk.content_hash) ?? [];
			existing.push(chunk);
			chunksByDocument.set(chunk.content_hash, existing);
		}
		let embeddedChunks = 0;
		let documents = 0;
		let skippedDocuments = 0;

		for (const documentChunks of chunksByDocument.values()) {
			const [first] = documentChunks;
			if (!first) continue;

			const document = await upsertRagDocument({
				source: first.source,
				source_type: first.source_type,
				title: first.title,
				content_hash: first.content_hash,
				metadata: first.metadata
			});

			const existingChunkCount = await countRagChunksForDocument(document.id);
			if (existingChunkCount >= documentChunks.length) {
				skippedDocuments += 1;
				continue;
			}

			const embedded = [];
			for (const chunk of documentChunks) {
				const embedding = await embedText(chunk.chunk_content);
				embedded.push({
					chunk_index: chunk.chunk_index,
					content: chunk.chunk_content,
					embedding,
					token_count: chunk.token_count,
					metadata: {
						...chunk.metadata,
						chunk_index: chunk.chunk_index
					}
				});
				embeddedChunks += 1;
			}

			await replaceRagChunks(document.id, embedded);
			documents += 1;
		}

		return json({
			ok: true,
			documents,
			skippedDocuments,
			chunks: embeddedChunks
		});
	} catch (error) {
		console.error('RAG ingest failed', error);
		return json(
			{ error: error instanceof Error ? error.message : 'RAG ingest failed' },
			{ status: 500 }
		);
	}
};
