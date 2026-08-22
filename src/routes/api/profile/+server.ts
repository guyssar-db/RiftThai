import { json } from '@sveltejs/kit';

import { getAuthenticatedUser, updateUserDisplayName } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const PATCH = async ({ cookies, request, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const rateLimit = checkRateLimit(`profile:${clientKey(getClientAddress())}:${user.id}`, {
		windowMs: 60_000,
		max: 10
	});
	if (rateLimit.limited) {
		return json(
			{ error: 'too many profile updates. please try again later' },
			{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	const displayName = typeof body?.displayName === 'string' ? body.displayName : '';
	try {
		const updatedUser = await updateUserDisplayName(user.id, displayName);
		return json({
			user: {
				id: updatedUser.id,
				displayName: updatedUser.displayName,
				displayNameLocked: updatedUser.displayNameLocked,
				profileHandle: updatedUser.profileHandle,
				profileSlug: updatedUser.profileSlug,
				isAdmin: updatedUser.isAdmin
			}
		});
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'อัปเดตโปรไฟล์ไม่สำเร็จ' },
			{ status: 400 }
		);
	}
};
