import { redirect } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { listCardReports } from '$lib/server/card-reports';
import cards from '$lib/data/riftbound_cards_all.json';

export const load = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) throw redirect(302, '/');
	if (!user.isAdmin) throw redirect(302, '/');

	return {
		user,
		reports: await listCardReports(),
		cards
	};
};
