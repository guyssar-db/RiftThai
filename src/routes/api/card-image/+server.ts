import { error } from '@sveltejs/kit';

const allowedHosts = new Set(['cmsassets.rgpub.io']);

export const GET = async ({ url }) => {
	const rawUrl = url.searchParams.get('url');
	if (!rawUrl) error(400, 'Missing image URL');

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
