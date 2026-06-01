<script lang="ts">
	import { browser } from '$app/environment';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import {
		buildDeckCards,
		calculateDeckStats,
		createEmptyDeck,
		getChampionCard,
		getDeckZones,
		maxMainDeckCards,
		normalizeDeckCollection,
		readDeckCollectionFromStorage,
		writeDeckCollectionToStorage,
		type StoredDeck
	} from '$lib/utils/deck';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let decks = $state<StoredDeck[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let query = $state('');
	let isOnline = $state(true);
	let copyingDeckId = $state('');
	let previewDeck = $state<StoredDeck | null>(null);
	let previewCanvas = $state<HTMLCanvasElement | null>(null);
	let isPreviewRendering = $state(false);
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
	const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

	let filteredDecks = $derived(
		decks.filter((deck) => {
			const search = query.trim().toLowerCase();
			if (!search) return true;
			const champion = getChampionCard(cards, deck.championCode);
			return [deck.name, champion?.name_en, champion?.name_th]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(search));
		})
	);

	$effect(() => {
		if (!browser) return;
		isOnline = navigator.onLine;
		void loadDecks();

		const updateOnlineStatus = () => {
			isOnline = navigator.onLine;
		};
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	});

	$effect(() => {
		if (!browser || !previewDeck || !previewCanvas) return;
		void renderPreviewCanvas(previewDeck, previewCanvas);
	});

	async function loadDecks() {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/decks?scope=public');
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Could not load decks');
			decks = Array.isArray(payload.decks) ? payload.decks : [];
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not load decks';
		} finally {
			isLoading = false;
		}
	}

	function getDeckSummary(deck: StoredDeck) {
		const deckCards = buildDeckCards(cards, deck.entries);
		const stats = calculateDeckStats(deckCards);
		const champion = getChampionCard(cards, deck.championCode);
		const legend = getDeckZones(deckCards).legends[0];
		const domains = stats.domains.filter(({ label }) => label !== 'Colorless');
		return {
			stats,
			domains,
			primaryCover: legend ?? (champion ? { card: champion, quantity: 1 } : null),
			secondaryCover: legend && champion ? { card: champion, quantity: 1 } : null
		};
	}

	function createDeckCopy(deck: StoredDeck, source: 'local' | 'online' = 'local') {
		const copiedDeck = createEmptyDeck(`${deck.name} Copy`);
		copiedDeck.championCode = deck.championCode;
		copiedDeck.entries = deck.entries;
		copiedDeck.source = source;
		copiedDeck.visibility = 'private';
		return copiedDeck;
	}

	function copyDeckLocal(deck: StoredDeck) {
		if (!browser) return;
		const copiedDeck = createDeckCopy(deck, 'local');
		const collection = readDeckCollectionFromStorage(localStorage);
		const nextCollection = normalizeDeckCollection({
			activeDeckId: copiedDeck.id,
			decks: [...collection.decks, copiedDeck]
		});

		writeDeckCollectionToStorage(localStorage, nextCollection);
		showActionNotice('Deck copied to local', 'success');
	}

	async function copyDeckOnline(deck: StoredDeck) {
		if (!browser || copyingDeckId) return;
		if (!isOnline) {
			showActionNotice('Offline mode supports local copy only', 'error');
			return;
		}

		copyingDeckId = deck.id;

		try {
			const copiedDeck = createDeckCopy(deck, 'local');
			const response = await fetch('/api/decks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deck: copiedDeck })
			});
			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(payload.error === 'login required' ? 'Login required to copy online' : payload.error || 'Could not copy deck');
			}

			const savedDeck = payload.deck as StoredDeck;
			const collection = readDeckCollectionFromStorage(localStorage);
			const nextCollection = normalizeDeckCollection({
				activeDeckId: savedDeck.id,
				decks: [...collection.decks, savedDeck]
			});
			writeDeckCollectionToStorage(localStorage, nextCollection);
			showActionNotice('Deck copied online', 'success');
		} catch (error) {
			showActionNotice(error instanceof Error ? error.message : 'Could not copy deck', 'error');
		} finally {
			copyingDeckId = '';
		}
	}

	function showActionNotice(message: string, type: 'success' | 'error' | 'info' = 'info') {
		actionNotice = { message, type };
		window.setTimeout(() => {
			if (actionNotice?.message === message) actionNotice = null;
		}, 2600);
	}

	async function renderPreviewCanvas(deck: StoredDeck, canvas: HTMLCanvasElement) {
		isPreviewRendering = true;
		const deckCards = buildDeckCards(cards, deck.entries);
		const zones = getDeckZones(deckCards);
		const champion = getChampionCard(cards, deck.championCode);
		const legendChampion = [
			...zones.legends,
			...(champion ? [{ card: champion, quantity: 1 }] : [])
		];
		const sections = [
			{ title: 'Legend + Champion', items: legendChampion },
			{ title: 'Battlefield', items: zones.battlefields },
			{ title: 'Main Deck', items: zones.main },
			{ title: 'Rune Deck', items: zones.runes },
			{ title: 'Tokens', items: zones.tokens },
			{ title: 'Other', items: zones.other }
		]
			.map((section) => ({ ...section, items: section.items.slice(0, 24) }))
			.filter((section) => section.items.length > 0);

		const width = 1200;
		const cardWidth = 104;
		const cardHeight = 145;
		const columns = 8;
		const sectionGap = 70;
		const rowGap = 180;
		const height = Math.max(
			760,
			230 +
				sections.reduce((total, section) => total + sectionGap + Math.ceil(section.items.length / columns) * rowGap, 0) +
				60
		);

		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d');
		if (!context) {
			isPreviewRendering = false;
			return;
		}

		const imageUrls = [...new Set(sections.flatMap((section) => section.items.map((item) => item.card.image_url).filter(Boolean)))];
		await Promise.all(imageUrls.map((url) => loadImage(getPreviewImageUrl(url))));

		drawPreviewBackground(context, width, height);
		drawPreviewHeader(context, deck, deckCards.length, width);

		let y = 230;
		for (const section of sections) {
			y = await drawPreviewSection(context, section.title, section.items, 40, y, cardWidth, cardHeight, columns);
		}

		isPreviewRendering = false;
	}

	function drawPreviewBackground(context: CanvasRenderingContext2D, width: number, height: number) {
		const background = context.createLinearGradient(0, 0, width, height);
		background.addColorStop(0, '#07111f');
		background.addColorStop(0.55, '#080b12');
		background.addColorStop(1, '#04070d');
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);

		context.strokeStyle = 'rgba(83,234,253,0.055)';
		context.lineWidth = 1;
		for (let x = 0; x < width; x += 64) {
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, height);
			context.stroke();
		}
		for (let y = 0; y < height; y += 64) {
			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(width, y);
			context.stroke();
		}
	}

	function drawPreviewHeader(context: CanvasRenderingContext2D, deck: StoredDeck, totalCards: number, width: number) {
		context.fillStyle = 'rgba(18,26,36,0.92)';
		roundRect(context, 40, 34, width - 80, 150, 18);
		context.fill();
		context.strokeStyle = 'rgba(83,234,253,0.22)';
		context.stroke();

		context.fillStyle = '#53EAFD';
		context.font = '900 18px Arial';
		context.fillText('RiftThai Public Deck', 72, 78);
		context.fillStyle = '#ffffff';
		context.font = '900 44px Arial';
		context.fillText(deck.name.slice(0, 34), 72, 132);
		context.fillStyle = '#9aa8b8';
		context.font = '800 16px Arial';
		context.fillText(`Updated ${new Date(deck.updatedAt).toLocaleDateString()}   /   ${totalCards} cards`, 72, 162);
	}

	async function drawPreviewSection(
		context: CanvasRenderingContext2D,
		title: string,
		items: ReturnType<typeof buildDeckCards>,
		startX: number,
		startY: number,
		cardWidth: number,
		cardHeight: number,
		columns: number
	) {
		context.fillStyle = '#53EAFD';
		context.font = '900 22px Arial';
		context.fillText(title, startX, startY + 24);
		context.fillStyle = '#9aa8b8';
		context.font = '800 14px Arial';
		context.fillText(`${items.reduce((total, item) => total + item.quantity, 0)} cards`, startX + 260, startY + 24);

		const cardStartY = startY + 48;
		for (const [index, item] of items.entries()) {
			const x = startX + (index % columns) * 142;
			const y = cardStartY + Math.floor(index / columns) * 180;
			context.fillStyle = 'rgba(18,26,36,0.86)';
			roundRect(context, x - 6, y - 6, cardWidth + 12, cardHeight + 36, 10);
			context.fill();
			context.strokeStyle = 'rgba(83,234,253,0.14)';
			context.stroke();

			if (item.card.image_url) {
				const image = await loadImage(getPreviewImageUrl(item.card.image_url));
				if (image) drawContainedImage(context, image, x, y, cardWidth, cardHeight);
			}

			context.fillStyle = '#53EAFD';
			roundRect(context, x + cardWidth - 34, y + 7, 28, 22, 6);
			context.fill();
			context.fillStyle = '#03111f';
			context.font = '900 12px Arial';
			context.fillText(`x${item.quantity}`, x + cardWidth - 29, y + 22);

			context.fillStyle = '#d6dee7';
			context.font = '800 11px Arial';
			context.fillText(item.card.name_en.slice(0, 16), x, y + cardHeight + 21);
		}

		return cardStartY + Math.ceil(items.length / columns) * 180 + 30;
	}

	function drawContainedImage(
		context: CanvasRenderingContext2D,
		image: HTMLImageElement,
		x: number,
		y: number,
		width: number,
		height: number
	) {
		const imageRatio = image.naturalWidth / image.naturalHeight;
		const boxRatio = width / height;
		const drawWidth = imageRatio > boxRatio ? width : height * imageRatio;
		const drawHeight = imageRatio > boxRatio ? width / imageRatio : height;
		const drawX = x + (width - drawWidth) / 2;
		const drawY = y + (height - drawHeight) / 2;
		context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
	}

	function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
		const safeRadius = Math.min(radius, width / 2, height / 2);
		context.beginPath();
		context.moveTo(x + safeRadius, y);
		context.lineTo(x + width - safeRadius, y);
		context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
		context.lineTo(x + width, y + height - safeRadius);
		context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
		context.lineTo(x + safeRadius, y + height);
		context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
		context.lineTo(x, y + safeRadius);
		context.quadraticCurveTo(x, y, x + safeRadius, y);
		context.closePath();
	}

	function loadImage(src: string) {
		if (imageCache.has(src)) return imageCache.get(src)!;

		const promise = new Promise<HTMLImageElement | null>((resolve) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => resolve(null);
			image.src = src;
		});
		imageCache.set(src, promise);
		return promise;
	}

	function getPreviewImageUrl(imageUrl: string) {
		return `/api/card-image?url=${encodeURIComponent(getCardImageUrl(imageUrl, 220))}`;
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
		<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
			<div class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl"></div>
			<div class="rt-rule-line relative p-5 pl-7 sm:p-7 sm:pl-9">
				<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
					<div class="min-w-0">
						<p class="rt-kicker mb-3">Public Decks</p>
						<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">Deck Browser</h1>
						<p class="rt-copy mt-3 max-w-2xl text-sm">
							ดูเด็ค public จากฐานข้อมูล แล้วคัดลอกเป็น local หรือ online deck ของตัวเองได้
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<a href="/deck" class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5 hover:text-white">
							My Decks
						</a>
					</div>
				</div>
				<div class="mt-5 max-w-xl">
					<input
						bind:value={query}
						class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
						placeholder="Search deck or champion..."
					/>
				</div>
			</div>
		</header>

		{#if errorMessage}
			<section class="rt-panel rounded-xl p-5 text-sm font-bold text-rose-100">{errorMessage}</section>
		{:else if isLoading}
			<section class="rt-panel rounded-xl p-8 text-center">
				<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
				<div class="mt-4 text-sm font-black uppercase tracking-widest text-white">Loading Decks</div>
			</section>
		{:else if filteredDecks.length === 0}
			<section class="rt-panel rounded-xl p-8 text-center">
				<h2 class="text-2xl font-black uppercase italic text-white">No Public Decks</h2>
				<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">ยังไม่มีเด็ค public หรือไม่เจอผลลัพธ์ที่ค้นหา</p>
			</section>
		{:else}
			<section class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
				{#each filteredDecks as deck}
					{@const summary = getDeckSummary(deck)}
					<article class="rt-panel group relative grid grid-cols-[8.5rem_minmax(0,1fr)] overflow-hidden rounded-xl transition hover:border-cyan-300/30 sm:grid-cols-[9.5rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)]">
						<div class="pointer-events-none absolute left-2 top-2 z-20 rounded-full border border-emerald-300/25 bg-slate-950/92 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-emerald-100 shadow-lg shadow-black/40 backdrop-blur">
							Online
						</div>
						<div class="relative flex rounded-l-xl bg-slate-950/80 p-2 sm:p-3">
							{#if summary.primaryCover}
								<div class="relative aspect-[744/1039] overflow-hidden rounded-lg border border-white/10 bg-black/20 shadow-[0_16px_28px_rgba(0,0,0,0.28)]">
									<img
										src={getCardImageUrl(summary.primaryCover.card.image_url, 260, 'webp')}
										class="h-full min-h-0 w-full object-contain transition group-hover:scale-[1.03]"
										alt={summary.primaryCover.card.name_en}
										loading="lazy"
									/>
								</div>
							{:else}
								<div class="grid aspect-[744/1039] place-items-center rounded-lg border border-dashed border-white/10 bg-black/20 text-sm font-black uppercase tracking-widest text-slate-600">
									No Cover
								</div>
							{/if}
							{#if summary.secondaryCover}
								<div class="absolute bottom-2 right-2 w-[56%] overflow-hidden rounded-md border border-cyan-300/25 bg-slate-950 shadow-2xl shadow-black/60 sm:bottom-4 sm:right-4 sm:w-[43%] sm:rounded-lg">
									<img
										src={getCardImageUrl(summary.secondaryCover.card.image_url, 180, 'webp')}
										class="aspect-[744/1039] w-full object-contain"
										alt={summary.secondaryCover.card.name_en}
										loading="lazy"
									/>
								</div>
							{/if}
						</div>
						<div class="flex min-w-0 flex-col p-3 sm:p-5">
							<div class="min-w-0">
								<h2 class="truncate text-base font-black uppercase italic text-white sm:text-xl">{deck.name}</h2>
								<p class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
									Updated {new Date(deck.updatedAt).toLocaleDateString()}
								</p>
							</div>
							<div class="mt-3 flex min-h-8 flex-wrap gap-1.5 sm:mt-4 sm:min-h-9 sm:gap-2">
								{#each summary.domains as domain}
									<div class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
										{#if getDomainIcon(domain.label)}
											<img src={getDomainIcon(domain.label) ?? ''} class="h-5 w-5 object-contain" alt={domain.label} />
										{/if}
										<span class="text-[10px] font-black text-cyan-100">{domain.count}</span>
									</div>
								{/each}
							</div>
							<div class="mt-3 grid grid-cols-2 gap-1.5 text-center sm:mt-4 sm:grid-cols-4 sm:gap-2">
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{summary.stats.mainTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Main/{maxMainDeckCards}</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{summary.stats.runeTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Rune</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{summary.stats.battlefieldTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Field</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{summary.stats.total}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Total</div>
								</div>
							</div>
							<div class="mt-auto grid grid-cols-3 gap-2 pt-4">
								<button
									type="button"
									class="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-3 text-[11px] font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-300/14 hover:text-white"
									onclick={() => (previewDeck = deck)}
								>
									Preview
								</button>
								<button
									type="button"
									class="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/10 hover:text-white"
									onclick={() => copyDeckLocal(deck)}
								>
									Copy Local
								</button>
								<button
									type="button"
									class="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 text-[11px] font-black uppercase tracking-widest text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-45"
									disabled={!isOnline || copyingDeckId === deck.id}
									title={isOnline ? 'Copy to your online decks' : 'Offline mode supports local copy only'}
									onclick={() => copyDeckOnline(deck)}
								>
									{copyingDeckId === deck.id ? 'Copying...' : 'Copy Online'}
								</button>
							</div>
						</div>
					</article>
				{/each}
			</section>
		{/if}
	</main>

	{#if previewDeck}
		<div class="fixed inset-0 z-[940] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
			<div class="rt-panel mx-auto flex max-h-[calc(100dvh-2rem)] max-w-6xl flex-col rounded-xl p-4 shadow-2xl shadow-black/50 sm:p-5">
				<div class="mb-4 flex items-start justify-between gap-4">
					<div class="min-w-0">
						<div class="rt-kicker mb-2">Deck Preview</div>
						<h2 class="truncate text-2xl font-black uppercase italic text-white">{previewDeck.name}</h2>
					</div>
					<button
						type="button"
						class="rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/10 hover:text-white"
						onclick={() => (previewDeck = null)}
					>
						Close
					</button>
				</div>

				<div class="relative grid min-h-0 flex-1 place-items-center overflow-auto rounded-xl border border-white/10 bg-black/30 p-2">
					{#if isPreviewRendering}
						<div class="absolute inset-0 z-10 grid place-items-center bg-black/45 backdrop-blur-sm">
							<div class="rounded-lg border border-cyan-300/20 bg-slate-950/90 px-4 py-3 text-xs font-black uppercase tracking-widest text-cyan-100">
								Rendering Preview
							</div>
						</div>
					{/if}
					<canvas
						bind:this={previewCanvas}
						class="block h-auto max-h-[calc(100dvh-11rem)] w-auto max-w-full rounded-lg bg-slate-950 shadow-2xl shadow-black/50"
						aria-label="Deck preview canvas"
					></canvas>
				</div>
			</div>
		</div>
	{/if}

	{#if actionNotice}
		<div
			class="rt-toast fixed right-4 top-20 z-[970] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border bg-slate-950/95 text-slate-100 shadow-2xl shadow-black/55 backdrop-blur-xl sm:right-6 {actionNotice.type === 'success' ? 'border-emerald-300/30 shadow-emerald-950/20' : actionNotice.type === 'error' ? 'border-rose-300/30 shadow-rose-950/25' : 'border-cyan-300/30 shadow-cyan-950/20'}"
			role="status"
			aria-live="polite"
		>
			<div class="h-1 {actionNotice.type === 'success' ? 'bg-emerald-300' : actionNotice.type === 'error' ? 'bg-rose-300' : 'bg-cyan-300'}"></div>
			<div class="rt-toast-progress {actionNotice.type === 'success' ? 'bg-emerald-300/80' : actionNotice.type === 'error' ? 'bg-rose-300/80' : 'bg-cyan-300/80'}"></div>
			<div class="flex items-start gap-3 p-4">
				<div class="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border {actionNotice.type === 'success' ? 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100' : actionNotice.type === 'error' ? 'border-rose-300/25 bg-rose-300/12 text-rose-100' : 'border-cyan-300/25 bg-cyan-300/12 text-cyan-100'}">
					<span class="h-2.5 w-2.5 rounded-full {actionNotice.type === 'success' ? 'bg-emerald-300' : actionNotice.type === 'error' ? 'bg-rose-300' : 'bg-cyan-300'}"></span>
				</div>
				<div class="min-w-0">
					<div class="text-[0.65rem] font-black uppercase tracking-[0.22em] {actionNotice.type === 'success' ? 'text-emerald-200' : actionNotice.type === 'error' ? 'text-rose-200' : 'text-cyan-200'}">
						{actionNotice.type === 'success' ? 'Success' : actionNotice.type === 'error' ? 'Error' : 'Notice'}
					</div>
					<div class="mt-1 text-sm font-black leading-snug text-white">{actionNotice.message}</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.rt-toast {
		animation: rt-toast-enter 220ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
	}

	.rt-toast-progress {
		height: 2px;
		transform-origin: left;
		animation: rt-toast-progress 2600ms linear forwards;
	}

	@keyframes rt-toast-enter {
		from {
			opacity: 0;
			transform: translate3d(18px, -10px, 0) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0) scale(1);
		}
	}

	@keyframes rt-toast-progress {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
</style>
