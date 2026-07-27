import cards from '$lib/data/cards.json';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	return { cards, deckId: params.id };
};
