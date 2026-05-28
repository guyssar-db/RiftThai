import type { Card } from '$lib/types/card';

export type DeckEntry = {
	code: string;
	quantity: number;
};

export type StoredDeck = {
	id: string;
	name: string;
	championCode: string;
	entries: DeckEntry[];
	updatedAt: string;
};

export type DeckCollection = {
	activeDeckId: string;
	decks: StoredDeck[];
};

export type DeckCard = {
	card: Card;
	quantity: number;
};

export type DeckStats = {
	total: number;
	mainTotal: number;
	runeTotal: number;
	legendTotal: number;
	battlefieldTotal: number;
	tokenTotal: number;
	otherTotal: number;
	costs: { label: string; count: number }[];
	types: { label: string; count: number }[];
	domains: { label: string; count: number }[];
	runes: { label: string; count: number }[];
};

export const deckStorageKey = 'riftthai.deck.v1';
export const deckCollectionStorageKey = 'riftthai.decks.v1';
export const maxMainCopiesPerName = 3;
export const maxMainDeckCards = 39;
export const maxBattlefieldCopiesPerName = 1;
export const maxLegendCards = 1;
export const maxChampionCards = 1;
export const maxRuneCards = 12;

const mainExclusions = new Set(['Rune', 'Battlefield', 'Legend']);
const tokenCardNames = new Set([
	'Bird',
	'Recruit (DE)',
	'Recruit (NX)',
	'Recruit (ZN)',
	'Reflection',
	'Sand Soldier',
	'Sprite'
]);

export function normalizeDeck(entries: DeckEntry[]) {
	const byCode = new Map<string, number>();

	for (const entry of entries) {
		const code = entry.code.trim();
		const quantity = Math.max(0, Math.min(999, Math.floor(Number(entry.quantity) || 0)));
		if (!code || quantity <= 0) continue;
		byCode.set(code, (byCode.get(code) ?? 0) + quantity);
	}

	return [...byCode.entries()]
		.map(([code, quantity]) => ({ code, quantity }))
		.sort((a, b) => a.code.localeCompare(b.code));
}

export function readDeckFromStorage(storage: Storage | null | undefined) {
	if (!storage) return [];

	try {
		const parsed = JSON.parse(storage.getItem(deckStorageKey) ?? '[]');
		return normalizeDeck(Array.isArray(parsed) ? parsed : []);
	} catch {
		return [];
	}
}

export function writeDeckToStorage(storage: Storage | null | undefined, entries: DeckEntry[]) {
	if (!storage) return;
	storage.setItem(deckStorageKey, JSON.stringify(normalizeDeck(entries)));
}

export function createEmptyDeck(name = 'New Deck'): StoredDeck {
	const now = new Date().toISOString();
	return {
		id: createDeckId(),
		name,
		championCode: '',
		entries: [],
		updatedAt: now
	};
}

export function normalizeDeckCollection(value: unknown): DeckCollection {
	const parsed = isObject(value) ? value : {};
	const rawDecks = Array.isArray(parsed.decks) ? parsed.decks : [];
	const decks = rawDecks.map(normalizeStoredDeck).filter((deck): deck is StoredDeck => Boolean(deck));
	const fallbackDeck = createEmptyDeck('My Deck');
	const safeDecks = decks.length > 0 ? decks : [fallbackDeck];
	const activeDeckId =
		typeof parsed.activeDeckId === 'string' && safeDecks.some((deck) => deck.id === parsed.activeDeckId)
			? parsed.activeDeckId
			: safeDecks[0].id;

	return {
		activeDeckId,
		decks: safeDecks
	};
}

export function readDeckCollectionFromStorage(storage: Storage | null | undefined) {
	if (!storage) return normalizeDeckCollection(null);

	try {
		const collectionRaw = storage.getItem(deckCollectionStorageKey);
		if (collectionRaw) return normalizeDeckCollection(JSON.parse(collectionRaw));

		const legacyDeck = readDeckFromStorage(storage);
		const migratedDeck = createEmptyDeck('My Deck');
		migratedDeck.entries = legacyDeck;
		return normalizeDeckCollection({ activeDeckId: migratedDeck.id, decks: [migratedDeck] });
	} catch {
		return normalizeDeckCollection(null);
	}
}

export function writeDeckCollectionToStorage(
	storage: Storage | null | undefined,
	collection: DeckCollection
) {
	if (!storage) return;
	storage.setItem(deckCollectionStorageKey, JSON.stringify(normalizeDeckCollection(collection)));
}

export function getActiveStoredDeck(collection: DeckCollection) {
	return collection.decks.find((deck) => deck.id === collection.activeDeckId) ?? collection.decks[0];
}

export function updateActiveDeckEntries(collection: DeckCollection, entries: DeckEntry[]) {
	const now = new Date().toISOString();
	const normalizedEntries = normalizeDeck(entries);

	return normalizeDeckCollection({
		activeDeckId: collection.activeDeckId,
		decks: collection.decks.map((deck) =>
			deck.id === collection.activeDeckId
				? { ...deck, entries: normalizedEntries, updatedAt: now }
				: deck
		)
	});
}

