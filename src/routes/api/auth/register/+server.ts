import { json } from '@sveltejs/kit';

import { registerUser } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

const registerResponse = {
	ok: true,
	message: 'If the account can be created, a verification email will be sent'
};

export const POST = async ({ request, getClientAddress }) => {
	try {
		const body = (await request.json()) as {
			email?: unknown;
			password?: unknown;
			displayName?: unknown;
		};
		const email = typeof body.email === 'string' ? body.email.trim() : '';
		const password = typeof body.password === 'string' ? body.password : '';
		const displayName = typeof body.displayName === 'string' ? body.displayName : '';

		const ip = clientKey(getClientAddress());
		const ipLimit = checkRateLimit(`register:ip:${ip}`, { windowMs: 60 * 60_000, max: 5 });
		const emailLimit = checkRateLimit(`register:email:${clientKey(email)}`, {
			windowMs: 60 * 60_000,
			max: 3
		});
		const limited = ipLimit.limited ? ipLimit : emailLimit;
		if (limited.limited) {
			return json(
				{ error: 'too many registration attempts. please try again later' },
				{ status: 429, headers: rateLimitHeaders(limited.retryAfter) }
			);
		}

		await registerUser(email, password, displayName);
		return json(registerResponse);
	} catch (error) {
		const message = error instanceof Error ? error.message : '';
		if (message === 'อีเมลนี้ถูกใช้งานแล้ว') return json(registerResponse);
		return json({ error: message || 'สมัครสมาชิกไม่สำเร็จ' }, { status: 400 });
	}
};
