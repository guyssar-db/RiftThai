import type { PageServerLoad } from './$types';
import sourceCards from '../../../../../static/cards.json';

const powerCosts: Record<string, number | null> = Object.fromEntries(
	sourceCards.map((card) => [card.cardCode.toLowerCase().replaceAll('/', '-'), card.power])
);

export const load: PageServerLoad = async ({ params }) => {
	return { deckId: params.id, powerCosts };
};
