type CardImageSources = {
	fallback: string;
	fallbackSrcset: string;
	webpSrcset: string | null;
};

const optimizedImageHost = 'cmsassets.rgpub.io';
const optimizedImagePath = '/sanity/images/';

function canOptimizeImage(imageUrl: string) {
	try {
		const url = new URL(imageUrl);
		return url.hostname === optimizedImageHost && url.pathname.includes(optimizedImagePath);
	} catch {
		return false;
	}
}

export function getCardImageUrl(imageUrl: string, width: number, format?: 'avif' | 'webp') {
	if (!canOptimizeImage(imageUrl)) return imageUrl;

	const url = new URL(imageUrl);
	url.searchParams.set('w', String(width));
	url.searchParams.set('q', '78');
	url.searchParams.set('fit', 'max');

	if (format) {
		url.searchParams.set('fm', format);
	}

	return url.toString();
}

function buildSrcset(imageUrl: string, widths: number[], format?: 'avif' | 'webp') {
	return widths.map((width) => `${getCardImageUrl(imageUrl, width, format)} ${width}w`).join(', ');
}

export function getCardImageSources(imageUrl: string, widths: number[]): CardImageSources {
	if (!canOptimizeImage(imageUrl)) {
		return {
			fallback: imageUrl,
			fallbackSrcset: '',
			webpSrcset: null
		};
	}

	const sortedWidths = [...new Set(widths)].sort((a, b) => a - b);
	const fallbackWidth = sortedWidths[Math.max(0, Math.floor(sortedWidths.length / 2))];

	return {
		fallback: getCardImageUrl(imageUrl, fallbackWidth),
		fallbackSrcset: buildSrcset(imageUrl, sortedWidths),
		webpSrcset: buildSrcset(imageUrl, sortedWidths, 'webp')
	};
}
