import { json } from '@sveltejs/kit';

import { loginUser, setSessionCookie } from '$lib/server/auth';
import { getRagConfig } from '$lib/server/rag/config';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const POST = async ({ request, cookies, getClientAddress }) => {
	try {
		const body = (await request.json()) as { email?: unknown; password?: unknown };
		const email = typeof body.email === 'string' ? body.email.trim() : '';
		const password = typeof body.password === 'string' ? body.password : '';

		if (!email || !password) {
			return json({ error: 'email and password are required' }, { status: 400 });
		}

		const ip = clientKey(getClientAddress());
		const ipLimit = checkRateLimit(`login:ip:${ip}`, { windowMs: 10 * 60_000, max: 30 });
		const accountLimit = checkRateLimit(`login:account:${ip}:${clientKey(email)}`, {
			windowMs: 10 * 60_000,
			max: 8
		});
		const limited = ipLimit.limited ? ipLimit : accountLimit;
		if (limited.limited) {
			return json(
				{ error: 'too many login attempts. please try again later' },
				{ status: 429, headers: rateLimitHeaders(limited.retryAfter) }
			);
		}

		const session = await loginUser(email, password);
		setSessionCookie(cookies, session.sessionToken, session.expiresAt);

		const config = getRagConfig();
		const userEmail = session.user.email;
		const isAdmin = config.adminEmails.includes(userEmail.toLowerCase());

		return json({
			user: {
				id: session.user.id,
				email: userEmail,
				displayName: session.user.displayName,
				displayNameLocked: session.user.displayNameLocked,
				profileHandle: session.user.profileHandle,
				profileSlug: session.user.profileSlug,
				isAdmin,
				emailVerified: session.user.emailVerified,
				createdAt: session.user.createdAt,
				settings: session.user.settings,
				usage: {
					used: 0,
					limit: 0
				}
			}
		});
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Login failed' },
			{ status: 401 }
		);
	}
};
