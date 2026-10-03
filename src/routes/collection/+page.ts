import cards from '$lib/data/cards.json';
import { sortCardsNewestFirst } from '$lib/utils/cardSort';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return { cards: sortCardsNewestFirst(cards) };
};
