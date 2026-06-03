<script lang="ts">
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import {
		buildDeckCards,
		calculateDeckStats,
		getChampionCard,
		getDeckZones,
		type StoredDeck
	} from '$lib/utils/deck';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let decks = $derived((data.decks as StoredDeck[]) || []);
	let profile = $derived(
		data.profile as {
			id: string;
			displayName: string;
			profileHandle: string;
			profileSlug: string;
			createdAt: string;
		}
	);

	function getDeckSummary(deck: StoredDeck) {
		const deckCards = buildDeckCards(cards, deck.entries);
		const sideboardCards = buildDeckCards(cards, deck.sideboardEntries ?? []);
		const stats = calculateDeckStats(deckCards, sideboardCards);
		const champion = getChampionCard(cards, deck.championCode);
		const legend = getDeckZones(deckCards).legends[0];
		return {
			stats,
			domains: stats.domains.filter(({ label }) => label !== 'Colorless'),
			cover: legend?.card ?? champion
		};
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>
	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a href="/" class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic">
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
			<div class="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl"></div>
			<div class="rt-rule-line relative p-5 pl-7 sm:p-7 sm:pl-9 lg:p-8 lg:pl-10">
				<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
					<div class="min-w-0 flex-1">
						<p class="rt-kicker mb-2">Player Profile</p>
						<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">{profile.displayName}</h1>
						<div class="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
							<span class="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-1.5 font-mono text-slate-300">
								@{profile.profileHandle}
							</span>
							<span class="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-cyan-300/5 px-3 py-1.5 text-cyan-200">
								<svg class="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
								Joined {new Date(profile.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
							</span>
							<span class="flex items-center gap-2 rounded-lg border border-orange-400/10 bg-orange-400/5 px-3 py-1.5 text-orange-200">
								<svg class="h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
								</svg>
								{decks.length} Public Decks
							</span>
						</div>
					</div>
					{#if data.isOwnProfile}
						<a href="/setting" class="rt-action self-start sm:self-center">
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="3"></circle>
								<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
							</svg>
							Settings
						</a>
					{/if}
				</div>
			</div>
		</header>

		{#if decks.length === 0}
			<section class="rt-panel rounded-xl p-8 text-center text-sm font-bold text-slate-400">
				No public decks yet.
			</section>
		{:else}
			<section class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
				{#each decks as deck}
					{@const summary = getDeckSummary(deck)}
					<a
						href="/deck/{deck.id}"
						class="rt-panel group grid grid-cols-[7.5rem_minmax(0,1fr)] rounded-xl p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/5 focus:outline-none focus:border-cyan-300/60 focus:ring-1 focus:ring-cyan-300/20"
					>
						<div class="overflow-hidden rounded-lg border border-white/10 bg-black/20">
							{#if summary.cover?.image_url}
								<img
									src={getCardImageUrl(summary.cover.image_url, 220, 'webp')}
									alt={summary.cover.name_en}
									class="aspect-[744/1039] w-full object-contain transition group-hover:scale-[1.03]"
									loading="lazy"
								/>
							{:else}
								<div class="flex aspect-[744/1039] w-full items-center justify-center bg-slate-900/60 text-slate-600">
									<svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
									</svg>
								</div>
							{/if}
						</div>
						<div class="flex flex-col justify-between min-w-0 p-2 pl-3">
							<div class="min-w-0">
								<h2 class="truncate text-lg font-black text-white uppercase italic group-hover:text-cyan-300 transition">
									{deck.name}
								</h2>
								<p class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
									{summary.stats.total} cards
								</p>
								<div class="mt-3 flex flex-wrap gap-1.5">
									{#each summary.domains as domain}
										<span class="inline-flex items-center gap-1 rounded-md border border-white/5 bg-black/40 px-2 py-0.5 text-[10px] font-black text-cyan-100">
											{#if getDomainIcon(domain.label)}
												<img src={getDomainIcon(domain.label) ?? ''} alt={domain.label} class="h-3.5 w-3.5" />
											{/if}
											{domain.count}
										</span>
									{/each}
								</div>
							</div>
							<div class="mt-4 flex items-center justify-between">
								<span class="text-[9px] font-black tracking-widest text-slate-600 uppercase">
									{new Date(deck.updatedAt).toLocaleDateString('th-TH')}
								</span>
								<span class="text-[10px] font-black uppercase tracking-widest text-cyan-300 group-hover:text-cyan-100 transition flex items-center gap-1">
									View 
									<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M5 12h14M12 5l7 7-7 7" />
									</svg>
								</span>
							</div>
						</div>
					</a>
				{/each}
			</section>
		{/if}
	</main>
</div>
