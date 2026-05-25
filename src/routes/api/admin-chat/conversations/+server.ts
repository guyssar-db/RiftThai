import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { hasUnreadUserMessage, listAdminConversations } from '$lib/server/admin-chat';

export const GET = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	if (!user.isAdmin) return json({ error: 'admin required' }, { status: 403 });

	const conversations = await listAdminConversations();

	return json({
		conversations: conversations.map((conversation) => ({
			...conversation,
			hasUnread: hasUnreadUserMessage(conversation)
		}))
	});
};

