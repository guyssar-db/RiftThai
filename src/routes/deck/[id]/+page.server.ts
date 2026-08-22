import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
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
	return { deckId: params.id, loadedDeck };
};
