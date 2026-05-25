import { json } from '@sveltejs/kit';

import { registerUser } from '$lib/server/auth';

export const POST = async ({ request }) => {
	try {
		const body = (await request.json()) as { email?: unknown; password?: unknown };
		const email = typeof body.email === 'string' ? body.email.trim() : '';
		const password = typeof body.password === 'string' ? body.password : '';

		await registerUser(email, password);
		return json({
			ok: true,
			message: 'Verification email sent'
		});
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Register failed' }, { status: 400 });
	}
};

