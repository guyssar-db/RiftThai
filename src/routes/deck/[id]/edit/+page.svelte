<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import CardModal from '$lib/components/CardModal.svelte';
	import DeckProgressStrip from '$lib/components/DeckProgressStrip.svelte';
	import DeckValidationPanel from '$lib/components/DeckValidationPanel.svelte';
	import IconSelect from '$lib/components/IconSelect.svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getRarityIcon } from '$lib/data/rarityIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import {
		buildDeckCards,
		calculateDeckStats,
		addStoredDeck,
		deleteActiveDeck,
		duplicateActiveDeck,
		getAllowedDomains,
		getActiveStoredDeck,
		getChampionCard,
		getCardQuantity,
		getSelectedLegend,
		isBattlefieldCard,
		isCardAllowedForLegend,
		isChampionCandidate,
		isLegendCard,
		isMainDeckCard,
		isRuneCard,
		isTokenCard,
		maxBattlefieldCopiesPerName,
		maxChampionCards,
		maxLegendCards,
		maxMainDeckCards,
		maxMainCopiesPerName,
		maxRuneCards,
		maxSideboardCards,
		normalizeDeck,
		normalizeDeckCollection,
		readDeckCollectionFromStorage,
		setCardQuantity,
		setActiveStoredDeck,
		updateActiveDeckEntries,
		updateActiveDeckSideboardEntries,
		updateActiveDeckChampion,
		updateActiveDeckName,
		validateDeck,
		writeDeckCollectionToStorage,
		type DeckCollection,
		type DeckEntry
	} from '$lib/utils/deck';
	import { getAuthSession } from '$lib/utils/authSession';
	import { getUserCollection } from '$lib/utils/collectionCache';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let routeDeckId = $derived(data.deckId ?? '');
	let collection = $state<DeckCollection>(normalizeDeckCollection(null));
	let entries = $state<DeckEntry[]>([]);
	let sideboardEntries = $state<DeckEntry[]>([]);
	let isEditingSideboard = $state(false);
	let searchTerm = $state('');
	let zoneFilter = $state<
		'all' | 'unit' | 'spell' | 'gear' | 'rune' | 'battlefield' | 'legend' | 'token'
	>('all');
	let domainFilter = $state('All');
	let setFilter = $state('All');
	let cardPage = $state(1);
	const cardsPerPage = 24;
	let deckNameInput = $state('My Deck');
	let filtersOpen = $state(false);
	let isClearConfirmOpen = $state(false);
	let deleteDeckId = $state('');
	let isDeckLoading = $state(true);
	let openDeckMenuId = $state('');
	let deckMenuTop = $state(0);
	let deckMenuLeft = $state(0);
	let isDeckDrawerOpen = $state(false);
	let selectedPopupCard = $state<Card | null>(null);
	let undoSnapshot = $state<DeckCollection | null>(null);
	let undoMessage = $state('');
	let userCardCollection = $state<Record<string, number>>({});
	let hasCollection = $derived(Object.keys(userCardCollection).length > 0);

	$effect(() => {
		if (!browser) return;
		void loadUserCollection();
	});

	async function loadUserCollection() {
		try {
			const session = await getAuthSession<{ user?: unknown }>();
			if (session.user) {
				userCardCollection = await getUserCollection();
			}
		} catch (err) {
			console.error('Failed to load user collection:', err);
		}
	}

	let activeDeck = $derived(getActiveStoredDeck(collection));
	let routeDeckExists = $derived(collection.decks.some((deck) => deck.id === routeDeckId));
	let deckCards = $derived(buildDeckCards(cards, entries));
	let sideboardCards = $derived(buildDeckCards(cards, sideboardEntries));
	let stats = $derived(calculateDeckStats(deckCards, sideboardCards));
	let selectedLegend = $derived(getSelectedLegend(deckCards));
	let championCard = $derived(getChampionCard(cards, activeDeck.championCode));
	let deckValidation = $derived(validateDeck(cards, activeDeck));
	let allowedDomains = $derived(getAllowedDomains(selectedLegend));
	let openDeckMenuDeck = $derived(
		collection.decks.find((deck) => deck.id === openDeckMenuId) ?? null
	);
	let deleteDeckTarget = $derived(
		collection.decks.find((deck) => deck.id === deleteDeckId) ?? null
	);
	let activeFilterCount = $derived(
		[zoneFilter, domainFilter, setFilter].filter((value) => value !== 'all' && value !== 'All')
			.length
	);
	let legendCards = $derived(cards.filter(isLegendCard));
	let setFilterOptions = $derived([
		{ label: 'All Sets', value: 'All' },
		...[...new Set(cards.map((card) => card.set_name).filter(Boolean))]
			.sort((a, b) => a.localeCompare(b))
			.map((set) => ({ label: set, value: set }))
	]);
	let domainFilterValues = $derived(
		selectedLegend
			? ['Colorless', ...allowedDomains]
			: [...new Set(cards.flatMap((card) => card.domains ?? []).filter(Boolean))].sort((a, b) =>
					a.localeCompare(b)
				)
	);
	let domainFilterOptions = $derived([
		{ label: 'All Colors', value: 'All' },
		...domainFilterValues.map((domain) => {
			const icon = getDomainIcon(domain);
			return {
				label: domain,
				value: domain,
				icons: icon ? [{ label: domain, src: icon }] : []
			};
		})
	]);
	let zoneFilterOptions = $derived(
		[
			{ label: 'All Types', value: 'all', type: '' },
			{ label: 'Unit', value: 'unit', type: 'Unit' },
			{ label: 'Spell', value: 'spell', type: 'Spell' },
			{ label: 'Gear', value: 'gear', type: 'Gear' },
			{ label: 'Rune', value: 'rune', type: 'Rune' },
			{ label: 'Battlefield', value: 'battlefield', type: 'Battlefield' },
			{ label: 'Token', value: 'token', type: '' }
		].map((option) => ({
			label: option.label,
			value: option.value,
			icons: option.type
				? getTypeIcons(option.type).map((icon) => ({
						label: icon.label,
						src: `/images/icons/${icon.src}`
					}))
				: []
		}))
	);
	let indexedCards = $derived(
		cards.map((card) => ({
			card,
			searchable: normalize([
				card.name_en,
				card.name_th,
				card.code,
				card.type,
				card.rarity,
				card.set_name,
				...(card.domains ?? []),
				...(card.tags ?? [])
			])
		}))
	);
	let filteredCards = $derived(
		indexedCards
			.filter(({ card }) => {
				if (!selectedLegend && !isLegendCard(card)) return false;
				if (selectedLegend && isLegendCard(card)) return false;
				if (selectedLegend && !isCardAllowedForLegend(card, selectedLegend)) return false;
				if (zoneFilter === 'unit' && (card.type !== 'Unit' || isTokenCard(card))) return false;
				if (zoneFilter === 'spell' && card.type !== 'Spell') return false;
				if (zoneFilter === 'gear' && card.type !== 'Gear') return false;
				// if (zoneFilter === 'main' && !isMainDeckCard(card)) return false;
				if (zoneFilter === 'rune' && !isRuneCard(card)) return false;
				if (zoneFilter === 'battlefield' && !isBattlefieldCard(card)) return false;
				if (zoneFilter === 'legend' && !isLegendCard(card)) return false;
				if (zoneFilter === 'token' && !isTokenCard(card)) return false;
				if (setFilter !== 'All' && card.set_name !== setFilter) return false;
				if (domainFilter !== 'All' && !(card.domains ?? []).includes(domainFilter)) return false;
				// if (
				// 	zoneFilter === 'other' &&
				// 	(isMainDeckCard(card) ||
				// 		isRuneCard(card) ||
				// 		isBattlefieldCard(card) ||
				// 		isLegendCard(card) ||
				// 		isTokenCard(card))
				// ) return false;
				return true;
			})
			.map(({ card, searchable }) => ({ card, searchable }))
			.filter(({ searchable }) => {
				const query = normalize(searchTerm);
				if (!query) return true;
				return query.split(' ').every((token) => searchable.includes(token));
			})
			.map(({ card }) => card)
	);
	let totalCardPages = $derived(Math.max(1, Math.ceil(filteredCards.length / cardsPerPage)));
	let paginatedCards = $derived(
		filteredCards.slice((cardPage - 1) * cardsPerPage, cardPage * cardsPerPage)
	);

	$effect(() => {
		if (!browser) return;
		const storedCollection = readDeckCollectionFromStorage(localStorage);
		const nextCollection = routeDeckId
			? setActiveStoredDeck(storedCollection, routeDeckId)
			: storedCollection;
		const nextDeck = getActiveStoredDeck(nextCollection);
		collection = nextCollection;
		entries = nextDeck.entries;
		sideboardEntries = nextDeck.sideboardEntries || [];
		deckNameInput = nextDeck.name;
		writeDeckCollectionToStorage(localStorage, nextCollection);
		isDeckLoading = false;
	});

	$effect(() => {
		if (!browser || isDeckLoading || !routeDeckId || routeDeckExists) return;
		goto('/deck');
	});

	$effect(() => {
		searchTerm;
		zoneFilter;
		domainFilter;
		setFilter;
		selectedLegend?.code;
		cardPage = 1;
	});

	$effect(() => {
		if (cardPage > totalCardPages) cardPage = totalCardPages;
	});

	$effect(() => {
		selectedLegend?.code;
		if (domainFilter !== 'All' && !domainFilterValues.includes(domainFilter)) domainFilter = 'All';
	});

	function changeQuantity(card: Card, delta: number) {
		if (isLegendCard(card)) {
			selectLegend(card);
			return;
		}

		if (isEditingSideboard) {
			const current = getCardQuantity(sideboardEntries, card.code);
			setSideboard(
				setCardQuantity(sideboardEntries, card.code, clampSideboardQuantity(card, current + delta))
			);
			return;
		}

		const current = getCardQuantity(entries, card.code);
		setEntries(setCardQuantity(entries, card.code, clampQuantity(card, current + delta)));
	}

	function setQuantity(card: Card, quantity: number) {
		if (isLegendCard(card)) {
			selectLegend(card);
			return;
		}

		if (isEditingSideboard) {
			setSideboard(
				setCardQuantity(sideboardEntries, card.code, clampSideboardQuantity(card, quantity))
			);
			return;
		}

		setEntries(setCardQuantity(entries, card.code, clampQuantity(card, quantity)));
	}

	function setSideboard(nextSideboard: DeckEntry[]) {
		const normalized = normalizeDeck(nextSideboard);
		sideboardEntries = normalized;
		saveCollection(updateActiveDeckSideboardEntries(collection, normalized));
	}

	function selectLegend(card: Card) {
		const nextEntries = [
			...entries.filter((entry) => {
				const entryCard = cards.find((candidate) => candidate.code === entry.code);
				return entryCard
					? !isLegendCard(entryCard) && isCardAllowedForLegend(entryCard, card)
					: true;
			}),
			{ code: card.code, quantity: 1 }
		];
		const currentChampion = getChampionCard(cards, activeDeck.championCode);
		let nextCollection = updateActiveDeckEntries(collection, nextEntries);
		if (currentChampion && !isChampionCandidate(currentChampion, card)) {
			nextCollection = updateActiveDeckChampion(nextCollection, '');
		}
		saveCollection(nextCollection);
		entries = getActiveStoredDeck(nextCollection).entries;
		zoneFilter = 'all';
	}

	function requestClearDeck() {
		isClearConfirmOpen = true;
	}

	function cancelClearDeck() {
		isClearConfirmOpen = false;
	}

	function clearDeck() {
		const nextCollection = updateActiveDeckSideboardEntries(
			updateActiveDeckChampion(updateActiveDeckEntries(collection, []), ''),
			[]
		);
		saveCollection(nextCollection);
		entries = getActiveStoredDeck(nextCollection).entries;
		sideboardEntries = getActiveStoredDeck(nextCollection).sideboardEntries || [];
		isClearConfirmOpen = false;
	}

	function selectStoredDeck(deckId: string) {
		if (deckId === collection.activeDeckId) return;
		const nextCollection = setActiveStoredDeck(collection, deckId);
		collection = nextCollection;
		const nextDeck = getActiveStoredDeck(nextCollection);
		entries = nextDeck.entries;
		sideboardEntries = nextDeck.sideboardEntries || [];
		deckNameInput = nextDeck.name;
		if (browser) writeDeckCollectionToStorage(localStorage, nextCollection);
		searchTerm = '';
		zoneFilter = 'all';
		openDeckMenuId = '';
		isDeckDrawerOpen = false;
		goto(`/deck/${deckId}/edit`);
	}

	function toggleDeckMenu(deckId: string, target: HTMLElement) {
		if (openDeckMenuId === deckId) {
			openDeckMenuId = '';
			return;
		}

		const rect = target.getBoundingClientRect();
		const menuWidth = 176;
		deckMenuTop = rect.bottom + 8;
		deckMenuLeft = Math.max(
			12,
			Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)
		);
		openDeckMenuId = deckId;
	}

	function setEntries(nextEntries: DeckEntry[]) {
		const normalizedEntries = normalizeDeck(nextEntries);
		entries = normalizedEntries;
		saveCollection(updateActiveDeckEntries(collection, normalizedEntries));
	}

	function saveCollection(nextCollection: DeckCollection) {
		if (!isDeckLoading) {
			undoSnapshot = collection;
			undoMessage = 'Deck updated';
		}
		collection = normalizeDeckCollection(nextCollection);
		deckNameInput = getActiveStoredDeck(collection).name;
		if (browser) writeDeckCollectionToStorage(localStorage, collection);
	}

	function undoLastDeckChange() {
		if (!browser || !undoSnapshot) return;
		const restored = normalizeDeckCollection(undoSnapshot);
		const restoredDeck = getActiveStoredDeck(restored);
		collection = restored;
		entries = restoredDeck.entries;
		sideboardEntries = restoredDeck.sideboardEntries || [];
		deckNameInput = restoredDeck.name;
		writeDeckCollectionToStorage(localStorage, restored);
		undoSnapshot = null;
		undoMessage = '';
	}

	function createDeck() {
		const nextCollection = addStoredDeck(collection, `Deck ${collection.decks.length + 1}`);
		const nextDeck = getActiveStoredDeck(nextCollection);
		collection = nextCollection;
		entries = nextDeck.entries;
		sideboardEntries = nextDeck.sideboardEntries || [];
		deckNameInput = nextDeck.name;
		if (browser) writeDeckCollectionToStorage(localStorage, nextCollection);
		searchTerm = '';
		zoneFilter = 'all';
		openDeckMenuId = '';
		goto(`/deck/${nextDeck.id}/edit`);
	}

	function duplicateDeck(deckId: string) {
		const nextCollection = duplicateActiveDeck(setActiveStoredDeck(collection, deckId));
		const nextDeck = getActiveStoredDeck(nextCollection);
		collection = nextCollection;
		entries = nextDeck.entries;
		sideboardEntries = nextDeck.sideboardEntries || [];
		deckNameInput = nextDeck.name;
		if (browser) writeDeckCollectionToStorage(localStorage, nextCollection);
		openDeckMenuId = '';
		goto(`/deck/${nextDeck.id}/edit`);
	}

	function deleteDeck(deckId: string) {
		const nextCollection = deleteActiveDeck(setActiveStoredDeck(collection, deckId));
		const nextDeck = getActiveStoredDeck(nextCollection);
		collection = nextCollection;
		entries = nextDeck.entries;
		sideboardEntries = nextDeck.sideboardEntries || [];
		deckNameInput = nextDeck.name;
		if (browser) writeDeckCollectionToStorage(localStorage, nextCollection);
		searchTerm = '';
		zoneFilter = 'all';
		openDeckMenuId = '';
		deleteDeckId = '';
		isDeckDrawerOpen = false;
		goto(`/deck/${nextDeck.id}/edit`);
	}

	function requestDeleteDeck(deckId: string) {
		deleteDeckId = deckId;
		openDeckMenuId = '';
	}

	function cancelDeleteDeck() {
		deleteDeckId = '';
	}

	function confirmDeleteDeck() {
		if (!deleteDeckId) return;
		deleteDeck(deleteDeckId);
	}

	function renameDeck() {
		saveCollection(updateActiveDeckName(collection, deckNameInput));
	}

	function setChampion(card: Card) {
		if (!isChampionCandidate(card, selectedLegend)) return;
		const nextCollection = updateActiveDeckChampion(
			updateActiveDeckEntries(collection, entries),
			card.code
		);
		saveCollection(nextCollection);
		entries = getActiveStoredDeck(nextCollection).entries;
	}

	function clearChampion() {
		saveCollection(updateActiveDeckChampion(collection, ''));
	}

	function openCardInfo(card: Card) {
		selectedPopupCard = card;
	}

	function closeCardInfo() {
		selectedPopupCard = null;
	}

	function clampQuantity(card: Card, quantity: number) {
		const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
		const current = getCardQuantity(entries, card.code);

		if (isMainDeckCard(card)) {
			const sideboardCount = sideboardCards
				.filter((item) => item.card.name_en === card.name_en)
				.reduce((total, item) => total + item.quantity, 0);
			const usedBySameName = getQuantityByName(card) - current + sideboardCount;
			const currentMainTotal = stats.mainTotal - current;
			return Math.min(
				safeQuantity,
				Math.max(0, maxMainCopiesPerName - usedBySameName),
				Math.max(0, maxMainDeckCards - currentMainTotal)
			);
		}

		if (isTokenCard(card)) {
			return safeQuantity;
		}

		if (isBattlefieldCard(card)) {
			const sideboardCount = sideboardCards
				.filter((item) => item.card.name_en === card.name_en)
				.reduce((total, item) => total + item.quantity, 0);
			const usedBySameName = getQuantityByName(card) - current + sideboardCount;
			return Math.min(safeQuantity, Math.max(0, maxBattlefieldCopiesPerName - usedBySameName));
		}

		if (isRuneCard(card)) {
			const currentRuneTotal = stats.runeTotal - current;
			return Math.min(safeQuantity, Math.max(0, maxRuneCards - currentRuneTotal));
		}

		return safeQuantity;
	}

	function clampSideboardQuantity(card: Card, quantity: number) {
		if (!isMainDeckCard(card)) return 0;

		const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
		const current = getCardQuantity(sideboardEntries, card.code);
		const currentSideboardTotal = stats.sideboardTotal - current;

		let limit = maxSideboardCards - currentSideboardTotal;

		const maxAllowed = maxMainCopiesPerName;
		const mainCount = getQuantityByName(card);
		const sideboardCount = sideboardCards
			.filter((item) => item.card.name_en === card.name_en && item.card.code !== card.code)
			.reduce((total, item) => total + item.quantity, 0);

		limit = Math.min(limit, Math.max(0, maxAllowed - (mainCount + sideboardCount)));

		return Math.min(safeQuantity, limit);
	}

	function getQuantityByName(card: Card) {
		return deckCards
			.filter((item) => item.card.name_en === card.name_en)
			.reduce((total, item) => total + item.quantity, 0);
	}

	function getQuantityLimit(card: Card) {
		if (isEditingSideboard) return isMainDeckCard(card) ? maxSideboardCards : 0;
		if (isMainDeckCard(card)) return maxMainCopiesPerName;
		if (isBattlefieldCard(card)) return maxBattlefieldCopiesPerName;
		if (isRuneCard(card)) return maxRuneCards;
		if (isLegendCard(card)) return maxLegendCards;
		if (isTokenCard(card)) return 999;
		return 99;
	}

	function canIncrease(card: Card) {
		if (isLegendCard(card)) return true;
		if (isEditingSideboard) {
			return (
				getCardQuantity(sideboardEntries, card.code) <
				clampSideboardQuantity(card, getCardQuantity(sideboardEntries, card.code) + 1)
			);
		}
		return (
			getCardQuantity(entries, card.code) <
			clampQuantity(card, getCardQuantity(entries, card.code) + 1)
		);
	}

	function getLimitLabel(card: Card) {
		if (isEditingSideboard) {
			if (!isMainDeckCard(card)) return 'main deck cards only';
			return `sideboard ${stats.sideboardTotal}/${maxSideboardCards}`;
		}
		if (card.code === activeDeck.championCode) return 'champion zone';
		if (isChampionCandidate(card, selectedLegend))
			return `main ${stats.mainTotal}/${maxMainDeckCards}`;
		if (isMainDeckCard(card)) return `main ${stats.mainTotal}/${maxMainDeckCards}`;
		if (isBattlefieldCard(card)) return `max ${maxBattlefieldCopiesPerName}/name`;
		if (isRuneCard(card)) return `${stats.runeTotal}/${maxRuneCards} runes`;
		if (isLegendCard(card)) return '1 legend';
		if (isTokenCard(card)) return 'token, unlimited';
		return '';
	}

	function getAbilityPreview(card: Card) {
		const text = card.ability_th || card.ability_en || '';
		return text
			.replace(/<[^>]+>/g, ' ')
			.replace(/:rb_[a-z0-9_]+:/gi, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function setCardPage(page: number) {
		cardPage = Math.min(totalCardPages, Math.max(1, page));
	}

	function getVisiblePages() {
		const visibleCount = Math.min(5, totalCardPages);
		if (totalCardPages <= visibleCount)
			return Array.from({ length: totalCardPages }, (_, index) => index + 1);
		if (cardPage <= 3) return Array.from({ length: visibleCount }, (_, index) => index + 1);
		if (cardPage >= totalCardPages - 2) {
			return Array.from(
				{ length: visibleCount },
				(_, index) => totalCardPages - visibleCount + 1 + index
			);
		}
		return Array.from({ length: visibleCount }, (_, index) => cardPage - 2 + index);
	}

	function normalize(value: unknown) {
		return (Array.isArray(value) ? value.join(' ') : String(value ?? ''))
			.normalize('NFKC')
			.toLowerCase()
			.replace(/[_\-/:()[\].,]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="design-nav sticky top-0 z-50 border-b border-amber-200/10 bg-[#0a0e15]/90 backdrop-blur-xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a
				href="/"
				class="shrink-0 border-l-2 border-amber-200/50 pl-3 text-xl font-black text-white uppercase italic"
			>
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu active="deck" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="design-hero rt-panel rt-topline mb-6 overflow-hidden rounded-2xl">
			<div class="rt-rule-line p-5 pl-7 sm:p-7 sm:pl-9">
				<p class="rt-kicker mb-3">Deck Editor</p>
				<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">Build Deck</h1>
						<p class="rt-copy mt-3 max-w-2xl text-sm">
							ค้นหาการ์ดแล้วกดเพิ่มหรือลดจำนวน เด็คจะบันทึกไว้ใน browser เครื่องนี้อัตโนมัติ
						</p>
					</div>
					<div class="flex flex-col space-y-2">
						<div class="flex flex-wrap items-end gap-2">
							<label class="grid min-w-[220px] flex-1 gap-1 sm:flex-none">
								<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase"
									>Deck Name</span
								>
								<input
									bind:value={deckNameInput}
									class="min-h-11 rounded-md border border-white/10 bg-[#080b12]/80 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none"
									maxlength="48"
									onblur={renameDeck}
									onkeydown={(event) => {
										if (event.key === 'Enter') event.currentTarget.blur();
									}}
								/>
							</label>
							<a href="/deck" class="rt-action">View Deck</a>
							<button
								type="button"
								class="inline-flex min-h-11 items-center rounded-lg border border-rose-300/20 px-4 text-xs font-black tracking-widest text-rose-100 uppercase transition hover:bg-rose-500/10 disabled:opacity-40"
								disabled={entries.length === 0}
								onclick={requestClearDeck}
							>
								Clear
							</button>
						</div>
						{#if selectedLegend}
							<div class="flex flex-wrap justify-end gap-2">
								{#each allowedDomains as domain}
									<span class="rt-chip">
										{#if getDomainIcon(domain)}
											<img
												src={getDomainIcon(domain) ?? ''}
												class="h-4 w-4 object-contain"
												alt={domain}
											/>
										{/if}
										{domain}
									</span>
								{/each}
								{#each selectedLegend.tags ?? [] as tag}
									<span class="rt-chip border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
										>Tag: {tag}</span
									>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</header>

		<section class="rt-panel relative mb-4 rounded-xl p-3">
			<div class="flex gap-2 overflow-x-auto pb-1">
				<button
					type="button"
					class="grid min-h-16 min-w-36 place-items-center rounded-lg border border-dashed border-cyan-300/30 bg-cyan-300/5 px-4 text-center transition hover:bg-cyan-300/10"
					onclick={createDeck}
				>
					<span class="text-xs font-black tracking-widest text-cyan-100 uppercase">+ New Deck</span>
				</button>
				{#each collection.decks as deck}
					<div class="relative min-w-48">
						<button
							type="button"
							class="min-h-16 w-full rounded-lg border p-3 text-left transition {deck.id ===
							collection.activeDeckId
								? 'border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_24px_rgba(83,234,253,0.08)]'
								: 'border-white/10 bg-black/15 hover:border-cyan-300/20 hover:bg-white/5'}"
							onclick={() => selectStoredDeck(deck.id)}
						>
							<span class="block truncate pr-9 text-sm font-black text-white uppercase italic"
								>{deck.name}</span
							>
							<span
								class="mt-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
							>
								{deck.entries.reduce((total, entry) => total + entry.quantity, 0)} Cards
							</span>
						</button>
						<button
							type="button"
							class="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-slate-950/80 text-lg font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
							onclick={(event) => {
								event.stopPropagation();
								toggleDeckMenu(deck.id, event.currentTarget);
							}}
							aria-label={`Open actions for ${deck.name}`}
						>
							&vellip;
						</button>
					</div>
				{/each}
			</div>
		</section>

		{#if !deckValidation.isReady}
			<div class="sticky top-[4.75rem] z-30">
				<DeckProgressStrip {stats} validation={deckValidation} />
			</div>
		{/if}

		<DeckValidationPanel validation={deckValidation} />

		<!-- {#if selectedLegend}
			<section class="rt-panel mb-6 rounded-xl p-5">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
					<div class="flex space-x-5">
						<h2 class="text-lg font-black uppercase italic text-white">Legend</h2>
						<div class="flex flex-wrap gap-2">
							{#each allowedDomains as domain}
								<span class="rt-chip">
									{#if getDomainIcon(domain)}
										<img src={getDomainIcon(domain) ?? ''} class="h-4 w-4 object-contain" alt={domain} />
									{/if}
									{domain}
								</span>
							{/each}
							{#each selectedLegend.tags ?? [] as tag}
								<span class="rt-chip border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Tag: {tag}</span>
							{/each}
						</div>
					</div>
						<p class="rt-copy mt-1 text-sm">
							สามารถเลือกการ์ดตาม domain ของ Legend ได้เท่านั้น
						</p>
					</div>
					{#if championCard}
						<div class="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
							<img
								src={getCardImageUrl(championCard.image_url, 140, 'webp')}
								class="aspect-[744/1039] w-14 rounded-md object-cover"
								alt={championCard.name_en}
								loading="lazy"
							/>
							<div class="min-w-0">
								<div class="truncate text-sm font-black text-white">{championCard.name_en}</div>
								<div class="text-[10px] font-black uppercase tracking-widest text-slate-500">{championCard.code}</div>
							</div>
						</div>
					{:else}
						<span class="rt-chip">No Champion</span>
					{/if}
				</div>
			</section>
		{/if} -->

		{#if !selectedLegend}
			<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each legendCards as card}
					<button
						type="button"
						class="rt-panel flex gap-3 rounded-xl p-3 text-left transition hover:border-amber-200/40"
						onclick={() => selectLegend(card)}
					>
						<img
							src={getCardImageUrl(card.image_url, 180, 'webp')}
							class="pointer-events-none aspect-[744/1039] w-20 shrink-0 rounded-md object-cover"
							alt={card.name_en}
							loading="lazy"
						/>
						<div class="min-w-0">
							<div class="truncate text-sm font-black text-white">{card.name_en}</div>
							<div class="mt-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
								{card.code}
							</div>
							<div class="mt-3 flex flex-wrap gap-1">
								{#each card.domains ?? [] as domain}
									<span
										class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black tracking-widest text-slate-300 uppercase"
									>
										{domain}
									</span>
								{/each}
							</div>
						</div>
					</button>
				{/each}
			</section>
		{:else}
			<section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div class="min-w-0">
					<div class="rt-panel rt-topline sticky top-[4.75rem] z-40 mb-5 rounded-xl p-3">
						<div class="flex flex-col gap-3 xl:flex-row">
							<div class="flex min-w-0 flex-1 gap-2">
								<input
									bind:value={searchTerm}
									class="min-h-12 min-w-0 flex-1 rounded-md border border-white/10 bg-[#080b12]/80 px-4 text-sm font-medium text-white placeholder:text-slate-600 focus:border-amber-200/50 focus:ring-4 focus:ring-amber-200/10 focus:outline-none"
									placeholder="Search card name, code, type, domain..."
								/>
								<button
									type="button"
									class="relative grid min-h-12 w-12 shrink-0 place-items-center rounded-md border border-white/10 bg-[#080b12]/80 text-white transition focus:border-amber-200/50 focus:ring-4 focus:ring-amber-200/10 focus:outline-none active:scale-95 xl:hidden"
									aria-label="Toggle filters"
									aria-expanded={filtersOpen}
									onclick={() => (filtersOpen = !filtersOpen)}
								>
									<svg
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M3 5h18" />
										<path d="M7 12h10" />
										<path d="M10 19h4" />
									</svg>
									{#if activeFilterCount > 0}
										<span
											class="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-md bg-amber-200 px-1 text-[10px] font-black text-slate-950"
										>
											{activeFilterCount}
										</span>
									{/if}
								</button>
							</div>
							<div class="hidden gap-2 sm:grid-cols-3 xl:grid xl:min-w-[620px]">
								<IconSelect bind:value={zoneFilter} label="All Types" options={zoneFilterOptions} />
								<IconSelect
									bind:value={domainFilter}
									label="All Colors"
									options={domainFilterOptions}
								/>
								<IconSelect bind:value={setFilter} label="All Sets" options={setFilterOptions} />
							</div>
						</div>
						{#if filtersOpen}
							<div class="mt-3 grid grid-cols-1 gap-2 border-t border-white/10 pt-3 xl:hidden">
								<IconSelect bind:value={zoneFilter} label="All Types" options={zoneFilterOptions} />
								<IconSelect
									bind:value={domainFilter}
									label="All Colors"
									options={domainFilterOptions}
								/>
								<IconSelect bind:value={setFilter} label="All Sets" options={setFilterOptions} />
							</div>
						{/if}
					</div>

					<div
						class="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/15 p-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="text-xs font-black tracking-widest text-slate-500 uppercase">
							Showing {(cardPage - 1) * cardsPerPage +
								(paginatedCards.length > 0 ? 1 : 0)}-{Math.min(
								cardPage * cardsPerPage,
								filteredCards.length
							)}
							of {filteredCards.length} cards
						</div>
						{@render CardPagination(false)}
					</div>

					<div
						class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5"
					>
						{#each paginatedCards as card}
							{@const quantity = isEditingSideboard
								? getCardQuantity(sideboardEntries, card.code)
								: getCardQuantity(entries, card.code)}
							{@const owned = (userCardCollection[card.code] ?? 0) + (userCardCollection[card.code + '_foil'] ?? 0)}
							{@const isMissing = hasCollection && quantity > 0 && owned < quantity}
							<article
								class="group overflow-hidden rounded-xl border transition hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_0_36px_rgba(45,212,191,0.10)]
								{isMissing ? 'border-amber-500/30 bg-[#120b05]/10' : 'border-white/10 bg-black/20'}"
							>
								<div
									class="relative flex aspect-[744/1039] w-full items-center justify-center overflow-hidden bg-slate-950"
								>
									{#if card.image_url}
										<img
											src={getCardImageUrl(card.image_url, 320, 'webp')}
											class="h-full w-full object-contain transition duration-500 {card.type ===
											'Battlefield'
												? 'scale-135 -rotate-90 group-hover:scale-140'
												: 'group-hover:scale-105'}"
											alt={card.name_en}
											loading="lazy"
										/>
									{:else}
										<div
											class="px-3 text-center text-[10px] font-black tracking-widest text-slate-600 uppercase"
										>
											No Image
										</div>
									{/if}

									<div
										class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
									></div>

									{#if getRarityIcon(card.rarity)}
										<div
											class="absolute top-2 left-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-slate-950/85 opacity-0 shadow-lg backdrop-blur transition group-focus-within:opacity-100 group-hover:opacity-100"
										>
											<img
												src={getRarityIcon(card.rarity) ?? ''}
												class="h-5 w-5 object-contain"
												alt="{card.rarity} rarity"
											/>
										</div>
									{/if}

									<button
										type="button"
										class="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-slate-950/85 text-sm font-black text-cyan-100 shadow-lg backdrop-blur transition hover:bg-cyan-300 hover:text-slate-950"
										onclick={() => openCardInfo(card)}
										aria-label={`View ${card.name_en} details`}
										title="Card info"
									>
										i
									</button>

									{#if quantity > 0}
										<div
											class="absolute top-12 right-2 rounded-md bg-amber-200 px-2 py-1 text-xs font-black text-slate-950 shadow-lg"
										>
											x{quantity}
										</div>
									{/if}

									{#if hasCollection}
										<div
											class="absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[9.5px] font-black tracking-wider uppercase shadow-md backdrop-blur border z-10
											{quantity > 0
												? (owned >= quantity
													? 'bg-emerald-500/80 border-emerald-400 text-white'
													: (owned > 0 ? 'bg-amber-500/80 border-amber-400 text-white' : 'bg-rose-500/80 border-rose-400 text-white'))
												: (owned > 0 ? 'bg-slate-950/90 border-cyan-400/40 text-cyan-300' : 'bg-slate-950/90 border-white/5 text-slate-500')}"
											title="Owned: {owned}"
										>
											Own: {owned}
										</div>
									{/if}

									<div
										class="absolute inset-x-0 bottom-0 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
									>
										<div class="mb-2 min-w-0">
											<div
												class="truncate text-xs font-black text-white uppercase italic drop-shadow sm:text-sm"
											>
												{card.name_en}
											</div>
											<div
												class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-300 uppercase"
											>
												{#each getTypeIcons(card.type) as typeIcon}
													<img
														src="/images/icons/{typeIcon.src}"
														class="h-4 w-4 shrink-0 object-contain"
														alt={typeIcon.label}
													/>
												{/each}
												<span class="truncate">{card.type}</span>
												{#each card.domains ?? [] as domain}
													{#if getDomainIcon(domain)}
														<img
															src={getDomainIcon(domain) ?? ''}
															class="h-5 w-5 object-contain"
															alt={domain}
															title={domain}
														/>
													{/if}
												{/each}
											</div>
											{#if getLimitLabel(card)}
												<div
													class="mt-1 hidden text-[9px] font-black tracking-widest text-amber-100 uppercase sm:block"
												>
													{getLimitLabel(card)}
												</div>
											{/if}
										</div>

										{#if isChampionCandidate(card, selectedLegend)}
											<button
												type="button"
												class="mb-2 min-h-8 w-full rounded-md border bg-slate-950/85 px-2 text-[9px] font-black tracking-widest uppercase backdrop-blur transition sm:min-h-9 sm:px-3 sm:text-[10px] {card.code ===
												activeDeck.championCode
													? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
													: 'border-amber-200/20 text-amber-100 hover:bg-amber-200/10'}"
												disabled={card.code === activeDeck.championCode}
												onclick={() => setChampion(card)}
											>
												{card.code === activeDeck.championCode ? 'Champion' : 'Set Champion'}
											</button>
										{/if}

										<div
											class="grid grid-cols-[2rem_1fr_2rem] items-center gap-1 sm:grid-cols-[2.5rem_1fr_2.5rem]"
										>
											<button
												type="button"
												class="grid h-9 place-items-center rounded-md border border-white/15 bg-slate-950/85 text-lg font-black text-slate-200 backdrop-blur transition hover:bg-white/10 disabled:opacity-30 sm:h-10"
												disabled={quantity === 0 || isLegendCard(card)}
												onclick={() => changeQuantity(card, -1)}
												aria-label="Remove card"
											>
												-
											</button>
											<input
												class="h-9 rounded-md border border-white/15 bg-slate-950/85 text-center text-sm font-black text-white backdrop-blur focus:border-amber-200/50 focus:outline-none sm:h-10"
												type="number"
												min="0"
												max={getQuantityLimit(card)}
												value={quantity}
												disabled={isLegendCard(card)}
												oninput={(event) => setQuantity(card, Number(event.currentTarget.value))}
												aria-label="Card quantity"
											/>
											<button
												type="button"
												class="grid h-9 place-items-center rounded-md bg-amber-200 text-lg font-black text-slate-950 transition active:scale-95 sm:h-10"
												disabled={!canIncrease(card)}
												onclick={() =>
													isLegendCard(card) ? selectLegend(card) : changeQuantity(card, 1)}
												aria-label="Add card"
											>
												+
											</button>
										</div>
									</div>
								</div>
							</article>
						{/each}
					</div>

					{@render CardPagination(true)}
				</div>

				{#if isDeckDrawerOpen}
					<button
						type="button"
						class="fixed inset-0 z-[920] bg-slate-950/70 backdrop-blur-sm lg:hidden"
						onclick={() => (isDeckDrawerOpen = false)}
						aria-label="Close current deck panel"
					></button>
				{/if}

				<aside
					class="rt-panel fixed inset-y-0 left-0 z-[925] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-r-xl border-r border-cyan-300/20 p-5 shadow-2xl shadow-black/50 transition-transform duration-300 {isDeckDrawerOpen
						? 'translate-x-0'
						: '-translate-x-full'} lg:sticky lg:top-[4.75rem] lg:z-auto lg:h-fit lg:w-auto lg:translate-x-0 lg:rounded-xl lg:border-r-0"
				>
					<div class="mb-4 flex items-center justify-between gap-3">
						<h2 class="text-lg font-black text-white uppercase italic">Current Deck</h2>
						<button
							type="button"
							class="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-lg font-black text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
							onclick={() => (isDeckDrawerOpen = false)}
							aria-label="Close current deck"
						>
							x
						</button>
					</div>
					<div
						class="mb-4 inline-flex w-full items-center rounded-lg border border-white/10 bg-slate-950/40 p-1"
					>
						<button
							type="button"
							class="flex-1 rounded-md py-2 text-center text-xs font-black tracking-widest uppercase transition {!isEditingSideboard
								? 'bg-cyan-300 text-slate-950'
								: 'text-slate-400 hover:text-white'}"
							onclick={() => (isEditingSideboard = false)}
						>
							Main
						</button>
						<button
							type="button"
							class="flex-1 rounded-md py-2 text-center text-xs font-black tracking-widest uppercase transition {isEditingSideboard
								? 'bg-cyan-300 text-slate-950'
								: 'text-slate-400 hover:text-white'}"
							onclick={() => (isEditingSideboard = true)}
						>
							Sideboard
						</button>
					</div>
					<div
						class="mb-4 grid grid-cols-4 gap-1.5 text-center text-[8px] font-black tracking-wider uppercase sm:text-[9px]"
					>
						<div class="rounded-md border border-white/10 bg-black/20 p-2">
							<div class="text-[11px] text-white sm:text-xs">{stats.mainTotal}</div>
							<div class="mt-1 text-slate-500">Main</div>
						</div>
						<div class="rounded-md border border-white/10 bg-black/20 p-2">
							<div class="text-[11px] text-white sm:text-xs">{stats.runeTotal}</div>
							<div class="mt-1 text-slate-500">Rune</div>
						</div>
						<div class="rounded-md border border-white/10 bg-black/20 p-2">
							<div class="text-[11px] text-white sm:text-xs">{stats.battlefieldTotal}</div>
							<div class="mt-1 text-slate-500">Field</div>
						</div>
						<div class="rounded-md border border-white/10 bg-black/20 p-2">
							<div class="text-[11px] text-white sm:text-xs">
								{stats.sideboardTotal}/{maxSideboardCards}
							</div>
							<div class="mt-1 text-slate-500">Side</div>
						</div>
					</div>
					<div class="mb-4 grid grid-cols-2 gap-2">
						{#if selectedLegend}
							<div
								class="relative overflow-hidden rounded-lg border border-amber-200/20 bg-black/20"
							>
								<img
									src={getCardImageUrl(selectedLegend.image_url, 220, 'webp')}
									class="aspect-[744/1039] w-full object-cover"
									alt={selectedLegend.name_en}
									loading="lazy"
								/>
								<div
									class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2 pt-10"
								>
									<div class="truncate text-xs font-black text-white">Legend</div>
									<div class="truncate text-[10px] font-bold text-slate-300">
										{selectedLegend.name_en}
									</div>
								</div>
							</div>
						{/if}
						{#if championCard}
							<div
								class="relative overflow-hidden rounded-lg border border-cyan-300/20 bg-black/20"
							>
								<img
									src={getCardImageUrl(championCard.image_url, 220, 'webp')}
									class="aspect-[744/1039] w-full object-cover"
									alt={championCard.name_en}
									loading="lazy"
								/>
								<button
									type="button"
									class="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-md border border-rose-300/25 bg-slate-950/85 text-sm font-black text-rose-100 shadow-lg backdrop-blur transition hover:bg-rose-500/20 hover:text-white"
									onclick={clearChampion}
									aria-label="Clear champion"
									title="Clear champion"
								>
									x
								</button>
								<div
									class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2 pt-10"
								>
									<div class="truncate text-xs font-black text-cyan-100">Champion</div>
									<div class="truncate text-[10px] font-bold text-slate-300">
										{championCard.name_en}
									</div>
								</div>
							</div>
						{:else if selectedLegend}
							<div
								class="grid aspect-[744/1039] place-items-center rounded-lg border border-dashed border-white/10 bg-black/20 p-3 text-center text-[10px] font-black tracking-widest text-slate-500 uppercase"
							>
								No Champion
							</div>
						{/if}
					</div>
					<div
						class="h-[calc(100dvh-22rem)] space-y-2 overflow-y-auto pr-1 lg:h-auto lg:max-h-[70dvh]"
					>
						{#each (isEditingSideboard ? sideboardCards : deckCards).filter((item) => !isLegendCard(item.card)) as item}
							{@const owned = (userCardCollection[item.card.code] ?? 0) + (userCardCollection[item.card.code + '_foil'] ?? 0)}
							{@const isMissing = hasCollection && owned < item.quantity}
							<div
								class="relative overflow-hidden rounded-lg border bg-black/20 {isMissing ? 'border-amber-500/30' : 'border-white/10'} {item
									.card.type === 'Battlefield'
									? 'sm:col-span-1'
									: ''}"
							>
								{#if item.card.image_url}
									<img
										src={getCardImageUrl(item.card.image_url, 260, 'webp')}
										class="absolute inset-0 h-full w-full object-cover opacity-100 {item.card
											.type === 'Battlefield'
											? 'translate-x-6 object-center'
											: 'translate-x-6 object-[55%_15%]'}"
										alt=""
										loading="lazy"
									/>
								{/if}
								<div
									class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/0"
								></div>
								<div
									class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/0 to-transparent"
								></div>
								<div
									class="relative flex {item.card.type === 'Battlefield'
										? 'min-h-15'
										: 'min-h-15'} items-center justify-between gap-3 p-3"
								>
									<div class="min-w-0 pr-4">
										<div class="truncate text-sm font-black text-white drop-shadow">
											{item.card.name_en}
										</div>
									{#if hasCollection}
											<div class="mt-0.5 text-[9px] font-black uppercase tracking-widest {owned >= item.quantity ? 'text-emerald-400' : 'text-amber-400'}">
												มีอยู่: {owned} / ต้องการ: {item.quantity}
											</div>
										{/if}
									</div>
									<div class="flex shrink-0 items-center gap-2">
										{#if isChampionCandidate(item.card, selectedLegend)}
											<button
												type="button"
												class="grid h-8 w-8 place-items-center rounded-md border text-sm font-black transition {item
													.card.code === activeDeck.championCode
													? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
													: 'border-amber-200/25 bg-slate-950/80 text-amber-100 hover:bg-amber-200/10'}"
												disabled={item.card.code === activeDeck.championCode}
												onclick={() => setChampion(item.card)}
												aria-label={item.card.code === activeDeck.championCode
													? 'Current champion'
													: 'Set as champion'}
												title={item.card.code === activeDeck.championCode
													? 'Current champion'
													: 'Set as champion'}
											>
												♛
											</button>
										{/if}
										<button
											type="button"
											class="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-slate-950/80 text-slate-200"
											onclick={() => changeQuantity(item.card, -1)}
										>
											-
										</button>
										<span
											class="grid h-8 min-w-8 place-items-center rounded-md bg-amber-200 px-2 text-sm font-black text-slate-950"
											>{item.quantity}</span
										>
										<button
											type="button"
											class="grid h-8 w-8 place-items-center rounded-md bg-amber-200 text-slate-950 disabled:opacity-50"
											disabled={!canIncrease(item.card)}
											onclick={() => changeQuantity(item.card, 1)}
										>
											+
										</button>
									</div>
								</div>
							</div>
						{:else}
							<p class="text-sm font-bold text-slate-500">ยังไม่มีการ์ดในเด็ค</p>
						{/each}
					</div>
				</aside>
			</section>
		{/if}
	</main>
</div>

{#if isDeckLoading}
	<div class="fixed inset-0 z-[980] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-xs rounded-xl p-5 text-center">
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"
			></div>
			<div class="mt-4 text-sm font-black tracking-widest text-white uppercase">Loading Deck</div>
		</div>
	</div>
{/if}

{#if selectedPopupCard}
	<CardModal card={selectedPopupCard} closePopup={closeCardInfo} canEdit={false} />
{/if}

{#if openDeckMenuDeck}
	<button
		type="button"
		class="fixed inset-0 z-[940] cursor-default bg-transparent"
		onclick={() => (openDeckMenuId = '')}
		aria-label="Close deck actions"
	></button>
	<div
		class="fixed z-[945] w-44 overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 p-1 shadow-2xl shadow-black/40"
		style={`top: ${deckMenuTop}px; left: ${deckMenuLeft}px;`}
	>
		<div class="truncate px-3 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
			{openDeckMenuDeck.name}
		</div>
		<button
			type="button"
			class="block min-h-10 w-full rounded-md px-3 text-left text-xs font-black tracking-widest text-slate-200 uppercase transition hover:bg-white/10 hover:text-white"
			onclick={() => duplicateDeck(openDeckMenuDeck.id)}
		>
			Duplicate
		</button>
		<button
			type="button"
			class="block min-h-10 w-full rounded-md px-3 text-left text-xs font-black tracking-widest text-rose-100 uppercase transition hover:bg-rose-500/15"
			onclick={() => requestDeleteDeck(openDeckMenuDeck.id)}
		>
			Delete
		</button>
	</div>
{/if}

{#if selectedLegend}
	<button
		type="button"
		class="fixed bottom-5 left-5 z-[930] grid h-14 w-14 place-items-center rounded-full border border-cyan-300/30 bg-slate-950/95 text-cyan-100 shadow-2xl shadow-black/40 backdrop-blur transition hover:bg-cyan-300/10 lg:hidden"
		onclick={() => (isDeckDrawerOpen = !isDeckDrawerOpen)}
		aria-label="Toggle current deck"
		aria-expanded={isDeckDrawerOpen}
	>
		<span class="grid gap-1">
			<span class="block h-0.5 w-6 rounded bg-current"></span>
			<span class="block h-0.5 w-6 rounded bg-current"></span>
			<span class="block h-0.5 w-6 rounded bg-current"></span>
		</span>
		<span
			class="absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-slate-950"
		>
			{stats.total}
		</span>
	</button>
{/if}

{#if undoSnapshot}
	<div
		class="fixed right-4 bottom-5 z-[960] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-cyan-300/20 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
		role="status"
		aria-live="polite"
	>
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<div class="text-[10px] font-black tracking-widest text-cyan-100 uppercase">
					Saved locally
				</div>
				<div class="mt-0.5 truncate text-sm font-bold text-white">{undoMessage}</div>
			</div>
			<button
				type="button"
				class="shrink-0 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200"
				onclick={undoLastDeckChange}
			>
				Undo
			</button>
		</div>
	</div>
{/if}

{#if deleteDeckTarget}
	<div class="fixed inset-0 z-[980] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
		<div
			class="rt-panel w-full max-w-md rounded-xl border border-rose-300/20 p-5 shadow-2xl shadow-rose-950/30"
		>
			<p class="rt-kicker mb-3 text-rose-100">Confirm Delete</p>
			<h2 class="text-2xl font-black text-white uppercase italic">Delete Deck?</h2>
			<p class="rt-copy mt-3 text-sm">
				This will permanently delete <span class="font-black text-white"
					>{deleteDeckTarget.name}</span
				> from this browser.
			</p>
			<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					class="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
					onclick={cancelDeleteDeck}
				>
					Cancel
				</button>
				<button
					type="button"
					class="inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-300/25 bg-rose-500/15 px-4 text-xs font-black tracking-widest text-rose-50 uppercase transition hover:bg-rose-500/25"
					onclick={confirmDeleteDeck}
				>
					Delete Deck
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isClearConfirmOpen}
	<div class="fixed inset-0 z-[980] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
		<div
			class="rt-panel w-full max-w-md rounded-xl border border-rose-300/20 p-5 shadow-2xl shadow-rose-950/30"
		>
			<p class="rt-kicker mb-3 text-rose-100">Confirm Clear</p>
			<h2 class="text-2xl font-black text-white uppercase italic">Clear Current Deck?</h2>
			<p class="rt-copy mt-3 text-sm">
				This will remove all cards, legend, and champion from <span class="font-black text-white"
					>{activeDeck.name}</span
				>.
			</p>
			<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					class="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
					onclick={cancelClearDeck}
				>
					Cancel
				</button>
				<button
					type="button"
					class="inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-300/25 bg-rose-500/15 px-4 text-xs font-black tracking-widest text-rose-50 uppercase transition hover:bg-rose-500/25"
					onclick={clearDeck}
				>
					Clear Deck
				</button>
			</div>
		</div>
	</div>
{/if}

{#snippet CardPagination(spaced: boolean)}
	{#if totalCardPages > 1}
		<div class={spaced ? 'mt-6 flex justify-center' : ''}>
			<div
				class="flex max-w-full items-center justify-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/70 p-1"
			>
				<button
					type="button"
					class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-black text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
					disabled={cardPage === 1}
					onclick={() => setCardPage(cardPage - 1)}
					aria-label="Previous card page"
				>
					&lt;
				</button>
				{#each getVisiblePages() as page}
					<button
						type="button"
						class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-xs font-black transition {cardPage ===
						page
							? 'bg-cyan-300 text-slate-950'
							: 'text-slate-400 hover:bg-white/5 hover:text-white'}"
						onclick={() => setCardPage(page)}
						aria-current={cardPage === page ? 'page' : undefined}
					>
						{page}
					</button>
				{/each}
				<button
					type="button"
					class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-black text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
					disabled={cardPage === totalCardPages}
					onclick={() => setCardPage(cardPage + 1)}
					aria-label="Next card page"
				>
					&gt;
				</button>
			</div>
		</div>
	{/if}
{/snippet}
