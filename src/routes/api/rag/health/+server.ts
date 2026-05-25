import { json } from '@sveltejs/kit';

import { getRagConfig, isGeminiConfigured, isSupabaseConfigured } from '$lib/server/rag/config';
import { countRagChunks, getUsageDate } from '$lib/server/rag/supabase';

export const GET = async () => {
	const config = getRagConfig();
	let chunkCount: number | null = null;
	let supabaseError: string | null = null;

	if (isSupabaseConfigured()) {
		try {
			chunkCount = await countRagChunks();
		} catch (error) {
			supabaseError = error instanceof Error ? error.message : 'Supabase health check failed';
		}
	}

	return json({
		geminiConfigured: isGeminiConfigured(),
		supabaseConfigured: isSupabaseConfigured(),
		geminiModel: config.geminiModel,
		geminiEmbeddingModel: config.geminiEmbeddingModel,
		matchThreshold: config.matchThreshold,
		matchCount: config.matchCount,
		dailyChatLimit: config.dailyChatLimit,
		dailyResetTime: '15:30 Asia/Bangkok',
		currentUsageDate: getUsageDate(),
		chunkCount,
		supabaseError
	});
};
