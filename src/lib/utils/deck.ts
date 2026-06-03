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
	sideboardEntries?: DeckEntry[];
	updatedAt: string;
	source?: 'local' | 'online';
	onlineId?: string;
	visibility?: 'private' | 'unlisted' | 'public';
	owner?: {
		id: string;
		displayName: string;
		profileHandle: string;
		profileSlug: string;
	};
	likesCount?: number;
	isLiked?: boolean;
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
	sideboardTotal: number;
	costs: { label: string; count: number }[];
	types: { label: string; count: number }[];
	domains: { label: string; count: number }[];
	runes: { label: string; count: number }[];
};

export type DeckValidationIssue = {
	id: string;
	severity: 'error' | 'warning';
	label: string;
	message: string;
};

export type DeckValidation = {
	isReady: boolean;
	errorCount: number;
	warningCount: number;
	issues: DeckValidationIssue[];
	checks: { label: string; status: 'pass' | 'fail' | 'warn'; value: string }[];
};

export const deckStorageKey = 'riftthai.deck.v1';
export const deckCollectionStorageKey = 'riftthai.decks.v1';
export const maxMainCopiesPerName = 3;
export const maxMainDeckCards = 39;
export const maxBattlefieldCopiesPerName = 1;
export const maxLegendCards = 1;
export const maxChampionCards = 1;
export const maxRuneCards = 12;
export const maxSideboardCards = 8;

