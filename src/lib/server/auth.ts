import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

import { getRagConfig } from '$lib/server/rag/config';

const scrypt = promisify(scryptCallback);
const sessionCookie = 'riftthai_session';
const passwordKeyLength = 64;

type AppUserRow = {
	id: string;
	email: string;
	password_hash: string;
	role: 'user' | 'admin';
	email_verified_at: string | null;
	created_at: string;
	updated_at: string;
};

type SessionRow = {
	id: string;
	user_id: string;
	session_token_hash: string;
	expires_at: string;
};

export type AuthUser = {
	id: string;
	email: string;
	isAdmin: boolean;
	role: 'user' | 'admin';
	emailVerified: boolean;
};

export async function registerUser(emailInput: string, password: string) {
	const email = normalizeEmail(emailInput);
	if (!email || password.length < 8) {
		throw new Error('Email is required and password must be at least 8 characters');
	}

	const existing = await findUserByEmail(email);
	if (existing) throw new Error('Email already exists');

	const password_hash = await hashPassword(password);
	const [user] = await authRequest<AppUserRow[]>('/rest/v1/app_users?select=*', {
		method: 'POST',
		headers: {
			Prefer: 'return=representation'
		},
		body: JSON.stringify({
			email,
			password_hash,
			role: isAdminEmail(email) ? 'admin' : 'user'
		})
	});

	if (!user) throw new Error('Could not create user');
	await createAndSendVerification(user);
	return toAuthUser(user);
}

export async function loginUser(emailInput: string, password: string) {
	const email = normalizeEmail(emailInput);
	const user = await findUserByEmail(email);
	if (!user) throw new Error('Invalid email or password');

	const passwordOk = await verifyPassword(password, user.password_hash);
	if (!passwordOk) throw new Error('Invalid email or password');
	if (!user.email_verified_at) throw new Error('Please verify your email before logging in');

	const sessionToken = createToken();
	const sessionHash = hashToken(sessionToken);
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

	await authRequest('/rest/v1/user_sessions', {
		method: 'POST',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({
			user_id: user.id,
			session_token_hash: sessionHash,
			expires_at: expiresAt
		})
	});

	return {
		user: toAuthUser(user),
		sessionToken,
		expiresAt
	};
}

export async function verifyEmailToken(token: string) {
	const tokenHash = hashToken(token);
	const tokens = await authRequest<Array<{ id: string; user_id: string; expires_at: string; used_at: string | null }>>(
		`/rest/v1/email_verification_tokens?token_hash=eq.${encodeURIComponent(tokenHash)}&select=*`
	);
	const verification = tokens[0];
	if (!verification || verification.used_at) throw new Error('Verification link is invalid');
	if (new Date(verification.expires_at).getTime() < Date.now()) throw new Error('Verification link expired');

	await authRequest(`/rest/v1/email_verification_tokens?id=eq.${verification.id}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({ used_at: new Date().toISOString() })
	});

	const [user] = await authRequest<AppUserRow[]>(`/rest/v1/app_users?id=eq.${verification.user_id}&select=*`);
	if (!user) throw new Error('User not found');

	const [updated] = await authRequest<AppUserRow[]>(`/rest/v1/app_users?id=eq.${user.id}&select=*`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=representation'
		},
		body: JSON.stringify({
			email_verified_at: user.email_verified_at ?? new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
	});

	return toAuthUser(updated ?? user);
}

export async function getAuthenticatedUser(cookies: Cookies): Promise<AuthUser | null> {
	const token = cookies.get(sessionCookie);
	if (!token) return null;

	const sessionHash = hashToken(token);
	const sessions = await authRequest<SessionRow[]>(
		`/rest/v1/user_sessions?session_token_hash=eq.${encodeURIComponent(sessionHash)}&select=*`
	);
	const session = sessions[0];
	if (!session || new Date(session.expires_at).getTime() < Date.now()) {
		if (session) await deleteSession(sessionHash);
		clearAuthCookies(cookies);
		return null;
	}

	const [user] = await authRequest<AppUserRow[]>(`/rest/v1/app_users?id=eq.${session.user_id}&select=*`);
	if (!user || !user.email_verified_at) return null;
	return toAuthUser(user);
}

export async function logoutUser(cookies: Cookies) {
	const token = cookies.get(sessionCookie);
	if (token) await deleteSession(hashToken(token));
	clearAuthCookies(cookies);
}

export function setSessionCookie(cookies: Cookies, sessionToken: string, expiresAt: string) {
	cookies.set(sessionCookie, sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		expires: new Date(expiresAt)
	});
}

export function clearAuthCookies(cookies: Cookies) {
	cookies.delete(sessionCookie, { path: '/' });
}

function toAuthUser(user: AppUserRow): AuthUser {
	const admin = user.role === 'admin' || isAdminEmail(user.email);
	return {
		id: user.id,
		email: user.email,
		isAdmin: admin,
		role: admin ? 'admin' : 'user',
		emailVerified: Boolean(user.email_verified_at)
	};
}

async function createAndSendVerification(user: AppUserRow) {
	const token = createToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

	await authRequest('/rest/v1/email_verification_tokens', {
		method: 'POST',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({
			user_id: user.id,
			token_hash: tokenHash,
			expires_at: expiresAt
		})
	});

	await sendVerificationEmail(user.email, token);
}

async function sendVerificationEmail(email: string, token: string) {
	const apiKey = env.RESEND_API_KEY;
	if (!apiKey) throw new Error('RESEND_API_KEY is missing');

	const appUrl = (env.PUBLIC_APP_URL || 'http://127.0.0.1:5174').replace(/\/$/, '');
	const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
	const from = env.RESEND_FROM_EMAIL || 'RiftThai <onboarding@resend.dev>';

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from,
			to: email,
			subject: 'Verify your RiftThai account',
			html: `<p>Click this link to verify your RiftThai account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`
		})
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Could not send verification email: ${text}`);
	}
}

async function findUserByEmail(email: string) {
	const rows = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&select=*`
	);
	return rows[0] ?? null;
}

async function deleteSession(sessionHash: string) {
	await authRequest(`/rest/v1/user_sessions?session_token_hash=eq.${encodeURIComponent(sessionHash)}`, {
		method: 'DELETE'
	});
}

async function hashPassword(password: string) {
	const salt = randomBytes(16).toString('base64url');
	const key = (await scrypt(password, salt, passwordKeyLength)) as Buffer;
	return `${salt}:${key.toString('base64url')}`;
}

async function verifyPassword(password: string, stored: string) {
	const [salt, key] = stored.split(':');
	if (!salt || !key) return false;
	const storedKey = Buffer.from(key, 'base64url');
	const inputKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
	return storedKey.length === inputKey.length && timingSafeEqual(storedKey, inputKey);
}

function createToken() {
	return randomBytes(32).toString('base64url');
}

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function isAdminEmail(email: string) {
	const { adminEmails } = getRagConfig();
	return adminEmails.includes(email.toLowerCase());
}

async function authRequest<T = unknown>(path: string, init: RequestInit = {}) {
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
		throw new Error(`Auth database request failed (${response.status}): ${text}`);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return text ? (JSON.parse(text) as T) : (undefined as T);
}
