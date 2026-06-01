<script lang="ts">
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

	let { data } = $props();

	let cards = $derived((data.cards as Card[]) || []);
	let searchTerm = $state('');
	let loadedSearchTerm = $state<string | null>(null);
	let selectedSet = $state('All');
	let selectedType = $state('All');
	let selectedDomains = $state<string[]>([]);
	let viewMode = $state<'gallery' | 'keywords' | 'phases'>('gallery');
	let currentPage = $state(1);
	let selectedPopupCard = $state<Card | null>(null);
	let isFiltering = $state(false);

	const cardsPerPage = 48;
	const windows874ByteByChar = createWindows874ByteMap();

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

	function createWindows874ByteMap() {
		if (typeof TextDecoder === 'undefined') return new Map<string, number>();

		const decoder = new TextDecoder('windows-874');
		const byteByChar = new Map<string, number>();

		for (let byte = 0; byte <= 255; byte += 1) {
			byteByChar.set(decoder.decode(new Uint8Array([byte])), byte);
		}

		return byteByChar;
	}

	function repairThaiMojibake(value: string) {
		if (!/[เธเนโ][\u0080-\u0E7F]/.test(value)) return value;
		if (typeof TextDecoder === 'undefined' || windows874ByteByChar.size === 0) return value;

		const bytes: number[] = [];

		for (const char of value) {
			const byte = windows874ByteByChar.get(char);
			if (byte === undefined) return value;
			bytes.push(byte);
		}

		const repaired = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
		return repaired.includes('\uFFFD') ? value : repaired;
	}

	function normalizeForSearch(value: unknown) {
		const original = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value ?? '');
		const repaired = repairThaiMojibake(original);

		return `${original} ${repaired}`
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
							class="flex items-center justify-between rounded-lg border border-cyan-300/15 bg-black/20 p-3 shadow-inner shadow-cyan-300/5"
						>
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
								Cards
							</div>
							<div class="text-xl font-black text-white">{cards.length}</div>
						</div>
						<div
							class="flex items-center justify-between rounded-lg border border-cyan-300/15 bg-black/20 p-3 shadow-inner shadow-cyan-300/5"
						>
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
								Sets
							</div>
							<div class="text-xl font-black text-white">{sets.length - 1}</div>
						</div>
						<div
							class="flex items-center justify-between rounded-lg border border-cyan-300/15 bg-black/20 p-3 shadow-inner shadow-cyan-300/5"
						>
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
								Domains
							</div>
							<div class="text-xl font-black text-white">{domains.length - 2}</div>
						</div>
					</div>
				</div>
			</header>

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

			<CardGrid cards={paginatedCards} {isLoading} {openPopup} />

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
