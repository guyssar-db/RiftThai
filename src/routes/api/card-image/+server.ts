import { error } from '@sveltejs/kit';
import fs from 'node:fs';
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

		if (!fs.existsSync(localFilePath)) {
			error(404, 'Local image not found');
		}

		const fileBuffer = fs.readFileSync(localFilePath);
		const ext = path.extname(localFilePath).toLowerCase();
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

	const response = await globalThis.fetch(imageUrl.toString());
	if (!response.ok || !response.body) {
		error(502, 'Could not fetch card image');
	}

	return new Response(response.body, {
		headers: {
			'Cache-Control': 'public, max-age=86400, s-maxage=604800',
			'Content-Type': response.headers.get('Content-Type') ?? 'image/png'
		}
	});
};
