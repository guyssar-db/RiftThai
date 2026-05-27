<script lang="ts">
	import { getRarityIcon } from '$lib/data/rarityIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageSources, getCardImageUrl } from '$lib/utils/cardImages';

	let {
		cards,
		isLoading = false,
		openPopup
	} = $props<{
		cards: Card[];
		isLoading?: boolean;
		openPopup: (card: Card) => void;
	}>();

	const preloadedPopupImages = new Set<string>();

	function preloadPopupImage(card: Card) {
		if (!card.image_url || preloadedPopupImages.has(card.image_url)) return;

		preloadedPopupImages.add(card.image_url);
		const image = new Image();
		image.decoding = 'async';
		image.src = getCardImageUrl(card.image_url, 480, 'webp');
	}

	function handleOpenPopup(card: Card) {
		preloadPopupImage(card);
		openPopup(card);
	}
</script>

{#if isLoading}
	<div class="card-grid">
		{#each Array(12) as _}
			<div class="flex flex-col gap-4 animate-pulse">
				<div class="aspect-[744/1039] rounded-xl border border-white/10 bg-white/5"></div>
				<div class="space-y-3 px-1">
					<div class="h-4 w-3/4 rounded-lg bg-white/5"></div>
					<div class="h-3 w-1/2 rounded-lg bg-white/5"></div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="card-grid">
		{#each cards as card}
			<button
				type="button"
				class="group min-w-0 rounded-xl text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25"
				onpointerenter={() => preloadPopupImage(card)}
				onfocus={() => preloadPopupImage(card)}
				onclick={() => handleOpenPopup(card)}
			>
				<div class="relative flex aspect-[744/1039] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-[0_16px_36px_rgba(0,0,0,0.42)] transition duration-300 group-hover:border-cyan-300/50 group-hover:shadow-[0_0_36px_rgba(45,212,191,0.13)] group-active:scale-[0.98]">
					{#if card.image_url}
						{@const imageSources = getCardImageSources(card.image_url, [240, 320, 480, 744])}
						<img
							src={imageSources.fallback}
							srcset={imageSources.fallbackSrcset}
							sizes="(min-width: 1440px) 210px, (min-width: 1180px) 18vw, (min-width: 900px) 23vw, (min-width: 640px) 30vw, 46vw"
							alt={card.name_en}
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover transition duration-500 group-hover:scale-105 {card.type?.includes('Battlefield') ? 'battlefield-rotated' : ''}"
						/>
					{:else}
						<div class="px-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
							No Image
						</div>
					{/if}

					<div class="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-slate-950/92 to-transparent p-4 opacity-0 transition group-hover:opacity-100 sm:block">
						<div class="rounded-lg bg-cyan-300 py-2 text-center text-xs font-black uppercase tracking-widest text-slate-950">
							View Details
						</div>
					</div>

					<div class="absolute right-3 top-3 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[9px] font-black tracking-widest text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
						{card.code}
					</div>

					{#if getRarityIcon(card.rarity)}
						<div class="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-slate-950/80 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
							<img src={getRarityIcon(card.rarity) ?? ''} class="h-5 w-5 object-contain" alt="{card.rarity} rarity" />
						</div>
					{/if}
				</div>

				<div class="mt-3 min-w-0 px-1 sm:mt-4">
					<h3 class="truncate text-xs font-black uppercase italic tracking-tight text-white transition group-hover:text-cyan-300 sm:text-sm">
						{card.name_en}
					</h3>
					<div class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-xs">
						{#each getTypeIcons(card.type) as typeIcon}
							<img src="/images/icons/{typeIcon.src}" class="h-4 w-4 shrink-0 object-contain opacity-80" alt="{typeIcon.label} type" />
						{/each}
						<span class="truncate">{card.type}</span>
					</div>
				</div>
			</button>
		{/each}
	</div>
{/if}
