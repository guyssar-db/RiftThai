import { redirect } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
	throw redirect(303, '/setting');
};
