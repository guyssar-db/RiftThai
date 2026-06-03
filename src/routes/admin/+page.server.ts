import { redirect } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { listCardReports } from '$lib/server/card-reports';
import { listAdminConversations, hasUnreadUserMessage } from '$lib/server/admin-chat';
import { getRagConfig } from '$lib/server/rag/config';

async function dbRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
	const config = getRagConfig();
	const response = await fetch(`${config.supabaseUrl}${path}`, {
		...init,
		headers: {
			apikey: config.supabaseServiceRoleKey,
			Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
			'Content-Type': 'application/json',
			...(init.headers ?? {})
		}
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Database request failed: ${text}`);
	}
	return response.json();
}

export const load = async ({ cookies }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user || !user.isAdmin) throw redirect(302, '/');

	try {
		// Query users
		const users = await dbRequest<any[]>('/rest/v1/app_users?select=id,email,display_name,profile_slug,profile_number,role,banned,created_at&order=created_at.desc&limit=100');
		
		// Query decks
		const decks = await dbRequest<any[]>('/rest/v1/user_decks?select=*,app_users(id,email,display_name)&order=created_at.desc&limit=100');

		// Reports
		const reports = await listCardReports();
		const openReportsCount = reports.filter(r => r.status === 'open' || r.status === 'reviewing').length;

		// Conversations
		const conversations = await listAdminConversations();
		const unreadConversationsCount = conversations.filter(c => hasUnreadUserMessage(c)).length;

		return {
			user,
			stats: {
				usersCount: users.length,
				decksCount: decks.length,
				openReportsCount,
				unreadConversationsCount
			},
			users,
			decks
		};
	} catch (error) {
		console.error('Admin loader failed:', error);
		return {
			user,
			stats: {
				usersCount: 0,
				decksCount: 0,
				openReportsCount: 0,
				unreadConversationsCount: 0
			},
			users: [],
			decks: []
		};
	}
};