const mainExclusions = new Set(['Rune', 'Battlefield', 'Legend']);
const tokenCardNames = new Set([
	'Bird',
	'Recruit (DE)',
	'Recruit (NX)',
	'Recruit (ZN)',
	'Reflection',
	'Sand Soldier',
	'Sprite',
	'Gold',
	'Baron Pit'
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
	const decks = rawDecks
		.map(normalizeStoredDeck)
		.filter((deck): deck is StoredDeck => Boolean(deck));
	const fallbackDeck = createEmptyDeck('My Deck');
	const safeDecks = decks.length > 0 ? decks : [fallbackDeck];
	const activeDeckId =
		typeof parsed.activeDeckId === 'string' &&
		safeDecks.some((deck) => deck.id === parsed.activeDeckId)
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
	return (
		collection.decks.find((deck) => deck.id === collection.activeDeckId) ?? collection.decks[0]
	);
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
	deck.sideboardEntries = normalizeDeck(activeDeck.sideboardEntries || []);
	deck.championCode = activeDeck.championCode;
	return normalizeDeckCollection({
		activeDeckId: deck.id,
		decks: [...collection.decks, deck]
	});
}

export function updateActiveDeckSideboardEntries(
	collection: DeckCollection,
	sideboardEntries: DeckEntry[]
) {
	const now = new Date().toISOString();
	const normalizedSideboard = normalizeDeck(sideboardEntries);

	return normalizeDeckCollection({
		activeDeckId: collection.activeDeckId,
		decks: collection.decks.map((deck) =>
			deck.id === collection.activeDeckId
				? { ...deck, sideboardEntries: normalizedSideboard, updatedAt: now }
				: deck
		)
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

export function calculateDeckStats(
	deckCards: DeckCard[],
	sideboardCards: DeckCard[] = []
): DeckStats {
	const zones = getDeckZones(deckCards);
	const costs = new Map<string, number>();
	const types = new Map<string, number>();
	const domains = new Map<string, number>();
	const runes = new Map<string, number>();

	for (const { card, quantity } of zones.main) {
		const cost =
			card.energy === null || card.energy === undefined ? 'No Cost' : String(card.energy);
		costs.set(cost, (costs.get(cost) ?? 0) + quantity);
		types.set(card.type || 'Unknown', (types.get(card.type || 'Unknown') ?? 0) + quantity);

		const cardDomains = card.domains?.length ? card.domains : ['Colorless'];
		for (const domain of cardDomains) {
			domains.set(domain, (domains.get(domain) ?? 0) + quantity);
		}
	}

	for (const { card, quantity } of zones.runes) {
		const label =
			card.domains?.[0] ?? (card.name_en.replace(/\s*Rune\s*/i, '').trim() || card.name_en);
		runes.set(label, (runes.get(label) ?? 0) + quantity);
	}

	return {
		total: sumQuantities(deckCards) + sumQuantities(sideboardCards),
		mainTotal: sumQuantities(zones.main),
		runeTotal: sumQuantities(zones.runes),
		legendTotal: sumQuantities(zones.legends),
		battlefieldTotal: sumQuantities(zones.battlefields),
		tokenTotal: sumQuantities(zones.tokens),
		otherTotal: sumQuantities(zones.other),
		sideboardTotal: sumQuantities(sideboardCards),
		costs: sortNumberLabels(costs),
		types: sortAlphaLabels(types),
		domains: sortAlphaLabels(domains),
		runes: sortAlphaLabels(runes)
	};
}

export function validateDeck(
	cards: Card[],
	deck: Pick<StoredDeck, 'championCode' | 'entries' | 'sideboardEntries'> | null | undefined
): DeckValidation {
	const deckCards = buildDeckCards(cards, deck?.entries ?? []);
	const sideboardCards = buildDeckCards(cards, deck?.sideboardEntries ?? []);
	const stats = calculateDeckStats(deckCards, sideboardCards);
	const zones = getDeckZones(deckCards);
	const legend = zones.legends[0]?.card ?? null;
	const champion = getChampionCard(cards, deck?.championCode);
	const issues: DeckValidationIssue[] = [];

	const knownCodes = new Set(cards.map((card) => card.code));
	for (const entry of [
		...normalizeDeck(deck?.entries ?? []),
		...normalizeDeck(deck?.sideboardEntries ?? [])
	]) {
		if (!knownCodes.has(entry.code)) {
			issues.push({
				id: `unknown-${entry.code}`,
				severity: 'error',
				label: 'Unknown card',
				message: `${entry.code} is not in the card database.`
			});
		}
	}

	if (stats.legendTotal !== maxLegendCards) {
		issues.push({
			id: 'legend-count',
			severity: 'error',
			label: 'Legend',
			message:
				stats.legendTotal === 0
					? 'Choose exactly 1 Legend.'
					: `Use exactly 1 Legend. Current: ${stats.legendTotal}.`
		});
	}

	if (!champion) {
		issues.push({
			id: 'champion-missing',
			severity: 'error',
			label: 'Champion',
			message: 'Choose exactly 1 Champion that matches your Legend tag.'
		});
	} else if (!isChampionCandidate(champion, legend)) {
		issues.push({
			id: 'champion-invalid',
			severity: 'error',
			label: 'Champion',
			message: `${champion.name_en} does not match the selected Legend.`
		});
	}

	if (stats.mainTotal !== maxMainDeckCards) {
		issues.push({
			id: 'main-count',
			severity: 'error',
			label: 'Main deck',
			message: `Main deck must be ${maxMainDeckCards} cards. Current: ${stats.mainTotal}.`
		});
	}

	if (stats.runeTotal > maxRuneCards) {
		issues.push({
			id: 'rune-count',
			severity: 'error',
			label: 'Rune deck',
			message: `Rune deck can have at most ${maxRuneCards} cards. Current: ${stats.runeTotal}.`
		});
	} else if (stats.runeTotal === 0) {
		issues.push({
			id: 'rune-empty',
			severity: 'warning',
			label: 'Rune deck',
			message: 'No runes selected yet.'
		});
	}

	if (stats.sideboardTotal > maxSideboardCards) {
		issues.push({
			id: 'sideboard-count',
			severity: 'error',
			label: 'Sideboard',
			message: `Sideboard can have at most ${maxSideboardCards} cards. Current: ${stats.sideboardTotal}.`
		});
	}

	for (const issue of getCopyLimitIssues(deckCards, sideboardCards)) issues.push(issue);

	if (legend) {
		for (const { card } of [...deckCards, ...sideboardCards]) {
			if (!isCardAllowedForLegend(card, legend)) {
				issues.push({
					id: `domain-${card.code}`,
					severity: 'error',
					label: 'Domain',
					message: `${card.name_en} is outside ${legend.name_en}'s domains.`
				});
			}
		}
	}

	const errorCount = issues.filter((issue) => issue.severity === 'error').length;
	const warningCount = issues.length - errorCount;

	return {
		isReady: errorCount === 0,
		errorCount,
		warningCount,
		issues,
		checks: [
			{
				label: 'Legend',
				status: stats.legendTotal === maxLegendCards ? 'pass' : 'fail',
				value: `${stats.legendTotal}/${maxLegendCards}`
			},
			{
				label: 'Champion',
				status: champion && isChampionCandidate(champion, legend) ? 'pass' : 'fail',
				value: champion ? '1/1' : '0/1'
			},
			{
				label: 'Main',
				status: stats.mainTotal === maxMainDeckCards ? 'pass' : 'fail',
				value: `${stats.mainTotal}/${maxMainDeckCards}`
			},
			{
				label: 'Rune',
				status: stats.runeTotal > maxRuneCards ? 'fail' : stats.runeTotal === 0 ? 'warn' : 'pass',
				value: `${stats.runeTotal}/${maxRuneCards}`
			},
			{
				label: 'Side',
				status: stats.sideboardTotal > maxSideboardCards ? 'fail' : 'pass',
				value: `${stats.sideboardTotal}/${maxSideboardCards}`
			}
		]
	};
}

export function isRuneCard(card: Card) {
	return card.type === 'Rune' || card.type?.includes('Rune');
}

export function isLegendCard(card: Card) {
	return card.type === 'Legend';
}

export function isBattlefieldCard(card: Card) {
	return card.type === 'Battlefield' && !isTokenCard(card);
}

export function isTokenCard(card: Card) {
	return tokenCardNames.has(card.name_en) || Boolean(card.code && card.code.includes('-T'));
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

function getCopyLimitIssues(deckCards: DeckCard[], sideboardCards: DeckCard[]) {
	const issues: DeckValidationIssue[] = [];
	const mainCopies = new Map<string, number>();
	const battlefieldCopies = new Map<string, number>();

	for (const { card, quantity } of [...deckCards, ...sideboardCards]) {
		if (isMainDeckCard(card)) {
			mainCopies.set(card.name_en, (mainCopies.get(card.name_en) ?? 0) + quantity);
		}
		if (isBattlefieldCard(card)) {
			battlefieldCopies.set(card.name_en, (battlefieldCopies.get(card.name_en) ?? 0) + quantity);
		}
	}

	for (const [name, quantity] of mainCopies) {
		if (quantity > maxMainCopiesPerName) {
			issues.push({
				id: `copy-main-${name}`,
				severity: 'error',
				label: 'Copy limit',
				message: `${name} has ${quantity} copies across main deck and sideboard. Max: ${maxMainCopiesPerName}.`
			});
		}
	}

	for (const [name, quantity] of battlefieldCopies) {
		if (quantity > maxBattlefieldCopiesPerName) {
			issues.push({
				id: `copy-field-${name}`,
				severity: 'error',
				label: 'Battlefield',
				message: `${name} has ${quantity} copies. Max: ${maxBattlefieldCopiesPerName}.`
			});
		}
	}

	return issues;
}

function normalizeStoredDeck(value: unknown): StoredDeck | null {
	if (!isObject(value)) return null;
	const championCode = typeof value.championCode === 'string' ? value.championCode.trim() : '';

	const source: 'local' | 'online' =
		value.source === 'online' || value.source === 'local'
			? value.source
			: typeof value.onlineId === 'string' && value.onlineId.trim()
				? 'online'
				: 'local';

	return {
		id: typeof value.id === 'string' && value.id.trim() ? value.id : createDeckId(),
		name: normalizeDeckName(value.name),
		championCode,
		entries: normalizeDeck(Array.isArray(value.entries) ? value.entries : []),
		sideboardEntries: normalizeDeck(
			Array.isArray((value as any).sideboardEntries) ? (value as any).sideboardEntries : []
		),
		updatedAt:
			typeof value.updatedAt === 'string' && value.updatedAt.trim()
				? value.updatedAt
				: new Date().toISOString(),
		source,
		onlineId:
			typeof value.onlineId === 'string' && value.onlineId.trim() ? value.onlineId : undefined,
		visibility:
			value.visibility === 'public' ||
			value.visibility === 'unlisted' ||
			value.visibility === 'private'
				? value.visibility
				: undefined,
		likesCount: typeof (value as any).likesCount === 'number' ? (value as any).likesCount : undefined,
		isLiked: typeof (value as any).isLiked === 'boolean' ? (value as any).isLiked : undefined
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
	return String(value ?? '')
		.normalize('NFKC')
		.toLowerCase()
		.trim();
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
