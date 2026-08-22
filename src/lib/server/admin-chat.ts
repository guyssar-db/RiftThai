import { getRagConfig } from '$lib/server/rag/config';
import type { AuthUser } from '$lib/server/auth';

export type AdminConversation = {
	id: string;
	user_id: string;
	last_message_at: string | null;
	last_user_message_at: string | null;
	last_admin_read_at: string | null;
	created_at: string;
	updated_at: string;
	app_users?: {
		email: string;
		display_name: string | null;
	} | null;
};

export type AdminMessage = {
	id: string;
	conversation_id: string;
	sender_user_id: string;
	sender_role: 'user' | 'admin';
	body: string;
	read_at: string | null;
	created_at: string;
};

export async function getOrCreateConversation(user: AuthUser) {
	const existing = await dbRequest<AdminConversation[]>(
		`/rest/v1/admin_conversations?user_id=eq.${user.id}&select=*`
	);
	if (existing[0]) return existing[0];

	const rows = await dbRequest<AdminConversation[]>('/rest/v1/admin_conversations?select=*', {
		method: 'POST',
		headers: {
			Prefer: 'return=representation'
		},
		body: JSON.stringify({
			user_id: user.id
		})
	});

	const conversation = rows[0];
	if (!conversation) throw new Error('Could not create conversation');
	return conversation;
}

export async function listAdminConversations() {
	return dbRequest<AdminConversation[]>(
		'/rest/v1/admin_conversations?select=*,app_users(email,display_name)&order=last_message_at.desc.nullslast'
	);
}

export async function getConversation(conversationId: string) {
	const rows = await dbRequest<AdminConversation[]>(
		`/rest/v1/admin_conversations?id=eq.${conversationId}&select=*,app_users(email,display_name)`
	);
	return rows[0] ?? null;
}

export async function getMessages(conversationId: string) {
	return dbRequest<AdminMessage[]>(
		`/rest/v1/admin_messages?conversation_id=eq.${conversationId}&select=*&order=created_at.asc`
	);
}

export async function sendMessage(conversationId: string, sender: AuthUser, body: string) {
	const cleanBody = body.trim();
	if (!cleanBody) throw new Error('กรุณากรอกข้อความ');

	const now = new Date().toISOString();
	const [message] = await dbRequest<AdminMessage[]>('/rest/v1/admin_messages?select=*', {
		method: 'POST',
		headers: {
			Prefer: 'return=representation'
		},
		body: JSON.stringify({
			conversation_id: conversationId,
			sender_user_id: sender.id,
			sender_role: sender.isAdmin ? 'admin' : 'user',
			body: cleanBody,
			read_at: sender.isAdmin ? now : null
		})
	});

	await dbRequest(`/rest/v1/admin_conversations?id=eq.${conversationId}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({
			last_message_at: now,
			last_user_message_at: sender.isAdmin ? undefined : now,
			updated_at: now
		})
	});

	if (!message) throw new Error('ส่งข้อความไม่สำเร็จ');
	return message;
}

export async function markConversationRead(conversationId: string) {
	const now = new Date().toISOString();
	await dbRequest(`/rest/v1/admin_conversations?id=eq.${conversationId}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({
			last_admin_read_at: now,
			updated_at: now
		})
	});

	await dbRequest(
		`/rest/v1/admin_messages?conversation_id=eq.${conversationId}&sender_role=eq.user&read_at=is.null`,
		{
			method: 'PATCH',
			headers: {
				Prefer: 'return=minimal'
			},
			body: JSON.stringify({
				read_at: now
			})
		}
	);
}

export function hasUnreadUserMessage(conversation: AdminConversation) {
	if (!conversation.last_user_message_at) return false;
	if (!conversation.last_admin_read_at) return true;
	return (
		new Date(conversation.last_user_message_at).getTime() >
		new Date(conversation.last_admin_read_at).getTime()
	);
}

async function dbRequest<T = unknown>(path: string, init: RequestInit = {}) {
	const config = getRagConfig();
	if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
		throw new Error('Supabase URL or service role key is missing');
	}

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
		throw new Error(`Admin chat database request failed (${response.status}): ${text}`);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return text ? (JSON.parse(text) as T) : (undefined as T);
}
