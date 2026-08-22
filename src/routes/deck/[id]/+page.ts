import cards from '$lib/data/cards.json';

export const load = async ({ data }) => {
	return { ...data, cards };
};
