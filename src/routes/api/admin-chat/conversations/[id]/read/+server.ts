import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { markConversationRead } from '$lib/server/admin-chat';

export const POST = async ({ cookies, params }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	if (!user.isAdmin) return json({ error: 'admin required' }, { status: 403 });

	await markConversationRead(params.id);
	return json({ ok: true });
};

