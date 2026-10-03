import { env } from '$env/dynamic/private';
import { getRagConfig } from './rag/config';
import { createHash } from 'node:crypto';

type RateLimitOptions = {
	windowMs: number;
	max: number;
};

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();
let lastCleanupAt = 0;

export async function checkRateLimit(key: string, options: RateLimitOptions) {
	if (env.NODE_ENV === 'production' || env.SHARED_RATE_LIMIT === 'true') {
		const config = getRagConfig();
		try {
			const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/consume_rate_limit`, {
				method: 'POST',
				headers: { apikey: config.supabaseServiceRoleKey, Authorization: `Bearer ${config.supabaseServiceRoleKey}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ bucket_key: createHash('sha256').update(key).digest('hex'), window_ms: options.windowMs, max_requests: options.max }),
				signal: AbortSignal.timeout(5000)
			});
			if (!response.ok) throw new Error('Rate limit unavailable');
			const result = await response.json();
			if (typeof result.limited !== 'boolean' || !Number.isFinite(result.retryAfter)) throw new Error('Invalid rate limit response');
			return { limited: result.limited as boolean, retryAfter: result.retryAfter as number };
		} catch {
			return { limited: true, retryAfter: 30 };
		}
	}
	const now = Date.now();
	cleanupExpiredBuckets(now);

	const entry = buckets.get(key);
	if (!entry || entry.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + options.windowMs });
		return { limited: false, retryAfter: 0 };
	}

	entry.count += 1;
	if (entry.count <= options.max) {
		return { limited: false, retryAfter: 0 };
	}

	return {
		limited: true,
		retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
	};
}

export function rateLimitHeaders(retryAfter: number) {
	return {
		'Retry-After': String(retryAfter),
		'Cache-Control': 'no-store'
	};
}

export function clientKey(input: string) {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9@._:-]/gi, '_')
		.slice(0, 160);
}

export function constantTimeEquals(a: string, b: string) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && timingSafeEqual(left, right);
}

function cleanupExpiredBuckets(now: number) {
	if (now - lastCleanupAt < 60_000) return;
	lastCleanupAt = now;

	for (const [key, entry] of buckets) {
		if (entry.resetAt <= now) buckets.delete(key);
	}
}
import { timingSafeEqual } from 'node:crypto';
