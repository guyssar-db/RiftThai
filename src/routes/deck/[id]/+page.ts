import cards from '$lib/data/riftbound_cards_all.json';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	let loadedDeck = null;
	try {
		const response = await fetch(`/api/decks?id=${encodeURIComponent(params.id)}`);
		if (response.ok) {
			const data = await response.json();
			loadedDeck = data.deck || null;
		}
	} catch (err) {
		// Fallback to local
	}
	return { cards, deckId: params.id, loadedDeck };
};
