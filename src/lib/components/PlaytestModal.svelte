<script lang="ts">
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { buildDeckCards, getDeckZones } from '$lib/utils/deck';

	let { deck, cards, isOpen, onClose } = $props<{
		deck: any;
		cards: Card[];
		isOpen: boolean;
		onClose: () => void;
	}>();

	let library = $state<Card[]>([]);
	let hand = $state<Card[]>([]);
	let selectedIndices = $state<number[]>([]);
	let hasMulliganed = $state(false);

	$effect(() => {
		if (isOpen && deck) {
			untrack(() => {
				resetSimulator();
			});
		}
	});

	function shuffle(array: Card[]) {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function resetSimulator() {
		if (!deck) return;

		const deckCards = buildDeckCards(cards, deck.entries ?? []);
		const zones = getDeckZones(deckCards);

		const mainCards: Card[] = [];
		for (const { card, quantity } of zones.main) {
			for (let i = 0; i < quantity; i++) {
				mainCards.push(card);
			}
		}

		library = shuffle(mainCards);
		hand = [];
		selectedIndices = [];
		hasMulliganed = false;

		// Draw initial 4 cards
		for (let i = 0; i < 4; i++) {
			if (library.length > 0) {
				hand.push(library.pop()!);
			}
		}
	}

	function toggleSelect(index: number) {
		if (hasMulliganed) return;

		if (selectedIndices.includes(index)) {
			selectedIndices = selectedIndices.filter((i) => i !== index);
		} else {
			if (selectedIndices.length < 2) {
				selectedIndices = [...selectedIndices, index];
			}
		}
	}

	function executeMulligan() {
		if (hasMulliganed || selectedIndices.length === 0 || selectedIndices.length > 2) return;

		const kept: Card[] = [];
		const replaced: Card[] = [];

		hand.forEach((card, idx) => {
			if (selectedIndices.includes(idx)) {
				replaced.push(card);
			} else {
				kept.push(card);
			}
		});

		const replacements: Card[] = [];
		for (let i = 0; i < replaced.length; i++) {
			if (library.length > 0) {
				replacements.push(library.pop()!);
			}
		}

		library = shuffle([...library, ...replaced]);
		hand = [...kept, ...replacements];
		selectedIndices = [];
		hasMulliganed = true;
	}

	function skipMulligan() {
		selectedIndices = [];
		hasMulliganed = true;
	}

	function drawCard() {
		if (library.length > 0) {
			hand = [...hand, library.pop()!];
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[950] overflow-y-auto bg-black/82 p-4 backdrop-blur-md">
		<div class="mesh-gradient opacity-30"></div>
		<div class="mx-auto my-8 max-w-5xl">
			<div class="rt-panel rt-topline relative rounded-xl border border-white/10 bg-[#0a0e15]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
				<!-- Header -->
				<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div class="rt-kicker">Simulator</div>
						<h2 class="text-2xl font-black text-white uppercase italic">
							Playtest & Hand Draw
						</h2>
						<p class="rt-copy text-xs mt-1">
							การ์ดเหลือในเด็ค: <span class="font-bold text-cyan-300">{library.length} ใบ</span> · 
							การ์ดบนมือ: <span class="font-bold text-slate-100">{hand.length} ใบ</span>
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						{#if !hasMulliganed}
							<button
								type="button"
								class="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-400/10 px-4 text-xs font-black tracking-widest text-amber-200 uppercase transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={selectedIndices.length === 0}
								onclick={executeMulligan}
							>
								Mulligan ({selectedIndices.length}/2)
							</button>
							<button
								type="button"
								class="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5"
								onclick={skipMulligan}
							>
								Keep Hand (เล่นมือนี้)
							</button>
						{:else}
							<button
								type="button"
								class="rt-action min-h-10 text-xs disabled:cursor-not-allowed disabled:opacity-50"
								disabled={library.length === 0}
								onclick={drawCard}
							>
								Draw Card (จั่วการ์ด)
							</button>
						{/if}

						<button
							type="button"
							class="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5"
							onclick={resetSimulator}
						>
							Restart (เริ่มใหม่)
						</button>

						<button
							type="button"
							class="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-slate-950 px-4 text-xs font-black tracking-widest text-slate-200 uppercase hover:bg-white/5"
							onclick={onClose}
						>
							Close
						</button>
					</div>
				</div>

				<!-- Instructions -->
				{#if !hasMulliganed}
					<div class="mb-5 rounded-lg border border-amber-300/20 bg-amber-400/5 p-3 text-xs text-amber-200">
						💡 <strong>กติกามัลลิแกน (Mulligan):</strong> จั่ว 4 ใบแรก เลือกการ์ดบนมือไม่เกิน 2 ใบเพื่อเปลี่ยนคืนเด็คแล้วสับจั่วชดเชยใหม่ (คลิกที่การ์ดเพื่อเลือก)
					</div>
				{/if}

				<!-- Hand Area -->
				<div class="min-h-[290px] rounded-xl border border-white/5 bg-slate-950/30 p-4 sm:p-6">
					{#if hand.length === 0}
						<div class="grid min-h-[260px] place-items-center text-slate-500">
							<p class="text-sm font-bold">ไม่มีการ์ดบนมือ</p>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
							{#each hand as card, idx}
								{@const isSelected = selectedIndices.includes(idx)}
								<button
									type="button"
									class="group relative flex flex-col items-center text-left focus:outline-none"
									onclick={() => toggleSelect(idx)}
									disabled={hasMulliganed}
								>
									<!-- Card Container -->
									<div class="relative w-full overflow-hidden rounded-lg border transition duration-200 group-hover:scale-[1.03] {isSelected ? 'border-amber-400 shadow-lg shadow-amber-950/40' : 'border-white/10 bg-slate-950'}">
										<!-- Card Image -->
										{#if card.image_url}
											<img
												src={getCardImageUrl(card.image_url, 260, 'webp')}
												alt={card.name_en}
												class="block h-auto w-full transition duration-300 {isSelected ? 'brightness-[0.4]' : ''}"
											/>
										{:else}
											<div class="flex aspect-[132/184] w-full flex-col items-center justify-center p-3 text-center border-2 border-dashed border-white/5 bg-slate-900">
												<span class="text-xs font-bold text-slate-400">{card.name_en}</span>
											</div>
										{/if}

										<!-- Mulligan Selection Overlay -->
										{#if isSelected}
											<div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 bg-amber-950/20 text-center">
												<div class="rounded-full bg-amber-400 p-1.5 text-slate-950">
													<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
													</svg>
												</div>
												<span class="text-[10px] font-black uppercase tracking-wider text-amber-200 bg-black/80 px-2 py-0.5 rounded">เปลี่ยน (Replace)</span>
											</div>
										{/if}

										<!-- Action Hint on Hover -->
										{#if !hasMulliganed}
											<div class="absolute inset-x-0 bottom-0 translate-y-full bg-black/80 py-1.5 text-center text-[9px] font-black tracking-widest text-white uppercase transition-transform duration-200 group-hover:translate-y-0 group-focus:translate-y-0">
												{isSelected ? 'Deselect' : 'Mulligan'}
											</div>
										{/if}
									</div>

									<!-- Card Details -->
									<div class="mt-2 w-full text-center px-1">
										<p class="truncate text-xs font-black text-slate-300 group-hover:text-white transition">
											{card.name_en}
										</p>
										{#if card.name_th}
											<p class="truncate text-[10px] font-medium text-slate-500 mt-0.5">
												{card.name_th}
											</p>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
