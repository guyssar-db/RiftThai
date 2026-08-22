import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { getConversation, getMessages, markConversationRead } from '$lib/server/admin-chat';

export const GET = async ({ cookies, params }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
	if (!user.isAdmin) return json({ error: 'ต้องมีสิทธิ์ผู้ดูแลระบบ' }, { status: 403 });

	const conversation = await getConversation(params.id);
	if (!conversation) return json({ error: 'ไม่พบบทสนทนา' }, { status: 404 });

	await markConversationRead(conversation.id);
	const messages = await getMessages(conversation.id);

	return json({ conversation, messages });
};
