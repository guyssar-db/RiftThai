const knownSetOrder = ['Radiance', 'Vendetta', 'Unleashed', 'Spiritforged', 'Origins', 'Proving Grounds'];
const setOrder = new Map(knownSetOrder.map((setName, index) => [setName, index]));

/** Keep the newest card set at the top while preserving the source order within each set. */
export function sortCardsNewestFirst<T extends { set_name?: string | null }>(cards: readonly T[]) {
	return cards
		.map((card, index) => ({ card, index }))
		.sort((a, b) => {
			const aOrder = setOrder.get(a.card.set_name ?? '') ?? -1;
			const bOrder = setOrder.get(b.card.set_name ?? '') ?? -1;
			return aOrder - bOrder || a.index - b.index;
		})
		.map(({ card }) => card);
}
