import cards from '$lib/data/riftbound_cards_all.json';

export const load = async ({ data }) => {
	return { ...data, cards };
};
