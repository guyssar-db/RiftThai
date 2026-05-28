<script lang="ts">
	import { browser } from '$app/environment';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import {
		addStoredDeck,
		buildDeckCards,
		calculateDeckStats,
		getChampionCard,
		getDeckZones,
		maxBattlefieldCopiesPerName,
		maxMainDeckCards,
		maxMainCopiesPerName,
		maxRuneCards,
		normalizeDeckCollection,
		readDeckCollectionFromStorage,
		setActiveStoredDeck,
		writeDeckCollectionToStorage,
		type DeckCollection,
		type DeckCard,
		type StoredDeck
	} from '$lib/utils/deck';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let collection = $state<DeckCollection>(normalizeDeckCollection(null));
	let selectedDeckId = $state('');
	let isExporting = $state(false);
	let isDeckLoading = $state(true);
	let exportMode = $state<'preview' | 'download' | ''>('');
	let exportError = $state('');
	let previewUrl = $state('');

	let selectedDeck = $derived(collection.decks.find((deck) => deck.id === selectedDeckId) ?? null);
	let championCard = $derived(getChampionCard(cards, selectedDeck?.championCode));
	let deckCards = $derived(buildDeckCards(cards, selectedDeck?.entries ?? []));
	let stats = $derived(calculateDeckStats(deckCards));
	let zones = $derived(getDeckZones(deckCards));
	let hasDeck = $derived(deckCards.length > 0);

	$effect(() => {
		if (!browser) return;
		const nextCollection = readDeckCollectionFromStorage(localStorage);
		collection = nextCollection;
		isDeckLoading = false;
	});

	function openDeck(deckId: string) {
		selectedDeckId = deckId;
		previewUrl = '';
		exportError = '';
	}

	function editDeck(deckId: string) {
		if (!browser) return;
		const nextCollection = setActiveStoredDeck(collection, deckId);
		writeDeckCollectionToStorage(localStorage, nextCollection);
		window.location.href = '/deck/edit';
	}

	function createNewDeck() {
		if (!browser) return;
		const nextCollection = addStoredDeck(collection, `Deck ${collection.decks.length + 1}`);
		writeDeckCollectionToStorage(localStorage, nextCollection);
		collection = nextCollection;
		window.location.href = '/deck/edit';
	}

	function closeDeck() {
		selectedDeckId = '';
		previewUrl = '';
		exportError = '';
	}

	async function downloadPng() {
		if (!browser || isExporting || !selectedDeck || deckCards.length === 0) return;

		isExporting = true;
		exportMode = 'download';
		exportError = '';

		try {
			const canvas = await buildExportCanvas();
			const link = document.createElement('a');
			link.download = `riftthai-${slugify(selectedDeck.name)}-${new Date().toISOString().slice(0, 10)}.png`;
			link.href = canvas.toDataURL('image/png');
			link.click();
		} catch (error) {
			exportError = error instanceof Error ? error.message : 'ไม่สามารถ export PNG ได้';
		} finally {
			isExporting = false;
			exportMode = '';
		}
	}

	async function previewPng() {
		if (!browser || isExporting || !selectedDeck || deckCards.length === 0) return;

		isExporting = true;
		exportMode = 'preview';
		exportError = '';

		try {
			const canvas = await buildExportCanvas();
			previewUrl = canvas.toDataURL('image/png');
		} catch (error) {
			exportError = error instanceof Error ? error.message : 'ไม่สามารถ preview PNG ได้';
		} finally {
			isExporting = false;
			exportMode = '';
		}
	}

	async function buildExportCanvas() {
		const canvas = document.createElement('canvas');
		const width = 1600;
		const cardWidth = 132;
		const cardHeight = 184;
		const columns = 8;
		const topCardColumns = 4;
		const legendChampionCards = getLegendChampionCards();
		const topSectionRows = Math.max(
			getSectionRows(legendChampionCards, 2),
			getSectionRows(zones.battlefields, topCardColumns)
		);
		const sectionRows =
			getSectionRows(zones.main, columns) +
			getSectionRows(zones.runes, columns) +
			getSectionRows(zones.tokens, columns) +
			getSectionRows(zones.other, columns);
		const remainingSectionCount = [zones.main, zones.runes, zones.tokens, zones.other].filter(
			(section) => section.length > 0
		).length;
		const sectionHeaderAndGap = 112;
		const bottomPadding = 96;
		const height = Math.max(
			1220,
			480 +
				sectionHeaderAndGap +
				topSectionRows * 226 +
				remainingSectionCount * sectionHeaderAndGap +
				sectionRows * 226 +
				bottomPadding
		);
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas is not available');

		drawExportBackground(context, width, height);
		drawExportHeader(context, width);
		drawExportStats(context, stats.costs, 48, 210, 460, 230, 'Cost Curve');
		await drawExportIconStats(context, stats.types, 548, 210, 460, 230, 'Card Types', getTypeIconUrl, true);
		await drawExportIconStats(context, stats.domains, 1048, 210, 460, 230, 'Main Domains', getDomainIconUrl, false);

		const topSectionY = 480;
		const legendEndY = await drawExportSection(context, 'Legend + Champion', legendChampionCards, 48, topSectionY, cardWidth, cardHeight, 2, 520);
		const battlefieldEndY = await drawExportSection(context, 'Battlefield', zones.battlefields, 600, topSectionY, cardWidth, cardHeight, topCardColumns, 908);
		let sectionY = Math.max(legendEndY, battlefieldEndY);
		sectionY = await drawExportSection(context, 'Main Deck', zones.main, 48, sectionY, cardWidth, cardHeight, columns);
		sectionY = await drawExportSection(context, 'Rune Deck', zones.runes, 48, sectionY, cardWidth, cardHeight, columns);
		sectionY = await drawExportSection(context, 'Tokens', zones.tokens, 48, sectionY, cardWidth, cardHeight, columns);
		await drawExportSection(context, 'Other', zones.other, 48, sectionY, cardWidth, cardHeight, columns);

		return canvas;
	}

	function drawExportBackground(context: CanvasRenderingContext2D, width: number, height: number) {
		const background = context.createLinearGradient(0, 0, width, height);
		background.addColorStop(0, '#07111f');
		background.addColorStop(0.48, '#080b12');
		background.addColorStop(1, '#04070d');
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);

		const glow = context.createRadialGradient(260, 90, 10, 260, 90, 620);
		glow.addColorStop(0, 'rgba(83,234,253,0.18)');
		glow.addColorStop(0.45, 'rgba(83,234,253,0.055)');
		glow.addColorStop(1, 'rgba(83,234,253,0)');
		context.fillStyle = glow;
		context.fillRect(0, 0, width, height);

		context.strokeStyle = 'rgba(83,234,253,0.055)';
		context.lineWidth = 1;

		for (let x = 0; x < width; x += 72) {
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, height);
			context.stroke();
		}

		for (let y = 0; y < height; y += 72) {
			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(width, y);
			context.stroke();
		}

		context.strokeStyle = 'rgba(83,234,253,0.08)';
		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(48, 184);
		context.lineTo(width - 48, 184);
		context.stroke();
	}

	function drawExportHeader(context: CanvasRenderingContext2D, width: number) {
		fillRoundRect(context, 48, 42, width - 96, 126, 18, 'rgba(18,26,36,0.92)');
		strokeRoundRect(context, 48, 42, width - 96, 126, 18, 'rgba(83,234,253,0.22)', 1.5);
		const accent = context.createLinearGradient(48, 42, width - 48, 42);
		accent.addColorStop(0, '#53EAFD');
		accent.addColorStop(0.55, 'rgba(83,234,253,0.45)');
		accent.addColorStop(1, 'rgba(83,234,253,0)');
		context.fillStyle = accent;
		context.fillRect(66, 42, width - 132, 4);

		fillRoundRect(context, 78, 70, 118, 28, 8, 'rgba(83,234,253,0.10)');
		context.fillStyle = '#ffffff';
		context.font = '900 14px Arial';
		context.fillText('RiftThai', 96, 90);
		context.fillStyle = '#ffffff';
		context.font = '900 52px Arial';
		context.fillText((selectedDeck?.name || 'RiftThai Deck').slice(0, 34), 78, 134);

		const metrics = [
			['Legend', `${stats.legendTotal}/1`],
			['Champion', `${championCard ? 1 : 0}/1`],
			['Field', String(stats.battlefieldTotal)],
			['Main', `${stats.mainTotal}/${maxMainDeckCards}`],
			['Rune', `${stats.runeTotal}/${maxRuneCards}`],
			['Token', String(stats.tokenTotal)]
		];

		metrics.forEach(([label, value], index) => {
			const chipX = width - 652 + index * 98;
			fillRoundRect(context, chipX, 76, 84, 58, 10, 'rgba(5,10,18,0.72)');
			strokeRoundRect(context, chipX, 76, 84, 58, 10, 'rgba(83,234,253,0.16)', 1);
			context.fillStyle = '#53EAFD';
			context.font = '900 19px Arial';
			context.fillText(value, chipX + 12, 103);
			context.fillStyle = '#8fa0b3';
			context.font = '800 9px Arial';
			context.fillText(label.toUpperCase(), chipX + 12, 123);
		});
	}

	function drawExportStats(
		context: CanvasRenderingContext2D,
		items: { label: string; count: number }[],
		x: number,
		y: number,
		width: number,
		height: number,
		title: string
	) {
		drawPanel(context, x, y, width, height);
		context.fillStyle = '#53EAFD';
		context.font = '900 20px Arial';
		context.fillText(title, x + 20, y + 36);

		const max = Math.max(1, ...items.map((item) => item.count));
		const barY = y + 62;
		const barHeight = 20;

		items.slice(0, 7).forEach((item, index) => {
			const top = barY + index * 23;
			context.fillStyle = '#d6dee7';
			context.font = '700 14px Arial';
			context.fillText(item.label.slice(0, 18), x + 20, top + 15);
			fillRoundRect(context, x + 150, top, width - 210, barHeight, 5, 'rgba(83,234,253,0.13)');
			fillRoundRect(context, x + 150, top, ((width - 210) * item.count) / max, barHeight, 5, '#53EAFD');
			context.fillStyle = '#ffffff';
			context.font = '900 14px Arial';
			context.fillText(String(item.count), x + width - 42, top + 15);
		});
	}

	async function drawExportIconStats(
		context: CanvasRenderingContext2D,
		items: { label: string; count: number }[],
		x: number,
		y: number,
		width: number,
		height: number,
		title: string,
		getIconUrl: (label: string) => string | null,
		showLabel: boolean
	) {
		drawPanel(context, x, y, width, height);
		context.fillStyle = '#53EAFD';
		context.font = '900 20px Arial';
		context.fillText(title, x + 20, y + 36);

		const max = Math.max(1, ...items.map((item) => item.count));
		const startY = y + 62;
		const rowHeight = 23;

		for (const [index, item] of items.slice(0, 7).entries()) {
			const top = startY + index * rowHeight;
			const iconUrl = getIconUrl(item.label);
			if (iconUrl) {
				const icon = await loadImage(iconUrl);
				if (icon) context.drawImage(icon, x + 20, top - 1, 20, 20);
			}

			context.fillStyle = '#d6dee7';
			context.font = '700 14px Arial';
			if (showLabel) context.fillText(item.label.slice(0, 14), x + 48, top + 15);

			const barX = showLabel ? x + 150 : x + 58;
			const barWidth = showLabel ? width - 210 : width - 118;
			fillRoundRect(context, barX, top, barWidth, 20, 5, 'rgba(83,234,253,0.13)');
			fillRoundRect(context, barX, top, (barWidth * item.count) / max, 20, 5, '#53EAFD');
			context.fillStyle = '#ffffff';
			context.font = '900 14px Arial';
			context.fillText(String(item.count), x + width - 42, top + 15);
		}
	}

	function drawExportRuleSummary(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number
	) {
		context.fillStyle = 'rgba(18,26,36,0.88)';
		context.fillRect(x, y, width, height);
		context.fillStyle = '#53EAFD';
		context.font = '900 20px Arial';
		context.fillText('Deck Structure', x + 20, y + 34);

		context.fillStyle = '#d6dee7';
		context.font = '700 18px Arial';
		context.fillText(
			`Legend + Champion: 1 each   |   Battlefield: max ${maxBattlefieldCopiesPerName} per name   |   Main Deck: ${maxMainDeckCards} cards, max ${maxMainCopiesPerName} per name   |   Rune: total max ${maxRuneCards}`,
			x + 20,
			y + 68
		);
	}

	async function drawExportSection(
		context: CanvasRenderingContext2D,
		title: string,
		items: DeckCard[],
		startX: number,
		startY: number,
		cardWidth: number,
		cardHeight: number,
		columns: number,
		sectionWidth = 1460
	) {
		if (items.length === 0) return startY;

		const compactHeader = sectionWidth < 700;
		const headerHeight = compactHeader ? 70 : 46;
		drawPanel(context, startX, startY, sectionWidth, headerHeight, 12);
		context.fillStyle = '#53EAFD';
		context.font = '900 22px Arial';
		context.fillText(title, startX + 18, startY + 30);
		context.fillStyle = '#9aa8b8';
		context.font = compactHeader ? '700 13px Arial' : '700 16px Arial';
		const totalCards = items.reduce((total, item) => total + item.quantity, 0);
		context.fillText(`${totalCards} cards`, startX + (compactHeader ? 18 : sectionWidth - 96), startY + (compactHeader ? 54 : 30));

		const cardStartY = startY + headerHeight + 22;
		for (const [index, item] of items.entries()) {
			const x = startX + (index % columns) * 188;
			const y = cardStartY + Math.floor(index / columns) * 226;

			fillRoundRect(context, x - 6, y - 6, cardWidth + 12, cardHeight + 44, 12, 'rgba(18,26,36,0.82)');
			strokeRoundRect(context, x - 6, y - 6, cardWidth + 12, cardHeight + 44, 12, 'rgba(83,234,253,0.14)', 1);

			if (item.card.image_url) {
				const image = await loadImage(getCanvasImageUrl(item.card.image_url));
				if (image) {
					drawContainedImage(context, image, x, y, cardWidth, cardHeight, 8, title === 'Battlefield');
				} else {
					drawCardPlaceholder(context, item.card.name_en, x, y, cardWidth, cardHeight);
				}
			} else {
				drawCardPlaceholder(context, item.card.name_en, x, y, cardWidth, cardHeight);
			}

			fillRoundRect(context, x + cardWidth - 45, y + 8, 36, 24, 7, '#53EAFD');
			context.fillStyle = '#03111f';
			context.font = '900 13px Arial';
			context.fillText(`x${item.quantity}`, x + cardWidth - 37, y + 25);
			context.fillStyle = '#d6dee7';
			context.font = '800 12px Arial';
			context.fillText(item.card.name_en.slice(0, 18), x - 1, y + cardHeight + 22);
		}

		return cardStartY + getSectionRows(items, columns) * 226 + 34;
	}

	function drawContainedImage(
		context: CanvasRenderingContext2D,
		image: HTMLImageElement,
		x: number,
		y: number,
		width: number,
		height: number,
		radius = 0,
		rotateLandscape = false
	) {
		fillRoundRect(context, x, y, width, height, radius, 'rgba(8,11,18,0.92)');

		if (rotateLandscape && image.naturalWidth > image.naturalHeight) {
			const rotatedBoxWidth = height;
			const rotatedBoxHeight = width;
			const imageRatio = image.naturalWidth / image.naturalHeight;
			const boxRatio = rotatedBoxWidth / rotatedBoxHeight;
			const drawWidth = imageRatio > boxRatio ? rotatedBoxWidth : rotatedBoxHeight * imageRatio;
			const drawHeight = imageRatio > boxRatio ? rotatedBoxWidth / imageRatio : rotatedBoxHeight;
			const drawX = -drawWidth / 2;
			const drawY = -drawHeight / 2;

			context.save();
			roundRectPath(context, x, y, width, height, radius);
			context.clip();
			context.translate(x + width / 2, y + height / 2);
			context.rotate(Math.PI / 2);
			context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
			context.restore();
			return;
		}

		const imageRatio = image.naturalWidth / image.naturalHeight;
		const boxRatio = width / height;
		const drawWidth = imageRatio > boxRatio ? width : height * imageRatio;
		const drawHeight = imageRatio > boxRatio ? width / imageRatio : height;
		const drawX = x + (width - drawWidth) / 2;
		const drawY = y + (height - drawHeight) / 2;

		context.save();
		roundRectPath(context, x, y, width, height, radius);
		context.clip();
		context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
		context.restore();
	}

	function getSectionRows(items: DeckCard[], columns: number) {
		return items.length === 0 ? 0 : Math.ceil(items.length / columns);
	}

	function getCanvasImageUrl(imageUrl: string) {
		return `/api/card-image?url=${encodeURIComponent(getCardImageUrl(imageUrl, 320))}`;
	}

	function getDomainIconUrl(label: string) {
		return getDomainIcon(label);
	}

	function getTypeIconUrl(label: string) {
		const icon = getTypeIcons(label)[0];
		return icon ? `/images/icons/${icon.src}` : null;
	}

	function drawCardPlaceholder(
		context: CanvasRenderingContext2D,
		name: string,
		x: number,
		y: number,
		width: number,
		height: number
	) {
		context.fillStyle = 'rgba(18,26,36,0.95)';
		context.fillRect(x, y, width, height);
		context.strokeStyle = 'rgba(244,210,135,0.22)';
		context.strokeRect(x + 1, y + 1, width - 2, height - 2);
		context.fillStyle = '#d6dee7';
		context.font = '900 14px Arial';
		wrapCanvasText(context, name, x + 10, y + 76, width - 20, 18, 4);
	}

	function drawPanel(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius = 14
	) {
		fillRoundRect(context, x, y, width, height, radius, 'rgba(18,26,36,0.88)');
		strokeRoundRect(context, x, y, width, height, radius, 'rgba(83,234,253,0.18)', 1);
		context.fillStyle = 'rgba(83,234,253,0.035)';
		roundRectPath(context, x, y, width, Math.min(56, height), radius);
		context.fill();
	}

	function fillRoundRect(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
		fillStyle: string | CanvasGradient
	) {
		context.fillStyle = fillStyle;
		roundRectPath(context, x, y, width, height, radius);
		context.fill();
	}

	function strokeRoundRect(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
		strokeStyle: string,
		lineWidth: number
	) {
		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
		roundRectPath(context, x, y, width, height, radius);
		context.stroke();
	}

	function roundRectPath(
		context: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number
	) {
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

	function wrapCanvasText(
		context: CanvasRenderingContext2D,
		text: string,
		x: number,
		y: number,
		maxWidth: number,
		lineHeight: number,
		maxLines: number
	) {
		const words = text.split(/\s+/);
		let line = '';
		let lines = 0;

		for (const word of words) {
			const testLine = line ? `${line} ${word}` : word;
			if (context.measureText(testLine).width > maxWidth && line) {
				context.fillText(line, x, y + lines * lineHeight);
				line = word;
				lines += 1;
				if (lines >= maxLines) return;
			} else {
				line = testLine;
			}
		}

		if (line && lines < maxLines) context.fillText(line, x, y + lines * lineHeight);
	}

	function loadImage(src: string) {
		return new Promise<HTMLImageElement | null>((resolve) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => resolve(null);
			image.src = src;
		});
	}

	function getMaxCount(items: { label: string; count: number }[]) {
		return Math.max(1, ...items.map((item) => item.count));
	}

	function getStoredDeckCards(deck: StoredDeck) {
		return buildDeckCards(cards, deck.entries);
	}

	function getStoredDeckSummary(deck: StoredDeck) {
		const deckItems = getStoredDeckCards(deck);
		const stats = calculateDeckStats(deckItems);
		const champion = getChampionCard(cards, deck.championCode);
		const legend = getDeckZones(deckItems).legends[0];
		const cover = [
			...(legend ? [legend] : []),
			...(champion ? [{ card: champion, quantity: 1 }] : [])
		];
		const domains = stats.domains.filter(({ label }) => label !== 'Colorless');
		return { cover, domains, stats };
	}

	function getLegendChampionCards() {
		return [
			...zones.legends,
			...(championCard ? [{ card: championCard, quantity: 1 }] : [])
		];
	}

	function slugify(value: string) {
		return (
			value
				.normalize('NFKC')
				.toLowerCase()
				.replace(/[^a-z0-9ก-๙]+/gi, '-')
				.replace(/^-+|-+$/g, '')
				.slice(0, 48) || 'deck'
		);
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-amber-200/10 bg-[#0a0e15]/90 backdrop-blur-xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a href="/" class="shrink-0 border-l-2 border-amber-200/50 pl-3 text-xl font-black uppercase italic text-white">
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu active="deck" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline mb-6 overflow-hidden rounded-xl">
			<div class="rt-rule-line p-5 pl-7 sm:p-7 sm:pl-9">
				<p class="rt-kicker mb-3">Deck Viewer</p>
				<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">My Deck</h1>
					</div>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="rt-action" onclick={createNewDeck}>New Deck</button>
					</div>
				</div>
			</div>
		</header>

		{#if collection.decks.length === 0}
			<section class="rt-panel rounded-xl p-8 text-center">
				<h2 class="text-2xl font-black uppercase italic text-white">ยังไม่มีเด็ค</h2>
				<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">ไปหน้า edit เพื่อเพิ่มการ์ดก่อน แล้วกลับมาดูสรุปหรือ export PNG ได้</p>
				<button type="button" class="rt-action mt-6" onclick={createNewDeck}>New Deck</button>
			</section>
		{:else}
			<section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{#each collection.decks as deck}
					{@const deckSummary = getStoredDeckSummary(deck)}
					<article class="rt-panel group overflow-hidden rounded-xl transition hover:border-cyan-300/30">
						<div class="grid h-64 grid-cols-2 gap-2 bg-slate-950/80 p-2">
							{#each deckSummary.cover as item}
								<div class="relative overflow-hidden rounded-md border border-white/10 bg-black/20">
									<img
										src={getCardImageUrl(item.card.image_url, 280, 'webp')}
										class="h-full min-h-0 w-full object-cover transition group-hover:scale-[1.02]"
										alt={item.card.name_en}
										loading="lazy"
									/>
									<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2 pt-10">
										<div class="truncate text-[10px] font-black uppercase tracking-widest {item.card.type === 'Legend' ? 'text-amber-100' : 'text-cyan-100'}">
											{item.card.type === 'Legend' ? 'Legend' : 'Champion'}
										</div>
										<div class="truncate text-xs font-black text-white">{item.card.name_en}</div>
									</div>
								</div>
							{:else}
								<div class="col-span-2 grid h-full place-items-center rounded-lg border border-dashed border-white/10 bg-black/20 text-sm font-black uppercase tracking-widest text-slate-600">
									Empty Deck
								</div>
							{/each}
							{#if deckSummary.cover.length === 1}
								<div class="grid h-full place-items-center rounded-md border border-dashed border-white/10 bg-black/20 p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
									No Champion
								</div>
							{/if}
						</div>
						<div class="p-5">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<h2 class="truncate text-xl font-black uppercase italic text-white">{deck.name}</h2>
									<p class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
										{deckSummary.stats.total} cards
									</p>
								</div>
								<div class="flex max-w-[9.5rem] flex-wrap justify-end gap-2">
									{#each deckSummary.domains as domain}
										<div
											class="grid h-10 w-7 shrink-0 place-items-center"
											title={`${domain.label}: ${domain.count}`}
										>
											{#if getDomainIcon(domain.label)}
												<img src={getDomainIcon(domain.label) ?? ''} class="h-6 w-6 object-contain" alt={domain.label} />
											{:else}
												<span class="h-2 w-2 rounded-full bg-cyan-200"></span>
											{/if}
											<span class="text-[10px] font-black leading-none text-cyan-100">{domain.count}</span>
										</div>
									{/each}
								</div>
							</div>
							<div class="mt-4 grid grid-cols-4 gap-2 text-center">
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-sm font-black text-white">{deckSummary.stats.mainTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Main/{maxMainDeckCards}</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-sm font-black text-white">{deckSummary.stats.runeTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Rune</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-sm font-black text-white">{deckSummary.stats.battlefieldTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Field</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-sm font-black text-white">{deckSummary.stats.tokenTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Token</div>
								</div>
							</div>
							<div class="mt-4 grid grid-cols-2 gap-2">
								<button
									type="button"
									class="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-300 px-3 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-200"
									onclick={() => openDeck(deck.id)}
								>
									View
								</button>
								<button
									type="button"
									class="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-xs font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/5 hover:text-white"
									onclick={() => editDeck(deck.id)}
								>
									Edit
								</button>
							</div>
						</div>
					</article>
				{/each}
			</section>
		{/if}
	</main>

	{#if isDeckLoading}
		<div class="fixed inset-0 z-[980] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
			<div class="rt-panel w-full max-w-xs rounded-xl p-5 text-center">
				<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
				<div class="mt-4 text-sm font-black uppercase tracking-widest text-white">Loading Decks</div>
			</div>
		</div>
	{/if}

	{#if selectedDeck}
		<div class="fixed inset-0 z-[900] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl">
				<div class="sticky top-0 z-10 mb-4 rounded-xl border border-white/10 bg-[#0a0e15]/95 p-4 backdrop-blur-xl">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="min-w-0">
							<div class="rt-kicker">Deck Detail</div>
							<h2 class="truncate text-3xl font-black uppercase italic text-white">{selectedDeck.name}</h2>
						</div>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								class="rt-action disabled:opacity-50"
								disabled={!hasDeck || isExporting}
								onclick={downloadPng}
							>
								{isExporting ? 'Exporting...' : 'Download PNG'}
							</button>
							<button
								type="button"
								class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
								disabled={!hasDeck || isExporting}
								onclick={previewPng}
							>
								Preview PNG
							</button>
							<button
								type="button"
								class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5 hover:text-white"
								onclick={() => editDeck(selectedDeck.id)}
							>
								Edit Deck
							</button>
							<button
								type="button"
								class="inline-flex min-h-11 items-center rounded-lg px-4 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-white/5 hover:text-white"
								onclick={closeDeck}
							>
								Close
							</button>
						</div>
					</div>
				</div>

				{#if exportError}
					<div class="mb-5 rounded-lg border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-100">
						{exportError}
					</div>
				{/if}

				{#if !hasDeck}
					<section class="rt-panel rounded-xl p-8 text-center">
						<h2 class="text-2xl font-black uppercase italic text-white">Empty Deck</h2>
						<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">เด็คนี้ยังไม่มีการ์ด</p>
					</section>
				{:else}
					<section class="mb-6 grid gap-3 sm:grid-cols-7">
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.legendTotal}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Legend</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{championCard ? 1 : 0}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Champion</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.battlefieldTotal}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Battlefield</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.mainTotal}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Main / {maxMainDeckCards}</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.runeTotal}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Rune Deck / {maxRuneCards}</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.tokenTotal}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Token</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.total}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Total Cards</div>
						</div>
					</section>

					<section class="mb-6 grid gap-5 lg:grid-cols-3">
						{@render ChartPanel('Cost Curve', stats.costs)}
						{@render ChartPanel('Card Types', stats.types)}
						{@render ChartPanel('Main Domains', stats.domains, true)}
					</section>

					<section class="mb-6 space-y-5">
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Legend + Champion</h2>
							{@render CardList(getLegendChampionCards())}
						</div>

						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Battlefield</h2>
							{@render CardList(zones.battlefields, true)}
						</div>
					</section>

					<section class="mb-6 space-y-5">
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Rune Deck</h2>
							{@render CardList(zones.runes)}
						</div>

						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Main Deck Cards</h2>
							{@render CardList(zones.main)}
						</div>
					</section>

					{#if zones.tokens.length > 0}
						<section class="rt-panel mb-6 rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Tokens</h2>
							{@render CardList(zones.tokens)}
						</section>
					{/if}

					{#if zones.other.length > 0}
						<section class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Other Cards</h2>
							{@render CardList(zones.other)}
						</section>
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	{#if isExporting}
		<div class="fixed inset-0 z-[980] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
			<div class="rt-panel rt-topline w-full max-w-sm rounded-xl p-6 text-center">
				<div class="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300"></div>
				<div class="rt-kicker mb-2">Loading</div>
				<h2 class="text-xl font-black uppercase italic text-white">
					{exportMode === 'preview' ? 'Preparing Preview' : 'Preparing Download'}
				</h2>
				<p class="rt-copy mt-3 text-sm">
					กำลังโหลดรูปการ์ดและสร้าง PNG กรุณารอสักครู่
				</p>
			</div>
		</div>
	{/if}

	{#if previewUrl}
		<div class="fixed inset-0 z-[950] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
			<div class="mx-auto max-w-6xl">
				<div class="mb-3 flex items-center justify-between gap-3">
					<div>
						<div class="rt-kicker">Developer Preview</div>
						<div class="text-sm font-bold text-slate-300">PNG export preview</div>
					</div>
					<button
						type="button"
						class="rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-200"
						onclick={() => (previewUrl = '')}
					>
						Close
					</button>
				</div>
				<img src={previewUrl} alt="Deck export preview" class="w-full rounded-xl border border-white/10 bg-slate-950" />
			</div>
		</div>
	{/if}
</div>

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
						<span class="text-amber-200">{item.count}</span>
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
	<div class={horizontal ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}>
		{#each items as item}
			<article class={horizontal ? 'group grid min-h-32 grid-cols-[8.5rem_1fr] gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-2 transition hover:border-cyan-300/35 sm:grid-cols-[10.5rem_1fr]' : 'group min-w-0 rounded-lg border border-white/10 bg-slate-950/70 p-2 transition hover:border-cyan-300/35'}>
				<div class="relative overflow-hidden rounded-md bg-slate-950">
					<img
						src={getCardImageUrl(item.card.image_url, 260, 'webp')}
						class={horizontal ? 'aspect-[1039/744] h-full w-full object-cover' : 'aspect-[744/1039] w-full object-cover'}
						alt={item.card.name_en}
						loading="lazy"
					/>
					<div class="absolute right-2 top-2 rounded-md bg-amber-200 px-2 py-1 text-xs font-black text-slate-950 shadow-lg">
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
