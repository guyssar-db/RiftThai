import { error } from '@sveltejs/kit';

import cards from '$lib/data/riftbound_cards_all.json';
import { getAuthenticatedUser, getPublicUserProfileBySlug } from '$lib/server/auth';
import { listPublicDecksByUser } from '$lib/server/decks';

export const load = async ({ cookies, params }) => {
	const currentUser = await getAuthenticatedUser(cookies);
	const profile = await getPublicUserProfileBySlug(params.displayname);
	if (!profile) throw error(404, 'Profile not found');
	if (!profile.profilePublic && currentUser?.id !== profile.id) throw error(404, 'Profile not found');

	const decks = profile.publicDecksVisible || currentUser?.id === profile.id
		? await listPublicDecksByUser(profile.id)
		: [];
	return {
		cards,
		profile,
		decks,
		isOwnProfile: currentUser?.id === profile.id
	};
};
