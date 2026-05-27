const domainIconMap: Record<string, string> = {
	Body: 'rune_body.svg',
	Calm: 'rune_calm.svg',
	Chaos: 'rune_chaos.svg',
	Colorless: 'rune_rainbow.svg',
	Fury: 'rune_fury.svg',
	Mind: 'rune_mind.svg',
	Order: 'rune_order.svg'
};

export function getDomainIcon(domain: string | null | undefined) {
	if (!domain) return null;

	const filename = domainIconMap[domain];
	return filename ? `/images/icons/${filename}` : null;
}
