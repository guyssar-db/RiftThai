import cards from '$lib/data/riftbound_cards_all.json';
import { getAuthenticatedUser } from '$lib/server/auth';

export const load = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	const canEdit = Boolean(user?.isAdmin);
	const searchTerm = url.searchParams.get('q') ?? '';
	return { cards, canEdit, searchTerm };
};
