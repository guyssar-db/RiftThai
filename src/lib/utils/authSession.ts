const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

let cachedSession: unknown;
let cachedAt = 0;
let pendingRequest: Promise<unknown> | null = null;

export function getAuthSession<T>(forceRefresh = false): Promise<T> {
	if (pendingRequest) return pendingRequest as Promise<T>;

	if (!forceRefresh && cachedAt && Date.now() - cachedAt < CACHE_TTL_MS) {
		return Promise.resolve(cachedSession as T);
	}

	pendingRequest = fetch('/api/auth/session')
		.then(async (response) => {
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Could not load session');
			cachedSession = data;
			cachedAt = Date.now();
			return data;
		})
		.finally(() => {
			pendingRequest = null;
		});

	return pendingRequest as Promise<T>;
}

export function invalidateAuthSession() {
	cachedAt = 0;
}
