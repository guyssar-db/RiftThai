<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import {
		addStoredDeck,
		buildDeckCards,
		calculateDeckStats,
		createEmptyDeck,
		getActiveStoredDeck,
		getChampionCard,
		getDeckZones,
		maxBattlefieldCopiesPerName,
		maxMainDeckCards,
		maxMainCopiesPerName,
		maxRuneCards,
		maxSideboardCards,
		normalizeDeck,
		normalizeDeckCollection,
		readDeckCollectionFromStorage,
		setActiveStoredDeck,
		writeDeckCollectionToStorage,
		type DeckCollection,
		type DeckCard,
		type DeckEntry,
		type StoredDeck
	} from '$lib/utils/deck';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let collection = $state<DeckCollection>(normalizeDeckCollection(null));
	let selectedDeckId = $state('');
	let isExporting = $state(false);
	let isDeckLoading = $state(true);
	let isDeckDetailOpen = $state(false);
	let exportMode = $state<'preview' | 'download' | ''>('');
	let exportError = $state('');
	let previewUrl = $state('');
	let openDeckMenuId = $state('');
	let shareCode = $state('');
	let shareCopied = $state(false);
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
	let importCode = $state('');
	let importError = $state('');
	let savingDeckId = $state('');
	let publishingDeckId = $state('');
	let deletingDeckId = $state('');
	let exportLayout = $state<'portrait' | 'landscape'>('portrait');

	$effect(() => {
		if (!browser) return;
		const stored = localStorage.getItem('riftthai-export-layout');
		if (stored === 'portrait' || stored === 'landscape') {
			exportLayout = stored;
		}
	});

	$effect(() => {
		if (!browser) return;
		localStorage.setItem('riftthai-export-layout', exportLayout);
	});

	let selectedDeck = $derived(collection.decks.find((deck) => deck.id === selectedDeckId) ?? null);
	let championCard = $derived(getChampionCard(cards, selectedDeck?.championCode));
	let deckCards = $derived(buildDeckCards(cards, selectedDeck?.entries ?? []));
	let sideboardCards = $derived(buildDeckCards(cards, selectedDeck?.sideboardEntries ?? []));
	let stats = $derived(calculateDeckStats(deckCards, sideboardCards));
	let zones = $derived(getDeckZones(deckCards));
	let hasDeck = $derived(deckCards.length > 0 || sideboardCards.length > 0);
	let libraryStats = $derived(
		collection.decks.reduce(
			(total, deck) => {
				const deckStats = calculateDeckStats(
					buildDeckCards(cards, deck.entries),
					buildDeckCards(cards, deck.sideboardEntries ?? [])
				);
				return {
					decks: total.decks + 1,
					cards: total.cards + deckStats.total,
					complete: total.complete + (deckStats.legendTotal > 0 && deckStats.mainTotal >= maxMainDeckCards ? 1 : 0)
				};
			},
			{ decks: 0, cards: 0, complete: 0 }
		)
	);

	$effect(() => {
		if (!browser) return;
		const nextCollection = readDeckCollectionFromStorage(localStorage);
		collection = nextCollection;
		isDeckLoading = false;
		void loadOnlineDecks(nextCollection);
	});

	async function loadOnlineDecks(baseCollection: DeckCollection) {
		try {
			const response = await fetch('/api/decks');
			if (response.status === 401) return;
			const payload = await response.json().catch(() => ({}));
			if (!response.ok || !Array.isArray(payload.decks) || payload.decks.length === 0) return;

			const byId = new Map(baseCollection.decks.map((deck) => [deck.id, deck]));
			for (const onlineDeck of payload.decks as StoredDeck[]) {
				const current = byId.get(onlineDeck.id);
				if (!current || new Date(onlineDeck.updatedAt).getTime() >= new Date(current.updatedAt).getTime()) {
					byId.set(onlineDeck.id, onlineDeck);
				} else {
					byId.set(onlineDeck.id, {
						...current,
						source: 'online',
						onlineId: onlineDeck.onlineId
					});
				}
			}

			const nextCollection = normalizeDeckCollection({
				activeDeckId: baseCollection.activeDeckId,
				decks: [...byId.values()]
			});
			collection = nextCollection;
			writeDeckCollectionToStorage(localStorage, nextCollection);
		} catch {
			// Local decks are still usable when online sync is unavailable.
		}
	}

	function openDeck(deckId: string) {
		selectedDeckId = deckId;
		isDeckDetailOpen = true;
		openDeckMenuId = '';
		previewUrl = '';
		exportError = '';
		shareCode = '';
		shareCopied = false;
	}

	function toggleDeckMenu(deckId: string) {
		openDeckMenuId = openDeckMenuId === deckId ? '' : deckId;
	}

	async function runDeckAction(deckId: string, action: 'preview' | 'download' | 'share') {
		selectedDeckId = deckId;
		isDeckDetailOpen = false;
		openDeckMenuId = '';
		exportError = '';
		await tick();

		if (action === 'preview') {
			await previewPng();
			return;
		}

		if (action === 'download') {
			await downloadPng();
			return;
		}

		await copyDeckShareCode(deckId);
	}

	function editDeck(deckId: string) {
		if (!browser) return;
		const nextCollection = setActiveStoredDeck(collection, deckId);
		writeDeckCollectionToStorage(localStorage, nextCollection);
		window.location.href = `/deck/${deckId}/edit`;
	}

	function createNewDeck() {
		if (!browser) return;
		const nextCollection = addStoredDeck(collection, `Deck ${collection.decks.length + 1}`);
		const nextDeck = getActiveStoredDeck(nextCollection);
		writeDeckCollectionToStorage(localStorage, nextCollection);
		collection = nextCollection;
		window.location.href = `/deck/${nextDeck.id}/edit`;
	}

	function closeDeck() {
		isDeckDetailOpen = false;
		selectedDeckId = '';
		previewUrl = '';
		exportError = '';
		shareCode = '';
		shareCopied = false;
	}

	function shareDeck() {
		if (!selectedDeck) return;
		shareCode = encodeDeckShare(selectedDeck);
		shareCopied = false;
	}

	async function copyShareCode() {
		if (!browser || !shareCode) return;
		await navigator.clipboard?.writeText(shareCode);
		shareCopied = true;
	}

	async function copyDeckShareCode(deckId: string) {
		if (!browser) return;
		const deck = collection.decks.find((item) => item.id === deckId);
		if (!deck) return;

		const code = encodeDeckShare(deck);
		shareCode = code;
		shareCopied = false;

		try {
			await navigator.clipboard?.writeText(code);
			shareCopied = true;
			showActionNotice('Deck share code copied', 'success');
		} catch {
			showActionNotice('Could not copy share code', 'error');
		}
	}

	async function saveDeckOnline(deckId: string) {
		if (!browser || savingDeckId) return;
		const deck = collection.decks.find((item) => item.id === deckId);
		if (!deck) return;

		savingDeckId = deckId;
		openDeckMenuId = '';

		try {
			const response = await fetch('/api/decks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deck })
			});
			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(payload.error === 'login required' ? 'Login required to save online' : payload.error || 'Could not save deck');
			}

			const savedDeck = payload.deck as StoredDeck;
			const nextCollection = normalizeDeckCollection({
				...collection,
				decks: collection.decks.map((item) =>
					item.id === deckId
						? {
								...item,
								onlineId: savedDeck.onlineId,
								source: 'online',
								updatedAt: savedDeck.updatedAt
							}
						: item
				)
			});

			collection = nextCollection;
			writeDeckCollectionToStorage(localStorage, nextCollection);
			showActionNotice('Deck saved online', 'success');
		} catch (error) {
			showActionNotice(error instanceof Error ? error.message : 'Could not save deck', 'error');
		} finally {
			savingDeckId = '';
		}
	}

	async function updateDeckVisibility(deckId: string, visibility: 'private' | 'public') {
		if (!browser || publishingDeckId) return;
		publishingDeckId = deckId;
		openDeckMenuId = '';

		try {
			let targetDeck = collection.decks.find((item) => item.id === deckId);
			if (!targetDeck) return;

			if (targetDeck.source !== 'online') {
				await saveDeckOnline(deckId);
				targetDeck = collection.decks.find((item) => item.id === deckId) ?? targetDeck;
			}

			const response = await fetch('/api/decks', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deckId, visibility })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(payload.error === 'login required' ? 'Login required to publish deck' : payload.error || 'Could not update deck');
			}

			const savedDeck = payload.deck as StoredDeck;
			const nextCollection = normalizeDeckCollection({
				...collection,
				decks: collection.decks.map((item) =>
					item.id === deckId
						? {
								...item,
								source: 'online',
								onlineId: savedDeck.onlineId,
								visibility: savedDeck.visibility,
								updatedAt: savedDeck.updatedAt
							}
						: item
				)
			});
			collection = nextCollection;
			writeDeckCollectionToStorage(localStorage, nextCollection);
			showActionNotice(visibility === 'public' ? 'Deck published' : 'Deck set private', 'success');
		} catch (error) {
			showActionNotice(error instanceof Error ? error.message : 'Could not update deck', 'error');
		} finally {
			publishingDeckId = '';
		}
	}

	async function deleteDeckFromLibrary(deckId: string) {
		if (!browser || deletingDeckId) return;
		const deck = collection.decks.find((item) => item.id === deckId);
		if (!deck) return;

		deletingDeckId = deckId;
		openDeckMenuId = '';

		try {
			if (deck.source === 'online') {
				const response = await fetch(`/api/decks?deckId=${encodeURIComponent(deckId)}`, {
					method: 'DELETE'
				});
				const payload = await response.json().catch(() => ({}));
				if (!response.ok) {
					throw new Error(payload.error === 'login required' ? 'Login required to delete online deck' : payload.error || 'Could not delete online deck');
				}
			}

			const nextDecks = collection.decks.filter((item) => item.id !== deckId);
			const nextCollection = normalizeDeckCollection({
				activeDeckId: nextDecks[0]?.id ?? '',
				decks: nextDecks
			});
			collection = nextCollection;
			writeDeckCollectionToStorage(localStorage, nextCollection);
			showActionNotice(deck.source === 'online' ? 'Online deck deleted' : 'Local deck deleted', 'success');
		} catch (error) {
			showActionNotice(error instanceof Error ? error.message : 'Could not delete deck', 'error');
		} finally {
			deletingDeckId = '';
		}
	}

	function showActionNotice(message: string, type: 'success' | 'error' | 'info' = 'info') {
		actionNotice = { message, type };
		window.setTimeout(() => {
			if (actionNotice?.message === message) actionNotice = null;
		}, 2600);
	}

	function importDeckCode() {
		if (!browser) return;
		importError = '';

		try {
			const payload = decodeDeckShare(importCode);
			const importedDeck = createEmptyDeck(payload.name || `Imported Deck ${collection.decks.length + 1}`);
			importedDeck.championCode = payload.championCode;
			importedDeck.entries = normalizeDeck(payload.entries);
			const nextCollection = normalizeDeckCollection({
				activeDeckId: importedDeck.id,
				decks: [...collection.decks, importedDeck]
			});

			collection = nextCollection;
			selectedDeckId = importedDeck.id;
			importCode = '';
			writeDeckCollectionToStorage(localStorage, nextCollection);
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Invalid deck code';
		}
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

	async function changeLayout(layout: 'portrait' | 'landscape') {
		if (exportLayout === layout) return;
		exportLayout = layout;
		await previewPng();
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
			const legendHeight = legendChampionCards.length > 0 ? (46 + 22 + legendRows * 226 + 34) : 0;
			const row1EndY = 210 + Math.max(230, legendHeight);

			const battlefieldRows = getSectionRows(zones.battlefields, 4);
			const battlefieldHeight = zones.battlefields.length > 0 ? (46 + 22 + battlefieldRows * 192 + 34) : 0;
			
			const runeRows = getSectionRows(zones.runes, 5);
			const runeHeight = zones.runes.length > 0 ? (46 + 22 + runeRows * 226 + 34) : 0;
			
			const row2EndY = row1EndY + Math.max(battlefieldHeight, runeHeight);

			const mainRows = getSectionRows(zones.main, 10);
			const mainHeight = zones.main.length > 0 ? (46 + 22 + mainRows * 226 + 34) : 0;
			let row3EndY = row2EndY + mainHeight;

			let bottomHeight = 0;
			const bottomSections = [];
			if (sideboardCards.length > 0) bottomSections.push({ title: 'Sideboard', cards: sideboardCards });
			if (zones.tokens.length > 0) bottomSections.push({ title: 'Tokens', cards: zones.tokens });
			if (zones.other.length > 0) bottomSections.push({ title: 'Other', cards: zones.other });

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
				getSectionRows(zones.battlefields, topCardColumns)
			);
			const sectionRows =
				getSectionRows(zones.main, columns) +
				getSectionRows(zones.runes, columns) +
				getSectionRows(sideboardCards, columns) +
				getSectionRows(zones.tokens, columns) +
				getSectionRows(zones.other, columns);
			const remainingSectionCount = [zones.main, zones.runes, sideboardCards, zones.tokens, zones.other].filter(
				(section) => section.length > 0
			).length;
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
			drawExportStats(context, stats.costs, 48, 210, 460, 230, 'Cost Curve');
			await drawExportIconStats(context, stats.types, 548, 210, 460, 230, 'Card Types', getTypeIconUrl, true);
			await drawExportIconStats(context, stats.domains, 1048, 210, 460, 230, 'Main Domains', getDomainIconUrl, false);

			const legendRows = getSectionRows(legendChampionCards, 2);
			const legendHeight = legendChampionCards.length > 0 ? (46 + 22 + legendRows * 226 + 34) : 0;
			const legendEndY = await drawExportSection(context, 'Legend + Champion', legendChampionCards, 1548, 210, cardWidth, cardHeight, 2, 404);
			const row1EndY = 210 + Math.max(230, legendHeight);

			const battlefieldEndY = await drawExportSection(context, 'Battlefield', zones.battlefields, 48, row1EndY, cardWidth, cardHeight, 4, 928);
			const runeEndY = await drawExportSection(context, 'Rune Deck', zones.runes, 1024, row1EndY, cardWidth, cardHeight, 5, 928);
			const row2EndY = Math.max(battlefieldEndY, runeEndY);

			const mainEndY = await drawExportSection(context, 'Main Deck', zones.main, 48, row2EndY, cardWidth, cardHeight, 10, 1904);
			let currentY = mainEndY;

			const bottomSections = [];
			if (sideboardCards.length > 0) bottomSections.push({ title: 'Sideboard', cards: sideboardCards });
			if (zones.tokens.length > 0) bottomSections.push({ title: 'Tokens', cards: zones.tokens });
			if (zones.other.length > 0) bottomSections.push({ title: 'Other', cards: zones.other });

			for (let i = 0; i < bottomSections.length; i += 2) {
				const left = bottomSections[i];
				const right = bottomSections[i + 1];
				if (left && right) {
					const leftEndY = await drawExportSection(context, left.title, left.cards, 48, currentY, cardWidth, cardHeight, 5, 928);
					const rightEndY = await drawExportSection(context, right.title, right.cards, 1024, currentY, cardWidth, cardHeight, 5, 928);
					currentY = Math.max(leftEndY, rightEndY);
				} else if (left) {
					currentY = await drawExportSection(context, left.title, left.cards, 48, currentY, cardWidth, cardHeight, 10, 1904);
				}
			}
		} else {
			drawExportStats(context, stats.costs, 48, 210, 460, 230, 'Cost Curve');
			await drawExportIconStats(context, stats.types, 548, 210, 460, 230, 'Card Types', getTypeIconUrl, true);
			await drawExportIconStats(context, stats.domains, 1048, 210, 460, 230, 'Main Domains', getDomainIconUrl, false);

			const topSectionY = 480;
			const legendEndY = await drawExportSection(context, 'Legend + Champion', legendChampionCards, 48, topSectionY, cardWidth, cardHeight, 2, 520);
			const battlefieldEndY = await drawExportSection(context, 'Battlefield', zones.battlefields, 600, topSectionY, cardWidth, cardHeight, topCardColumns, 908);
			let sectionY = Math.max(legendEndY, battlefieldEndY);
			sectionY = await drawExportSection(context, 'Main Deck', zones.main, 48, sectionY, cardWidth, cardHeight, columns);
			sectionY = await drawExportSection(context, 'Rune Deck', zones.runes, 48, sectionY, cardWidth, cardHeight, columns);
			sectionY = await drawExportSection(context, 'Sideboard', sideboardCards, 48, sectionY, cardWidth, cardHeight, columns);
			sectionY = await drawExportSection(context, 'Tokens', zones.tokens, 48, sectionY, cardWidth, cardHeight, columns);
			await drawExportSection(context, 'Other', zones.other, 48, sectionY, cardWidth, cardHeight, columns);
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
		context.fillText((selectedDeck?.name || 'RiftThai Deck').slice(0, 34), 78, 134);

		const metrics = [
			['Legend', `${stats.legendTotal}/1`],
			['Champion', `${championCard ? 1 : 0}/1`],
			['Field', String(stats.battlefieldTotal)],
			['Main', `${stats.mainTotal}/${maxMainDeckCards}`],
			['Rune', `${stats.runeTotal}/${maxRuneCards}`],
			['Side', `${stats.sideboardTotal}/${maxSideboardCards}`],
			['Token', String(stats.tokenTotal)]
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
		context.fillText(`${totalCards} cards`, startX + (compactHeader ? 18 : sectionWidth - 96), startY + (compactHeader ? 54 : 30));

		const cardStartY = startY + headerHeight + 22;
		for (const [index, item] of items.entries()) {
			const x = startX + (index % columns) * colStep;
			const y = cardStartY + Math.floor(index / columns) * rowStep;

			fillRoundRect(context, x - 6, y - 6, currentCardWidth + 12, currentCardHeight + 44, 12, 'rgba(18,26,36,0.82)');
			strokeRoundRect(context, x - 6, y - 6, currentCardWidth + 12, currentCardHeight + 44, 12, 'rgba(83,234,253,0.14)', 1);

			if (item.card.image_url) {
				const image = await loadImage(getCanvasImageUrl(item.card.image_url));
				if (image) {
					drawContainedImage(context, image, x, y, currentCardWidth, currentCardHeight, 8, !isBattlefield);
				} else {
					drawCardPlaceholder(context, item.card.name_en, x, y, currentCardWidth, currentCardHeight);
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
		const sideboardItems = buildDeckCards(cards, deck.sideboardEntries ?? []);
		const stats = calculateDeckStats(deckItems, sideboardItems);
		const champion = getChampionCard(cards, deck.championCode);
		const legend = getDeckZones(deckItems).legends[0];
		const cover = [
			...(legend ? [legend] : []),
			...(champion ? [{ card: champion, quantity: 1 }] : [])
		];
		const primaryCover = cover[0] ?? null;
		const secondaryCover = cover[1] ?? null;
		const domains = stats.domains.filter(({ label }) => label !== 'Colorless');
		return { cover, primaryCover, secondaryCover, domains, stats };
	}

	function getDeckSourceLabel(deck: StoredDeck) {
		const sourceFields = deck as StoredDeck & { source?: string; origin?: string; storage?: string };
		const source = String(sourceFields.source ?? sourceFields.origin ?? sourceFields.storage ?? 'local').toLowerCase();
		return source === 'online' || source === 'remote' || source === 'cloud' ? 'Online' : 'Local';
	}

	function getDeckVisibilityLabel(deck: StoredDeck) {
		return deck.visibility === 'public' ? 'Public' : 'Private';
	}

	function getDeckVisibilityClass(deck: StoredDeck) {
		return deck.visibility === 'public'
			? 'border-emerald-300/35 bg-emerald-300/14 text-emerald-100'
			: 'border-slate-400/20 bg-slate-950/92 text-slate-300';
	}

	function isOnlineDeck(deck: StoredDeck) {
		return deck.source === 'online' || Boolean(deck.onlineId);
	}

	function getLegendChampionCards() {
		return [
			...zones.legends,
			...(championCard ? [{ card: championCard, quantity: 1 }] : [])
		];
	}

	function encodeDeckShare(deck: StoredDeck) {
		const payload = JSON.stringify([
			2,
			deck.name,
			deck.championCode,
			normalizeDeck(deck.entries).map((entry) => [entry.code, entry.quantity])
		]);
		const bytes = new TextEncoder().encode(payload);
		let binary = '';
		for (const byte of bytes) binary += String.fromCharCode(byte);
		return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	}

	function decodeDeckShare(code: string): { name: string; championCode: string; entries: DeckEntry[] } {
		const safeCode = code.trim().replace(/\s+/g, '');
		if (!safeCode) throw new Error('Paste a deck share code first');

		const base64 = safeCode.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
		const binary = atob(padded);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		const payload = JSON.parse(new TextDecoder().decode(bytes));

		if (Array.isArray(payload) && payload[0] === 2 && Array.isArray(payload[3])) {
			return {
				name: String(payload[1] ?? 'Imported Deck').slice(0, 48),
				championCode: String(payload[2] ?? ''),
				entries: payload[3].map((entry: unknown) => {
					if (!Array.isArray(entry)) return { code: '', quantity: 0 };
					return { code: String(entry[0] ?? ''), quantity: Number(entry[1] ?? 0) };
				})
			};
		}

		if (!payload || payload.v !== 1 || !Array.isArray(payload.e)) {
			throw new Error('This deck code is not supported');
		}

		return {
			name: String(payload.n ?? 'Imported Deck').slice(0, 48),
			championCode: String(payload.c ?? ''),
			entries: payload.e
		};
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
			<div class="flex min-w-0 items-center gap-3">
				<a
					href="/"
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-200/15 bg-amber-200/5 text-slate-200 transition hover:border-amber-200/30 hover:bg-amber-200/10 hover:text-amber-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/25 sm:w-auto sm:px-4"
					aria-label="Back to home"
				>
					<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="m15 18-6-6 6-6" />
					</svg>
					<span class="hidden text-xs font-black uppercase tracking-widest sm:ml-2 sm:block">Back</span>
				</a>

				<a href="/" class="shrink-0 text-xl font-black uppercase italic text-white sm:text-2xl">
					Rift<span class="text-cyan-300">Thai</span>
				</a>
			</div>
			<SiteMenu active="deck" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
			<div class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl"></div>
			<div class="rt-rule-line relative p-5 pl-7 sm:p-7 sm:pl-9">
				<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
					<div class="min-w-0">
						<p class="rt-kicker mb-3">Deck Library</p>
						<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">My Decks</h1>
						<p class="rt-copy mt-3 max-w-2xl text-sm">
							จัดการเด็คทั้งหมดในเครื่องนี้ เลือกเปิดดูสรุป, export PNG หรือเข้า builder เพื่อแก้ไขเด็ค
						</p>
					</div>
					<div class="grid grid-cols-3 gap-2 sm:min-w-[23rem]">
						<div class="rounded-lg border border-cyan-300/15 bg-black/20 p-3 text-center">
							<div class="text-xl font-black text-white">{libraryStats.decks}</div>
							<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Decks</div>
						</div>
						<div class="rounded-lg border border-cyan-300/15 bg-black/20 p-3 text-center">
							<div class="text-xl font-black text-white">{libraryStats.cards}</div>
							<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Cards</div>
						</div>
						<div class="rounded-lg border border-cyan-300/15 bg-black/20 p-3 text-center">
							<div class="text-xl font-black text-white">{libraryStats.complete}</div>
							<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Ready</div>
						</div>
					</div>
				</div>
				<div class="mt-5 flex flex-wrap gap-2">
					<button type="button" class="rt-action" onclick={createNewDeck}>New Deck</button>
					<a href="/deck/browser" class="inline-flex min-h-11 items-center rounded-lg border border-cyan-300/20 px-4 text-xs font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-300/10">
						Browser
					</a>
				</div>
				<div class="mt-4 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-2 sm:grid-cols-[minmax(0,1fr)_auto]">
					<input
						bind:value={importCode}
						class="min-h-11 min-w-0 rounded-md border border-white/10 bg-slate-950/70 px-3 text-xs font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
						placeholder="Paste deck share code..."
					/>
					<button
						type="button"
						class="inline-flex min-h-11 items-center justify-center rounded-md border border-cyan-300/20 px-4 text-xs font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-300/10"
						onclick={importDeckCode}
					>
						Import Deck
					</button>
				</div>
				{#if importError}
					<p class="mt-2 text-xs font-bold text-rose-100">{importError}</p>
				{/if}
			</div>
		</header>

		{#if collection.decks.length === 0 && !isDeckLoading}
			<section class="rt-panel rounded-xl p-8 text-center">
				<h2 class="text-2xl font-black uppercase italic text-white">ยังไม่มีเด็ค</h2>
				<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">ไปหน้า edit เพื่อเพิ่มการ์ดก่อน แล้วกลับมาดูสรุปหรือ export PNG ได้</p>
				<button type="button" class="rt-action mt-6" onclick={createNewDeck}>New Deck</button>
			</section>
		{:else if !isDeckLoading}
			<section class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
				{#each collection.decks as deck}
					{@const deckSummary = getStoredDeckSummary(deck)}
					<article class="rt-panel group relative grid grid-cols-[8.5rem_minmax(0,1fr)] overflow-visible rounded-xl transition hover:border-cyan-300/30 sm:grid-cols-[9.5rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)]">
						<div class="pointer-events-none absolute left-2 top-2 z-20 flex max-w-[calc(100%-1rem)] gap-1.5">
							<span class="rounded-full border border-cyan-300/25 bg-slate-950/92 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-lg shadow-black/40 backdrop-blur">
								{getDeckSourceLabel(deck)}
							</span>
							{#if isOnlineDeck(deck)}
								<span class="rounded-full border px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] shadow-lg shadow-black/40 backdrop-blur {getDeckVisibilityClass(deck)}">
									{getDeckVisibilityLabel(deck)}
								</span>
							{/if}
						</div>
						<a
							href="/deck/{deck.id}"
							class="relative flex rounded-l-xl bg-slate-950/80 p-2 sm:p-3"
							aria-label={`Open ${deck.name}`}
						>
							{#if deckSummary.primaryCover}
								{@const item = deckSummary.primaryCover}
								<div class="relative aspect-[744/1039] overflow-hidden rounded-lg border border-white/10 bg-black/20 shadow-[0_16px_28px_rgba(0,0,0,0.28)]">
									<img
										src={getCardImageUrl(item.card.image_url, 260, 'webp')}
										class="h-full min-h-0 w-full object-contain transition group-hover:scale-[1.03]"
										alt={item.card.name_en}
										loading="lazy"
									/>
								</div>
							{:else}
								<div class="grid aspect-[744/1039] w-full place-items-center rounded-lg border border-dashed border-amber-200/20 bg-amber-500/5 text-center p-3 shadow-inner">
									<div class="flex flex-col items-center gap-1.5">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6 text-amber-200/35">
											<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-3-12h5.25c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-5.25M3.75 6h9c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-9a1.125 1.125 0 01-1.125-1.125v-10.5C2.625 6.504 3.129 6 3.75 6z" />
										</svg>
										<div class="text-[9px] font-black uppercase tracking-[0.25em] text-amber-200/40">Empty</div>
									</div>
								</div>
							{/if}

							{#if deckSummary.secondaryCover}
								{@const item = deckSummary.secondaryCover}
								<div class="absolute bottom-2 right-2 w-[56%] sm:w-[36%] overflow-hidden rounded-md border border-cyan-300/25 bg-slate-950 shadow-2xl shadow-black/60 sm:bottom-4 sm:right-4 sm:w-[43%] sm:rounded-lg">
									<img
										src={getCardImageUrl(item.card.image_url, 180, 'webp')}
										class="aspect-[744/1039] w-full object-contain"
										alt={item.card.name_en}
										loading="lazy"
									/>
								</div>
							{/if}
						</a>
						<div class="flex min-w-0 flex-col p-3 sm:p-5">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<h2 class="truncate text-base font-black uppercase italic text-white sm:text-xl">{deck.name}</h2>
									<p class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
										Updated {new Date(deck.updatedAt).toLocaleDateString()}
									</p>
								</div>
								<div class="rt-chip hidden shrink-0 sm:inline-flex">{deckSummary.stats.total} Cards</div>
							</div>

							<div class="mt-3 flex min-h-8 flex-wrap gap-1.5 sm:mt-4 sm:min-h-9 sm:gap-2">
								{#if deckSummary.domains.length > 0}
									{#each deckSummary.domains as domain}
										<div
											class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1"
											title={`${domain.label}: ${domain.count}`}
										>
											{#if getDomainIcon(domain.label)}
												<img src={getDomainIcon(domain.label) ?? ''} class="h-5 w-5 object-contain" alt={domain.label} />
											{:else}
												<span class="h-2 w-2 rounded-full bg-cyan-200"></span>
											{/if}
											<span class="text-[10px] font-black text-cyan-100">{domain.count}</span>
										</div>
									{/each}
								{:else}
									<span class="text-xs font-bold text-slate-600">No main domains yet</span>
								{/if}
							</div>
							<div class="mt-3 grid grid-cols-2 gap-1.5 text-center sm:mt-4 sm:grid-cols-4 sm:gap-2">
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{deckSummary.stats.mainTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Main</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{deckSummary.stats.runeTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Rune</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{deckSummary.stats.battlefieldTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Field</div>
								</div>
								<div class="rounded-md border border-white/10 bg-black/20 p-2">
									<div class="text-xs font-black text-white sm:text-sm">{deckSummary.stats.tokenTotal}</div>
									<div class="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Token</div>
								</div>
							</div>
							<div class="relative mt-auto grid grid-cols-[1fr_1fr_auto] gap-1.5 pt-4">
								<a
									href="/deck/{deck.id}"
									class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-300/14 hover:text-white"
								>
									List
								</a>
								<button
									type="button"
									class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/10 hover:text-white"
									onclick={() => editDeck(deck.id)}
								>
									Edit
								</button>
								<button
									type="button"
									class="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-slate-950/70 text-xl font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
									aria-label={`Open export actions for ${deck.name}`}
									aria-expanded={openDeckMenuId === deck.id}
									onclick={() => toggleDeckMenu(deck.id)}
								>
									&vellip;
								</button>
								{#if openDeckMenuId === deck.id}
									<div class="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-lg border border-cyan-300/15 bg-slate-950/98 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
										<button
											type="button"
											class="block w-full rounded-md px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-emerald-100 transition hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-45"
											disabled={savingDeckId === deck.id}
											onclick={() => saveDeckOnline(deck.id)}
										>
											{savingDeckId === deck.id ? 'Saving...' : isOnlineDeck(deck) ? 'Update' : 'Save Online'}
										</button>
										{#if isOnlineDeck(deck)}
											<button
												type="button"
												class="block w-full rounded-md px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-orange-100 transition hover:bg-orange-300/10 disabled:cursor-not-allowed disabled:opacity-45"
												disabled={publishingDeckId === deck.id}
												onclick={() => updateDeckVisibility(deck.id, deck.visibility === 'public' ? 'private' : 'public')}
											>
												{publishingDeckId === deck.id
													? 'Updating...'
													: deck.visibility === 'public'
														? 'Set Private'
														: 'Publish'}
											</button>
										{/if}
										<button
											type="button"
											class="block w-full rounded-md px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-100 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-45"
											disabled={deletingDeckId === deck.id}
											onclick={() => deleteDeckFromLibrary(deck.id)}
										>
											{deletingDeckId === deck.id ? 'Deleting...' : isOnlineDeck(deck) ? 'Delete Online' : 'Delete Local'}
										</button>
										<button
											type="button"
											class="block w-full rounded-md px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
											disabled={deckSummary.stats.total === 0 || isExporting}
											onclick={() => runDeckAction(deck.id, 'preview')}
										>
											Download PNG
										</button>
										<button
											type="button"
											class="block w-full rounded-md px-3 py-3 text-left text-xs font-black uppercase tracking-widest text-amber-100 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-45"
											disabled={deckSummary.stats.total === 0}
											onclick={() => runDeckAction(deck.id, 'share')}
										>
											Share
										</button>
									</div>
								{/if}
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

	{#if selectedDeck && isDeckDetailOpen}
		<div class="fixed inset-0 z-[900] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl">
				<div class="sticky top-0 z-10 mb-4 rounded-xl border border-white/10 bg-[#0a0e15]/95 p-4 backdrop-blur-xl">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div class="min-w-0">
							<div class="rt-kicker">Deck Detail</div>
							<h2 class="truncate text-3xl font-black uppercase italic text-white">{selectedDeck.name}</h2>
						</div>
						<div class="flex flex-wrap gap-2">
							<div class="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-slate-950/40 p-1">
								<button
									type="button"
									class="rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition {exportLayout === 'portrait' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}"
									onclick={() => exportLayout = 'portrait'}
								>
									Portrait
								</button>
								<button
									type="button"
									class="rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition {exportLayout === 'landscape' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}"
									onclick={() => exportLayout = 'landscape'}
								>
									Landscape
								</button>
							</div>
							<button
								type="button"
								class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
								disabled={!hasDeck || isExporting}
								onclick={previewPng}
							>
								1. Preview
							</button>
							<button
								type="button"
								class="rt-action disabled:opacity-50"
								disabled={!hasDeck || isExporting}
								onclick={downloadPng}
							>
								{isExporting ? 'Exporting...' : '2. Download PNG'}
							</button>
							<button
								type="button"
								class="inline-flex min-h-11 items-center rounded-lg border border-cyan-300/20 px-4 text-xs font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-300/10 disabled:opacity-50"
								disabled={!hasDeck}
								onclick={shareDeck}
							>
								3. Share
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

				{#if shareCode}
					<div class="mb-5 rounded-xl border border-cyan-300/15 bg-slate-950/80 p-4">
						<div class="mb-2 text-[10px] font-black uppercase tracking-widest text-cyan-100">
							Deck Share Code
						</div>
						<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
							<textarea
								readonly
								class="h-24 min-w-0 resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-xs font-bold leading-relaxed text-slate-100 focus:outline-none"
								value={shareCode}
							></textarea>
							<button
								type="button"
								class="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-300 px-4 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-200"
								onclick={copyShareCode}
							>
								{shareCopied ? 'Copied' : 'Copy Code'}
							</button>
						</div>
						<p class="mt-2 text-xs font-semibold text-slate-500">
							นำ code นี้ไปกรอกในช่อง Import Deck บนหน้า /deck เพื่อเพิ่มเด็คเข้ารายการ
						</p>
					</div>
				{/if}

				{#if !hasDeck}
					<section class="rt-panel rounded-xl p-8 text-center">
						<h2 class="text-2xl font-black uppercase italic text-white">Empty Deck</h2>
						<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">เด็คนี้ยังไม่มีการ์ด</p>
					</section>
				{:else}
					<section class="mb-6 grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
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
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Rune / {maxRuneCards}</div>
						</div>
						<div class="rt-panel rounded-xl p-4">
							<div class="text-2xl font-black text-white">{stats.sideboardTotal}</div>
							<div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Sideboard / {maxSideboardCards}</div>
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
							{@render CardList(getLegendChampionCards(), true)}
						</div>

						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Battlefield</h2>
							{@render CardList(zones.battlefields, true)}
						</div>
					</section>

					<section class="mb-6 space-y-5">
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Rune Deck</h2>
							{@render CardList(zones.runes, true)}
						</div>

						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Main Deck Cards</h2>
							{@render CardList(zones.main)}
						</div>
					</section>

					{#if sideboardCards.length > 0}
						<section class="rt-panel mb-6 rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Sideboard</h2>
							{@render CardList(sideboardCards)}
						</section>
					{/if}

					{#if zones.tokens.length > 0}
						<section class="rt-panel mb-6 rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black uppercase italic text-white">Tokens</h2>
							{@render CardList(zones.tokens, true)}
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
				<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-[#0a0e15]/95 p-4 backdrop-blur-xl">
					<div>
						<div class="rt-kicker">Developer Preview</div>
						<div class="text-sm font-bold text-slate-300">PNG export preview</div>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<!-- Segmented Control for Layout -->
						<div class="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-slate-950/40 p-1">
							<button
								type="button"
								class="rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition {exportLayout === 'portrait' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}"
								onclick={() => changeLayout('portrait')}
								disabled={isExporting}
							>
								Portrait
							</button>
							<button
								type="button"
								class="rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition {exportLayout === 'landscape' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}"
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
							class="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-slate-950 px-4 text-xs font-black uppercase tracking-widest text-slate-200 hover:bg-white/5"
							onclick={() => (previewUrl = '')}
						>
							Close
						</button>
					</div>
				</div>
				<div class="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950">
					{#if isExporting}
						<div class="absolute inset-0 z-10 grid place-items-center bg-black/70 backdrop-blur-xs">
							<div class="text-center">
								<div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300"></div>
								<div class="text-xs font-black uppercase tracking-widest text-white">Regenerating Preview...</div>
							</div>
						</div>
					{/if}
					<img src={previewUrl} alt="Deck export preview" class="w-full" />
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
						style={!horizontal && item.card.name_en === 'Baron Pit' ? 'transform: rotate(90deg) scale(1.4);' : ''}
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
