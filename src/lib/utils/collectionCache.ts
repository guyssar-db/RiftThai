const COLLECTION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedCollection: Record<string, number> | null = null;
let cachedAt = 0;
let pendingRequest: Promise<Record<string, number>> | null = null;

export function getUserCollection(forceRefresh = false): Promise<Record<string, number>> {
	if (pendingRequest) return pendingRequest;

	if (!forceRefresh && cachedCollection && Date.now() - cachedAt < COLLECTION_CACHE_TTL_MS) {
		return Promise.resolve(cachedCollection);
	}

	pendingRequest = fetch('/api/collection')
		.then(async (response) => {
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Could not load collection');
			const collection = data.collection || {};
			cachedCollection = collection;
			cachedAt = Date.now();
			return collection;
		})
		.finally(() => {
			pendingRequest = null;
		});

	return pendingRequest;
}

export function setCachedCollection(collection: Record<string, number>) {
	cachedCollection = collection;
	cachedAt = Date.now();
}

export function invalidateCollectionCache() {
	cachedCollection = null;
	cachedAt = 0;
}
