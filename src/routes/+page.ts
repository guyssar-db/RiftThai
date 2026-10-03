import cards from '$lib/data/cards.json';
import { sortCardsNewestFirst } from '$lib/utils/cardSort';

export const load = async ({ data }) => {
	return { ...data, cards: sortCardsNewestFirst(cards) };
};
