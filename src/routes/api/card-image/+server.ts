import { error } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';

const allowedHosts = new Set(['cmsassets.rgpub.io']);

export const GET = async ({ url }) => {
	const rawUrl = url.searchParams.get('url');
	if (!rawUrl) error(400, 'Missing image URL');

	// กรณี 1: หากเป็น Local Relative Path ใน Static Folder (เช่น /image/cards/xxx.avif)
	if (rawUrl.startsWith('/')) {
		const staticRoot = path.resolve(process.cwd(), 'static');
		const safeUrl = path.normalize(rawUrl).replace(/^[/\\]+/, '');
		const localFilePath = path.resolve(staticRoot, safeUrl);
		if (localFilePath !== staticRoot && !localFilePath.startsWith(`${staticRoot}${path.sep}`)) {
			error(400, 'Invalid local image path');
		}

		const ext = path.extname(localFilePath).toLowerCase();
		if (!['.avif', '.webp', '.png', '.jpg', '.jpeg'].includes(ext)) error(400, 'Unsupported image type');
		const stat = await fs.stat(localFilePath).catch(() => null);
		if (!stat?.isFile()) error(404, 'Local image not found');
		if (stat.size > 10 * 1024 * 1024) error(413, 'Image too large');
		const fileBuffer = await fs.readFile(localFilePath);
		const contentType = ext === '.avif' ? 'image/avif' : (ext === '.webp' ? 'image/webp' : 'image/png');

		return new Response(fileBuffer, {
			headers: {
				'Cache-Control': 'public, max-age=86400, s-maxage=604800',
				'Content-Type': contentType
			}
		});
	}

	// กรณี 2: หากเป็น URL รีโมตดั้งเดิม (Sanity CDN)
	let imageUrl: URL;
	try {
		imageUrl = new URL(rawUrl);
	} catch {
		error(400, 'Invalid image URL');
	}

	if (imageUrl.protocol !== 'https:' || !allowedHosts.has(imageUrl.hostname)) {
		error(400, 'Image host is not allowed');
	}

	const response = await globalThis.fetch(imageUrl.toString(), { redirect: 'error', signal: AbortSignal.timeout(10_000) }).catch(() => null);
	if (!response?.ok || !response.body) {
		error(502, 'Could not fetch card image');
	}

	if (!/^image\/(avif|webp|png|jpeg)(;|$)/i.test(response.headers.get('Content-Type') ?? '')) {
		await response.body.cancel();
		error(502, 'Unsupported image type');
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > 10 * 1024 * 1024) { await reader.cancel(); error(413, 'Image too large'); }
			chunks.push(value);
		}
	} finally { reader.releaseLock(); }
	return new Response(Buffer.concat(chunks), {
		headers: {
			'Cache-Control': 'public, max-age=86400, s-maxage=604800',
			'Content-Type': response.headers.get('Content-Type') ?? 'image/png'
		}
	});
};