export function updateActiveDeckChampion(collection: DeckCollection, championCode: string) {
	const now = new Date().toISOString();
	const safeChampionCode = String(championCode ?? '').trim();

	return normalizeDeckCollection({
		activeDeckId: collection.activeDeckId,
		decks: collection.decks.map((deck) =>
			deck.id === collection.activeDeckId
				? {
						...deck,
						championCode: safeChampionCode,
						entries:
							safeChampionCode && safeChampionCode !== deck.championCode
								? decrementDeckEntry(deck.entries, safeChampionCode)
								: deck.entries,
						updatedAt: now
					}
				: deck
		)
	});
}

export function updateActiveDeckName(collection: DeckCollection, name: string) {
	const safeName = normalizeDeckName(name);
	const now = new Date().toISOString();

	return normalizeDeckCollection({
		activeDeckId: collection.activeDeckId,
		decks: collection.decks.map((deck) =>
			deck.id === collection.activeDeckId ? { ...deck, name: safeName, updatedAt: now } : deck
		)
	});
}

export function addStoredDeck(collection: DeckCollection, name = 'New Deck') {
	const deck = createEmptyDeck(name);
	return normalizeDeckCollection({
		activeDeckId: deck.id,
		decks: [...collection.decks, deck]
	});
}

export function duplicateActiveDeck(collection: DeckCollection) {
	const activeDeck = getActiveStoredDeck(collection);
	const deck = createEmptyDeck(`${activeDeck.name} Copy`);
	deck.entries = normalizeDeck(activeDeck.entries);
	deck.championCode = activeDeck.championCode;
	return normalizeDeckCollection({
		activeDeckId: deck.id,
		decks: [...collection.decks, deck]
	});
}

export function deleteActiveDeck(collection: DeckCollection) {
	if (collection.decks.length <= 1) {
		const deck = createEmptyDeck('My Deck');
		return normalizeDeckCollection({ activeDeckId: deck.id, decks: [deck] });
	}

	const nextDecks = collection.decks.filter((deck) => deck.id !== collection.activeDeckId);
	return normalizeDeckCollection({
		activeDeckId: nextDecks[0]?.id ?? '',
		decks: nextDecks
	});
}

export function setActiveStoredDeck(collection: DeckCollection, deckId: string) {
	return normalizeDeckCollection({
		activeDeckId: deckId,
		decks: collection.decks
	});
}

export function buildDeckCards(cards: Card[], entries: DeckEntry[]) {
	const cardByCode = new Map(cards.map((card) => [card.code, card]));

	return normalizeDeck(entries)
		.map((entry) => {
			const card = cardByCode.get(entry.code);
			return card ? { card, quantity: entry.quantity } : null;
		})
		.filter((item): item is DeckCard => Boolean(item))
		.sort((a, b) => {
			const typeSort = getZoneSort(a.card) - getZoneSort(b.card);
			if (typeSort !== 0) return typeSort;
			if (isMainDeckCard(a.card) && isMainDeckCard(b.card)) {
				const mainTypeSort = getMainTypeSort(a.card) - getMainTypeSort(b.card);
				if (mainTypeSort !== 0) return mainTypeSort;
			}
			const energySort = getCostValue(a.card) - getCostValue(b.card);
			if (energySort !== 0) return energySort;
			return a.card.name_en.localeCompare(b.card.name_en);
		});
}

export function getChampionCard(cards: Card[], championCode: string | null | undefined) {
	if (!championCode) return null;
	return cards.find((card) => card.code === championCode) ?? null;
}

export function getDeckZones(deckCards: DeckCard[]) {
	return {
		legends: deckCards.filter(({ card }) => isLegendCard(card)),
		battlefields: deckCards.filter(({ card }) => isBattlefieldCard(card)),
		main: deckCards.filter(({ card }) => isMainDeckCard(card)),
		runes: deckCards.filter(({ card }) => isRuneCard(card)),
		tokens: deckCards.filter(({ card }) => isTokenCard(card)),
		other: deckCards.filter(
			({ card }) =>
				!isMainDeckCard(card) &&
				!isRuneCard(card) &&
				!isLegendCard(card) &&
				!isBattlefieldCard(card) &&
				!isTokenCard(card)
		)
	};
}

