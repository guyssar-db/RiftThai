import { getRagConfig } from '$lib/server/rag/config';

type UserCollectionRow = {
	user_id: string;
	card_code: string;
	quantity: number;
};

export async function getUserCollection(userId: string): Promise<Record<string, number>> {
	const rows =
		(await collectionRequest<UserCollectionRow[]>(
			`/rest/v1/user_collections?user_id=eq.${encodeURIComponent(userId)}&select=card_code,quantity`
		)) ?? [];

	const collection: Record<string, number> = {};
	for (const row of rows) {
		collection[row.card_code] = row.quantity;
	}
	return collection;
}

export async function updateUserCollectionQuantity(
	userId: string,
	cardCode: string,
	quantity: number
): Promise<void> {
	const cleanCode = String(cardCode ?? '').trim();
	if (!cleanCode) throw new Error('cardCode is required');

	const qty = Math.max(0, Math.floor(Number(quantity) || 0));

	if (qty === 0) {
		// Delete
		await collectionRequest(
			`/rest/v1/user_collections?user_id=eq.${encodeURIComponent(userId)}&card_code=eq.${encodeURIComponent(cleanCode)}`,
			{
				method: 'DELETE',
				headers: {
					Prefer: 'return=minimal'
				}
			}
		);
	} else {
		// Upsert
		await collectionRequest('/rest/v1/user_collections?on_conflict=user_id,card_code', {
			method: 'POST',
			headers: {
				Prefer: 'resolution=merge-duplicates,return=minimal'
			},
			body: JSON.stringify({
				user_id: userId,
				card_code: cleanCode,
				quantity: qty,
				updated_at: new Date().toISOString()
			})
		});
	}
}

export async function clearUserCollection(userId: string): Promise<void> {
	await collectionRequest(
		`/rest/v1/user_collections?user_id=eq.${encodeURIComponent(userId)}`,
		{
			method: 'DELETE',
			headers: {
				Prefer: 'return=minimal'
			}
		}
	);
}

export async function batchUpsertUserCollection(
	userId: string,
	entries: { cardCode: string; quantity: number }[]
): Promise<void> {
	if (entries.length === 0) return;

	const upserts = entries.filter((e) => e.quantity > 0).map((entry) => ({
		user_id: userId,
		card_code: entry.cardCode.toUpperCase(),
		quantity: entry.quantity,
		updated_at: new Date().toISOString()
	}));

	const deletes = entries.filter((e) => e.quantity === 0).map((entry) => entry.cardCode.toUpperCase());

	if (deletes.length > 0) {
		const formattedCodes = deletes.map((c) => `"${c}"`).join(',');
		await collectionRequest(
			`/rest/v1/user_collections?user_id=eq.${encodeURIComponent(userId)}&card_code=in.(${encodeURIComponent(formattedCodes)})`,
			{
				method: 'DELETE',
				headers: {
					Prefer: 'return=minimal'
				}
			}
		);
	}

	if (upserts.length > 0) {
		await collectionRequest('/rest/v1/user_collections?on_conflict=user_id,card_code', {
			method: 'POST',
			headers: {
				Prefer: 'resolution=merge-duplicates,return=minimal'
			},
			body: JSON.stringify(upserts)
		});
	}
}

async function collectionRequest<T = unknown>(path: string, init: RequestInit = {}) {
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
		throw new Error(`Collection database request failed (${response.status}): ${text}`);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return text ? (JSON.parse(text) as T) : (undefined as T);
}
