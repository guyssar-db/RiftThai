<script lang="ts">
	import { getRarityIcon } from '$lib/data/rarityIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageSources, getCardImageUrl } from '$lib/utils/cardImages';
	import { usesLandscapeCardFrame } from '$lib/utils/cardPresentation';

	let {
		cards,
		isLoading = false,
		openPopup,
		userCollection = null
	} = $props<{
		cards: Card[];
		isLoading?: boolean;
		openPopup: (card: Card) => void;
		userCollection?: Record<string, number> | null;
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
			<div class="flex animate-pulse flex-col gap-4">
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
		{#each cards as card, index (card.code)}
			<button
				type="button"
				class="rt-glow-card group min-w-0 rounded-xl text-left transition duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/20"
				onpointerenter={() => preloadPopupImage(card)}
				onfocus={() => preloadPopupImage(card)}
				onclick={() => handleOpenPopup(card)}
				aria-label="ดูรายละเอียด {card.name_en}"
			>
				<div
					class="relative flex aspect-[744/1039] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition duration-200 group-hover:border-cyan-300/35 group-active:scale-[0.985]"
				>
					{#if card.image_url}
						{@const imageSources = getCardImageSources(card.image_url, [240, 320, 480, 744])}
						<img
							src={imageSources.fallback}
							srcset={imageSources.fallbackSrcset}
							sizes="(min-width: 1440px) 210px, (min-width: 1180px) 18vw, (min-width: 900px) 23vw, (min-width: 640px) 30vw, 46vw"
							alt={card.name_en}
							loading={index < 6 ? 'eager' : 'lazy'}
							decoding="async"
							fetchpriority={index < 2 ? 'high' : 'auto'}
							class="h-full w-full object-cover transition duration-500 {usesLandscapeCardFrame(
								card
							)
								? 'battlefield-rotated'
								: 'group-hover:scale-105'}"
						/>
					{:else}
						<div
							class="px-3 text-center text-[10px] font-black tracking-widest text-slate-600 uppercase"
						>
							No Image
						</div>
					{/if}

					<div
						class="absolute top-2.5 right-2.5 rounded-lg border border-white/10 bg-slate-950/82 px-2 py-1 text-[9px] font-bold tracking-wider text-slate-200 backdrop-blur transition group-hover:border-cyan-300/25 group-hover:text-cyan-100"
					>
						{card.code}
					</div>

					{#if userCollection}
						{@const ownedNormal = userCollection[card.code] ?? 0}
						{@const ownedFoil = userCollection[card.code + '_foil'] ?? 0}
						{@const owned = ownedNormal + ownedFoil}
						<div
							class="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[9.5px] font-black tracking-wider uppercase shadow-md backdrop-blur
							{owned > 0
								? 'border-cyan-400/45 bg-slate-950/92 text-white shadow-[0_0_8px_rgba(34,211,238,0.2)]'
								: 'border-white/5 bg-slate-950/90 text-slate-500'}"
							title="มีแบบปกติ {ownedNormal} ใบ, ฟอยล์ {ownedFoil} ใบ"
						>
							<span class={ownedNormal > 0 ? 'text-cyan-300' : ''}>Non-F: {ownedNormal}</span>
							<span class="text-white/20">|</span>
							<span class={ownedFoil > 0 ? 'font-extrabold text-pink-400' : ''}>F: {ownedFoil}</span
							>
						</div>
					{/if}

					{#if getRarityIcon(card.rarity)}
						<div
							class="absolute top-2.5 left-2.5 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-950/82 shadow-lg backdrop-blur"
						>
							<img
								src={getRarityIcon(card.rarity) ?? ''}
								class="h-5 w-5 object-contain"
								alt="{card.rarity} rarity"
							/>
						</div>
					{/if}
				</div>

				<div class="mt-3 min-w-0 px-0.5">
					<h3
						class="truncate text-sm font-bold tracking-tight text-slate-100 transition group-hover:text-cyan-200 sm:text-[15px]"
					>
						{card.name_en}
					</h3>
					{#if card.name_th && card.name_th !== card.name_en}
						<p class="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">{card.name_th}</p>
					{/if}
					<div
						class="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-500 sm:text-[11px]"
					>
						{#each getTypeIcons(card.type) as typeIcon}
							<img
								src="/images/icons/{typeIcon.src}"
								class="h-3.5 w-3.5 shrink-0 object-contain opacity-70"
								alt="{typeIcon.label} type"
							/>
						{/each}
						<span class="truncate">{card.type}</span>
					</div>
				</div>
			</button>
		{/each}
	</div>
{/if}
