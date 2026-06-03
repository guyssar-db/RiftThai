<script lang="ts">
	import { browser } from '$app/environment';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import PlaytestModal from '$lib/components/PlaytestModal.svelte';
	import {
		buildDeckCards,
		calculateDeckStats,
		createEmptyDeck,
		getChampionCard,
		getDeckZones,
		maxBattlefieldCopiesPerName,
		maxMainDeckCards,
		maxMainCopiesPerName,
		maxRuneCards,
		maxSideboardCards,
		normalizeDeckCollection,
		readDeckCollectionFromStorage,
		validateDeck,
		writeDeckCollectionToStorage,
		type StoredDeck,
		type DeckCard
	} from '$lib/utils/deck';
	import { getTypeIcons } from '$lib/data/typeIcons';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
		let decks = $state<StoredDeck[]>([]);
	let currentUser = $state<{ id: string } | null>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let query = $state('');
	let selectedCoverCode = $state('');
	let selectedColor = $state('');
	let readyOnly = $state(false);
	let canBuildInstantlyFilter = $state(false);
	let sortMode = $state<'newest' | 'name' | 'main' | 'trending'>('newest');
	let isOnline = $state(true);
	let copyingDeckId = $state('');
	let previewDeck = $state<StoredDeck | null>(null);
	let previewUrl = $state('');
	let exportLayout = $state<'portrait' | 'landscape'>('portrait');
	let isExporting = $state(false);
	let exportMode = $state<'preview' | 'download' | ''>('');
	let exportError = $state('');
	let isPlaytestOpen = $state(false);
	let playtestDeck = $state<StoredDeck | null>(null);

	function openPlaytest(deck: StoredDeck) {
		playtestDeck = deck;
		isPlaytestOpen = true;
	}

	function closePlaytest() {
		isPlaytestOpen = false;
		playtestDeck = null;
	}

	let previewChampionCard = $derived(getChampionCard(cards, previewDeck?.championCode));
	let previewDeckCards = $derived(buildDeckCards(cards, previewDeck?.entries ?? []));
	let previewSideboardCards = $derived(buildDeckCards(cards, previewDeck?.sideboardEntries ?? []));
	let previewStats = $derived(calculateDeckStats(previewDeckCards, previewSideboardCards));
	let previewZones = $derived(getDeckZones(previewDeckCards));

	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
	let activeCopyMenuDeckId = $state('');
	const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

	let availableLegends = $derived(
		(() => {
			const list = new Map<string, Card>();
			for (const deck of decks) {
				const deckCards = buildDeckCards(cards, deck.entries);
				const legend = getDeckZones(deckCards).legends[0]?.card;
				if (legend) {
					list.set(legend.code, legend);
				}
			}
			return Array.from(list.values()).sort((a, b) => a.name_en.localeCompare(b.name_en));
		})()
	);

	let availableChampions = $derived(
		(() => {
			const list = new Map<string, Card>();
			for (const deck of decks) {
				const champion = getChampionCard(cards, deck.championCode);
				if (champion) {
					list.set(champion.code, champion);
				}
			}
			return Array.from(list.values()).sort((a, b) => a.name_en.localeCompare(b.name_en));
		})()
	);

	let filteredDecks = $derived(
		decks
			.filter((deck) => {
				// 1. Text search
				const search = query.trim().toLowerCase();
				if (search) {
					const champion = getChampionCard(cards, deck.championCode);
					const deckCards = buildDeckCards(cards, deck.entries);
					const legend = getDeckZones(deckCards).legends[0]?.card;
					const matchesText = [
						deck.name,
						champion?.name_en,
						champion?.name_th,
						legend?.name_en,
						legend?.name_th
					]
						.filter(Boolean)
						.some((value) => String(value).toLowerCase().includes(search));
					if (!matchesText) return false;
				}

				// 2. Legend / Champion cover code filter
				if (selectedCoverCode) {
					const champion = getChampionCard(cards, deck.championCode);
					const deckCards = buildDeckCards(cards, deck.entries);
					const legend = getDeckZones(deckCards).legends[0]?.card;
					const matchesCover =
						(champion && champion.code === selectedCoverCode) ||
						(legend && legend.code === selectedCoverCode);
					if (!matchesCover) return false;
				}

				// 3. Color / Domain filter
				if (selectedColor) {
					const summary = getDeckSummary(deck);
					const matchesColor = summary.domains.some((d) => d.label === selectedColor);
					if (!matchesColor) return false;
				}

				if (readyOnly && !validateDeck(cards, deck).isReady) return false;

				if (canBuildInstantlyFilter) {
					for (const entry of deck.entries) {
						const owned = userCollection[entry.code] ?? 0;
						if (owned < entry.quantity) return false;
					}
					if (deck.championCode) {
						const owned = userCollection[deck.championCode] ?? 0;
						if (owned < 1) return false;
					}
				}

				return true;
			})
			.sort((a, b) => {
				if (sortMode === 'name') return a.name.localeCompare(b.name);
				if (sortMode === 'main')
					return getDeckSummary(b).stats.mainTotal - getDeckSummary(a).stats.mainTotal;
				if (sortMode === 'trending')
					return (b.likesCount ?? 0) - (a.likesCount ?? 0);
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			})
	);

	$effect(() => {
		if (!browser) return;
		isOnline = navigator.onLine;

		const updateOnlineStatus = () => {
			isOnline = navigator.onLine;
		};
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		const handleGlobalClick = () => {
			activeCopyMenuDeckId = '';
		};
		window.addEventListener('click', handleGlobalClick);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
			window.removeEventListener('click', handleGlobalClick);
		};
	});

	$effect(() => {
		if (!browser) return;
		void loadPreferredDeckSettings();
		const stored = localStorage.getItem('riftthai-export-layout');
		if (stored === 'portrait' || stored === 'landscape') {
			exportLayout = stored;
		}
	});

	let userCollection = $state<Record<string, number>>({});

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
		if (!browser) return;
		localStorage.setItem('riftthai-export-layout', exportLayout);
	});

	$effect(() => {
		if (!browser) return;
		const _ = sortMode;
		void loadDecks();
	});

	async function loadDecks() {
		isLoading = true;
		errorMessage = '';

		try {
			const sortParam = sortMode === 'trending' ? 'trending' : 'newest';
			const response = await fetch(`/api/decks?scope=public&sort=${sortParam}`);
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
		const sideboardCards = buildDeckCards(cards, deck.sideboardEntries ?? []);
		const stats = calculateDeckStats(deckCards, sideboardCards);
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
		copiedDeck.sideboardEntries = deck.sideboardEntries ?? [];
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
				throw new Error(
					payload.error === 'login required'
						? 'Login required to copy online'
						: payload.error || 'Could not copy deck'
				);
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
		actionNotice = null;
		window.setTimeout(() => {
			actionNotice = { message, type };
		}, 0);
	}

	async function openPreview(deck: StoredDeck) {
		previewDeck = deck;
		previewUrl = '';
		await generatePreview();
	}

	async function preloadPreviewAssets() {
		const legendChampion = getLegendChampionCards();
		const allItems = [
			...legendChampion,
			...previewZones.battlefields,
			...previewZones.main,
			...previewZones.runes,
			...previewSideboardCards,
			...previewZones.tokens,
			...previewZones.other
		];
		const cardUrls = [...new Set(allItems.map((item) => item.card.image_url).filter(Boolean))].map(url => getCanvasImageUrl(url));
		const domainUrls = previewStats.domains.map(d => getDomainIconUrl(d.label)).filter(Boolean) as string[];
		const typeUrls = previewStats.types.map(t => getTypeIconUrl(t.label)).filter(Boolean) as string[];

		const allUrls = [...new Set([...cardUrls, ...domainUrls, ...typeUrls])];

		await Promise.all(allUrls.map((url) => {
			return loadImage(url).then(img => {
				return img;
			});
		}));
	}

	async function downloadPng() {
		if (!browser || isExporting || !previewDeck || previewDeckCards.length === 0) {
			return;
		}

		isExporting = true;
		exportMode = 'download';
		exportError = '';

		try {
			await preloadPreviewAssets();
			const canvas = await buildExportCanvas();
			const link = document.createElement('a');
			link.download = `riftthai-${slugify(previewDeck.name)}-${new Date().toISOString().slice(0, 10)}.png`;
			link.href = canvas.toDataURL('image/png');
			link.click();
		} catch (error) {
			console.error('[RiftThai Preview] downloadPng error:', error);
			exportError = error instanceof Error ? error.message : 'ไม่สามารถ export PNG ได้';
		} finally {
			isExporting = false;
			exportMode = '';
		}
	}

	async function generatePreview() {
		if (!browser || isExporting || !previewDeck || previewDeckCards.length === 0) {
			return;
		}

		isExporting = true;
		exportMode = 'preview';
		exportError = '';

		try {
			await preloadPreviewAssets();
			const canvas = await buildExportCanvas();
			previewUrl = canvas.toDataURL('image/png');
		} catch (error) {
			console.error('[RiftThai Preview] generatePreview error:', error);
			exportError = error instanceof Error ? error.message : 'ไม่สามารถ preview PNG ได้';
		} finally {
			isExporting = false;
			exportMode = '';
		}
	}

	async function changeLayout(layout: 'portrait' | 'landscape') {
		if (exportLayout === layout) return;
		exportLayout = layout;
		await generatePreview();
	}

	async function buildExportCanvas() {
		const canvas = document.createElement('canvas');
		const isLandscape = exportLayout === 'landscape';
		const width = isLandscape ? 2000 : 1600;
		const cardWidth = 132;
		const cardHeight = 184;
		const columns = 8;
		const topCardColumns = 4;
		const legendChampionCards = getLegendChampionCards();

		let height = 1220;
		if (isLandscape) {
			const legendRows = getSectionRows(legendChampionCards, 2);
			const legendHeight = legendChampionCards.length > 0 ? 46 + 22 + legendRows * 226 + 34 : 0;
			const row1EndY = 210 + Math.max(230, legendHeight);

			const battlefieldRows = getSectionRows(previewZones.battlefields, 4);
			const battlefieldHeight =
				previewZones.battlefields.length > 0 ? 46 + 22 + battlefieldRows * 192 + 34 : 0;

			const runeRows = getSectionRows(previewZones.runes, 5);
			const runeHeight = previewZones.runes.length > 0 ? 46 + 22 + runeRows * 226 + 34 : 0;

			const row2EndY = row1EndY + Math.max(battlefieldHeight, runeHeight);

			const mainRows = getSectionRows(previewZones.main, 10);
			const mainHeight = previewZones.main.length > 0 ? 46 + 22 + mainRows * 226 + 34 : 0;
			let row3EndY = row2EndY + mainHeight;

			let bottomHeight = 0;
			const bottomSections = [];
			if (previewSideboardCards.length > 0)
				bottomSections.push({ title: 'Sideboard', cards: previewSideboardCards });
			if (previewZones.tokens.length > 0) bottomSections.push({ title: 'Tokens', cards: previewZones.tokens });
			if (previewZones.other.length > 0) bottomSections.push({ title: 'Other', cards: previewZones.other });

			for (let i = 0; i < bottomSections.length; i += 2) {
				const left = bottomSections[i];
				const right = bottomSections[i + 1];
				if (left && right) {
					const leftRows = getSectionRows(left.cards, 5);
					const leftHeight = 46 + 22 + leftRows * 226 + 34;
					const rightRows = getSectionRows(right.cards, 5);
					const rightHeight = 46 + 22 + rightRows * 226 + 34;
					bottomHeight += Math.max(leftHeight, rightHeight);
				} else if (left) {
					const leftRows = getSectionRows(left.cards, 10);
					const leftHeight = 46 + 22 + leftRows * 226 + 34;
					bottomHeight += leftHeight;
				}
			}
			const bottomPadding = 96;
			height = Math.max(1120, row3EndY + bottomHeight + bottomPadding);
		} else {
			const topSectionRows = Math.max(
				getSectionRows(legendChampionCards, 2),
				getSectionRows(previewZones.battlefields, topCardColumns)
			);
			const sectionRows =
				getSectionRows(previewZones.main, columns) +
				getSectionRows(previewZones.runes, columns) +
				getSectionRows(previewSideboardCards, columns) +
				getSectionRows(previewZones.tokens, columns) +
				getSectionRows(previewZones.other, columns);
			const remainingSectionCount = [
				previewZones.main,
				previewZones.runes,
				previewSideboardCards,
				previewZones.tokens,
				previewZones.other
			].filter((section) => section.length > 0).length;
			const sectionHeaderAndGap = 112;
			const bottomPadding = 96;
			height = Math.max(
				1220,
				480 +
					sectionHeaderAndGap +
					topSectionRows * 226 +
					remainingSectionCount * sectionHeaderAndGap +
					sectionRows * 226 +
					bottomPadding
			);
		}

		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas is not available');

		drawExportBackground(context, width, height);
		drawExportHeader(context, width);

		if (isLandscape) {
			drawExportStats(context, previewStats.costs, 48, 210, 460, 230, 'Cost Curve');
			await drawExportIconStats(
				context,
				previewStats.types,
				548,
				210,
				460,
				230,
				'Card Types',
				getTypeIconUrl,
				true
			);
			await drawExportIconStats(
				context,
				previewStats.domains,
				1048,
				210,
				460,
				230,
				'Main Domains',
				getDomainIconUrl,
				false
			);

			const legendRows = getSectionRows(legendChampionCards, 2);
			const legendHeight = legendChampionCards.length > 0 ? 46 + 22 + legendRows * 226 + 34 : 0;
			const legendEndY = await drawExportSection(
				context,
				'Legend + Champion',
				legendChampionCards,
				1548,
				210,
				cardWidth,
				cardHeight,
				2,
				404
			);
			const row1EndY = 210 + Math.max(230, legendHeight);

			const battlefieldEndY = await drawExportSection(
				context,
				'Battlefield',
				previewZones.battlefields,
				48,
				row1EndY,
				cardWidth,
				cardHeight,
				4,
				928
			);
			const runeEndY = await drawExportSection(
				context,
				'Rune Deck',
				previewZones.runes,
				1024,
				row1EndY,
				cardWidth,
				cardHeight,
				5,
				928
			);
			const row2EndY = Math.max(battlefieldEndY, runeEndY);

			const mainEndY = await drawExportSection(
				context,
				'Main Deck',
				previewZones.main,
				48,
				row2EndY,
				cardWidth,
				cardHeight,
				10,
				1904
			);
			let currentY = mainEndY;

			const bottomSections = [];
			if (previewSideboardCards.length > 0)
				bottomSections.push({ title: 'Sideboard', cards: previewSideboardCards });
			if (previewZones.tokens.length > 0) bottomSections.push({ title: 'Tokens', cards: previewZones.tokens });
			if (previewZones.other.length > 0) bottomSections.push({ title: 'Other', cards: previewZones.other });

			for (let i = 0; i < bottomSections.length; i += 2) {
				const left = bottomSections[i];
				const right = bottomSections[i + 1];
				if (left && right) {
					const leftEndY = await drawExportSection(
						context,
						left.title,
						left.cards,
						48,
						currentY,
						cardWidth,
						cardHeight,
						5,
						928
					);
					const rightEndY = await drawExportSection(
						context,
						right.title,
						right.cards,
						1024,
						currentY,
						cardWidth,
						cardHeight,
						5,
						928
					);
					currentY = Math.max(leftEndY, rightEndY);
				} else if (left) {
					currentY = await drawExportSection(
						context,
						left.title,
						left.cards,
						48,
						currentY,
						cardWidth,
						cardHeight,
						10,
						1904
					);
				}
			}
		} else {
			drawExportStats(context, previewStats.costs, 48, 210, 460, 230, 'Cost Curve');
			await drawExportIconStats(
				context,
				previewStats.types,
				548,
				210,
				460,
				230,
				'Card Types',
				getTypeIconUrl,
				true
			);
			await drawExportIconStats(
				context,
				previewStats.domains,
				1048,
				210,
				460,
				230,
				'Main Domains',
				getDomainIconUrl,
				false
			);

			const topSectionY = 480;
			const legendEndY = await drawExportSection(
				context,
				'Legend + Champion',
				legendChampionCards,
				48,
				topSectionY,
				cardWidth,
				cardHeight,
				2,
				520
			);
			const battlefieldEndY = await drawExportSection(
				context,
				'Battlefield',
				previewZones.battlefields,
				600,
				topSectionY,
				cardWidth,
				cardHeight,
				topCardColumns,
				908
			);
			let sectionY = Math.max(legendEndY, battlefieldEndY);
			sectionY = await drawExportSection(
				context,
				'Main Deck',
				previewZones.main,
				48,
				sectionY,
				cardWidth,
				cardHeight,
				columns
			);
			sectionY = await drawExportSection(
				context,
				'Rune Deck',
				previewZones.runes,
				48,
				sectionY,
				cardWidth,
				cardHeight,
				columns
			);
			sectionY = await drawExportSection(
				context,
				'Sideboard',
				previewSideboardCards,
				48,
				sectionY,
				cardWidth,
				cardHeight,
				columns
			);
			sectionY = await drawExportSection(
				context,
				'Tokens',
				previewZones.tokens,
				48,
				sectionY,
				cardWidth,
				cardHeight,
				columns
			);
			await drawExportSection(
				context,
				'Other',
				previewZones.other,
				48,
				sectionY,
				cardWidth,
				cardHeight,
				columns
			);
		}

		// Draw watermark website link at the bottom-right corner
		context.fillStyle = 'rgba(83, 234, 253, 0.45)';
		context.font = '800 15px Arial';
		context.textAlign = 'right';
		context.fillText('riftthai.guyssar.com', width - 48, height - 36);
		context.textAlign = 'left'; // Reset to default

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
		context.fillText((previewDeck?.name || 'RiftThai Deck').slice(0, 34), 78, 134);

		const metrics = [
			['Legend', `${previewStats.legendTotal}/1`],
			['Champion', `${previewChampionCard ? 1 : 0}/1`],
			['Field', String(previewStats.battlefieldTotal)],
			['Main', `${previewStats.mainTotal}/${maxMainDeckCards}`],
			['Rune', `${previewStats.runeTotal}/${maxRuneCards}`],
			['Side', `${previewStats.sideboardTotal}/${maxSideboardCards}`],
			['Token', String(previewStats.tokenTotal)]
		];

		metrics.forEach(([label, value], index) => {
			const chipX = width - 750 + index * 98;
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
			fillRoundRect(
				context,
				x + 150,
				top,
				((width - 210) * item.count) / max,
				barHeight,
				5,
				'#53EAFD'
			);
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

		const isBattlefield = title === 'Battlefield';
		const currentCardWidth = isBattlefield ? cardHeight : cardWidth;
		const currentCardHeight = isBattlefield ? cardWidth : cardHeight;
		const colStep = isBattlefield ? 230 : 188;
		const rowStep = isBattlefield ? 192 : 226;

		const compactHeader = sectionWidth < 700;
		const headerHeight = compactHeader ? 70 : 46;
		drawPanel(context, startX, startY, sectionWidth, headerHeight, 12);
		context.fillStyle = '#53EAFD';
		context.font = '900 22px Arial';
		context.fillText(title, startX + 18, startY + 30);
		context.fillStyle = '#9aa8b8';
		context.font = compactHeader ? '700 13px Arial' : '700 16px Arial';
		const totalCards = items.reduce((total, item) => total + item.quantity, 0);
		context.fillText(
			`${totalCards} cards`,
			startX + (compactHeader ? 18 : sectionWidth - 96),
			startY + (compactHeader ? 54 : 30)
		);

		const cardStartY = startY + headerHeight + 22;
		for (const [index, item] of items.entries()) {
			const x = startX + (index % columns) * colStep;
			const y = cardStartY + Math.floor(index / columns) * rowStep;

			fillRoundRect(
				context,
				x - 6,
				y - 6,
				currentCardWidth + 12,
				currentCardHeight + 44,
				12,
				'rgba(18,26,36,0.82)'
			);
			strokeRoundRect(
				context,
				x - 6,
				y - 6,
				currentCardWidth + 12,
				currentCardHeight + 44,
				12,
				'rgba(83,234,253,0.14)',
				1
			);

			if (item.card.image_url) {
				const image = await loadImage(getCanvasImageUrl(item.card.image_url));
				if (image) {
					drawContainedImage(
						context,
						image,
						x,
						y,
						currentCardWidth,
						currentCardHeight,
						8,
						!isBattlefield
					);
				} else {
					drawCardPlaceholder(
						context,
						item.card.name_en,
						x,
						y,
						currentCardWidth,
						currentCardHeight
					);
				}
			} else {
				drawCardPlaceholder(context, item.card.name_en, x, y, currentCardWidth, currentCardHeight);
			}

			fillRoundRect(context, x + currentCardWidth - 45, y + 8, 36, 24, 7, '#53EAFD');
			context.fillStyle = '#03111f';
			context.font = '900 13px Arial';
			context.fillText(`x${item.quantity}`, x + currentCardWidth - 37, y + 25);
			context.fillStyle = '#d6dee7';
			context.font = '800 12px Arial';
			context.fillText(item.card.name_en.slice(0, 18), x - 1, y + currentCardHeight + 22);
		}

		return cardStartY + getSectionRows(items, columns) * rowStep + 34;
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
		return `/api/card-image?url=${encodeURIComponent(getCardImageUrl(imageUrl, 320, 'webp'))}`;
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
		if (imageCache.has(src)) {
			return imageCache.get(src)!;
		}

		const promise = new Promise<HTMLImageElement | null>((resolve) => {
			const image = new Image();
			const timer = setTimeout(() => {
				console.warn('[RiftThai Preview] loadImage request timeout reached (2.5s) for:', src);
				image.onload = null;
				image.onerror = null;
				resolve(null);
			}, 2500);

			image.onload = () => {
				clearTimeout(timer);
				resolve(image);
			};
			image.onerror = (e) => {
				clearTimeout(timer);
				console.error('[RiftThai Preview] loadImage request error for:', src, e);
				resolve(null);
			};
			image.src = src;
		});
		imageCache.set(src, promise);
		return promise;
	}

	function getLegendChampionCards() {
		return [...previewZones.legends, ...(previewChampionCard ? [{ card: previewChampionCard, quantity: 1 }] : [])];
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

	async function loadPreferredDeckSettings() {
		try {
			const response = await fetch('/api/auth/session');
			const payload = await response.json().catch(() => ({}));
			currentUser = payload.user || null;
			const layout = payload.user?.settings?.defaultExportLayout;
			if (layout === 'portrait' || layout === 'landscape') exportLayout = layout;
		} catch {
			// Deck exports keep the built-in portrait default if account settings are unavailable.
		}
	}

	async function toggleLike(deck: StoredDeck) {
		if (!currentUser) {
			showActionNotice('โปรดเข้าสู่ระบบเพื่อโหวตเด็ค (Please log in to upvote decks)', 'error');
			return;
		}
		if (!deck.onlineId) return;

		const isCurrentlyLiked = deck.isLiked;
		// Optimistic UI update
		deck.isLiked = !isCurrentlyLiked;
		deck.likesCount = (deck.likesCount ?? 0) + (isCurrentlyLiked ? -1 : 1);

		try {
			const url = `/api/decks/like` + (isCurrentlyLiked ? `?deckId=${deck.onlineId}` : '');
			const method = isCurrentlyLiked ? 'DELETE' : 'POST';
			const body = isCurrentlyLiked ? undefined : JSON.stringify({ deckId: deck.onlineId });

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(result.error || 'Failed to update like');
			}
		} catch (error) {
			// Rollback on error
			deck.isLiked = isCurrentlyLiked;
			deck.likesCount = (deck.likesCount ?? 0) + (isCurrentlyLiked ? 1 : -1);
			showActionNotice(error instanceof Error ? error.message : 'Error updating vote', 'error');
		}
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav
		class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
	>
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a
				href="/deck"
				class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic"
			>
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu active="deck" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
			<div
				class="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl"
			></div>
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
						<a
							href="/deck"
							class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
						>
							My Decks
						</a>
					</div>
				</div>
				<div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
					<div class="relative flex-1">
						<input
							bind:value={query}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 pr-10 pl-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
							placeholder="Search deck, champion, or legend..."
						/>
						{#if query}
							<button
								type="button"
								class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-white"
								onclick={() => (query = '')}
								aria-label="Clear search"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									class="h-5 w-5"
								>
									<path
										d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
									/>
								</svg>
							</button>
						{/if}
					</div>

					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
						<select
							bind:value={selectedCoverCode}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-bold text-white focus:border-cyan-300/50 focus:outline-none sm:w-60"
						>
							<option value="">All Legends & Champions</option>
							{#if availableLegends.length > 0}
								<optgroup label="Legends">
									{#each availableLegends as legend}
										<option value={legend.code}
											>{legend.name_en} ({legend.name_th || 'EN Only'})</option
										>
									{/each}
								</optgroup>
							{/if}
							{#if availableChampions.length > 0}
								<optgroup label="Champions">
									{#each availableChampions as champion}
										<option value={champion.code}
											>{champion.name_en} ({champion.name_th || 'EN Only'})</option
										>
									{/each}
								</optgroup>
							{/if}
						</select>

						<select
							bind:value={sortMode}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-bold text-white focus:border-cyan-300/50 focus:outline-none sm:w-36"
						>
							<option value="newest">Newest</option>
							<option value="trending">Trending</option>
							<option value="name">Name</option>
							<option value="main">Main Count</option>
						</select>

						<label
							class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-black tracking-widest text-slate-300 uppercase cursor-pointer select-none"
						>
							<input type="checkbox" bind:checked={readyOnly} class="h-4 w-4 accent-cyan-300" />
							Ready
						</label>

						{#if Object.keys(userCollection).length > 0}
							<label
								class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-black tracking-widest text-slate-300 uppercase cursor-pointer select-none"
							>
								<input type="checkbox" bind:checked={canBuildInstantlyFilter} class="h-4 w-4 accent-cyan-300" />
								ประกอบเด็คได้ทันที
							</label>
						{/if}

						<div class="flex flex-wrap items-center gap-1.5" title="Filter by Color / Domain">
							{#each ['Body', 'Calm', 'Chaos', 'Fury', 'Mind', 'Order'] as domain}
								{@const icon = getDomainIcon(domain)}
								<button
									type="button"
									class="relative h-11 w-11 rounded-lg border p-2 transition {selectedColor ===
									domain
										? 'border-cyan-300 bg-cyan-300/18 shadow-[0_0_12px_rgba(83,234,253,0.38)]'
										: 'border-white/10 bg-slate-950/70 hover:border-cyan-300/30'}"
									onclick={() => (selectedColor = selectedColor === domain ? '' : domain)}
									aria-label="Filter by {domain}"
									title={domain}
								>
									{#if icon}
										<img src={icon} class="h-full w-full object-contain" alt={domain} />
									{/if}
								</button>
							{/each}
						</div>
					</div>

					{#if query || selectedCoverCode || selectedColor || readyOnly || canBuildInstantlyFilter || sortMode !== 'newest'}
						<button
							type="button"
							class="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-rose-300/20 bg-rose-300/8 px-4 text-xs font-black tracking-widest text-rose-100 uppercase transition hover:bg-rose-300/14 lg:w-auto"
							onclick={() => {
								query = '';
								selectedCoverCode = '';
								selectedColor = '';
								readyOnly = false;
								canBuildInstantlyFilter = false;
								sortMode = 'newest';
							}}
						>
							Clear Filters
						</button>
					{/if}
				</div>
			</div>
		</header>

		{#if errorMessage}
			<section class="rt-panel rounded-xl p-5 text-sm font-bold text-rose-100">
				{errorMessage}
			</section>
		{:else if isLoading}
			<section class="rt-panel rounded-xl p-8 text-center">
				<div
					class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"
				></div>
				<div class="mt-4 text-sm font-black tracking-widest text-white uppercase">
					Loading Decks
				</div>
			</section>
		{:else if filteredDecks.length === 0}
			<section class="rt-panel rounded-xl p-8 text-center">
				<h2 class="text-2xl font-black text-white uppercase italic">No Public Decks</h2>
				<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">
					ยังไม่มีเด็ค public หรือไม่เจอผลลัพธ์ที่ค้นหา
				</p>
			</section>
		{:else}
			<section class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
				{#each filteredDecks as deck}
					{@const summary = getDeckSummary(deck)}
					<article
						class="rt-panel group relative grid grid-cols-[8.5rem_minmax(0,1fr)] overflow-visible rounded-xl transition hover:border-cyan-300/30 sm:grid-cols-[9.5rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)]"
					>
						<div
							class="pointer-events-none absolute top-2 left-2 z-20 rounded-full border border-emerald-300/25 bg-slate-950/92 px-2.5 py-1 text-[0.62rem] font-black tracking-[0.18em] text-emerald-100 uppercase shadow-lg shadow-black/40 backdrop-blur"
						>
							Online
						</div>

						<button
							type="button"
							class="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-black tracking-widest uppercase shadow-lg backdrop-blur-md transition select-none
							{deck.isLiked
								? 'border-pink-500 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
								: 'border-white/10 bg-slate-950/92 text-slate-400 hover:border-white/20 hover:text-white'}"
							onclick={(e) => {
								e.stopPropagation();
								void toggleLike(deck);
							}}
							aria-label="Upvote deck"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 transition-transform active:scale-125 {deck.isLiked ? 'text-pink-500' : 'text-slate-400'}">
								<path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
							</svg>
							<span>{deck.likesCount ?? 0}</span>
						</button>
						<a
							href="/deck/{deck.id}"
							class="relative flex rounded-l-xl bg-slate-950/80 p-2 sm:p-3 transition hover:bg-slate-900"
						>
							{#if summary.primaryCover}
								<div
									class="relative aspect-[744/1039] overflow-hidden rounded-lg border border-white/10 bg-black/20 shadow-[0_16px_28px_rgba(0,0,0,0.28)]"
								>
									<img
										src={getCardImageUrl(summary.primaryCover.card.image_url, 260, 'webp')}
										class="h-full min-h-0 w-full object-contain transition group-hover:scale-[1.03]"
										alt={summary.primaryCover.card.name_en}
										loading="lazy"
									/>
								</div>
							{:else}
								<div
									class="grid aspect-[744/1039] place-items-center rounded-lg border border-dashed border-white/10 bg-black/20 text-sm font-black tracking-widest text-slate-600 uppercase"
								>
									No Cover
								</div>
							{/if}
							{#if summary.secondaryCover}
								<div
									class="absolute right-2 bottom-2 w-[56%] overflow-hidden rounded-md border border-cyan-300/25 bg-slate-950 shadow-2xl shadow-black/60 sm:right-4 sm:bottom-4 sm:w-[43%] sm:rounded-lg"
								>
									<img
										src={getCardImageUrl(summary.secondaryCover.card.image_url, 180, 'webp')}
										class="aspect-[744/1039] w-full object-contain"
										alt={summary.secondaryCover.card.name_en}
										loading="lazy"
									/>
								</div>
							{/if}
						</a>
						<div class="flex min-w-0 flex-col p-3 sm:p-5">
							<div class="min-w-0">
								<h2 class="truncate text-base font-black text-white uppercase italic sm:text-xl hover:text-cyan-300 transition">
									<a href="/deck/{deck.id}">{deck.name}</a>
								</h2>
								<p class="mt-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
									Updated {new Date(deck.updatedAt).toLocaleDateString()}
								</p>
								{#if deck.owner}
									<a
										href="/profile/{deck.owner.profileSlug}"
										class="mt-2 inline-flex max-w-full items-center rounded-md border border-cyan-300/15 bg-cyan-300/8 px-2 py-1 text-[10px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14"
									>
										<span class="truncate">By {deck.owner.profileHandle}</span>
									</a>
								{/if}
							</div>
							<div class="mt-3 flex min-h-8 flex-wrap gap-1.5 sm:mt-4 sm:min-h-9 sm:gap-2">
								{#each summary.domains as domain}
									<div
										class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1"
									>
										{#if getDomainIcon(domain.label)}
											<img
												src={getDomainIcon(domain.label) ?? ''}
												class="h-5 w-5 object-contain"
												alt={domain.label}
											/>
										{/if}
										<span class="text-[10px] font-black text-cyan-100">{domain.count}</span>
									</div>
								{/each}
							</div>
							<div
								class="mt-3 grid grid-cols-2 gap-1.5 text-center sm:mt-4 sm:grid-cols-4 sm:gap-2"
							>
								<div
									class="rounded-md border border-white/10 bg-black/20 p-2"
									title="Main Deck: {summary.stats.mainTotal} / {maxMainDeckCards} cards"
								>
									<div class="text-xs font-black text-white sm:text-sm">
										{summary.stats.mainTotal}
									</div>
									<div class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
										Main
									</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">
										{summary.stats.runeTotal}
									</div>
									<div class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
										Rune
									</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">
										{summary.stats.battlefieldTotal}
									</div>
									<div class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
										Field
									</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{summary.stats.total}</div>
									<div class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">
										Total
									</div>
								</div>
							</div>
							<div class="mt-auto grid grid-cols-1 gap-1.5 pt-4 min-[380px]:grid-cols-3 sm:gap-2 text-center">
								<button
									type="button"
									class="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-3 text-[11px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14 hover:text-white"
									onclick={() => openPreview(deck)}
								>
									Preview
								</button>
								<button
									type="button"
									class="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-3 text-[11px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14 hover:text-white"
									onclick={() => openPlaytest(deck)}
								>
									Playtest
								</button>
								<div class="relative">
									<button
										type="button"
										class="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-300/8 px-3 text-[11px] font-black tracking-widest text-emerald-100 uppercase transition hover:bg-emerald-300/14 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
										disabled={copyingDeckId === deck.id}
										onclick={(e) => {
											e.stopPropagation();
											activeCopyMenuDeckId = activeCopyMenuDeckId === deck.id ? '' : deck.id;
										}}
									>
										<span>{copyingDeckId === deck.id ? 'Copying...' : 'Copy'}</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="h-3.5 w-3.5 transition-transform duration-200 {activeCopyMenuDeckId ===
											deck.id
												? 'rotate-180'
												: ''}"
										>
											<path
												fill-rule="evenodd"
												d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>

									{#if activeCopyMenuDeckId === deck.id}
										<div
											role="menu"
											tabindex="-1"
											class="animate-in fade-in slide-in-from-bottom-2 absolute right-0 bottom-full left-0 z-50 mb-2 rounded-lg border border-white/10 bg-slate-950 p-1.5 shadow-2xl backdrop-blur-xl duration-150"
											onclick={(e) => e.stopPropagation()}
											onkeydown={(e) => e.stopPropagation()}
										>
											<button
												type="button"
												class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[10px] font-black tracking-wider text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
												onclick={() => {
													copyDeckLocal(deck);
													activeCopyMenuDeckId = '';
												}}
											>
												<span>Local Copy</span>
												<span class="rounded bg-white/5 px-1 py-0.5 text-[8px] text-slate-400"
													>Offline</span
												>
											</button>
											<button
												type="button"
												class="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[10px] font-black tracking-wider text-slate-300 uppercase transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-40"
												disabled={!isOnline || copyingDeckId === deck.id}
												title={isOnline
													? 'Copy to your online decks'
													: 'Offline mode supports local copy only'}
												onclick={() => {
													void copyDeckOnline(deck);
													activeCopyMenuDeckId = '';
												}}
											>
												<span>Online Copy</span>
												<span
													class="rounded bg-emerald-400/10 px-1 py-0.5 text-[8px] text-emerald-400"
													>Cloud</span
												>
											</button>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</article>
				{/each}
			</section>
		{/if}
	</main>

	{#if isExporting && !previewUrl}
		<div class="fixed inset-0 z-[980] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
			<div class="rt-panel rt-topline w-full max-w-sm rounded-xl p-6 text-center">
				<div
					class="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300"
				></div>
				<div class="rt-kicker mb-2">Loading</div>
				<h2 class="text-xl font-black text-white uppercase italic">
					{exportMode === 'preview' ? 'Preparing Preview' : 'Preparing Download'}
				</h2>
				<p class="rt-copy mt-3 text-sm">กำลังโหลดรูปการ์ดและสร้าง PNG กรุณารอสักครู่</p>
			</div>
		</div>
	{/if}

	{#if previewUrl}
		<div class="fixed inset-0 z-[950] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
			<div class="mx-auto max-w-6xl">
				<div
					class="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0a0e15]/95 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<div class="rt-kicker">Developer Preview</div>
						<div class="text-sm font-bold text-slate-300">PNG export preview</div>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<!-- Segmented Control for Layout -->
						<div
							class="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-slate-950/40 p-1"
						>
							<button
								type="button"
								class="rounded-md px-3 py-1.5 text-xs font-black tracking-widest uppercase transition {exportLayout ===
								'portrait'
									? 'bg-cyan-300 text-slate-950'
									: 'text-slate-400 hover:text-white'}"
								onclick={() => changeLayout('portrait')}
								disabled={isExporting}
							>
								Portrait
							</button>
							<button
								type="button"
								class="rounded-md px-3 py-1.5 text-xs font-black tracking-widest uppercase transition {exportLayout ===
								'landscape'
									? 'bg-cyan-300 text-slate-950'
									: 'text-slate-400 hover:text-white'}"
								onclick={() => changeLayout('landscape')}
								disabled={isExporting}
							>
								Landscape
							</button>
						</div>

						<!-- Download Button -->
						<button
							type="button"
							class="rt-action disabled:opacity-50"
							disabled={isExporting}
							onclick={downloadPng}
						>
							Download PNG
						</button>

						<!-- Close Button -->
						<button
							type="button"
							class="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-slate-950 px-4 text-xs font-black tracking-widest text-slate-200 uppercase hover:bg-white/5"
							onclick={() => {
								previewUrl = '';
								previewDeck = null;
							}}
						>
							Close
						</button>
					</div>
				</div>
				<div class="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950">
					{#if isExporting}
						<div class="absolute inset-0 z-10 grid place-items-center bg-black/70 backdrop-blur-xs">
							<div class="text-center">
								<div
									class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300"
								></div>
								<div class="text-xs font-black tracking-widest text-white uppercase">
									Regenerating Preview...
								</div>
							</div>
						</div>
					{/if}
					<img src={previewUrl} alt="Deck export preview" class="w-full" />
				</div>
			</div>
		</div>
	{/if}

	{#if playtestDeck}
		<PlaytestModal
			deck={playtestDeck}
			cards={cards}
			isOpen={isPlaytestOpen}
			onClose={closePlaytest}
		/>
	{/if}

	{#if actionNotice}
		<Toast
			show={true}
			message={actionNotice.message}
			type={actionNotice.type}
			onclose={() => actionNotice = null}
		/>
	{/if}
</div>

