import { json } from '@sveltejs/kit';
import { getAuthenticatedUser, banUser, unbanUser } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const POST = async ({ request, cookies, getClientAddress }) => {
	const currentUser = await getAuthenticatedUser(cookies);
	if (!currentUser) return json({ error: 'login required' }, { status: 401 });
	if (!currentUser.isAdmin) return json({ error: 'admin required' }, { status: 403 });

	const ip = clientKey(getClientAddress());
	const limit = checkRateLimit(`admin:ban:${ip}:${currentUser.id}`, {
		windowMs: 60_000,
		max: 10
	});
	if (limit.limited) {
		return json(
			{ error: 'too many ban attempts. please try again later' },
			{ status: 429, headers: rateLimitHeaders(limit.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	const targetUserId = typeof body?.userId === 'string' ? body.userId.trim() : '';
	const action = body?.action === 'unban' ? 'unban' : 'ban';

	if (!targetUserId) {
		return json({ error: 'userId is required' }, { status: 400 });
	}

	try {
		if (action === 'ban') {
			await banUser(targetUserId);
		} else {
			await unbanUser(targetUserId);
		}
		return json({ ok: true });
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Action failed';
		return json({ error: msg }, { status: 500 });
	}
};
