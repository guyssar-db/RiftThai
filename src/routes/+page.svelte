<script lang="ts">
	import { browser } from '$app/environment';
	import { navigating } from '$app/stores';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import AppNav from '$lib/components/AppNav.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import KeywordSection from '$lib/components/KeywordSection.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TurnPhasesSection from '$lib/components/TurnPhasesSection.svelte';
	import { keywords } from '$lib/data/keywords';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { buildDeckCards, getDeckZones, getChampionCard, type StoredDeck } from '$lib/utils/deck';

	let { data } = $props();

	let cards = $derived((data.cards as Card[]) || []);
	let searchTerm = $state(data.searchTerm ?? '');
	let loadedSearchTerm = $state<string | null>(data.searchTerm ?? null);
	let selectedSet = $state(data.selectedSet ?? 'All');
	let selectedType = $state(data.selectedType ?? 'All');
	let selectedDomains = $state<string[]>(data.selectedDomains ?? []);
	let viewMode = $state<'gallery' | 'keywords' | 'phases'>((data.viewMode as any) ?? 'gallery');
	let currentPage = $state(1);
	let selectedPopupCard = $state<Card | null>(null);
	let isFiltering = $state(false);
	let userCollection = $state<Record<string, number> | null>(null);
	let trendingDecks = $state<StoredDeck[]>([]);
	let loadingTrending = $state(false);

	async function loadTrendingDecks() {
		loadingTrending = true;
		try {
			const res = await fetch('/api/decks?scope=public&sort=popular');
			if (res.ok) {
				const resData = await res.json();
				trendingDecks = (resData.decks || []).slice(0, 8);
			}
		} catch (err) {
			console.error('Failed to load trending decks:', err);
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
		setParam('domains', selectedDomains.join(','));
		setParam('mode', viewMode === 'gallery' ? '' : viewMode);

		if (window.location.search !== currentUrl.search) {
			window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
		}
	});

	const cardsPerPage = 48;

	let sets = $derived(['All', ...new Set(cards.map((card) => card.set_name).filter(Boolean))]);
	let types = $derived(['All', ...new Set(cards.map((card) => card.type).filter(Boolean))]);
	let domains = $derived([
		'All',
		...new Set(cards.flatMap((card) => card.domains ?? []).filter(Boolean))
	]);

	let filteredCards = $derived(
		cards.filter((card) => {
			const searchTokens = normalizeForSearch(searchTerm).split(' ').filter(Boolean);
			const searchable = normalizeForSearch([
				card.name_en,
				card.name_th,
				card.code,
				card.type,
				card.rarity,
				card.set_name,
				card.ability_en,
				card.ability_th,
				...(card.domains ?? []),
				...(card.tags ?? [])
			]);

			const matchesSearch =
				searchTokens.length === 0 || searchTokens.every((token) => searchable.includes(token));
			const matchesSet = selectedSet === 'All' || card.set_name === selectedSet;
			const matchesType = selectedType === 'All' || card.type === selectedType;
			const matchesDomain =
				selectedDomains.length === 0 ||
				selectedDomains.some((domain) => (card.domains ?? []).includes(domain));

			return matchesSearch && matchesSet && matchesType && matchesDomain;
		})
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
	});

	async function loadUserCollection() {
		try {
			const res = await fetch('/api/auth/session');
			const session = await res.json().catch(() => ({}));
			if (session.user) {
				const colRes = await fetch('/api/collection');
				const colData = await colRes.json().catch(() => ({}));
				if (colRes.ok) {
					userCollection = colData.collection || {};
				}
			}
		} catch (err) {
			console.error('Failed to load user collection:', err);
		}
	}

	$effect(() => {
		searchTerm;
		selectedSet;
		selectedType;
		selectedDomains;
		currentPage = 1;
	});

	$effect(() => {
		searchTerm;
		selectedSet;
		selectedType;
		selectedDomains;
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

<div class="rt-page-shell pb-24 font-sans selection:bg-cyan-400/30 md:pb-0">
	<div class="mesh-gradient"></div>

	{#if !!$navigating}
		<div class="fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-slate-950">
			<div class="animate-loading-bar h-full bg-cyan-400"></div>
		</div>
	{/if}

	<AppNav bind:viewMode />

	<main class="rt-container py-5 sm:py-8 lg:py-10">
		{#if viewMode === 'gallery'}
			<header
				class="rt-panel rt-topline rt-scanline relative mb-5 grid overflow-hidden rounded-xl lg:mb-7 lg:grid-cols-[minmax(0,1fr)_360px]"
			>
				<div
					class="pointer-events-none absolute -top-28 right-10 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl"
				></div>
				<div
					class="pointer-events-none absolute -right-20 -bottom-32 h-72 w-72 rounded-full bg-[#ffb86b]/10 blur-3xl"
				></div>

				<div class="rt-rule-line relative min-w-0 p-5 pl-7 sm:p-7 sm:pl-9 lg:p-8 lg:pl-10">
					<div class="mb-4 flex flex-wrap items-center gap-2">
						<p class="rt-kicker">Riftbound Thai Card Database</p>
						<span
							class="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-100 uppercase"
							>Live Index</span
						>
					</div>
					<h1 class="rt-heading text-5xl uppercase italic sm:text-7xl lg:text-8xl">
						Rift<span class="text-cyan-300">Thai</span>
					</h1>
					<p class="rt-copy mt-4 max-w-2xl text-sm sm:text-base">
						ค้นการ์ด, อ่านคำแปลไทย, กรองตาม set, type และ domain ได้จากหน้าเดียว พร้อมข้อมูล keyword
						และลำดับ phase สำหรับใช้เตรียมเล่น
					</p>
					<div class="mt-6 flex flex-wrap gap-2">
						<span class="rt-chip">Thai Translation</span>
						<span class="rt-chip">Rules Notes</span>
						<span class="rt-chip">Deck Prep</span>
					</div>
				</div>

				<div class="relative border-t border-white/10 bg-slate-950/32 p-4 lg:border-t-0 lg:border-l">
					<div
						class="mb-3 hidden rounded-lg border border-white/10 bg-black/20 p-3 text-[10px] font-black tracking-widest text-slate-400 uppercase lg:block"
					>
						Index Telemetry
					</div>
					<div class="grid h-full grid-cols-3 gap-2 text-center lg:h-auto lg:grid-cols-1">
						<div
							class="flex flex-col items-center justify-center gap-1 rounded-lg border border-cyan-300/15 bg-black/20 p-2.5 shadow-inner shadow-cyan-300/5 sm:p-3 lg:flex-row lg:justify-between"
						>
							<div class="text-[9px] font-black tracking-widest text-slate-500 uppercase sm:text-[10px]">
								Cards
							</div>
							<div class="text-base font-black text-white sm:text-xl">{cards.length}</div>
						</div>
						<div
							class="flex flex-col items-center justify-center gap-1 rounded-lg border border-cyan-300/15 bg-black/20 p-2.5 shadow-inner shadow-cyan-300/5 sm:p-3 lg:flex-row lg:justify-between"
						>
							<div class="text-[9px] font-black tracking-widest text-slate-500 uppercase sm:text-[10px]">
								Sets
							</div>
							<div class="text-base font-black text-white sm:text-xl">{sets.length - 1}</div>
						</div>
						<div
							class="flex flex-col items-center justify-center gap-1 rounded-lg border border-cyan-300/15 bg-black/20 p-2.5 shadow-inner shadow-cyan-300/5 sm:p-3 lg:flex-row lg:justify-between"
						>
							<div class="text-[9px] font-black tracking-widest text-slate-500 uppercase sm:text-[10px]">
								Domains
							</div>
							<div class="text-base font-black text-white sm:text-xl">{domains.length - 2}</div>
						</div>
					</div>
				</div>
			</header>

			{#if trendingDecks.length > 0}
				<section class="rt-panel mb-6 rounded-xl p-5 relative overflow-hidden">
					<div class="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-300/5 blur-3xl"></div>
					<div class="mb-4 flex items-center justify-between">
						<div>
							<p class="rt-kicker">Trending Decks</p>
							<h2 class="text-xl font-black text-white uppercase italic sm:text-2xl">
								เด็คยอดนิยมจากชุมชน
							</h2>
						</div>
						<a
							href="/deck/browser"
							class="text-xs font-black tracking-widest text-cyan-300 uppercase hover:text-cyan-100 transition"
						>
							ดูทั้งหมด (Browse All) &rarr;
						</a>
					</div>

					<div class="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
						{#each trendingDecks as deck}
							{@const summary = getTrendingDeckSummary(deck)}
							<a
								href="/deck/{deck.id}"
								class="group relative flex w-72 flex-shrink-0 snap-start items-center gap-3.5 rounded-lg border border-white/5 bg-slate-950/50 p-3 transition-all duration-200 hover:border-cyan-300/25 hover:bg-slate-900/60 hover:scale-[1.01]"
							>
								<!-- Background Glow -->
								<div class="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-400/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

								<!-- Cover Image -->
								<div class="relative w-16 aspect-[744/1039] shrink-0 overflow-hidden rounded bg-black/40 border border-white/10">
									{#if summary.coverCard?.image_url}
										<img
											src={getCardImageUrl(summary.coverCard.image_url, 180, 'webp')}
											class="h-full w-full object-contain transition duration-200 group-hover:scale-105"
											alt={deck.name}
											loading="lazy"
										/>
									{:else}
										<div class="grid h-full w-full place-items-center text-[8px] font-black text-slate-600 uppercase">
											No Cover
										</div>
									{/if}
								</div>

								<!-- Info -->
								<div class="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
									<div>
										<h3 class="truncate text-sm font-black text-white uppercase group-hover:text-cyan-300 transition">
											{deck.name}
										</h3>
										<p class="mt-0.5 truncate text-[10px] font-bold text-slate-500 uppercase">
											By {deck.owner?.profileHandle || 'Anonymous'}
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
																class="h-4.5 w-4.5 object-contain rounded-full bg-slate-950 ring-1 ring-white/10"
																alt={dom.label}
																title={dom.label}
															/>
														{/if}
													{/each}
												</div>
											{:else if getDomainIcon(summary.primaryDomain)}
												<img
													src={getDomainIcon(summary.primaryDomain)}
													class="h-4.5 w-4.5 object-contain"
													alt={summary.primaryDomain}
													title={summary.primaryDomain}
												/>
											{/if}
											<span class="text-[9px] font-black tracking-widest text-slate-400 uppercase">
												{summary.cardCount} Cards
											</span>
										</div>

										<div class="flex items-center gap-1 text-pink-400 text-xs font-black">
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
												<path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
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

			<SearchBar
				bind:searchTerm
				bind:selectedSet
				bind:selectedType
				bind:selectedDomains
				{sets}
				{types}
				{domains}
				resultsCount={filteredCards.length}
			/>

			<CardGrid cards={paginatedCards} {isLoading} {openPopup} userCollection={userCollection} />

			{#if filteredCards.length === 0 && !isLoading}
				<EmptyState />
			{/if}

			<Pagination bind:currentPage {totalPages} />
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

<style>
	@keyframes loading-bar {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.animate-loading-bar {
		animation: loading-bar 1.5s infinite linear;
	}

</style>
