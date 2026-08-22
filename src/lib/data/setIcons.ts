const setIcons: Record<string, string> = {
	origins: '/images/Set/origins.webp',
	radiance: '/images/Set/radiance.webp',
	spiritforged: '/images/Set/spiritforged.webp',
	unleashed: '/images/Set/unleashed.webp',
	provinggrounds: '/images/Set/proving-grounds.webp',
	vendetta: '/images/Set/vendetta.webp'
};

export function getSetIcon(set: string): string | null {
	const normalizedSet = set.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
	return setIcons[normalizedSet] ?? null;
}
