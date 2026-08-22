import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Cookies } from '@sveltejs/kit';

import { getRagConfig } from '$lib/server/rag/config';

const scrypt = promisify(scryptCallback);
const sessionCookie = 'riftthai_session';
const passwordKeyLength = 64;

type AppUserRow = {
	id: string;
	email: string;
	display_name: string | null;
	display_name_locked: boolean | null;
	profile_slug: string | null;
	profile_number: string | null;
	password_hash: string;
	role: 'user' | 'admin';
	email_verified_at: string | null;
	profile_public: boolean | null;
	public_decks_visible: boolean | null;
	default_deck_visibility: 'private' | 'public' | null;
	default_export_layout: 'portrait' | 'landscape' | null;
	banned?: boolean;
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
	displayName: string;
	displayNameLocked: boolean;
	profileHandle: string;
	profileSlug: string;
	isAdmin: boolean;
	role: 'user' | 'admin';
	emailVerified: boolean;
	banned: boolean;
	createdAt: string;
	settings: UserSettings;
};

export type UserSettings = {
	profilePublic: boolean;
	publicDecksVisible: boolean;
	defaultDeckVisibility: 'private' | 'public';
	defaultExportLayout: 'portrait' | 'landscape';
};

export type PublicUserProfile = {
	id: string;
	displayName: string;
	displayNameLocked: boolean;
	profileHandle: string;
	profileSlug: string;
	profilePublic: boolean;
	publicDecksVisible: boolean;
	createdAt: string;
};

export async function registerUser(emailInput: string, password: string, displayNameInput = '') {
	const email = normalizeEmail(emailInput);
	if (!email || password.length < 8) {
		throw new Error('กรุณากรอกอีเมล และรหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
	}

	const existing = await findUserByEmail(email);
	if (existing) throw new Error('อีเมลนี้ถูกใช้งานแล้ว');

	const displayName = normalizeDisplayName(displayNameInput) || defaultDisplayName(email);
	const profile = await createUniqueProfileSlug(displayName);
	const password_hash = await hashPassword(password);
	const [user] = await authRequest<AppUserRow[]>('/rest/v1/app_users?select=*', {
		method: 'POST',
		headers: {
			Prefer: 'return=representation'
		},
		body: JSON.stringify({
			email,
			display_name: displayName,
			display_name_locked: false,
			profile_number: profile.number,
			profile_slug: profile.slug,
			profile_public: true,
			public_decks_visible: true,
			default_deck_visibility: 'private',
			default_export_layout: 'portrait',
			password_hash,
			role: isAdminEmail(email) ? 'admin' : 'user'
		})
	});

	if (!user) throw new Error('สร้างบัญชีไม่สำเร็จ');
	await createAndSendVerification(user);
	return toAuthUser(user);
}

export async function loginUser(emailInput: string, password: string) {
	const email = normalizeEmail(emailInput);
	const user = await findUserByEmail(email);
	if (!user) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

	const passwordOk = await verifyPassword(password, user.password_hash);
	if (!passwordOk) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
	if (user.banned) throw new Error('บัญชีนี้ถูกระงับการใช้งาน');
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
	const tokens = await authRequest<
		Array<{ id: string; user_id: string; expires_at: string; used_at: string | null }>
	>(`/rest/v1/email_verification_tokens?token_hash=eq.${encodeURIComponent(tokenHash)}&select=*`);
	const verification = tokens[0];
	if (!verification || verification.used_at) throw new Error('ลิงก์ยืนยันไม่ถูกต้อง');
	if (new Date(verification.expires_at).getTime() < Date.now())
		throw new Error('ลิงก์ยืนยันหมดอายุแล้ว');

	await authRequest(`/rest/v1/email_verification_tokens?id=eq.${verification.id}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({ used_at: new Date().toISOString() })
	});

	const [user] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${verification.user_id}&select=*`
	);
	if (!user) throw new Error('ไม่พบบัญชีผู้ใช้');

	const [updated] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${user.id}&select=*`,
		{
			method: 'PATCH',
			headers: {
				Prefer: 'return=representation'
			},
			body: JSON.stringify({
				email_verified_at: user.email_verified_at ?? new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
		}
	);

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

	const [user] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${session.user_id}&select=*`
	);
	if (!user || !user.email_verified_at || user.banned) {
		if (user?.banned) {
			await deleteSession(sessionHash);
			clearAuthCookies(cookies);
			cookies.set('riftthai_banned_notice', '1', {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: env.NODE_ENV === 'production',
				maxAge: 10
			});
		}
		return null;
	}

	// Rolling session & cookie renewal if less than 15 days remain
	const remainingTime = new Date(session.expires_at).getTime() - Date.now();
	const fifteenDays = 1000 * 60 * 60 * 24 * 15;
	if (remainingTime < fifteenDays) {
		const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
		try {
			await authRequest(`/rest/v1/user_sessions?id=eq.${session.id}`, {
				method: 'PATCH',
				headers: {
					Prefer: 'return=minimal'
				},
				body: JSON.stringify({ expires_at: newExpiresAt })
			});
			setSessionCookie(cookies, token, newExpiresAt);
		} catch {}
	}

	return toAuthUser(user);
}

