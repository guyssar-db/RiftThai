import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getRagConfig } from '$lib/server/rag/config';

export const GET = async ({ cookies, url }) => {
	const currentUser = await getAuthenticatedUser(cookies);
	if (!currentUser || !currentUser.isAdmin) return json({ error: 'unauthorized' }, { status: 403 });

	const q = url.searchParams.get('q')?.trim() || '';
	const config = getRagConfig();
	
	let path = '/rest/v1/app_users?select=id,email,display_name,profile_slug,profile_number,role,banned,created_at&order=created_at.desc&limit=100';
	if (q) {
		const filter = encodeURIComponent(q);
		path += `&or=(email.ilike.%${filter}%,display_name.ilike.%${filter}%,profile_slug.ilike.%${filter}%)`;
	}

	const response = await fetch(`${config.supabaseUrl}${path}`, {
		headers: {
			apikey: config.supabaseServiceRoleKey,
			Authorization: `Bearer ${config.supabaseServiceRoleKey}`
		}
	});
	if (!response.ok) return json({ error: 'failed to query users' }, { status: 500 });
	const users = await response.json();
	return json({ users });
};
