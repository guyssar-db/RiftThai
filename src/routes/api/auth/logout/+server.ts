import { json } from '@sveltejs/kit';

import { logoutUser } from '$lib/server/auth';

export const POST = async ({ cookies }) => {
	await logoutUser(cookies);
	return json({ ok: true });
};
