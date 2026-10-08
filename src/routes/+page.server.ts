import { getAuthenticatedUser } from '$lib/server/auth';
import sourceCards from '../../static/cards.json';

// Source Power is a rune cost; Card.power in the legacy schema represents Might.
const powerCosts: Record<string, number | null> = Object.fromEntries(
	sourceCards.map((card) => [card.cardCode.toLowerCase().replaceAll('/', '-'), card.power])
);

export const load = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	const canEdit = Boolean(user?.isAdmin);
	const searchTerm = url.searchParams.get('q') ?? '';
	const selectedSet = url.searchParams.get('set') ?? 'All';
	const requestedType = url.searchParams.get('type') ?? 'All';
	const selectedType = requestedType === 'Basic' ? 'Rune' : requestedType;
	const gearParam = url.searchParams.get('gear')?.toLowerCase();
	const selectedGearGroup = gearParam === 'equipment' ? 'Equipment' : gearParam === 'unit' ? 'Unit' : 'All';
	const selectedDomains = url.searchParams.get('domains')?.split(',').filter(Boolean) ?? [];
	const viewMode = url.searchParams.get('mode') ?? 'gallery';

	const energyParam = url.searchParams.get('energy');
	const selectedEnergy = energyParam !== null && energyParam !== '' ? Number(energyParam) : null;

	const mightParam = url.searchParams.get('might');
	const selectedMight = mightParam !== null && mightParam !== '' ? Number(mightParam) : null;

	return {
		powerCosts,
		selectedRarity: url.searchParams.get('rarity') ?? 'All',
		sortMode: ['name', 'energy'].includes(url.searchParams.get('sort') ?? '')
			? url.searchParams.get('sort')!
			: 'latest',
		selectedPower: ['1', '2', '3'].includes(url.searchParams.get('power') ?? '')
			? Number(url.searchParams.get('power'))
			: null,
		canEdit,
		searchTerm,
		selectedSet,
		selectedType,
		selectedGearGroup,
		selectedDomains,
		viewMode,
		selectedEnergy,
		selectedMight
	};
};
