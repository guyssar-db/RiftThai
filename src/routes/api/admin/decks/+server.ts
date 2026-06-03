import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getRagConfig } from '$lib/server/rag/config';

export const GET = async ({ cookies, url }) => {
	const currentUser = await getAuthenticatedUser(cookies);
	if (!currentUser || !currentUser.isAdmin) return json({ error: 'unauthorized' }, { status: 403 });

	const q = url.searchParams.get('q')?.trim() || '';
	const config = getRagConfig();
	
	let path = '/rest/v1/user_decks?select=*,app_users(id,email,display_name)&order=created_at.desc&limit=100';
	if (q) {
		const filter = encodeURIComponent(q);
		path += `&name.ilike.%${filter}%`;
	}

	const response = await fetch(`${config.supabaseUrl}${path}`, {
		headers: {
			apikey: config.supabaseServiceRoleKey,
			Authorization: `Bearer ${config.supabaseServiceRoleKey}`
		}
	});
	if (!response.ok) return json({ error: 'failed to query decks' }, { status: 500 });
	const decks = await response.json();
	return json({ decks });
};
