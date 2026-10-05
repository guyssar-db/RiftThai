<script lang="ts">
	import { browser } from '$app/environment';
	import { navigating } from '$app/stores';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import AppNav from './HomeNav.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import KeywordSection from '$lib/components/KeywordSection.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SearchBar from './HomeFilters.svelte';
	import './home.css';
	import TurnPhasesSection from '$lib/components/TurnPhasesSection.svelte';
	import { keywords } from '$lib/data/keywords';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getCardTypeLabels } from '$lib/data/typeIcons';
	import { buildDeckCards, getDeckZones, getChampionCard, type StoredDeck } from '$lib/utils/deck';
	import { getAuthSession } from '$lib/utils/authSession';
	import { getUserCollection } from '$lib/utils/collectionCache';
	import { desktopSidebarCollapsed } from '$lib/stores/sidebar';

	import type { PageData } from '../../../routes/$types';
	let { data }: { data: PageData } = $props();
	// Route data intentionally seeds mutable filter state once; later changes come from user input.
	// svelte-ignore state_referenced_locally
	const initialData = data;

	let cards = $derived((data.cards as Card[]) || []);
	let searchTerm = $state(initialData.searchTerm ?? '');
	let loadedSearchTerm = $state<string | null>(initialData.searchTerm ?? null);
	let selectedSet = $state(initialData.selectedSet ?? 'All');
	let selectedType = $state(initialData.selectedType ?? 'All');
	let selectedGearGroup = $state(initialData.selectedGearGroup ?? 'All');
	let selectedDomains = $state<string[]>(initialData.selectedDomains ?? []);
	let selectedEnergy = $state<number | null>(initialData.selectedEnergy ?? null);
	let selectedMight = $state<number | null>(initialData.selectedMight ?? null);
	let selectedPower = $state<number | null>(initialData.selectedPower ?? null);
	let selectedRarity = $state(initialData.selectedRarity ?? 'All');
	let sortMode = $state(initialData.sortMode ?? 'latest');
	const powerCode = (code: string) => code.toLowerCase().replaceAll('/', '-');
	let rarities = $derived(['All', ...new Set(cards.map((c) => c.rarity).filter(Boolean))]);
	let viewMode = $state<'gallery' | 'keywords' | 'phases'>(
		(initialData.viewMode as any) ?? 'gallery'
	);
	let currentPage = $state(1);
	let selectedPopupCard = $state<Card | null>(null);
	let isFiltering = $state(false);
	let userCollection = $state<Record<string, number> | null>(null);
	let trendingDecks = $state<StoredDeck[]>([]);
	let loadingTrending = $state(false);

	let collectionStats = $derived.by(() => {
		if (!userCollection) return null;
		let nonFoilCount = 0;
		let foilCount = 0;
		for (const [key, val] of Object.entries(userCollection)) {
			if (typeof val === 'number' && val > 0) {
				if (key.endsWith('_foil')) {
					foilCount += val;
				} else {
					nonFoilCount += val;
				}
			}
		}
		return { nonFoilCount, foilCount };
	});

	async function loadTrendingDecks() {
		loadingTrending = true;
		try {
			const res = await fetch('/api/decks?scope=public&sort=popular');
			if (res.ok) {
				const resData = await res.json();
				trendingDecks = (resData.decks || []).slice(0, 8);
			}
		} catch {
		} finally {
			loadingTrending = false;
		}
	}

	function getTrendingDeckSummary(deck: StoredDeck) {
		const deckCards = buildDeckCards(cards, deck.entries);
		const champion = getChampionCard(cards, deck.championCode);
		const legend = getDeckZones(deckCards).legends[0];

		const domains: Record<string, number> = {};
		for (const item of deckCards) {
			for (const d of item.card.domains ?? []) {
				if (d !== 'Colorless') {
					domains[d] = (domains[d] ?? 0) + item.quantity;
				}
			}
		}
		const sortedDomains = Object.entries(domains).sort((a, b) => b[1] - a[1]);
		const primaryDomain = sortedDomains[0]?.[0] || 'Colorless';
		const domainsList = sortedDomains.map(([label, count]) => ({ label, count }));

		return {
			coverCard: legend?.card ?? champion ?? null,
			primaryDomain,
			domains: domainsList,
			cardCount: deckCards.reduce((acc, c) => acc + c.quantity, 0)
		};
	}

	$effect(() => {
		if (!browser) return;
		void loadTrendingDecks();
	});

	$effect(() => {
		const currentUrl = new URL(window.location.href);

		const setParam = (key: string, val: string) => {
			if (val) {
				currentUrl.searchParams.set(key, val);
			} else {
				currentUrl.searchParams.delete(key);
			}
		};

		setParam('q', searchTerm);
		setParam('set', selectedSet === 'All' ? '' : selectedSet);
		setParam('type', selectedType === 'All' ? '' : selectedType);
		setParam('gear', selectedType === 'Gear' && selectedGearGroup !== 'All' ? selectedGearGroup.toLowerCase() : '');
		setParam('domains', selectedDomains.join(','));
		setParam('mode', viewMode === 'gallery' ? '' : viewMode);
		setParam('energy', selectedEnergy === null ? '' : String(selectedEnergy));
		setParam('might', selectedMight === null ? '' : String(selectedMight));
		setParam('power', selectedPower === null ? '' : String(selectedPower));
		setParam('rarity', selectedRarity === 'All' ? '' : selectedRarity);
		setParam('sort', sortMode === 'latest' ? '' : sortMode);

		if (window.location.search !== currentUrl.search) {
			window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
		}
	});

	const cardsPerPage = 48;

	let sets = $derived(['All', ...new Set(cards.map((card) => card.set_name).filter(Boolean))]);
	let types = $derived(['All', ...new Set(cards.flatMap((card) => getCardTypeLabels(card)).filter(Boolean))]);
	let domains = $derived([
		'All',
		...new Set(cards.flatMap((card) => card.domains ?? []).filter(Boolean))
	]);
	let indexedCards = $derived(
		cards.map((card) => ({
			card,
			searchable: normalizeForSearch([
				card.name_en,
				card.name_th,
				card.code,
				...getCardTypeLabels(card),
				card.rarity,
				card.set_name,
				card.ability_en,
				card.ability_th,
				...(card.domains ?? []),
				...(card.tags ?? [])
			])
		}))
	);

	let filteredCards = $derived(
		indexedCards
			.filter(({ card, searchable }) => {
				const searchTokens = normalizeForSearch(searchTerm).split(' ').filter(Boolean);

				const matchesSearch =
					searchTokens.length === 0 || searchTokens.every((token) => searchable.includes(token));
				const matchesSet = selectedSet === 'All' || card.set_name === selectedSet;
				const cardTypes = getCardTypeLabels(card);
				const matchesType = selectedType === 'All' || cardTypes.includes(selectedType);
				const isEquipment = (card.tags ?? []).includes('Equipment');
				const isGearUnit = cardTypes.includes('Gear') && cardTypes.includes('Unit');
				const matchesGearGroup =
					selectedType !== 'Gear' ||
					selectedGearGroup === 'All' ||
					(selectedGearGroup === 'Equipment' ? isEquipment : isGearUnit);
				const matchesDomain =
					selectedDomains.length === 0 ||
					selectedDomains.some((domain) => (card.domains ?? []).includes(domain));
				const matchesEnergy =
					['Rune', 'Token', 'Basic'].includes(selectedType) ||
					selectedEnergy === null ||
					(selectedEnergy === 7 ? (card.energy ?? 0) >= 7 : card.energy === selectedEnergy);
				const cost = data.powerCosts?.[powerCode(card.code)] ?? null;
				const matchesPower =
					selectedPower === null ||
					(cost !== null && (selectedPower === 3 ? cost >= 3 : cost === selectedPower));
				const matchesRarity = selectedRarity === 'All' || card.rarity === selectedRarity;
				const matchesMight =
					!['All', 'Unit', 'Champion'].includes(selectedType) ||
					selectedMight === null ||
					(card.power?.label === 'Might' &&
						(selectedMight === 7
							? (card.power?.value?.id ?? 0) >= 7
							: card.power?.value?.id === selectedMight));

				return (
					matchesSearch &&
					matchesSet &&
					matchesType &&
					matchesGearGroup &&
					matchesDomain &&
					matchesEnergy &&
					matchesPower &&
					matchesRarity &&
					matchesMight
				);
			})
			.map(({ card }) => card)
			.sort((a, b) =>
				sortMode === 'name'
					? a.name_en.localeCompare(b.name_en)
					: sortMode === 'energy'
						? (a.energy ?? 99) - (b.energy ?? 99)
						: 0
			)
	);

	let totalPages = $derived(Math.max(1, Math.ceil(filteredCards.length / cardsPerPage)));
	let paginatedCards = $derived(
		filteredCards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)
	);

	$effect(() => {
		const nextSearchTerm = data.searchTerm ?? '';
		if (nextSearchTerm !== loadedSearchTerm) {
			searchTerm = nextSearchTerm;
			loadedSearchTerm = nextSearchTerm;
		}
	});

	$effect(() => {
		if (!browser) return;
		void loadUserCollection();
		const syncAuth = () => void loadUserCollection();
		window.addEventListener('riftthai-auth-changed', syncAuth);
		return () => {
			window.removeEventListener('riftthai-auth-changed', syncAuth);
		};
	});

	async function loadUserCollection() {
		try {
			const session = await getAuthSession<{ user?: unknown }>();
			if (session.user) {
				userCollection = await getUserCollection();
			} else {
				userCollection = null;
			}
		} catch {
			userCollection = null;
		}
	}

	$effect(() => {
		searchTerm;
		selectedSet;
		selectedType;
		selectedGearGroup;
		selectedDomains;
		selectedEnergy;
		selectedMight;
		selectedPower;
		selectedRarity;
		sortMode;
		currentPage = 1;
	});

	$effect(() => {
		searchTerm;
		selectedSet;
		selectedType;
		selectedGearGroup;
		selectedDomains;
		selectedEnergy;
		selectedMight;
		selectedPower;
		selectedRarity;
		sortMode;
		isFiltering = true;
		const timer = setTimeout(() => (isFiltering = false), 220);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		if (currentPage > totalPages) currentPage = totalPages;
	});

	let isLoading = $derived(!!$navigating || isFiltering);

	function openPopup(card: Card) {
		selectedPopupCard = card;
	}

	function closePopup() {
		selectedPopupCard = null;
	}

	function resetCardSearch() {
		searchTerm = '';
		selectedSet = 'All';
		selectedType = 'All';
		selectedGearGroup = 'All';
		selectedDomains = [];
		selectedEnergy = null;
		selectedMight = null;
		selectedPower = null;
		selectedRarity = 'All';
	}

	function normalizeForSearch(value: unknown) {
		const original = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value ?? '');
		return original
			.normalize('NFKC')
			.toLowerCase()
			.replace(/[_\-/:()[\].,]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
</script>

	<div
		class="home-redesign rt-page-shell pb-24 font-sans selection:bg-cyan-400/30 md:pb-0"
		class:home-sidebar-collapsed={$desktopSidebarCollapsed}
	>
	<div class="mesh-gradient"></div>

	<AppNav bind:viewMode />

	<main class="rt-container py-5 sm:py-8 lg:py-10">
		{#if viewMode === 'gallery'}
			<div class="home-gallery-layout">
				<aside class="home-filter-rail" aria-label="ค้นหาและกรองการ์ด">
					<SearchBar
						bind:searchTerm
						bind:selectedSet
						bind:selectedType
					bind:selectedGearGroup
						bind:selectedDomains
						bind:selectedEnergy
						bind:selectedMight
						bind:selectedPower
						bind:selectedRarity
						bind:sortMode
						{rarities}
						{sets}
						{types}
						{domains}
						resultsCount={filteredCards.length}
						rail={$desktopSidebarCollapsed}
					/>
				</aside>
				<div class="home-gallery-content">
			<header class="catalog-hero">
				<div class="catalog-copy">
					<p>RIFTBOUND · คลังการ์ดภาษาไทย</p>
					<h1>Rift<span>Thai</span></h1>
				</div>
				<div class="catalog-stats">
					<div><strong>{cards.length.toLocaleString()}</strong><span>การ์ดทั้งหมด</span></div>
					<div><strong>{sets.length - 1}</strong><span>ชุดการ์ด</span></div>
					<div>
						<strong>{domains.filter((d) => d !== 'All' && d !== 'Colorless').length}</strong><span
							>โดเมน</span
						>
					</div>
				</div>
			</header>

				<div class="home-filter-inline">
					<SearchBar
						bind:searchTerm
						bind:selectedSet
						bind:selectedType
					bind:selectedGearGroup
						bind:selectedDomains
						bind:selectedEnergy
						bind:selectedMight
						bind:selectedPower
						bind:selectedRarity
						bind:sortMode
						{rarities}
						{sets}
						{types}
						{domains}
						resultsCount={filteredCards.length}
					/>
				</div>

			<CardGrid cards={paginatedCards} {isLoading} {openPopup} {userCollection} />

			{#if filteredCards.length === 0 && !isLoading}
				<EmptyState
					showReset={Boolean(
						searchTerm ||
						selectedSet !== 'All' ||
						selectedType !== 'All' ||
						selectedDomains.length ||
						selectedEnergy !== null ||
						selectedMight !== null ||
						selectedPower !== null ||
						selectedRarity !== 'All'
					)}
					onreset={resetCardSearch}
				/>
			{/if}

			<Pagination bind:currentPage {totalPages} />
			{#if trendingDecks.length > 0}
				<section class="rt-panel relative mb-6 overflow-hidden rounded-xl p-5">
					<div
						class="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-cyan-300/5 blur-3xl"
					></div>
					<div class="mb-4 flex items-center justify-between">
						<div>
							<p class="rt-kicker">เด็คยอดนิยม</p>
							<h2 class="text-xl font-black text-white uppercase italic sm:text-2xl">
								เด็คยอดนิยมจากชุมชน
							</h2>
						</div>
						<a
							href="/deck/browser"
							class="text-xs font-black tracking-widest text-cyan-300 uppercase transition hover:text-cyan-100"
						>
							ดูเด็คทั้งหมด &rarr;
						</a>
					</div>

					<div
						class="flex snap-x scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent gap-4 overflow-x-auto pb-2"
					>
						{#each trendingDecks as deck}
							{@const summary = getTrendingDeckSummary(deck)}
							<a
								href="/deck/{deck.id}"
								class="group relative flex w-72 flex-shrink-0 snap-start items-center gap-3.5 rounded-lg border border-white/5 bg-slate-950/50 p-3 transition-all duration-200 hover:scale-[1.01] hover:border-cyan-300/25 hover:bg-slate-900/60"
							>
								<!-- Background Glow -->
								<div
									class="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-400/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								></div>

								<!-- Cover Image -->
								<div
									class="relative aspect-[744/1039] w-16 shrink-0 overflow-hidden rounded border border-white/10 bg-black/40"
								>
									{#if summary.coverCard?.image_url}
										<img
											src={getCardImageUrl(summary.coverCard.image_url, 180, 'webp')}
											class="h-full w-full object-contain transition duration-200 group-hover:scale-105"
											alt={deck.name}
											loading="lazy"
										/>
									{:else}
										<div
											class="grid h-full w-full place-items-center text-[8px] font-black text-slate-600 uppercase"
										>
											ไม่มีภาพปก
										</div>
									{/if}
								</div>

								<!-- Info -->
								<div class="flex h-full min-w-0 flex-1 flex-col justify-between py-0.5">
									<div>
										<h3
											class="truncate text-sm font-black text-white uppercase transition group-hover:text-cyan-300"
										>
											{deck.name}
										</h3>
										<p class="mt-0.5 truncate text-[10px] font-bold text-slate-500 uppercase">
											โดย {deck.owner?.profileHandle || 'ไม่ระบุชื่อ'}
										</p>
									</div>

									<div class="mt-3 flex items-center justify-between gap-2">
										<div class="flex items-center gap-1.5">
											{#if summary.domains && summary.domains.length > 0}
												<div class="flex -space-x-1">
													{#each summary.domains as dom}
														{#if getDomainIcon(dom.label)}
															<img
																src={getDomainIcon(dom.label)}
																class="h-[18px] w-[18px] rounded-full bg-slate-950 object-contain ring-1 ring-white/10"
																alt={dom.label}
																title={dom.label}
															/>
														{/if}
													{/each}
												</div>
											{:else if getDomainIcon(summary.primaryDomain)}
												<img
													src={getDomainIcon(summary.primaryDomain)}
													class="h-[18px] w-[18px] object-contain"
													alt={summary.primaryDomain}
													title={summary.primaryDomain}
												/>
											{/if}
											<span class="text-[9px] font-black tracking-widest text-slate-400 uppercase">
												{summary.cardCount} ใบ
											</span>
										</div>

										<div class="flex items-center gap-1 text-xs font-black text-pink-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												class="h-3.5 w-3.5"
											>
												<path
													d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"
												/>
											</svg>
											<span>{deck.likesCount ?? 0}</span>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}
				</div>
			</div>
		{:else if viewMode === 'keywords'}
			<KeywordSection {keywords} />
		{:else if viewMode === 'phases'}
			<TurnPhasesSection />
		{/if}
	</main>

	<AppFooter />
</div>

{#if selectedPopupCard}
	<CardModal card={selectedPopupCard} {closePopup} canEdit={data.canEdit} />
{/if}
