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

export function checkRateLimit(key: string, options: RateLimitOptions) {
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
