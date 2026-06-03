import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { likeDeck, unlikeDeck } from '$lib/server/decks';

export const POST = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const deckId = typeof body?.deckId === 'string' ? body.deckId.trim() : '';
	if (!deckId) return json({ error: 'deckId required' }, { status: 400 });

	try {
		await likeDeck(user.id, deckId);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'failed to like deck';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const deckId = url.searchParams.get('deckId')?.trim() ?? '';
	if (!deckId) return json({ error: 'deckId required' }, { status: 400 });

	try {
		await unlikeDeck(user.id, deckId);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'failed to unlike deck';
		return json({ error: message }, { status: 500 });
	}
};
