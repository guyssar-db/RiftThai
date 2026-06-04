type CardImageSources = {
	fallback: string;
	fallbackSrcset: string;
	webpSrcset: string | null;
};

// แปลง URL รูปภาพต้นทางหรือ local path อื่นๆ ให้มาดึงจาก /image/cards/[name].avif เสมอ
function getLocalAvifPath(imageUrl: string): string {
	if (!imageUrl) return '';

	// กรณี 1: เป็น relative path ในเครื่องอยู่แล้ว เช่น /images/SFD-T02.webp
	if (imageUrl.startsWith('/')) {
		if (imageUrl.startsWith('/image/cards/') && imageUrl.endsWith('.avif')) {
			return imageUrl;
		}
		const basename = imageUrl.split('/').pop() || '';
		const extIndex = basename.lastIndexOf('.');
		const nameWithoutExt = extIndex !== -1 ? basename.substring(0, extIndex) : basename;
		return `/image/cards/${nameWithoutExt}.avif`;
	}

	// กรณี 2: เป็น URL ของ Sanity CDN
	try {
		const url = new URL(imageUrl);
		const pathname = url.pathname;
		const filename = pathname.split('/').pop() || '';
		const extIndex = filename.lastIndexOf('.');
		const nameWithoutExt = extIndex !== -1 ? filename.substring(0, extIndex) : filename;
		return `/image/cards/${nameWithoutExt}.avif`;
	} catch {
		return imageUrl;
	}
}

export function getCardImageUrl(imageUrl: string, width: number, format?: 'avif' | 'webp') {
	return getLocalAvifPath(imageUrl);
}

export function getCardImageSources(imageUrl: string, widths: number[]): CardImageSources {
	const localPath = getLocalAvifPath(imageUrl);
	return {
		fallback: localPath,
		fallbackSrcset: localPath,
		webpSrcset: localPath
	};
}

