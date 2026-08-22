import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { likeDeck, unlikeDeck } from '$lib/server/decks';

export const POST = async ({ cookies, request }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const deckId = typeof body?.deckId === 'string' ? body.deckId.trim() : '';
	if (!deckId) return json({ error: 'กรุณาระบุเด็ค' }, { status: 400 });

	try {
		await likeDeck(user.id, deckId);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'โหวตเด็คไม่สำเร็จ';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const deckId = url.searchParams.get('deckId')?.trim() ?? '';
	if (!deckId) return json({ error: 'กรุณาระบุเด็ค' }, { status: 400 });

	try {
		await unlikeDeck(user.id, deckId);
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'ยกเลิกโหวตเด็คไม่สำเร็จ';
		return json({ error: message }, { status: 500 });
	}
};
