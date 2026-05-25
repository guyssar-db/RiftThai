import { json, redirect } from '@sveltejs/kit';

import { verifyEmailToken } from '$lib/server/auth';

export const GET = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const next = new URL('/verify-email', url);

	try {
		await verifyEmailToken(token);
		next.searchParams.set('status', 'success');
	} catch (error) {
		next.searchParams.set('status', 'error');
		next.searchParams.set('message', error instanceof Error ? error.message : 'Verification failed');
	}

	throw redirect(303, next);
};

export const POST = async ({ request }) => {
	try {
		const body = (await request.json()) as { token?: unknown };
		const token = typeof body.token === 'string' ? body.token : '';
		const user = await verifyEmailToken(token);
		return json({ user });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Verification failed' }, { status: 400 });
	}
};

