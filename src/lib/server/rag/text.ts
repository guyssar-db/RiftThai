const byteByChar = createWindows874ByteMap();

function createWindows874ByteMap() {
	if (typeof TextDecoder === 'undefined') return new Map<string, number>();

	const decoder = new TextDecoder('windows-874');
	const map = new Map<string, number>();

	for (let byte = 0; byte <= 255; byte += 1) {
		map.set(decoder.decode(new Uint8Array([byte])), byte);
	}

	return map;
}

export function repairThaiMojibake(value: string) {
	const utf8Repaired = repairUtf8AsLatin1(value);
	if (utf8Repaired !== value) return repairThaiMojibake(utf8Repaired);

	if (!/[เน€เธเน€เธเน][\u0080-\u0E7F]/.test(value)) return value;
	if (typeof TextDecoder === 'undefined' || byteByChar.size === 0) return value;

	const bytes: number[] = [];

	for (const char of value) {
		const byte = byteByChar.get(char);
		if (byte === undefined) return value;
		bytes.push(byte);
	}

	const repaired = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
	return repaired.includes('\uFFFD') ? value : repaired;
}

function repairUtf8AsLatin1(value: string) {
	if (!/(?:Ã|Â|â|à¸|à¹)/.test(value)) return value;
	if (typeof TextDecoder === 'undefined') return value;

	const bytes: number[] = [];
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code > 255) return value;
		bytes.push(code);
	}

	const repaired = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
	return repaired.includes('\uFFFD') ? value : repaired;
}

export function normalizeSearchText(value: unknown) {
	const raw = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value ?? '');
	const repaired = repairThaiMojibake(raw);

	return `${raw} ${repaired}`
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[_\-/:()[\].,]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function estimateTokenCount(value: string) {
	return Math.ceil(value.length / 4);
}

export function chunkText(value: string, targetLength = 1800, overlap = 220) {
	const normalized = value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
	if (normalized.length <= targetLength) return normalized ? [normalized] : [];

	const chunks: string[] = [];
	let cursor = 0;

	while (cursor < normalized.length) {
		const hardEnd = Math.min(cursor + targetLength, normalized.length);
		const segment = normalized.slice(cursor, hardEnd);
		const breakpoint = Math.max(
			segment.lastIndexOf('\n\n'),
			segment.lastIndexOf('\n'),
			segment.lastIndexOf('. '),
			segment.lastIndexOf(' ')
		);
		const end = hardEnd === normalized.length || breakpoint < targetLength * 0.55 ? hardEnd : cursor + breakpoint;
		const chunk = normalized.slice(cursor, end).trim();
		if (chunk) chunks.push(chunk);
		cursor = Math.max(end - overlap, cursor + 1);
		if (cursor >= normalized.length || end === normalized.length) break;
	}

	return chunks;
}

export function scoreLexical(query: string, text: string) {
	const tokens = normalizeSearchText(query)
		.split(' ')
		.filter((token) => token.length > 1);
	const haystack = normalizeSearchText(text);

	if (tokens.length === 0) return 0;

	return tokens.reduce((score, token) => {
		if (haystack.includes(token)) return score + Math.min(12, token.length);
		return score;
	}, 0);
}
