import cards from '$lib/data/riftbound_cards_all.json';

export const load = async () => {
    const canEdit = !!process.env.RIOT_API_KEY;
	return { cards, canEdit };
};
