import { json, redirect } from '@sveltejs/kit';

import { verifyEmailToken } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const GET = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const next = new URL('/verify-email', url);

	try {
		await verifyEmailToken(token);
		next.searchParams.set('status', 'success');
	} catch (error) {
		next.searchParams.set('status', 'error');
		next.searchParams.set(
			'message',
			error instanceof Error ? error.message : 'ยืนยันอีเมลไม่สำเร็จ'
		);
	}

	throw redirect(303, next);
};

export const POST = async ({ request, getClientAddress }) => {
	try {
		const rateLimit = checkRateLimit(`verify-email:${clientKey(getClientAddress())}`, {
			windowMs: 60_000,
			max: 20
		});
		if (rateLimit.limited) {
			return json(
				{ error: 'too many verification attempts. please try again later' },
				{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
			);
		}

		const body = (await request.json()) as { token?: unknown };
		const token = typeof body.token === 'string' ? body.token : '';
		const user = await verifyEmailToken(token);
		return json({ user });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'ยืนยันอีเมลไม่สำเร็จ' },
			{ status: 400 }
		);
	}
};