export function calculateDeckStats(deckCards: DeckCard[]): DeckStats {
	const zones = getDeckZones(deckCards);
	const costs = new Map<string, number>();
	const types = new Map<string, number>();
	const domains = new Map<string, number>();
	const runes = new Map<string, number>();

	for (const { card, quantity } of zones.main) {
		const cost = card.energy === null || card.energy === undefined ? 'No Cost' : String(card.energy);
		costs.set(cost, (costs.get(cost) ?? 0) + quantity);
		types.set(card.type || 'Unknown', (types.get(card.type || 'Unknown') ?? 0) + quantity);

		const cardDomains = card.domains?.length ? card.domains : ['Colorless'];
		for (const domain of cardDomains) {
			domains.set(domain, (domains.get(domain) ?? 0) + quantity);
		}
	}

	for (const { card, quantity } of zones.runes) {
		const label = card.domains?.[0] ?? (card.name_en.replace(/\s*Rune\s*/i, '').trim() || card.name_en);
		runes.set(label, (runes.get(label) ?? 0) + quantity);
	}

	return {
		total: sumQuantities(deckCards),
		mainTotal: sumQuantities(zones.main),
		runeTotal: sumQuantities(zones.runes),
		legendTotal: sumQuantities(zones.legends),
		battlefieldTotal: sumQuantities(zones.battlefields),
		tokenTotal: sumQuantities(zones.tokens),
		otherTotal: sumQuantities(zones.other),
		costs: sortNumberLabels(costs),
		types: sortAlphaLabels(types),
		domains: sortAlphaLabels(domains),
		runes: sortAlphaLabels(runes)
	};
}

export function isRuneCard(card: Card) {
	return card.type === 'Rune' || card.type?.includes('Rune');
}

export function isLegendCard(card: Card) {
	return card.type === 'Legend';
}

export function isBattlefieldCard(card: Card) {
	return card.type === 'Battlefield';
}

export function isTokenCard(card: Card) {
	return tokenCardNames.has(card.name_en);
}

export function isMainDeckCard(card: Card) {
	return !mainExclusions.has(card.type) && !isTokenCard(card);
}

export function isChampionCandidate(card: Card, legend: Card | null) {
	if (!legend || card.type !== 'Unit') return false;
	const legendTags = new Set((legend.tags ?? []).map(normalizeComparable));
	return (card.tags ?? []).some((tag) => legendTags.has(normalizeComparable(tag)));
}

export function getSelectedLegend(deckCards: DeckCard[]) {
	return getDeckZones(deckCards).legends[0]?.card ?? null;
}

export function getAllowedDomains(legend: Card | null) {
	return legend?.domains?.filter((domain) => domain !== 'Colorless') ?? [];
}

export function isCardAllowedForLegend(card: Card, legend: Card | null) {
	if (isLegendCard(card)) return true;
	if (isTokenCard(card)) return true;
	if (!legend) return false;

	const allowedDomains = getAllowedDomains(legend);
	const cardDomains = card.domains?.length ? card.domains : ['Colorless'];

	return cardDomains.every((domain) => domain === 'Colorless' || allowedDomains.includes(domain));
}

export function getCardQuantity(entries: DeckEntry[], code: string) {
	return entries.find((entry) => entry.code === code)?.quantity ?? 0;
}

export function setCardQuantity(entries: DeckEntry[], code: string, quantity: number) {
	const next = entries.filter((entry) => entry.code !== code);
	if (quantity > 0) next.push({ code, quantity });
	return normalizeDeck(next);
}

function getZoneSort(card: Card) {
	if (isLegendCard(card)) return 0;
	if (isBattlefieldCard(card)) return 1;
	if (isMainDeckCard(card)) return 2;
	if (isRuneCard(card)) return 3;
	if (isTokenCard(card)) return 4;
	return 5;
}

function getMainTypeSort(card: Card) {
	if (card.type === 'Unit') return 0;
	if (card.type === 'Spell') return 1;
	if (card.type === 'Gear') return 2;
	return 3;
}

function getCostValue(card: Card) {
	return card.energy ?? 999;
}

function sumQuantities(deckCards: DeckCard[]) {
	return deckCards.reduce((total, item) => total + item.quantity, 0);
}

function sortAlphaLabels(values: Map<string, number>) {
	return [...values.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => a.label.localeCompare(b.label));
}

function sortNumberLabels(values: Map<string, number>) {
	return [...values.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => {
			const aNumber = Number(a.label);
			const bNumber = Number(b.label);
			if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
			return a.label.localeCompare(b.label);
		});
}

function normalizeStoredDeck(value: unknown) {
	if (!isObject(value)) return null;
	const championCode = typeof value.championCode === 'string' ? value.championCode.trim() : '';

	return {
		id: typeof value.id === 'string' && value.id.trim() ? value.id : createDeckId(),
		name: normalizeDeckName(value.name),
		championCode,
		entries: normalizeDeck(Array.isArray(value.entries) ? value.entries : []),
		updatedAt:
			typeof value.updatedAt === 'string' && value.updatedAt.trim()
				? value.updatedAt
				: new Date().toISOString()
	};
}

function normalizeDeckName(value: unknown) {
	const name = String(value ?? '').trim();
	return name ? name.slice(0, 48) : 'Untitled Deck';
}

function decrementDeckEntry(entries: DeckEntry[], code: string) {
	return normalizeDeck(entries)
		.map((entry) => (entry.code === code ? { ...entry, quantity: entry.quantity - 1 } : entry))
		.filter((entry) => entry.quantity > 0);
}

function normalizeComparable(value: unknown) {
	return String(value ?? '').normalize('NFKC').toLowerCase().trim();
}

function createDeckId() {
	const random =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2);
	return `deck-${random}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object');
}
