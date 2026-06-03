import cards from '$lib/data/riftbound_cards_all.json';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return { cards };
};
