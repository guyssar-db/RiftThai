import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface RateLimitInfo {
	count: number;
	resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

function isRateLimited(ip: string, path: string, maxRequests: number, windowMs: number): boolean {
	const key = `${ip}:${path}`;
	const now = Date.now();
	const limitInfo = rateLimitMap.get(key);

	if (!limitInfo || now > limitInfo.resetTime) {
		rateLimitMap.set(key, {
			count: 1,
			resetTime: now + windowMs
		});
		return false;
	}

	limitInfo.count++;
	if (limitInfo.count > maxRequests) {
		return true;
	}
	return false;
}

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof globalThis !== 'undefined') {
	const intervalKey = '__rate_limit_cleanup_interval__';
	if (!(intervalKey in globalThis)) {
		(globalThis as any)[intervalKey] = setInterval(() => {
			const now = Date.now();
			for (const [key, value] of rateLimitMap.entries()) {
				if (now > value.resetTime) {
					rateLimitMap.delete(key);
				}
			}
		}, 5 * 60 * 1000);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Rate Limiting for sensitive POST endpoints
	if (event.request.method === 'POST') {
		const path = event.url.pathname;
		if (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/verify-email') {
			let ip = 'unknown';
			try {
				ip = event.getClientAddress();
			} catch {}
			if (isRateLimited(ip, path, 10, 60_000)) {
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
