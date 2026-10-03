import { json } from '@sveltejs/kit';

import {
	beginTwoFactorSetup,
	confirmTwoFactorSetup,
	disableTwoFactor,
	getAuthenticatedUser,
	getTwoFactorStatus
} from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const GET = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	return json(await getTwoFactorStatus(user.id));
};

export const POST = async ({ cookies, request, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const rateLimit = await checkRateLimit(`2fa:${clientKey(getClientAddress())}:${user.id}`, {
		windowMs: 10 * 60_000,
		max: 10
	});
	if (rateLimit.limited) {
		return json(
			{ error: 'ดำเนินการ 2FA บ่อยเกินไป กรุณาลองใหม่ภายหลัง' },
			{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	const action = typeof body?.action === 'string' ? body.action : '';

	try {
		if (action === 'setup') {
			const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
			if (!currentPassword) return json({ error: 'กรุณากรอกรหัสผ่านปัจจุบัน' }, { status: 400 });

			return json(await beginTwoFactorSetup(user.id, currentPassword));
		}

		if (action === 'enable') {
			const code = typeof body?.code === 'string' ? body.code : '';
			if (!code) return json({ error: 'กรุณากรอกรหัสจาก Authenticator' }, { status: 400 });

			const backupCodes = await confirmTwoFactorSetup(user.id, code);
			return json({ enabled: true, backupCodes });
		}

		if (action === 'disable') {
			const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
			const code = typeof body?.code === 'string' ? body.code : '';
			if (!currentPassword || !code) {
				return json({ error: 'กรุณากรอกรหัสผ่านและรหัส 2FA' }, { status: 400 });
			}

			await disableTwoFactor(user.id, currentPassword, code);
			return json({ enabled: false });
		}

		return json({ error: 'คำสั่ง 2FA ไม่ถูกต้อง' }, { status: 400 });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'ดำเนินการ 2FA ไม่สำเร็จ' },
			{ status: 400 }
		);
	}
};
