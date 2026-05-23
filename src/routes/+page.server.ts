import cards from '$lib/data/riftbound_cards_all.json';

export const load = async ({ url }) => {
	const canEdit = !!process.env.RIOT_API_KEY;
	const searchTerm = url.searchParams.get('q') ?? '';
	return { cards, canEdit, searchTerm };
};
