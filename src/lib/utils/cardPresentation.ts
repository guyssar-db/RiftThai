import type { Card } from '$lib/types/card';

const landscapeBattlefieldTokens = new Set(['Baron Pit', 'Brush']);

export function usesLandscapeCardFrame(card: Pick<Card, 'name_en' | 'type'>): boolean {
	return card.type === 'Battlefield' || landscapeBattlefieldTokens.has(card.name_en);
}
