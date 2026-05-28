import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { getConversation, sendMessage } from '$lib/server/admin-chat';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const POST = async ({ request, cookies, params, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	if (!user.isAdmin) return json({ error: 'admin required' }, { status: 403 });

	const ip = clientKey(getClientAddress());
	const rateLimit = checkRateLimit(`admin-support:${ip}:${user.id}`, { windowMs: 60_000, max: 30 });
	if (rateLimit.limited) {
		return json(
			{ error: 'too many admin messages. please try again later' },
			{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
		);
	}

	const conversation = await getConversation(params.id);
	if (!conversation) return json({ error: 'conversation not found' }, { status: 404 });

	const body = (await request.json()) as { body?: unknown };
	const messageBody = typeof body.body === 'string' ? body.body : '';
	const message = await sendMessage(conversation.id, user, messageBody);

	return json({ message });
};
