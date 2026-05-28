import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const handle: Handle = async ({ event, resolve }) => {
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
		"script-src 'self' 'unsafe-inline'",
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
	response.headers.set('Content-Security-Policy', policy.join('; '));
}
