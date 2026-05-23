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
	let selectedDomain = $state('All');
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
				selectedDomain === 'All' || (card.domains ?? []).includes(selectedDomain);

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
		selectedDomain;
		currentPage = 1;
	});

	$effect(() => {
		searchTerm;
		selectedSet;
		selectedType;
		selectedDomain;
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

<div class="relative min-h-dvh overflow-x-clip pb-24 font-sans text-slate-100 selection:bg-cyan-400/30 md:pb-0">
	<div class="mesh-gradient"></div>

	{#if !!$navigating}
		<div class="fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-slate-950">
			<div class="h-full bg-cyan-400 animate-loading-bar"></div>
		</div>
	{/if}

	<AppNav bind:viewMode />

	<main class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
		{#if viewMode === 'gallery'}
			<header class="mb-8 sm:mb-10">
				<div class="mx-auto max-w-4xl text-center">
					<p class="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300/80">
						Riftbound Thai Card Database
					</p>
					<h1 class="text-4xl font-black uppercase italic tracking-tight text-white sm:text-6xl lg:text-7xl">
						Rift<span class="text-cyan-400">Thai</span>
					</h1>
				</div>
			</header>

			<SearchBar
				bind:searchTerm
				bind:selectedSet
				bind:selectedType
				bind:selectedDomain
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
	<CardModal card={selectedPopupCard} closePopup={closePopup} canEdit={data.canEdit} />
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

	:global(.card-grid) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
	}

	@media (min-width: 640px) {
		:global(.card-grid) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.5rem;
		}
	}

	@media (min-width: 900px) {
		:global(.card-grid) {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (min-width: 1180px) {
		:global(.card-grid) {
			grid-template-columns: repeat(5, minmax(0, 1fr));
			gap: 2rem;
		}
	}

	@media (min-width: 1440px) {
		:global(.card-grid) {
			grid-template-columns: repeat(6, minmax(0, 1fr));
		}
	}

	:global(.kw-inline-badge) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1.8em;
		margin: 2px 4px;
		padding: 0 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 0.75em;
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		vertical-align: middle;
		box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
		transform: skewX(-13deg);
	}

	:global(.kw-inline-badge > *) {
		transform: skewX(13deg);
	}

	:global(.kw-inline-badge.kw-arrow) {
		padding: 0 18px 0 14px;
		clip-path: polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
		transform: none;
	}

	:global(.kw-inline-badge.kw-arrow > *) {
		transform: none;
	}

	:global(.kw-inline-badge.kw-cost-badge) {
		height: auto;
		min-height: 1.8em;
		gap: 0.25em;
		padding: 0.18em 0.75em;
		transform: skewX(-13deg);
	}

	:global(.kw-inline-badge.kw-cost-badge > *) {
		transform: skewX(13deg);
	}

	:global(.kw-inline-badge.kw-cost-badge .inline-icon),
	:global(.kw-inline-badge.kw-cost-badge .icon-energy-circle) {
		margin: 0;
		top: 0;
	}

	:global(.inline-icon) {
		position: relative;
		top: -1px;
		display: inline-block;
		width: auto;
		height: 1.3em;
		margin: 0 2px;
		vertical-align: middle;
		filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.5));
	}

	:global(.icon-energy-circle) {
		position: relative;
		top: -2px;
		display: inline-flex;
		width: 1.3em;
		height: 1.3em;
		align-items: center;
		justify-content: center;
		margin: 0 2px;
		border-radius: 50%;
		background: white;
		color: black;
		font-size: 0.7em;
		font-weight: 900;
		vertical-align: middle;
		box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.3);
	}

	:global(.battlefield-rotated) {
		object-fit: contain;
		transform: rotate(90deg) scale(1.4);
	}

	@media (max-width: 640px) {
		:global(.kw-inline-badge) {
			padding: 0 8px;
			font-size: 0.65em;
		}
	}
</style>
