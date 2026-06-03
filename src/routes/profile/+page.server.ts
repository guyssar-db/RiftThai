import { redirect } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';

export const load = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) throw redirect(303, '/');
	throw redirect(303, `/profile/${user.profileSlug}`);
};
