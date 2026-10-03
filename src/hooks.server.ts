import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/security';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const handle: Handle = async ({ event, resolve }) => {
	// Rate Limiting for sensitive POST endpoints
	if (event.request.method === 'POST') {
		const path = event.url.pathname;
		if (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/verify-email') {
			let ip = 'unknown';
			try {
				ip = event.getClientAddress();
			} catch {}
			if ((await checkRateLimit(`auth:${ip}:${path}`, { max: 10, windowMs: 60_000 })).limited) {
				return new Response('Too Many Requests. Please try again in a minute.', {
					status: 429,
					headers: { 'Retry-After': '60' }
				});
			}
		}
	}

	if (unsafeMethods.has(event.request.method) && !isAllowedOrigin(event.request, event.url)) {
		return new Response('Forbidden', { status: 403 });
	}

	const response = await resolve(event);
	setSecurityHeaders(response);
	return response;
};

function isAllowedOrigin(request: Request, url: URL) {
	const origin = request.headers.get('origin');
	if (!origin) return true;

	const allowedOrigins = new Set([url.origin]);
	const appUrl = publicEnv.PUBLIC_APP_URL?.replace(/\/$/, '');
	if (appUrl) allowedOrigins.add(appUrl);
	allowedOrigins.add('https://riftthai.guyssar.com');

	return allowedOrigins.has(origin);
}

function setSecurityHeaders(response: Response) {
	const policy = [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"frame-ancestors 'none'",
		"form-action 'self'",
		"img-src 'self' data: blob: https://cmsassets.rgpub.io",
		"font-src 'self' data: https://fonts.gstatic.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"connect-src 'self' ws: wss:"
	];
	if (env.NODE_ENV === 'production') policy.push('upgrade-insecure-requests');

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), payment=()'
	);
	response.headers.set('X-Frame-Options', 'DENY');
	const generatedCsp = response.headers.get('Content-Security-Policy');
	response.headers.set('Content-Security-Policy', [generatedCsp, policy.join('; ')].filter(Boolean).join('; '));
}
