import { getAuthenticatedUser } from '$lib/server/auth';

export const load = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	const canEdit = Boolean(user?.isAdmin);
	const searchTerm = url.searchParams.get('q') ?? '';
	const selectedSet = url.searchParams.get('set') ?? 'All';
	const selectedType = url.searchParams.get('type') ?? 'All';
	const selectedDomains = url.searchParams.get('domains')?.split(',').filter(Boolean) ?? [];
	const viewMode = url.searchParams.get('mode') ?? 'gallery';
	return { canEdit, searchTerm, selectedSet, selectedType, selectedDomains, viewMode };
};
