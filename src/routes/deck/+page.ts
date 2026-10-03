import cards from '$lib/data/cards.json';
import { sortCardsNewestFirst } from '$lib/utils/cardSort';

export const load = async () => {
	return { cards: sortCardsNewestFirst(cards) };
};
