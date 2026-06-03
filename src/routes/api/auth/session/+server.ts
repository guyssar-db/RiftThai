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
			id: user.id,
			email: user.email,
			displayName: user.displayName,
			displayNameLocked: user.displayNameLocked,
			profileHandle: user.profileHandle,
			profileSlug: user.profileSlug,
			isAdmin: user.isAdmin,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			settings: user.settings,
			usage: {
				used,
				limit: config.dailyChatLimit
			}
		}
	});
};
