import { getRagConfig } from '$lib/server/rag/config';
import { normalizeDeck, type DeckEntry, type StoredDeck } from '$lib/utils/deck';

type UserDeckRow = {
	id: string;
	user_id: string;
	local_deck_id: string;
	name: string;
	champion_code: string;
	entries: DeckEntry[];
	visibility: 'private' | 'unlisted' | 'public';
	created_at: string;
	updated_at: string;
};

export async function listUserDecks(userId: string) {
	const rows =
		(await deckRequest<UserDeckRow[]>(
			`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&select=*&order=updated_at.desc`
		)) ?? [];

	return rows.map(rowToStoredDeck);
}

export async function listPublicDecks() {
	const rows =
		(await deckRequest<UserDeckRow[]>(
			'/rest/v1/user_decks?visibility=eq.public&select=*&order=updated_at.desc&limit=60'
		)) ?? [];

	return rows.map(rowToStoredDeck);
}

export async function upsertUserDeck(userId: string, deck: StoredDeck) {
	const entries = normalizeDeck(deck.entries);
	const now = new Date().toISOString();
	const existingDeck = await findUserDeckByLocalId(userId, deck.id);

	const payload = {
		name: normalizeDeckName(deck.name),
		champion_code: deck.championCode || '',
		entries,
		updated_at: now
	};

	const rows = existingDeck
		? await deckRequest<UserDeckRow[]>(
				`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&local_deck_id=eq.${encodeURIComponent(deck.id)}&select=*`,
				{
					method: 'PATCH',
					headers: {
						Prefer: 'return=representation'
					},
					body: JSON.stringify(payload)
				}
			)
		: await deckRequest<UserDeckRow[]>('/rest/v1/user_decks?select=*', {
				method: 'POST',
				headers: {
					Prefer: 'return=representation'
				},
				body: JSON.stringify({
					user_id: userId,
					local_deck_id: deck.id,
					...payload,
					visibility: deck.visibility ?? 'private'
				})
			});

	const row = rows?.[0];
	if (!row) throw new Error('Could not save deck');
	return rowToStoredDeck(row);
}

async function findUserDeckByLocalId(userId: string, localDeckId: string) {
	const rows = await deckRequest<UserDeckRow[]>(
		`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&local_deck_id=eq.${encodeURIComponent(localDeckId)}&select=*`
	);

	return rows?.[0] ?? null;
}

export async function setUserDeckVisibility(userId: string, localDeckId: string, visibility: 'private' | 'public') {
	const rows = await deckRequest<UserDeckRow[]>(
		`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&local_deck_id=eq.${encodeURIComponent(localDeckId)}&select=*`,
		{
			method: 'PATCH',
			headers: {
				Prefer: 'return=representation'
			},
			body: JSON.stringify({
				visibility,
				updated_at: new Date().toISOString()
			})
		}
	);

	const row = rows?.[0];
	if (!row) throw new Error('Deck not found');
	return rowToStoredDeck(row);
}

export async function deleteUserDeck(userId: string, localDeckId: string) {
	await deckRequest(
		`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&local_deck_id=eq.${encodeURIComponent(localDeckId)}`,
		{
			method: 'DELETE',
			headers: {
				Prefer: 'return=minimal'
			}
		}
	);
}

function rowToStoredDeck(row: UserDeckRow): StoredDeck {
	return {
		id: row.local_deck_id,
		name: row.name,
		championCode: row.champion_code,
		entries: normalizeDeck(Array.isArray(row.entries) ? row.entries : []),
		updatedAt: row.updated_at,
		source: 'online',
		onlineId: row.id,
		visibility: row.visibility
	};
}

function normalizeDeckName(value: unknown) {
	const name = String(value ?? '').trim();
	return name ? name.slice(0, 48) : 'Untitled Deck';
}

async function deckRequest<T = unknown>(path: string, init: RequestInit = {}) {
	const config = getRagConfig();
	if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
		throw new Error('Supabase URL or service role key is missing');
	}

	const response = await fetch(`${config.supabaseUrl}${path}`, {
		...init,
		headers: {
			apikey: config.supabaseServiceRoleKey,
			Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
			'Content-Type': 'application/json',
			...(init.headers ?? {})
		}
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Deck database request failed (${response.status}): ${text}`);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return text ? (JSON.parse(text) as T) : (undefined as T);
}
