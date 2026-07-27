import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import {
	getUserCollection,
	updateUserCollectionQuantity,
	clearUserCollection,
	batchUpsertUserCollection
} from '$lib/server/collection';
import { boundedInteger, boundedString, isRecord, safeServerError } from '$lib/server/request';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const GET = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	try {
		const collection = await getUserCollection(user.id);
		return json({ collection });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'failed to load collection';
		return json({ error: message }, { status: 500 });
	}
};

export const POST = async ({ cookies, request, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	const limit = checkRateLimit(`collection:${clientKey(getClientAddress())}:${user.id}`, { windowMs: 60_000, max: 120 });
	if (limit.limited) return json({ error: 'too many collection updates' }, { status: 429, headers: rateLimitHeaders(limit.retryAfter) });

	const body = await request.json().catch(() => null);

	// Batch Update Check
	if (isRecord(body) && Array.isArray(body.entries)) {
		if (body.entries.length > 500 || !body.entries.every(isValidCollectionEntry)) {
			return json({ error: 'invalid collection batch' }, { status: 400 });
		}
		try {
			await batchUpsertUserCollection(user.id, body.entries as { cardCode: string; quantity: number }[]);
			return json({ ok: true });
		} catch (error) {
			return json(safeServerError('Collection batch update failed', error), { status: 500 });
		}
	}

	const cardCode = isRecord(body) ? boundedString(body.cardCode, 80, 1) : null;
	const quantity = isRecord(body) ? boundedInteger(body.quantity, 0, 999) : null;

	if (!cardCode || quantity === null) {
		return json({ error: 'cardCode and quantity are required' }, { status: 400 });
	}

	try {
		await updateUserCollectionQuantity(user.id, cardCode, quantity);
		return json({ ok: true });
	} catch (error) {
		return json(safeServerError('Collection update failed', error), { status: 500 });
	}
};

export const DELETE = async ({ cookies, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	const limit = checkRateLimit(`collection-clear:${clientKey(getClientAddress())}:${user.id}`, { windowMs: 60_000, max: 5 });
	if (limit.limited) return json({ error: 'too many requests' }, { status: 429, headers: rateLimitHeaders(limit.retryAfter) });

	try {
		await clearUserCollection(user.id);
		return json({ ok: true });
	} catch (error) {
		return json(safeServerError('Collection clear failed', error), { status: 500 });
	}
};

function isValidCollectionEntry(value: unknown): value is { cardCode: string; quantity: number } {
	if (!isRecord(value)) return false;
	return boundedString(value.cardCode, 80, 1) !== null && boundedInteger(value.quantity, 0, 999) !== null;
}