export async function logoutUser(cookies: Cookies) {
	const token = cookies.get(sessionCookie);
	if (token) await deleteSession(hashToken(token));
	clearAuthCookies(cookies);
}

export async function updateUserDisplayName(userId: string, displayNameInput: string) {
	const displayName = normalizeDisplayName(displayNameInput);
	if (!displayName) throw new Error('กรุณากรอกชื่อที่แสดง');
	const currentUser = await findUserById(userId);
	if (!currentUser) throw new Error('ไม่พบบัญชีผู้ใช้');
	if (currentUser.display_name_locked)
		throw new Error('Display name cannot be changed after it is saved');

	const profile = await createUniqueProfileSlug(
		displayName,
		userId,
		currentUser?.profile_number ?? ''
	);

	const [updated] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}&select=*`,
		{
			method: 'PATCH',
			headers: {
				Prefer: 'return=representation'
			},
			body: JSON.stringify({
				display_name: displayName,
				display_name_locked: true,
				profile_number: profile.number,
				profile_slug: profile.slug,
				updated_at: new Date().toISOString()
			})
		}
	);

	if (!updated) throw new Error('ไม่พบบัญชีผู้ใช้');
	return toAuthUser(updated);
}

export async function updateUserSettings(userId: string, input: Partial<UserSettings>) {
	const payload: Record<string, unknown> = {
		updated_at: new Date().toISOString()
	};

	if (typeof input.profilePublic === 'boolean') payload.profile_public = input.profilePublic;
	if (typeof input.publicDecksVisible === 'boolean') {
		payload.public_decks_visible = input.publicDecksVisible;
	}
	if (input.defaultDeckVisibility === 'private' || input.defaultDeckVisibility === 'public') {
		payload.default_deck_visibility = input.defaultDeckVisibility;
	}
	if (input.defaultExportLayout === 'portrait' || input.defaultExportLayout === 'landscape') {
		payload.default_export_layout = input.defaultExportLayout;
	}

	const [updated] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}&select=*`,
		{
			method: 'PATCH',
			headers: {
				Prefer: 'return=representation'
			},
			body: JSON.stringify(payload)
		}
	);

	if (!updated) throw new Error('ไม่พบบัญชีผู้ใช้');
	return toAuthUser(updated);
}

export async function changeUserPassword(
	userId: string,
	currentPassword: string,
	nextPassword: string
) {
	if (nextPassword.length < 8) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
	const user = await findUserById(userId);
	if (!user) throw new Error('ไม่พบบัญชีผู้ใช้');

	const passwordOk = await verifyPassword(currentPassword, user.password_hash);
	if (!passwordOk) throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');

	const password_hash = await hashPassword(nextPassword);
	await authRequest(`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({
			password_hash,
			updated_at: new Date().toISOString()
		})
	});
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
	const [user] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}&select=id,email,display_name,profile_slug,profile_number,password_hash,role,email_verified_at,created_at,updated_at`
	);
	if (!user || !user.email_verified_at) return null;

	return {
		id: user.id,
		displayName: getUserDisplayName(user),
		displayNameLocked: Boolean(user.display_name_locked),
		profileHandle: getUserProfileHandle(user),
		profileSlug: getUserProfileSlug(user),
		profilePublic: getUserSettings(user).profilePublic,
		publicDecksVisible: getUserSettings(user).publicDecksVisible,
		createdAt: user.created_at
	};
}

