import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { getMessages, getOrCreateConversation, sendMessage } from '$lib/server/admin-chat';

export const GET = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const conversation = await getOrCreateConversation(user);
	const messages = await getMessages(conversation.id);

	return json({ conversation, messages });
};

export const POST = async ({ request, cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = (await request.json()) as { body?: unknown };
	const messageBody = typeof body.body === 'string' ? body.body : '';
	const conversation = await getOrCreateConversation(user);
	const message = await sendMessage(conversation.id, user, messageBody);

	return json({ message });
};

