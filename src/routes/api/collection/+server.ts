import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import {
	getUserCollection,
	updateUserCollectionQuantity,
	clearUserCollection,
	batchUpsertUserCollection
} from '$lib/server/collection';

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

export const POST = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const body = await request.json().catch(() => null);

	// Batch Update Check
	if (body && Array.isArray(body.entries)) {
		try {
			await batchUpsertUserCollection(user.id, body.entries);
			return json({ ok: true });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'failed to batch update collection';
			return json({ error: message }, { status: 500 });
		}
	}

	const cardCode = typeof body?.cardCode === 'string' ? body.cardCode.trim() : '';
	const quantity = typeof body?.quantity === 'number' ? body.quantity : null;

	if (!cardCode || quantity === null) {
		return json({ error: 'cardCode and quantity are required' }, { status: 400 });
	}

	try {
		await updateUserCollectionQuantity(user.id, cardCode, quantity);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'failed to update collection';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	try {
		await clearUserCollection(user.id);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'failed to clear collection';
		return json({ error: message }, { status: 500 });
	}
};