export async function getPublicUserProfileBySlug(
	slugInput: string
): Promise<PublicUserProfile | null> {
	const slug = normalizeProfileSlug(slugInput);
	if (!slug) return null;
	const [user] = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?profile_slug=eq.${encodeURIComponent(slug)}&select=id,email,display_name,profile_slug,profile_number,password_hash,role,email_verified_at,created_at,updated_at,profile_public,public_decks_visible`
	);
	if (!user || !user.email_verified_at) return null;

	return {
		id: user.id,
		displayName: getUserDisplayName(user),
		displayNameLocked: Boolean(user.display_name_locked),
		profileHandle: getUserProfileHandle(user),
		profileSlug: getUserProfileSlug(user),
		profilePublic: getUserSettings(user).profilePublic,
		publicDecksVisible: getUserSettings(user).publicDecksVisible,
		createdAt: user.created_at
	};
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
		displayName: getUserDisplayName(user),
		displayNameLocked: Boolean(user.display_name_locked),
		profileHandle: getUserProfileHandle(user),
		profileSlug: getUserProfileSlug(user),
		isAdmin: admin,
		role: admin ? 'admin' : 'user',
		emailVerified: Boolean(user.email_verified_at),
		banned: Boolean(user.banned),
		createdAt: user.created_at,
		settings: getUserSettings(user)
	};
}

export function getUserSettings(
	user: Pick<
		AppUserRow,
		'profile_public' | 'public_decks_visible' | 'default_deck_visibility' | 'default_export_layout'
	>
): UserSettings {
	return {
		profilePublic: user.profile_public !== false,
		publicDecksVisible: user.public_decks_visible !== false,
		defaultDeckVisibility: user.default_deck_visibility === 'public' ? 'public' : 'private',
		defaultExportLayout: user.default_export_layout === 'landscape' ? 'landscape' : 'portrait'
	};
}

export function getUserDisplayName(user: Pick<AppUserRow, 'email' | 'display_name'>) {
	return normalizeDisplayName(user.display_name ?? '') || defaultDisplayName(user.email);
}

export function getUserProfileHandle(
	user: Pick<AppUserRow, 'email' | 'display_name' | 'profile_number'>
) {
	return `${getUserDisplayName(user)}#${getUserProfileNumber(user)}`;
}

export function getUserProfileSlug(
	user: Pick<AppUserRow, 'email' | 'display_name' | 'profile_slug' | 'profile_number'>
) {
	return (
		normalizeProfileSlug(user.profile_slug ?? '') ||
		createProfileSlug(getUserDisplayName(user), getUserProfileNumber(user))
	);
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

	const appUrl = (publicEnv.PUBLIC_APP_URL || 'https://riftthai.guyssar.com').replace(/\/$/, '');
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

async function findUserById(userId: string) {
	const rows = await authRequest<AppUserRow[]>(
		`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}&select=*`
	);
	return rows[0] ?? null;
}

async function deleteSession(sessionHash: string) {
	await authRequest(
		`/rest/v1/user_sessions?session_token_hash=eq.${encodeURIComponent(sessionHash)}`,
		{
			method: 'DELETE'
		}
	);
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

function normalizeDisplayName(value: unknown) {
	return String(value ?? '')
		.normalize('NFKC')
		.trim()
		.replace(/\s+/g, ' ')
		.slice(0, 32);
}

function defaultDisplayName(email: string) {
	const localPart = email.split('@')[0]?.trim();
	return normalizeDisplayName(localPart) || 'RiftThai Player';
}

function createProfileBase(displayName: string) {
	return (
		displayName
			.normalize('NFKC')
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 48) || 'player'
	);
}

function createProfileSlug(displayName: string, profileNumber: string) {
	return `${createProfileBase(displayName)}-${profileNumber}`;
}

function normalizeProfileSlug(value: unknown) {
	return String(value ?? '')
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}-]+/gu, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64);
}

function getUserProfileNumber(user: Pick<AppUserRow, 'profile_number'>) {
	const number = String(user.profile_number ?? '')
		.replace(/\D/g, '')
		.slice(0, 5);
	return number.length === 5 ? number : '00001';
}

async function createUniqueProfileSlug(
	displayName: string,
	currentUserId = '',
	preferredNumber = ''
) {
	const numbers = [
		String(preferredNumber).replace(/\D/g, '').slice(0, 5),
		...Array.from({ length: 24 }, () => randomProfileNumber())
	].filter((number) => number.length === 5);

	for (const number of numbers) {
		const candidate = createProfileSlug(displayName, number);
		const rows = await authRequest<Array<{ id: string }>>(
			`/rest/v1/app_users?profile_slug=eq.${encodeURIComponent(candidate)}&select=id`
		);
		const existing = rows[0];
		if (!existing || existing.id === currentUserId) return { slug: candidate, number };
	}

	const fallbackNumber = randomProfileNumber();
	return {
		slug: `${createProfileBase(displayName)}-${fallbackNumber}-${randomBytes(2).toString('hex')}`,
		number: fallbackNumber
	};
}

function randomProfileNumber() {
	return String(Math.floor(Math.random() * 100000)).padStart(5, '0');
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

export async function banUser(userId: string) {
	await authRequest(`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({ banned: true })
	});

	// Evict sessions from database immediately
	await authRequest(`/rest/v1/user_sessions?user_id=eq.${encodeURIComponent(userId)}`, {
		method: 'DELETE'
	});
}

export async function unbanUser(userId: string) {
	await authRequest(`/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}`, {
		method: 'PATCH',
		headers: {
			Prefer: 'return=minimal'
		},
		body: JSON.stringify({ banned: false })
	});
}
