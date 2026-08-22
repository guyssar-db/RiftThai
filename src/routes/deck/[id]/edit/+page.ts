import cards from '$lib/data/cards.json';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
	return { ...data, cards };
};
