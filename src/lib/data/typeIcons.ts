const typeIconMap: Record<string, string> = {
	Battlefield: 'battlefield.avif',
	Champion: 'champion.avif',
	Gear: 'gear.avif',
	Legend: 'legend.avif',
	Rune: 'rune.avif',
	Spell: 'spell.avif',
	Unit: 'unit.avif'
};

export function getTypeIcon(type: string | null | undefined) {
	const filename = getTypeIcons(type)[0]?.src;
	return filename ? `/images/icons/${filename}` : null;
}

export function getTypeIcons(type: string | null | undefined) {
	if (!type) return [];

	const exactFilename = typeIconMap[type];
	if (exactFilename) {
		return [{ label: type, src: exactFilename }];
	}

	return type
		.split(/\s+/)
		.map((part) => {
			const filename = typeIconMap[part];
			return filename ? { label: part, src: filename } : null;
		})
		.filter((icon): icon is { label: string; src: string } => icon !== null);
}
