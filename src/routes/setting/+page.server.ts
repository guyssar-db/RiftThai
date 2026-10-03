import { redirect } from '@sveltejs/kit';

import { getAuthenticatedUser, getTwoFactorStatus } from '$lib/server/auth';

export const load = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) throw redirect(303, '/');
	const twoFactor = await getTwoFactorStatus(user.id);

	return {
		user: {
			id: user.id,
			email: user.email,
			displayName: user.displayName,
			displayNameLocked: user.displayNameLocked,
			profileHandle: user.profileHandle,
			profileSlug: user.profileSlug,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			twoFactorEnabled: twoFactor.enabled,
			settings: user.settings
		}
	};
};
