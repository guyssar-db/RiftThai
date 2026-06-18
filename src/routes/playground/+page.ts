import cards from '$lib/data/riftbound_cards_all.json';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const deckId = url.searchParams.get('id') || '';
	let loadedDeck = null;

	if (deckId) {
		try {
			const response = await fetch(`/api/decks?id=${encodeURIComponent(deckId)}`);
			if (response.ok) {
				const data = await response.json();
				loadedDeck = data.deck || null;
			}
		} catch (err) {
			console.error('Failed to load online deck for playground:', err);
		}
	}

	return { cards, deckId, loadedDeck };
};
