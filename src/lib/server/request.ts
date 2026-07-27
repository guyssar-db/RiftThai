export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function boundedString(value: unknown, maxLength: number, minLength = 0) {
	if (typeof value !== 'string') return null;
	const result = value.trim();
	return result.length >= minLength && result.length <= maxLength ? result : null;
}

export function boundedInteger(value: unknown, min: number, max: number) {
	if (typeof value !== 'number' || !Number.isInteger(value) || !Number.isFinite(value)) return null;
	return value >= min && value <= max ? value : null;
}

export function safeServerError(label: string, error: unknown) {
	console.error(label, error);
	return { error: 'Internal server error' };
}
