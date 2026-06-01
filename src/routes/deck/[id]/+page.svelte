<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import {
		buildDeckCards,
		calculateDeckStats,
		getChampionCard,
		getDeckZones,
		maxMainDeckCards,
		maxRuneCards,
		maxSideboardCards,
		readDeckCollectionFromStorage,
		setActiveStoredDeck,
		writeDeckCollectionToStorage,
		type DeckCard,
		type DeckCollection,
		type StoredDeck
	} from '$lib/utils/deck';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let deckId = $derived(data.deckId ?? '');
	let collection = $state<DeckCollection | null>(null);
	let isLoading = $state(true);

	let selectedDeck = $derived(collection?.decks.find((deck) => deck.id === deckId) ?? null);
	let deckCards = $derived(buildDeckCards(cards, selectedDeck?.entries ?? []));
	let sideboardCards = $derived(buildDeckCards(cards, selectedDeck?.sideboardEntries ?? []));
	let stats = $derived(calculateDeckStats(deckCards, sideboardCards));
	let zones = $derived(getDeckZones(deckCards));
	let championCard = $derived(getChampionCard(cards, selectedDeck?.championCode));
	let hasDeck = $derived(deckCards.length > 0 || sideboardCards.length > 0);

	$effect(() => {
		if (!browser) return;
		const nextCollection = readDeckCollectionFromStorage(localStorage);
		collection = nextCollection;
		if (nextCollection.decks.some((deck) => deck.id === deckId)) {
			writeDeckCollectionToStorage(localStorage, setActiveStoredDeck(nextCollection, deckId));
		}
		isLoading = false;
	});

	$effect(() => {
		if (!browser || isLoading || selectedDeck) return;
		goto('/deck');
	});

	function getLegendChampionCards() {
		return [
			...zones.legends,
			...(championCard ? [{ card: championCard, quantity: 1 }] : [])
		];
	}

	function getMaxCount(items: { label: string; count: number }[]) {
		return Math.max(1, ...items.map((item) => item.count));
	}

	function getDeckTitle(deck: StoredDeck | null) {
		return deck?.name ?? 'Deck';
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a href="/deck" class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black uppercase italic text-white">
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu active="deck" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		{#if selectedDeck}
			<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
				<div class="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl"></div>
				<div class="rt-rule-line relative p-5 pl-7 sm:p-7 sm:pl-9">
					<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
						<div class="min-w-0">
							<p class="rt-kicker mb-3">Deck Detail</p>
							<h1 class="rt-heading break-words text-4xl uppercase italic sm:text-6xl">
								{getDeckTitle(selectedDeck)}
							</h1>
							<p class="rt-copy mt-3 text-sm">
								Updated {new Date(selectedDeck.updatedAt).toLocaleDateString()} · {stats.total} cards
							</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<a href="/deck" class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5 hover:text-white">
								Back
							</a>
							<a href="/deck/{selectedDeck.id}/edit" class="rt-action">Edit Deck</a>
						</div>
					</div>
				</div>
			</header>

			{#if !hasDeck}
				<section class="rt-panel rounded-xl p-8 text-center">
					<h2 class="text-2xl font-black uppercase italic text-white">Empty Deck</h2>
					<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">ยังไม่มีการ์ดในเด็คนี้</p>
					<a href="/deck/{selectedDeck.id}/edit" class="rt-action mt-6">Start Building</a>
				</section>
			{:else}
				<section class="mb-6 grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
					{@render StatCard('Legend', stats.legendTotal)}
					{@render StatCard('Champion', championCard ? 1 : 0)}
					{@render StatCard('Field', stats.battlefieldTotal)}
					{@render StatCard(`Main / ${maxMainDeckCards}`, stats.mainTotal)}
					{@render StatCard(`Rune / ${maxRuneCards}`, stats.runeTotal)}
					{@render StatCard(`Sideboard / ${maxSideboardCards}`, stats.sideboardTotal)}
					{@render StatCard('Token', stats.tokenTotal)}
					{@render StatCard('Total', stats.total)}
				</section>

				<section class="mb-6 grid gap-5 lg:grid-cols-3">
					{@render ChartPanel('Cost Curve', stats.costs)}
					{@render ChartPanel('Card Types', stats.types)}
					{@render ChartPanel('Main Domains', stats.domains, true)}
				</section>

				<section class="mb-6 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black uppercase italic text-white">Legend + Champion</h2>
						{@render CardList(getLegendChampionCards())}
					</div>
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black uppercase italic text-white">Battlefield</h2>
						{@render CardList(zones.battlefields, true)}
					</div>
				</section>

				<section class="space-y-5">
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black uppercase italic text-white">Main Deck</h2>
						{@render CardList(zones.main)}
					</div>
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black uppercase italic text-white">Rune Deck</h2>
						{@render CardList(zones.runes)}
					</div>
					{#if sideboardCards.length > 0}
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Sideboard</h2>
							{@render CardList(sideboardCards)}
						</div>
					{/if}
					{#if zones.tokens.length > 0}
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Tokens</h2>
							{@render CardList(zones.tokens)}
						</div>
					{/if}
					{#if zones.other.length > 0}
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Other Cards</h2>
							{@render CardList(zones.other)}
						</div>
					{/if}
				</section>
			{/if}
		{:else}
			<div class="rt-panel mx-auto w-full max-w-xs rounded-xl p-5 text-center">
				<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
				<div class="mt-4 text-sm font-black uppercase tracking-widest text-white">Loading Deck</div>
			</div>
		{/if}
	</main>
</div>

{#snippet StatCard(label: string, value: number)}
	<div class="rt-panel rounded-xl p-4">
		<div class="text-2xl font-black text-white">{value}</div>
		<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
	</div>
{/snippet}

{#snippet ChartPanel(title: string, items: { label: string; count: number }[], icons = false)}
	<div class="rt-panel rounded-xl p-5">
		<h2 class="mb-4 text-lg font-black uppercase italic text-white">{title}</h2>
		<div class="space-y-3">
			{#each items as item}
				<div>
					<div class="mb-1 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest">
						<span class="flex min-w-0 items-center gap-2 text-slate-300">
							{#if icons && getDomainIcon(item.label)}
								<img src={getDomainIcon(item.label) ?? ''} class="h-4 w-4 object-contain" alt={item.label} />
							{/if}
							<span class="truncate">{item.label}</span>
						</span>
						<span class="text-cyan-200">{item.count}</span>
					</div>
					<div class="h-2 overflow-hidden rounded-sm bg-black/30">
						<div class="h-full bg-cyan-300" style="width: {(item.count / getMaxCount(items)) * 100}%"></div>
					</div>
				</div>
			{:else}
				<p class="text-sm font-bold text-slate-500">No data</p>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet CardList(items: DeckCard[], horizontal = false)}
	<div class={horizontal ? 'grid gap-3 sm:grid-cols-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}>
		{#each items as item}
			<article class={horizontal ? 'group grid min-h-32 grid-cols-[8.5rem_1fr] gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-2 transition hover:border-cyan-300/35 sm:grid-cols-[10.5rem_1fr]' : 'group min-w-0 rounded-lg border border-white/10 bg-slate-950/70 p-2 transition hover:border-cyan-300/35'}>
				<div class="relative overflow-hidden rounded-md bg-slate-950">
					{#if item.card.image_url}
						<img
							src={getCardImageUrl(item.card.image_url, 260, 'webp')}
							class={horizontal ? 'aspect-[1039/744] h-full w-full object-contain' : 'aspect-[744/1039] w-full object-contain'}
							style={!horizontal && item.card.name_en === 'Baron Pit' ? 'transform: rotate(90deg) scale(1.4);' : ''}
							alt={item.card.name_en}
							loading="lazy"
						/>
					{/if}
					<div class="absolute right-2 top-2 rounded-md bg-cyan-300 px-2 py-1 text-xs font-black text-slate-950 shadow-lg">
						x{item.quantity}
					</div>
				</div>
				<div class={horizontal ? 'min-w-0 self-center py-1 pr-1' : 'min-w-0 px-1 pb-1 pt-2'}>
					<div class="truncate text-sm font-black uppercase italic text-white">{item.card.name_en}</div>
					<div class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
						<span class="truncate">{item.card.type}</span>
						<span class="text-slate-700">/</span>
						<span class="truncate">{item.card.code}</span>
					</div>
					<div class="mt-2 flex max-h-6 flex-wrap gap-1 overflow-hidden">
						{#each item.card.domains ?? [] as domain}
							{#if getDomainIcon(domain)}
								<img src={getDomainIcon(domain) ?? ''} class="h-5 w-5 object-contain" alt={domain} title={domain} />
							{:else}
								<span class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
									{domain}
								</span>
							{/if}
						{/each}
					</div>
				</div>
			</article>
		{:else}
			<p class="col-span-full text-sm font-bold text-slate-500">No cards</p>
		{/each}
	</div>
{/snippet}
