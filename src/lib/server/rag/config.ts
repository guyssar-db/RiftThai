import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const RAG_EMBEDDING_DIMENSIONS = 768;

export function getRagConfig() {
	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL || '';
	const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || '';
	const geminiApiKey = env.GEMINI_API_KEY || '';

	return {
		supabaseUrl: supabaseUrl.replace(/\/$/, ''),
		supabaseServiceRoleKey,
		supabaseAnonKey,
		geminiApiKey,
		ingestSecret: env.RAG_INGEST_SECRET || '',
		geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
		geminiEmbeddingModel: env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
		matchThreshold: Number(env.RAG_MATCH_THRESHOLD || 0.5),
		matchCount: Number(env.RAG_MATCH_COUNT || 8),
		dailyChatLimit: Number(env.RAG_DAILY_CHAT_LIMIT || 5),
		adminEmails: (env.RAG_ADMIN_EMAILS || '')
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean)
	};
}

export function isSupabaseConfigured() {
	const config = getRagConfig();
	return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export function isGeminiConfigured() {
	return Boolean(getRagConfig().geminiApiKey);
}
