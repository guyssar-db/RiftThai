import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { getMessages, getOrCreateConversation, sendMessage } from '$lib/server/admin-chat';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const GET = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const conversation = await getOrCreateConversation(user);
	const messages = await getMessages(conversation.id);

	return json({ conversation, messages });
};

export const POST = async ({ request, cookies, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const ip = clientKey(getClientAddress());
	const ipLimit = checkRateLimit(`support-chat:ip:${ip}`, { windowMs: 60_000, max: 20 });
	const userLimit = checkRateLimit(`support-chat:user:${user.id}`, { windowMs: 60_000, max: 10 });
	const limited = ipLimit.limited ? ipLimit : userLimit;
	if (limited.limited) {
		return json(
			{ error: 'too many support messages. please try again later' },
			{ status: 429, headers: rateLimitHeaders(limited.retryAfter) }
		);
	}

	const body = (await request.json()) as { body?: unknown };
	const messageBody = typeof body.body === 'string' ? body.body : '';
	const conversation = await getOrCreateConversation(user);
	const message = await sendMessage(conversation.id, user, messageBody);

	return json({ message });
};
