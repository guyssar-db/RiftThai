import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { deleteUserDeck, listPublicDecks, listUserDecks, setUserDeckVisibility, upsertUserDeck } from '$lib/server/decks';
import { normalizeDeck, type StoredDeck } from '$lib/utils/deck';

export const GET = async ({ cookies, url }) => {
	if (url.searchParams.get('scope') === 'public') {
		const decks = await listPublicDecks();
		return json({ decks });
	}

	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const decks = await listUserDecks(user.id);
	return json({ decks });
};

export const POST = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const deck = normalizeDeckInput(body?.deck);
	if (!deck) return json({ error: 'invalid deck' }, { status: 400 });

	const savedDeck = await upsertUserDeck(user.id, deck);
	return json({ deck: savedDeck });
};

export const PATCH = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const deckId = typeof body?.deckId === 'string' ? body.deckId.trim() : '';
	const visibility = body?.visibility === 'public' ? 'public' : body?.visibility === 'private' ? 'private' : '';
	if (!deckId || !visibility) return json({ error: 'invalid visibility update' }, { status: 400 });

	const deck = await setUserDeckVisibility(user.id, deckId, visibility);
	return json({ deck });
};

export const DELETE = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const deckId = url.searchParams.get('deckId')?.trim() ?? '';
	if (!deckId) return json({ error: 'deckId required' }, { status: 400 });

	await deleteUserDeck(user.id, deckId);
	return json({ ok: true });
};

function normalizeDeckInput(value: unknown): StoredDeck | null {
	if (!value || typeof value !== 'object') return null;
	const deck = value as Partial<StoredDeck>;
	const id = typeof deck.id === 'string' && deck.id.trim() ? deck.id.trim() : '';
	if (!id) return null;

	return {
		id,
		name: String(deck.name ?? 'Untitled Deck').trim().slice(0, 48) || 'Untitled Deck',
		championCode: String(deck.championCode ?? '').trim(),
		entries: normalizeDeck(Array.isArray(deck.entries) ? deck.entries : []),
		updatedAt:
			typeof deck.updatedAt === 'string' && deck.updatedAt.trim()
				? deck.updatedAt
				: new Date().toISOString(),
		source: 'local',
		onlineId: typeof deck.onlineId === 'string' && deck.onlineId.trim() ? deck.onlineId : undefined,
		visibility:
			deck.visibility === 'public' || deck.visibility === 'unlisted' || deck.visibility === 'private'
				? deck.visibility
				: undefined
	};
}
