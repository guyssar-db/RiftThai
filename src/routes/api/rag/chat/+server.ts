import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { answerRagQuestion } from '$lib/server/rag/chat';
import { getRagConfig } from '$lib/server/rag/config';
import { getChatUsage, incrementChatUsage } from '$lib/server/rag/supabase';

export const POST = async ({ request, cookies }) => {
	try {
		const user = await getAuthenticatedUser(cookies);
		if (!user) {
			return json({ error: 'login required' }, { status: 401 });
		}

		const config = getRagConfig();
		const used = user.isAdmin ? 0 : await getChatUsage(user.id);
		if (!user.isAdmin && used >= config.dailyChatLimit) {
			return json(
				{
					error: 'daily chat limit reached',
					usage: {
						used,
						limit: config.dailyChatLimit
					}
				},
				{ status: 429 }
			);
		}

		const body = (await request.json()) as { question?: unknown };
		const question = typeof body.question === 'string' ? body.question.trim() : '';

		if (!question) {
			return json({ error: 'question is required' }, { status: 400 });
		}

		const result = await answerRagQuestion(question);
		const nextUsed = user.isAdmin ? 0 : await incrementChatUsage(user.id);

		return json({
			...result,
			usage: {
				used: nextUsed,
				limit: config.dailyChatLimit,
				isAdmin: user.isAdmin
			}
		});
	} catch (error) {
		console.error('RAG chat failed', error);
		return json(
			{ error: error instanceof Error ? error.message : 'RAG chat failed' },
			{ status: 500 }
		);
	}
};
