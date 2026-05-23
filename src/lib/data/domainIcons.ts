const domainIconMap: Record<string, string> = {
	Body: 'rune_body.svg',
	Calm: 'rune_calm.svg',
	Chaos: 'rune_chaos.svg',
	Colorless: 'rune_rainbow.svg',
	Fury: 'rune_fury.svg',
	Mind: 'rune_mind.svg',
	Order: '8bb1b193a8e1adc26ca28e1a21da8d1e2f5d2f72-64x64.png'
};

export function getDomainIcon(domain: string | null | undefined) {
	if (!domain) return null;

	const filename = domainIconMap[domain];
	return filename ? `/images/icons/${filename}` : null;
}
