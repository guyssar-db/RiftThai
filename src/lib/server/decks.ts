import { getRagConfig } from '$lib/server/rag/config';
import { getUserDisplayName, getUserProfileHandle, getUserProfileSlug } from '$lib/server/auth';
import { normalizeDeck, type DeckEntry, type StoredDeck } from '$lib/utils/deck';

type UserDeckRow = {
	id: string;
	user_id: string;
	local_deck_id: string;
	name: string;
	champion_code: string;
	entries: DeckEntry[];
	sideboard_entries?: DeckEntry[];
	visibility: 'private' | 'unlisted' | 'public';
	likes_count?: number;
	created_at: string;
	updated_at: string;
	app_users?: {
		id: string;
		email: string;
		display_name: string | null;
		profile_slug: string | null;
		profile_number: string | null;
		profile_public?: boolean | null;
		public_decks_visible?: boolean | null;
	} | null;
};

export async function listUserDecks(userId: string) {
	const rows =
		(await deckRequest<UserDeckRow[]>(
			`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&select=*&order=updated_at.desc`
		)) ?? [];

	return rows.map(rowToStoredDeck);
}

export async function listPublicDecks(orderBy: 'updated_at.desc' | 'likes_count.desc,updated_at.desc' = 'updated_at.desc') {
	const rows =
		(await deckRequest<UserDeckRow[]>(
			`/rest/v1/user_decks?visibility=eq.public&select=*,app_users!inner(id,email,display_name,profile_slug,profile_number,profile_public,public_decks_visible)&app_users.profile_public=eq.true&app_users.public_decks_visible=eq.true&order=${orderBy}&limit=60`
		)) ?? [];

	return rows.map(rowToStoredDeck);
}

export async function listPublicDecksByUser(userId: string) {
	const rows =
		(await deckRequest<UserDeckRow[]>(
			`/rest/v1/user_decks?user_id=eq.${encodeURIComponent(userId)}&visibility=eq.public&select=*,app_users(id,email,display_name,profile_slug,profile_number)&order=updated_at.desc`
		)) ?? [];

	return rows.map(rowToStoredDeck);
}

export async function getDeckById(deckId: string) {
	const rows = await deckRequest<UserDeckRow[]>(
		`/rest/v1/user_decks?local_deck_id=eq.${encodeURIComponent(deckId)}&select=*,app_users(id,email,display_name,profile_slug,profile_number)`
	);
	return rows?.[0] ? rowToStoredDeck(rows[0]) : null;
}

export async function upsertUserDeck(userId: string, deck: StoredDeck) {
	const entries = normalizeDeck(deck.entries);
	const sideboardEntries = normalizeDeck(deck.sideboardEntries || []);
	const now = new Date().toISOString();
	const existingDeck = await findUserDeckByLocalId(userId, deck.id);

	const payload = {
		name: normalizeDeckName(deck.name),
		champion_code: deck.championCode || '',
		entries,
		sideboard_entries: sideboardEntries,
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
		sideboardEntries: normalizeDeck(Array.isArray(row.sideboard_entries) ? row.sideboard_entries : []),
		updatedAt: row.updated_at,
		source: 'online',
		onlineId: row.id,
		visibility: row.visibility,
		likesCount: row.likes_count ?? 0,
		owner: row.app_users
			? {
					id: row.app_users.id,
					displayName: getUserDisplayName(row.app_users),
					profileHandle: getUserProfileHandle(row.app_users),
					profileSlug: getUserProfileSlug(row.app_users)
				}
			: {
					id: row.user_id,
					displayName: 'Player',
					profileHandle: 'player',
					profileSlug: 'player'
				}
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

export async function getUserLikedDeckIds(userId: string): Promise<Set<string>> {
	interface LikeRow {
		deck_id: string;
	}
	const rows = await deckRequest<LikeRow[]>(
		`/rest/v1/deck_likes?user_id=eq.${encodeURIComponent(userId)}&select=deck_id`
	);
	return new Set(rows?.map((r) => r.deck_id) ?? []);
}

export async function likeDeck(userId: string, deckId: string): Promise<void> {
	await deckRequest('/rest/v1/deck_likes', {
		method: 'POST',
		headers: {
			Prefer: 'resolution=merge-duplicates,return=minimal'
		},
		body: JSON.stringify({
			user_id: userId,
			deck_id: deckId
		})
	});
}

export async function unlikeDeck(userId: string, deckId: string): Promise<void> {
	await deckRequest(
		`/rest/v1/deck_likes?user_id=eq.${encodeURIComponent(userId)}&deck_id=eq.${encodeURIComponent(deckId)}`,
		{
			method: 'DELETE',
			headers: {
				Prefer: 'return=minimal'
			}
		}
	);
}
