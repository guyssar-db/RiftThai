import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { getRagConfig } from '$lib/server/rag/config';
import { getChatUsage } from '$lib/server/rag/supabase';

export const GET = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ user: null });

	const config = getRagConfig();
	const used = user.isAdmin ? 0 : await getChatUsage(user.id);

	return json({
		user: {
			email: user.email,
			isAdmin: user.isAdmin,
			usage: {
				used,
				limit: config.dailyChatLimit
			}
		}
	});
};

