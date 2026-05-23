const rarityIconMap: Record<string, string> = {
	Common: 'common.avif',
	Uncommon: 'uncommon.avif',
	Rare: 'rare.avif',
	Epic: 'epic.avif',
	Showcase: 'Showcase.avif'
};

export function getRarityIcon(rarity: string | null | undefined) {
	if (!rarity) return null;
	const filename = rarityIconMap[rarity];
	return filename ? `/images/icons/${filename}` : null;
}
