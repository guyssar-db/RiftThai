import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import {
	deleteUserDeck,
	getDeckById,
	listPublicDecks,
	listUserDecks,
	setUserDeckVisibility,
	upsertUserDeck,
	getUserLikedDeckIds,
	adminDeleteDeck,
	adminSetDeckHidden,
	adminSetDeckVisibility
} from '$lib/server/decks';
import { normalizeDeck, type StoredDeck } from '$lib/utils/deck';

export const GET = async ({ cookies, url }) => {
	const deckId = url.searchParams.get('id');
	const user = await getAuthenticatedUser(cookies);

	if (deckId) {
		const deck = await getDeckById(deckId);
		if (!deck) return json({ error: 'deck not found' }, { status: 404 });

		if (deck.hidden && (!user || (!user.isAdmin && user.id !== deck.owner?.id))) {
			return json({ error: 'access denied (moderated)' }, { status: 403 });
		}

		if (deck.visibility !== 'public' && deck.visibility !== 'unlisted') {
			if (!user || (!user.isAdmin && user.id !== deck.owner?.id)) {
				return json({ error: 'access denied' }, { status: 403 });
			}
		}

		if (user && deck.onlineId) {
			const likedDeckIds = await getUserLikedDeckIds(user.id);
			deck.isLiked = likedDeckIds.has(deck.onlineId);
		}

		return json({ deck });
	}

	if (url.searchParams.get('scope') === 'public') {
		const sortParam = url.searchParams.get('sort') || 'newest';
		const orderBy =
			sortParam === 'popular' || sortParam === 'trending'
				? ('likes_count.desc,updated_at.desc' as const)
				: ('updated_at.desc' as const);

		const decks = await listPublicDecks(orderBy);

		if (user) {
			const likedDeckIds = await getUserLikedDeckIds(user.id);
			for (const deck of decks) {
				if (deck.onlineId) {
					deck.isLiked = likedDeckIds.has(deck.onlineId);
				}
			}
		}
		return json({ decks });
	}

	if (!user) return json({ error: 'login required' }, { status: 401 });

	const decks = await listUserDecks(user.id);
	if (user) {
		const likedDeckIds = await getUserLikedDeckIds(user.id);
		for (const deck of decks) {
			if (deck.onlineId) {
				deck.isLiked = likedDeckIds.has(deck.onlineId);
			}
		}
	}
	return json({ decks });
};

export const POST = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const deck = normalizeDeckInput(body?.deck);
	if (!deck) return json({ error: 'invalid deck' }, { status: 400 });
	deck.visibility = deck.visibility ?? user.settings.defaultDeckVisibility;

	const savedDeck = await upsertUserDeck(user.id, deck);
	return json({ deck: savedDeck });
};

export const PATCH = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const deckId = typeof body?.deckId === 'string' ? body.deckId.trim() : '';
	if (!deckId) return json({ error: 'deckId required' }, { status: 400 });

	const deck = await getDeckById(deckId);
	if (!deck) return json({ error: 'deck not found' }, { status: 404 });

	if (user.isAdmin) {
		let updatedDeck = deck;
		if (typeof body.hidden === 'boolean') {
			updatedDeck = await adminSetDeckHidden(deck.onlineId!, body.hidden);
		}
		if (body.visibility === 'public' || body.visibility === 'private' || body.visibility === 'unlisted') {
			updatedDeck = await adminSetDeckVisibility(deck.onlineId!, body.visibility);
		}
		return json({ deck: updatedDeck });
	}

	if (user.id !== deck.owner?.id) {
		return json({ error: 'access denied' }, { status: 403 });
	}

	const visibility = body?.visibility === 'public' ? 'public' : body?.visibility === 'private' ? 'private' : '';
	if (!visibility) return json({ error: 'invalid visibility update' }, { status: 400 });

	const updatedDeck = await setUserDeckVisibility(user.id, deckId, visibility);
	return json({ deck: updatedDeck });
};

export const DELETE = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const deckId = url.searchParams.get('deckId')?.trim() ?? '';
	if (!deckId) return json({ error: 'deckId required' }, { status: 400 });

	const deck = await getDeckById(deckId);
	if (!deck) return json({ error: 'deck not found' }, { status: 404 });

	if (user.isAdmin) {
		await adminDeleteDeck(deck.onlineId!);
		return json({ ok: true });
	}

	if (user.id !== deck.owner?.id) {
		return json({ error: 'access denied' }, { status: 403 });
	}

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
		sideboardEntries: normalizeDeck(Array.isArray(deck.sideboardEntries) ? deck.sideboardEntries : []),
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
