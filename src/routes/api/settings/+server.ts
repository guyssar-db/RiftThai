import { json } from '@sveltejs/kit';

import { changeUserPassword, getAuthenticatedUser, updateUserSettings } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const PATCH = async ({ cookies, request, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const rateLimit = checkRateLimit(`settings:${clientKey(getClientAddress())}:${user.id}`, {
		windowMs: 60_000,
		max: 20
	});
	if (rateLimit.limited) {
		return json(
			{ error: 'too many settings updates. please try again later' },
			{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	try {
		const updatedUser = await updateUserSettings(user.id, {
			profilePublic: typeof body?.profilePublic === 'boolean' ? body.profilePublic : undefined,
			publicDecksVisible:
				typeof body?.publicDecksVisible === 'boolean' ? body.publicDecksVisible : undefined,
			defaultDeckVisibility:
				body?.defaultDeckVisibility === 'public' || body?.defaultDeckVisibility === 'private'
					? body.defaultDeckVisibility
					: undefined,
			defaultExportLayout:
				body?.defaultExportLayout === 'landscape' || body?.defaultExportLayout === 'portrait'
					? body.defaultExportLayout
					: undefined
		});

		return json({ settings: updatedUser.settings });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Could not update settings' },
			{ status: 400 }
		);
	}
};

export const POST = async ({ cookies, request, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });

	const rateLimit = checkRateLimit(`password:${clientKey(getClientAddress())}:${user.id}`, {
		windowMs: 10 * 60_000,
		max: 5
	});
	if (rateLimit.limited) {
		return json(
			{ error: 'too many password attempts. please try again later' },
			{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
	const nextPassword = typeof body?.nextPassword === 'string' ? body.nextPassword : '';

	try {
		await changeUserPassword(user.id, currentPassword, nextPassword);
		return json({ ok: true });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Could not change password' },
			{ status: 400 }
		);
	}
};
