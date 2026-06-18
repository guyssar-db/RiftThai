<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import {
		buildDeckCards,
		getDeckZones,
		calculateDeckStats,
		readDeckCollectionFromStorage,
		isTokenCard,
		type StoredDeck
	} from '$lib/utils/deck';
	import CardModal from '$lib/components/CardModal.svelte';

	let { data } = $props();
	const cards = data.cards as Card[];

	// Route parameters & loaded deck
	let deckId = $state(data.deckId);
	let loadedDeck = $state(data.loadedDeck as StoredDeck | null);
	let loadedDeckZones = $derived.by(() => {
		if (!loadedDeck) return null;
		const deckCards = buildDeckCards(cards, loadedDeck.entries ?? []);
		return getDeckZones(deckCards);
	});

	// Decks lists
	let activeDeck = $state<StoredDeck | null>(null);
	let localDecks = $state<StoredDeck[]>([]);
	let selectedPopupCard = $state<Card | null>(null);
	let searchDeckId = $state('');

	// Game States
	let isGameStarted = $state(false);
	let dragOverCardId = $state<string | null>(null);
	let isMulliganPhase = $state(false);
	let selectedMulliganIndices = $state(new Set<number>());
	let library = $state<Card[]>([]);
	let hand = $state<Card[]>([]);
	let trash = $state<Card[]>([]);
	let banished = $state<Card[]>([]);
	let runeLibrary = $state<Card[]>([]);
	let activeRunes = $state<BoardItem[]>([]);

	// Board Item Definition
	type BoardItem = {
		id: string;
		card: Card;
		isExhausted: boolean;
		counters: number;
		isFacedown: boolean;
		copiedFromReflection?: boolean;
		mightModifier?: number;
		damageReceived?: number;
		attachments?: BoardItem[];
	};

	// 1v1 Board Zones (Solo/Player Side Only Layout)
	let playerBase = $state<BoardItem[]>([]);

	// 2 Battlefields in the middle
	let bf1 = $state<{
		card: Card | null; // The Battlefield card itself in the center
		playerSide: BoardItem[];
		hiddenCard: BoardItem | null; // Facedown Zone (holds 1 card)
	}>({ card: null, playerSide: [], hiddenCard: null });

	let bf2 = $state<{
		card: Card | null;
		playerSide: BoardItem[];
		hiddenCard: BoardItem | null;
	}>({ card: null, playerSide: [], hiddenCard: null });

	// Legend & Champion display
	let playerLegend = $state<Card | null>(null);
	let playerChampion = $state<Card | null>(null);
	let activeDeckBattlefields = $state<Card[]>([]);

	// Resource Trackers
	let turn = $state(1);
	let energy = $derived(activeRunes.filter((r) => !r.isExhausted).length);
	let maxEnergy = $derived(activeRunes.length);
	
	// Player Stats
	let playerScore = $state(0);

	// Spawner state (to spawn any card on the board)
	let spawnSearch = $state('');
	let spawnTab = $state<'all' | 'token' | 'unit' | 'spell' | 'gear' | 'rune' | 'battlefield'>('all');
	let isSpawnMenuOpen = $state(false);
	let spawnTargetZone = $state<'base' | 'bf1' | 'bf2' | 'bf1_hidden' | 'bf2_hidden'>('base');

	function getDeckLegendAndChampion(deck: StoredDeck | null) {
		if (!deck) return { legend: null, champion: null };
		const deckCards = buildDeckCards(cards, deck.entries ?? []);
		const legendEntry = deckCards.find((dc) => dc.card.type === 'Legend');
		const legend = legendEntry ? legendEntry.card : null;

		const champion = cards.find((c) => c.code === deck.championCode && c.type !== 'Legend') || null;
		return { legend, champion };
	}

	// Active dropdown menus
	let activeMenuCardIdx = $state<number | null>(null);
	let activeMenuBoardItem = $state<{ item: BoardItem; zone: string } | null>(null);

	// Legend & Champion Zone States
	let isLegendExhausted = $state(false);
	let activeMenuLegendOpen = $state(false);
	let activeMenuChampionOpen = $state(false);

	// Pile Viewer Modal
	let pileViewerType = $state<'trash' | 'banished' | 'deck' | null>(null);
	// Play Assistant states
	let skillAnalysisResult = $state<any | null>(null);
	let skillCardToTrigger = $state<Card | null>(null);
	let autoSkillError = $state('');

	// Reflection Transform states
	let isTransformMenuOpen = $state(false);
	let transformTargetItem = $state<BoardItem | null>(null);
	let transformTargetZone = $state<string>('');
	let transformSearch = $state('');
	let boardUnits = $derived.by(() => {
		const list: Card[] = [];
		const seenCodes = new Set<string>();

		const addCard = (card: Card) => {
			if (card.type === 'Unit' && card.name_en !== 'Reflection' && !seenCodes.has(card.code)) {
				list.push(card);
				seenCodes.add(card.code);
			}
		};

		playerBase.forEach(item => {
			if (!item.isFacedown) addCard(item.card);
		});

		bf1.playerSide.forEach(item => {
			if (!item.isFacedown) addCard(item.card);
		});

		if (bf1.hiddenCard && !bf1.hiddenCard.isFacedown) {
			addCard(bf1.hiddenCard.card);
		}

		bf2.playerSide.forEach(item => {
			if (!item.isFacedown) addCard(item.card);
		});

		if (bf2.hiddenCard && !bf2.hiddenCard.isFacedown) {
			addCard(bf2.hiddenCard.card);
		}

		return list;
	});
	let currentPile = $derived.by(() => {
		if (pileViewerType === 'deck') return library;
		if (pileViewerType === 'trash') return trash;
		if (pileViewerType === 'banished') return banished;
		return [];
	});

	let activeDeckCodes = $derived.by(() => {
		if (!activeDeck) return new Set<string>();
		const codes = new Set<string>((activeDeck.entries ?? []).map((e) => e.code));
		if (activeDeck.championCode) {
			codes.add(activeDeck.championCode);
		}
		if (activeDeck.sideboardEntries) {
			activeDeck.sideboardEntries.forEach((e) => codes.add(e.code));
		}
		return codes;
	});

	// Battlefield picker
	let isBfPickerOpen = $state(false);
	let bfPickerTarget = $state<'bf1' | 'bf2'>('bf1');

	onMount(() => {
		if (browser) {
			localDecks = readDeckCollectionFromStorage(window.localStorage).decks;

			if (loadedDeck) {
				activeDeck = loadedDeck;
			} else if (deckId) {
				const local = localDecks.find((d) => d.id === deckId);
				if (local) {
					activeDeck = local;
				}
			}

			if (activeDeck) {
				startGame();
			}
		}
	});

	function selectDeck(deck: StoredDeck) {
		activeDeck = deck;
		deckId = deck.id;
		startGame();
	}

	function loadDeckById(id: string) {
		if (!id) return;
		const local = localDecks.find((d) => d.id === id);
		if (local) {
			loadedDeck = local;
			deckId = id;
		} else {
			fetch(`/api/decks?id=${encodeURIComponent(id)}`)
				.then((res) => {
					if (res.ok) return res.json();
					throw new Error('Not found');
				})
				.then((val) => {
					if (val.deck) {
						loadedDeck = val.deck;
						deckId = id;
					} else {
						alert('ไม่พบเด็คที่ระบุในฐานข้อมูลออนไลน์หรือเครื่องนี้');
					}
				})
				.catch(() => {
					alert('ไม่พบเด็ครหัสนี้');
				});
		}
	}

	function shuffle(array: Card[]) {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function startGame() {
		if (!activeDeck) return;

		const deckCards = buildDeckCards(cards, activeDeck.entries ?? []);
		const zones = getDeckZones(deckCards);

		// Build Main Library
		const mainCards: Card[] = [];
		for (const { card, quantity } of zones.main) {
			for (let i = 0; i < quantity; i++) {
				mainCards.push(card);
			}
		}

		library = shuffle(mainCards);
		hand = [];
		trash = [];
		banished = [];

		// Clean zones
		playerBase = [];
		
		bf1 = { card: null, playerSide: [], hiddenCard: null };
		bf2 = { card: null, playerSide: [], hiddenCard: null };

		// Store the active deck's battlefields for picker selection
		activeDeckBattlefields = zones.battlefields.map((z) => z.card);

		// Left battlefield (bf1) is chosen manually by the player
		bf1.card = null;
		
		// Right battlefield (bf2) is selected randomly from all battlefields in the database
		const allBfs = cards.filter((c) => c.type === 'Battlefield' && c.name_en !== 'Baron Pit' && c.name_en !== 'Brush');
		if (allBfs.length > 0) {
			bf2.card = allBfs[Math.floor(Math.random() * allBfs.length)];
		} else {
			bf2.card = null;
		}

		// Set Legend & Champion
		playerChampion = cards.find((c) => c.code === activeDeck?.championCode && c.type !== 'Legend') || null;
		playerLegend = zones.legends[0]?.card || null;
		if (!playerLegend && playerChampion) {
			const champTags = (playerChampion.tags || []).map((t) => String(t).toLowerCase().trim());
			playerLegend =
				cards.find((c) => {
					if (c.type !== 'Legend') return false;
					const legendTags = (c.tags || []).map((t) => String(t).toLowerCase().trim());
					return legendTags.some((tag) => champTags.includes(tag));
				}) || null;
		}

		if (!playerLegend) {
			playerLegend = cards.find((c) => c.type === 'Legend') || null;
		}

		// Setup resources
		turn = 1;
		playerScore = 0;

		// Draw initial 4 cards
		for (let i = 0; i < 4; i++) {
			if (library.length > 0) {
				hand.push(library.pop()!);
			}
		}

		// Build Rune Library
		let runeCards: Card[] = [];
		for (const { card, quantity } of zones.runes) {
			for (let i = 0; i < quantity; i++) {
				runeCards.push(card);
			}
		}

		if (runeCards.length === 0) {
			const allRunes = cards.filter((c) => c.type === 'Rune');
			runeCards.push(...allRunes.slice(0, 12));
		}

		runeLibrary = shuffle(runeCards);
		activeRunes = [];
		isLegendExhausted = false;
		activeMenuLegendOpen = false;
		activeMenuChampionOpen = false;

		selectedMulliganIndices = new Set();
		isMulliganPhase = true;
		isGameStarted = true;
		activePlaygroundStep = 'E';
	}

	function toggleMulliganSelect(index: number) {
		const next = new Set(selectedMulliganIndices);
		if (next.has(index)) {
			next.delete(index);
		} else {
			if (next.size >= 2) return;
			next.add(index);
		}
		selectedMulliganIndices = next;
	}

	function channelRune(count = 1) {
		for (let c = 0; c < count; c++) {
			if (activeRunes.length >= 12) {
				alert('แท่นศิลาพูนรูนเต็มแล้ว (สูงสุด 12 ช่อง)');
				break;
			}
			if (runeLibrary.length === 0) {
				alert('กองรูนหมดแล้ว!');
				break;
			}

			const card = runeLibrary.pop()!;
			const item: BoardItem = {
				id: Math.random().toString(36).substr(2, 9),
				card,
				isExhausted: false,
				counters: 0,
				isFacedown: false
			};
			activeRunes = [...activeRunes, item];
		}
	}

	function playRuneFromHand(index: number) {
		const card = hand[index];
		if (activeRunes.length >= 12) {
			alert('แท่นศิลาพูนรูนเต็มแล้ว (สูงสุด 12 ช่อง)');
			return;
		}

		// Remove from hand
		hand = hand.filter((_, i) => i !== index);
		activeMenuCardIdx = null;

		const item: BoardItem = {
			id: Math.random().toString(36).substr(2, 9),
			card,
			isExhausted: false,
			counters: 0,
			isFacedown: false
		};
		activeRunes = [...activeRunes, item];
	}

	function recycleRune(item: BoardItem) {
		removeBoardItem(item.id, 'rune');
		runeLibrary = [item.card, ...runeLibrary];
	}

	function returnToHand(item: BoardItem, zone: string) {
		removeBoardItem(item.id, zone);
		hand = [...hand, item.card];
		activeMenuBoardItem = null;
	}

	function deployChampion(zone: 'base' | 'bf1' | 'bf2') {
		if (!playerChampion) return;

		const item: BoardItem = {
			id: Math.random().toString(36).substr(2, 9),
			card: playerChampion,
			isExhausted: false,
			counters: 0,
			isFacedown: false
		};

		if (zone === 'base') {
			playerBase = [...playerBase, item];
		} else if (zone === 'bf1') {
			bf1.playerSide = [...bf1.playerSide, item];
		} else if (zone === 'bf2') {
			bf2.playerSide = [...bf2.playerSide, item];
		}

		// Deduct Energy by exhausting runes
		if (playerChampion.energy !== null && playerChampion.energy !== undefined) {
			let cost = playerChampion.energy;
			for (let i = 0; i < activeRunes.length && cost > 0; i++) {
				if (!activeRunes[i].isExhausted) {
					activeRunes[i].isExhausted = true;
					cost--;
				}
			}
			activeRunes = [...activeRunes];
		}

		playerChampion = null;
		activeMenuChampionOpen = false;
	}

	function returnToChampionZone(item: BoardItem, zone: string) {
		removeBoardItem(item.id, zone);
		playerChampion = item.card;
		activeMenuBoardItem = null;
	}

	function confirmMulligan() {
		const toReplace: Card[] = [];
		const remaining: Card[] = [];

		hand.forEach((card, index) => {
			if (selectedMulliganIndices.has(index)) {
				toReplace.push(card);
			} else {
				remaining.push(card);
			}
		});

		// Prepend to library (puts them at the bottom of the deck since library.pop() takes from the end)
		for (const card of toReplace) {
			library = [card, ...library];
		}

		const newHand = [...remaining];
		for (let i = 0; i < toReplace.length; i++) {
			if (library.length > 0) {
				newHand.push(library.pop()!);
			}
		}

		hand = newHand;
		isMulliganPhase = false;
		selectedMulliganIndices = new Set();

		// Channel initial 2 runes on game start
		channelRune(2);
		activePlaygroundStep = 'E';
	}

	function drawCard() {
		if (library.length > 0) {
			hand = [...hand, library.pop()!];
		}
	}

	function shuffleLibrary() {
		library = shuffle(library);
	}

	function discardFromHand(index: number) {
		const card = hand[index];
		hand = hand.filter((_, i) => i !== index);
		if (!isTokenCard(card) && card.code !== 'UNL-T06' && card.name_en !== 'Reflection') {
			trash = [...trash, card];
		}
		activeMenuCardIdx = null;
	}

	function recycleToDeckBottom(index: number) {
		const card = hand[index];
		hand = hand.filter((_, i) => i !== index);
		library = [card, ...library];
		activeMenuCardIdx = null;
	}

	// Play Card Action
	function playCard(index: number, zone: 'base' | 'bf1' | 'bf2' | 'bf1_hidden' | 'bf2_hidden') {
		const card = hand[index];
		const item: BoardItem = {
			id: Math.random().toString(36).substr(2, 9),
			card,
			isExhausted: false,
			counters: 0,
			isFacedown: zone.endsWith('_hidden')
		};

		if (zone === 'base') {
			playerBase = [...playerBase, item];
		} else if (zone === 'bf1') {
			bf1.playerSide = [...bf1.playerSide, item];
		} else if (zone === 'bf2') {
			bf2.playerSide = [...bf2.playerSide, item];
		} else if (zone === 'bf1_hidden') {
			if (bf1.hiddenCard && !isTokenCard(bf1.hiddenCard.card) && !bf1.hiddenCard.copiedFromReflection && bf1.hiddenCard.card.code !== 'UNL-T06' && bf1.hiddenCard.card.name_en !== 'Reflection') trash = [...trash, bf1.hiddenCard.card];
			bf1.hiddenCard = item;
		} else if (zone === 'bf2_hidden') {
			if (bf2.hiddenCard && !isTokenCard(bf2.hiddenCard.card) && !bf2.hiddenCard.copiedFromReflection && bf2.hiddenCard.card.code !== 'UNL-T06' && bf2.hiddenCard.card.name_en !== 'Reflection') trash = [...trash, bf2.hiddenCard.card];
			bf2.hiddenCard = item;
		}

		// Deduct Energy by exhausting runes
		if (card.energy !== null && card.energy !== undefined && !zone.endsWith('_hidden')) {
			let cost = card.energy;
			for (let i = 0; i < activeRunes.length && cost > 0; i++) {
				if (!activeRunes[i].isExhausted) {
					activeRunes[i].isExhausted = true;
					cost--;
				}
			}
			activeRunes = [...activeRunes];
		}

		hand = hand.filter((_, i) => i !== index);
		activeMenuCardIdx = null;
	}

	// Move Card on Board
	function moveItem(item: BoardItem, currentZone: string, targetZone: string) {
		// Remove from current
		removeBoardItem(item.id, currentZone, true);

		// Add to target
		const updatedItem = { ...item };
		
		if (targetZone === 'base') {
			playerBase = [...playerBase, updatedItem];
		} else if (targetZone === 'bf1') {
			bf1.playerSide = [...bf1.playerSide, updatedItem];
		} else if (targetZone === 'bf2') {
			bf2.playerSide = [...bf2.playerSide, updatedItem];
		}

		activeMenuBoardItem = null;
	}

	function discardAttachmentsOf(item: BoardItem) {
		if (item.attachments && item.attachments.length > 0) {
			for (const att of item.attachments) {
				if (!isTokenCard(att.card) && !att.copiedFromReflection && att.card.code !== 'UNL-T06' && att.card.name_en !== 'Reflection') {
					trash = [...trash, att.card];
				}
			}
			item.attachments = [];
		}
	}

	function removeAttachment(attachmentId: string): BoardItem | null {
		let foundAttachment: BoardItem | null = null;

		const checkAndRemove = (list: BoardItem[]) => {
			for (const parent of list) {
				if (parent.attachments) {
					const idx = parent.attachments.findIndex((att) => att.id === attachmentId);
					if (idx !== -1) {
						foundAttachment = parent.attachments[idx];
						parent.attachments = parent.attachments.filter((att) => att.id !== attachmentId);
						return true;
					}
				}
			}
			return false;
		};

		if (checkAndRemove(playerBase)) {
			playerBase = [...playerBase];
		} else if (checkAndRemove(bf1.playerSide)) {
			bf1 = { ...bf1 };
		} else if (checkAndRemove(bf2.playerSide)) {
			bf2 = { ...bf2 };
		}

		return foundAttachment;
	}

	function findAndRemoveAttachment(parentId: string, attId: string): BoardItem | null {
		let foundAttachment: BoardItem | null = null;

		const checkAndRemove = (list: BoardItem[]) => {
			const parent = list.find((x) => x.id === parentId);
			if (parent && parent.attachments) {
				const idx = parent.attachments.findIndex((att) => att.id === attId);
				if (idx !== -1) {
					foundAttachment = parent.attachments[idx];
					parent.attachments = parent.attachments.filter((att) => att.id !== attId);
					return true;
				}
			}
			return false;
		};

		if (checkAndRemove(playerBase)) {
			playerBase = [...playerBase];
		} else if (checkAndRemove(bf1.playerSide)) {
			bf1 = { ...bf1 };
		} else if (checkAndRemove(bf2.playerSide)) {
			bf2 = { ...bf2 };
		}

		return foundAttachment;
	}

	function findAndRemoveBoardItem(id: string, zone: string): BoardItem | null {
		let item: BoardItem | null = null;
		if (zone === 'base') {
			item = playerBase.find((x) => x.id === id) || null;
			playerBase = playerBase.filter((x) => x.id !== id);
		} else if (zone === 'bf1') {
			item = bf1.playerSide.find((x) => x.id === id) || null;
			bf1.playerSide = bf1.playerSide.filter((x) => x.id !== id);
		} else if (zone === 'bf2') {
			item = bf2.playerSide.find((x) => x.id === id) || null;
			bf2.playerSide = bf2.playerSide.filter((x) => x.id !== id);
		} else if (zone === 'bf1_hidden') {
			item = bf1.hiddenCard;
			if (item?.id === id) bf1.hiddenCard = null;
		} else if (zone === 'bf2_hidden') {
			item = bf2.hiddenCard;
			if (item?.id === id) bf2.hiddenCard = null;
		} else if (zone === 'rune') {
			item = activeRunes.find((x) => x.id === id) || null;
			activeRunes = activeRunes.filter((x) => x.id !== id);
		}
		return item;
	}

	// Helper to handle all drop actions (from hand or other board zones)
	function handleDrop(dataStr: string, targetZone: 'base' | 'bf1' | 'bf2' | 'bf1_hidden' | 'bf2_hidden') {
		if (!dataStr) return;

		if (dataStr.startsWith('hand:')) {
			const idx = parseInt(dataStr.substring(5), 10);
			if (!isNaN(idx)) {
				playCard(idx, targetZone);
			}
		} else if (dataStr.startsWith('board:')) {
			const parts = dataStr.split(':');
			if (parts.length >= 3) {
				const sourceZone = parts[1];
				const itemId = parts[2];

				let foundItem: BoardItem | null = null;
				if (sourceZone === 'attachment' && parts.length === 4) {
					const parentId = parts[2];
					const attId = parts[3];
					foundItem = findAndRemoveAttachment(parentId, attId);
				} else {
					if (sourceZone === 'base') {
						foundItem = playerBase.find((x) => x.id === itemId) || null;
					} else if (sourceZone === 'bf1') {
						foundItem = bf1.playerSide.find((x) => x.id === itemId) || null;
					} else if (sourceZone === 'bf2') {
						foundItem = bf2.playerSide.find((x) => x.id === itemId) || null;
					}
					if (foundItem) {
						removeBoardItem(foundItem.id, sourceZone, true);
					}
				}

				if (foundItem) {
					// Add to target
					const updatedItem = { ...foundItem };
					if (targetZone === 'base') {
						playerBase = [...playerBase, updatedItem];
					} else if (targetZone === 'bf1') {
						bf1.playerSide = [...bf1.playerSide, updatedItem];
					} else if (targetZone === 'bf2') {
						bf2.playerSide = [...bf2.playerSide, updatedItem];
					}
				}
			}
		} else {
			// Fallback for old index-only drag data
			const idx = parseInt(dataStr, 10);
			if (!isNaN(idx)) {
				playCard(idx, targetZone);
			}
		}
	}

	function handleDropOnCard(dataStr: string, targetItem: BoardItem, targetZone: string) {
		if (!dataStr) return;

		let droppedItem: BoardItem | null = null;

		if (dataStr.startsWith('hand:')) {
			const idx = parseInt(dataStr.substring(5), 10);
			if (!isNaN(idx)) {
				const card = hand[idx];
				// Remove from hand
				hand = hand.filter((_, i) => i !== idx);
				activeMenuCardIdx = null;

				// Create BoardItem
				droppedItem = {
					id: Math.random().toString(36).substr(2, 9),
					card,
					isExhausted: false,
					counters: 0,
					isFacedown: false
				};

				// Deduct energy if applicable
				if (card.energy !== null && card.energy !== undefined) {
					let cost = card.energy;
					for (let i = 0; i < activeRunes.length && cost > 0; i++) {
						if (!activeRunes[i].isExhausted) {
							activeRunes[i].isExhausted = true;
							cost--;
						}
					}
					activeRunes = [...activeRunes];
				}
			}
		} else if (dataStr.startsWith('board:')) {
			const parts = dataStr.split(':');
			if (parts.length >= 3) {
				const sourceZone = parts[1];
				const itemId = parts[2];

				if (sourceZone === 'attachment' && parts.length === 4) {
					const parentId = parts[2];
					const attId = parts[3];
					if (attId === targetItem.id || parentId === targetItem.id) return; // Prevent cycles
					droppedItem = findAndRemoveAttachment(parentId, attId);
				} else {
					if (itemId === targetItem.id) return; // Prevent attaching to self
					droppedItem = findAndRemoveBoardItem(itemId, sourceZone);
				}
			}
		}

		if (droppedItem) {
			if (!targetItem.attachments) {
				targetItem.attachments = [];
			}
			targetItem.attachments = [...targetItem.attachments, droppedItem];
			refreshZoneState(targetZone);
		}
	}

	function removeBoardItem(id: string, zone: string, keepAttachments = false) {
		let foundItem: BoardItem | null = null;
		if (zone.startsWith('attachment:')) {
			removeAttachment(id);
			return;
		}
		if (zone === 'base') {
			foundItem = playerBase.find((x) => x.id === id) || null;
			playerBase = playerBase.filter((x) => x.id !== id);
		} else if (zone === 'bf1') {
			foundItem = bf1.playerSide.find((x) => x.id === id) || null;
			bf1.playerSide = bf1.playerSide.filter((x) => x.id !== id);
		} else if (zone === 'bf2') {
			foundItem = bf2.playerSide.find((x) => x.id === id) || null;
			bf2.playerSide = bf2.playerSide.filter((x) => x.id !== id);
		} else if (zone === 'bf1_hidden') {
			foundItem = bf1.hiddenCard;
			if (foundItem?.id === id) bf1.hiddenCard = null;
		} else if (zone === 'bf2_hidden') {
			foundItem = bf2.hiddenCard;
			if (foundItem?.id === id) bf2.hiddenCard = null;
		} else if (zone === 'rune') {
			foundItem = activeRunes.find((x) => x.id === id) || null;
			activeRunes = activeRunes.filter((x) => x.id !== id);
		}

		if (foundItem && !keepAttachments) {
			discardAttachmentsOf(foundItem);
		}
	}

	function detachItem(parentItem: BoardItem, zone: string, attachmentIndex: number, target: 'hand' | 'trash' | 'banished') {
		if (!parentItem.attachments || parentItem.attachments.length <= attachmentIndex) return;

		const [detached] = parentItem.attachments.splice(attachmentIndex, 1);
		parentItem.attachments = [...parentItem.attachments];

		if (target === 'hand') {
			hand = [...hand, detached.card];
		} else if (target === 'trash') {
			if (!isTokenCard(detached.card) && !detached.copiedFromReflection && detached.card.code !== 'UNL-T06' && detached.card.name_en !== 'Reflection') {
				trash = [...trash, detached.card];
			}
		} else if (target === 'banished') {
			banished = [...banished, detached.card];
		}

		refreshZoneState(zone);
	}

	// Item modifiers
	function toggleExhaustItem(item: BoardItem, zone: string) {
		item.isExhausted = !item.isExhausted;
		refreshZoneState(zone);
	}

	function addCounterItem(item: BoardItem, zone: string) {
		item.counters += 1;
		refreshZoneState(zone);
	}

	function removeCounterItem(item: BoardItem, zone: string) {
		item.counters = Math.max(0, item.counters - 1);
		refreshZoneState(zone);
	}

	function adjustMightModifier(item: BoardItem, amount: number, zone: string) {
		item.mightModifier = (item.mightModifier ?? 0) + amount;
		refreshZoneState(zone);
	}

	function adjustDamageReceived(item: BoardItem, amount: number, zone: string) {
		item.damageReceived = Math.max(0, (item.damageReceived ?? 0) + amount);
		refreshZoneState(zone);
	}

	function removeItemToTrash(item: BoardItem, zone: string) {
		removeBoardItem(item.id, zone);
		if (!isTokenCard(item.card) && !item.copiedFromReflection && item.card.code !== 'UNL-T06' && item.card.name_en !== 'Reflection') {
			trash = [...trash, item.card];
		}
		activeMenuBoardItem = null;
	}

	function removeItemToBanish(item: BoardItem, zone: string) {
		removeBoardItem(item.id, zone);
		banished = [...banished, item.card];
		activeMenuBoardItem = null;
	}

	function revealFacedownItem(item: BoardItem, zone: string) {
		item.isFacedown = false;
		refreshZoneState(zone);
		activeMenuBoardItem = null;
	}
	function parseCardAbilityAndBuildActions(card: Card) {
		const text = (card.ability_en || '').toLowerCase();
		const actions: any[] = [];
		let requires_user_confirmation = false;
		let confirmation_message = '';

		// 1. Draw cards
		const drawMatch = text.match(/draw\s+(\d+)\s+card/);
		if (drawMatch) {
			const val = parseInt(drawMatch[1], 10);
			actions.push({
				type: 'draw_card',
				value: val,
				description: `จั่วการ์ด ${val} ใบ`
			});
		}

		// 2. Score points
		const scoreMatch = text.match(/score\s+(\d+)\s+point/);
		if (scoreMatch) {
			const val = parseInt(scoreMatch[1], 10);
			actions.push({
				type: 'modify_score',
				value: val,
				description: `ได้รับคะแนน ${val} แต้ม`
			});
		}

		// 3. Gain Energy
		const gainEnergyMatch = text.match(/gain\s+(\d+)\s+energy/);
		if (gainEnergyMatch) {
			const val = parseInt(gainEnergyMatch[1], 10);
			actions.push({
				type: 'modify_energy',
				value: val,
				description: `ได้รับพลังงาน ${val} หน่วย`
			});
		}

		// 4. Lose Energy / Pay Energy
		const loseEnergyMatch = text.match(/(?:lose|pay)\s+(\d+)\s+energy/);
		if (loseEnergyMatch) {
			const val = parseInt(loseEnergyMatch[1], 10);
			actions.push({
				type: 'modify_energy',
				value: -val,
				description: `เสียพลังงาน ${val} หน่วย`
			});
		}

		// 5. Channel runes
		const channelMatch = text.match(/channel\s+(\d+)\s+rune/);
		if (channelMatch) {
			const val = parseInt(channelMatch[1], 10);
			actions.push({
				type: 'channel_rune',
				value: val,
				description: `Channel รูน ${val} ใบ`
			});
		} else if (text.includes('channel a rune') || text.includes('channel 1 rune')) {
			actions.push({
				type: 'channel_rune',
				value: 1,
				description: 'Channel รูน 1 ใบ'
			});
		}

		// 6. Recycle runes
		if (text.includes('recycle a rune') || text.includes('recycle 1 rune')) {
			actions.push({
				type: 'recycle_rune',
				description: 'รีไซเคิลการ์ดรูน 1 ใบ'
			});
		}

		// Optional check: contains "you may" or "พวกเขาสามารถ" or "คุณสามารถ"
		if (text.includes('you may') || (card.ability_th && (card.ability_th.includes('คุณสามารถ') || card.ability_th.includes('อาจจะ')))) {
			requires_user_confirmation = true;
			confirmation_message = `การ์ดใบนี้ระบุความสามารถทางเลือก "คุณสามารถ..." คุณต้องการเปิดใช้งานความสามารถทางเลือกนี้หรือไม่?`;
		}

		const ability_summary = card.ability_th 
			? card.ability_th.split('\n')[0] 
			: (card.ability_en ? card.ability_en.split('\n')[0] : 'ใช้ความสามารถการ์ด');

		return {
			ability_summary,
			requires_user_confirmation,
			confirmation_message: requires_user_confirmation ? confirmation_message : null,
			actions
		};
	}

	function runAutoSkillFor(card: Card) {
		selectedPopupCard = null; // Close card info modal
		autoSkillError = '';
		skillAnalysisResult = null;
		skillCardToTrigger = card;

		try {
			const parsed = parseCardAbilityAndBuildActions(card);
			
			if (parsed.actions.length === 0) {
				throw new Error('ไม่พบความสามารถที่ระบบสามารถประมวลผลอัตโนมัติได้บนการ์ดใบนี้ (การ์ดใบนี้อาจมีความสามารถเฉพาะทางหรือเอฟเฟกต์เชิงรับ กรุณาปรับเปลี่ยนสถานะบอร์ดด้วยตนเอง)');
			}

			skillAnalysisResult = parsed;
		} catch (error: any) {
			console.error(error);
			autoSkillError = error.message || 'เกิดข้อผิดพลาดในการประมวลผล';
		}
	}

	function executeSkillActions() {
		if (!skillAnalysisResult || !skillAnalysisResult.actions) return;

		for (const action of skillAnalysisResult.actions) {
			try {
				if (action.type === 'modify_energy') {
					let val = action.value;
					if (val > 0) {
						// Ready 'val' exhausted runes
						for (let i = 0; i < activeRunes.length && val > 0; i++) {
							if (activeRunes[i].isExhausted) {
								activeRunes[i].isExhausted = false;
								val--;
							}
						}
					} else if (val < 0) {
						// Exhaust 'Math.abs(val)' ready runes
						let toExhaust = Math.abs(val);
						for (let i = 0; i < activeRunes.length && toExhaust > 0; i++) {
							if (!activeRunes[i].isExhausted) {
								activeRunes[i].isExhausted = true;
								toExhaust--;
							}
						}
					}
					activeRunes = [...activeRunes];
				} else if (action.type === 'modify_score') {
					playerScore = Math.max(0, Math.min(8, playerScore + action.value));
				} else if (action.type === 'draw_card') {
					for (let i = 0; i < action.value; i++) {
						drawCard();
					}
				} else if (action.type === 'channel_rune') {
					channelRune(action.value);
				} else if (action.type === 'recycle_rune') {
					if (activeRunes.length > 0) {
						recycleRune(activeRunes[0]);
					}
				}
			} catch (err) {
				console.error('Failed to execute action:', action, err);
			}
		}

		skillAnalysisResult = null;
		skillCardToTrigger = null;
	}

	function cancelSkillActions() {
		skillAnalysisResult = null;
		skillCardToTrigger = null;
	}
	function openTransformMenu(item: BoardItem, zone: string) {
		transformTargetItem = item;
		transformTargetZone = zone;
		transformSearch = '';
		isTransformMenuOpen = true;
		activeMenuBoardItem = null;
	}

	function transformReflectionTo(selectedCard: Card) {
		if (transformTargetItem) {
			transformTargetItem.card = selectedCard;
			transformTargetItem.copiedFromReflection = true;
			refreshZoneState(transformTargetZone);
		}
		isTransformMenuOpen = false;
		transformSearch = '';
		transformTargetItem = null;
	}

	function refreshZoneState(zone: string) {
		if (zone === 'base') {
			playerBase = [...playerBase];
		} else if (zone === 'bf1') {
			bf1 = { ...bf1 };
		} else if (zone === 'bf2') {
			bf2 = { ...bf2 };
		} else if (zone === 'bf1_hidden') {
			bf1.hiddenCard = bf1.hiddenCard;
		} else if (zone === 'bf2_hidden') {
			bf2.hiddenCard = bf2.hiddenCard;
		} else if (zone === 'rune') {
			activeRunes = [...activeRunes];
		}
	}

	let activePlaygroundStep = $state<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('E');

	const playgroundSteps: {
		key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
		label: string;
		desc: string;
		icon: string;
		color: string;
	}[] = [
		{ key: 'A', label: 'Awaken', desc: 'ฟื้นสภาพการ์ด', icon: '', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
		{ key: 'B', label: 'Beginning', desc: 'เริ่มเทิร์น', icon: '', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
		{ key: 'C', label: 'Channel', desc: 'ชาร์จรูน', icon: '', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
		{ key: 'D', label: 'Draw', desc: 'จั่วการ์ด', icon: '', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
		{ key: 'E', label: 'Action', desc: 'วางแผนหลัก', icon: '', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
		{ key: 'F', label: 'End', desc: 'จบเทิร์น', icon: '', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
	];

	let energyRunes = $derived.by(() => {
		return [...activeRunes].sort((a, b) => {
			if (a.isExhausted && !b.isExhausted) return 1;
			if (!a.isExhausted && b.isExhausted) return -1;
			return 0;
		});
	});

	function getRuneColorClass(card: Card, isExhausted: boolean) {
		const dom = (card.domains && card.domains[0] || '').toLowerCase().trim();
		if (isExhausted) {
			if (dom === 'fire') return 'bg-red-950/70 border-red-900/30';
			if (dom === 'water') return 'bg-blue-950/70 border-blue-900/30';
			if (dom === 'earth') return 'bg-emerald-950/70 border-emerald-900/30';
			if (dom === 'air') return 'bg-sky-950/70 border-sky-900/30';
			return 'bg-slate-900 border-slate-800/30';
		} else {
			if (dom === 'fire') return 'bg-gradient-to-tr from-red-600 to-orange-500 shadow-md shadow-red-500/20 border-red-400/30';
			if (dom === 'water') return 'bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 border-blue-400/30';
			if (dom === 'earth') return 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20 border-emerald-400/30';
			if (dom === 'air') return 'bg-gradient-to-tr from-sky-400 to-indigo-400 shadow-md shadow-sky-500/20 border-sky-300/30';
			return 'bg-gradient-to-tr from-slate-600 to-slate-400 border-slate-400/30';
		}
	}

	function goToStep(step: 'A' | 'B' | 'C' | 'D' | 'E' | 'F', runLogic = false) {
		activePlaygroundStep = step;
		
		if (runLogic) {
			if (step === 'A') {
				// Step A: Awaken (Untap / Ready Phase)
				playerBase.forEach((x) => (x.isExhausted = false));
				bf1.playerSide.forEach((x) => (x.isExhausted = false));
				bf2.playerSide.forEach((x) => (x.isExhausted = false));
				activeRunes.forEach((x) => (x.isExhausted = false));
				isLegendExhausted = false;

				playerBase = [...playerBase];
				bf1 = { ...bf1 };
				bf2 = { ...bf2 };
				activeRunes = [...activeRunes];
			} else if (step === 'B') {
				// Step B: Beginning Phase
			} else if (step === 'C') {
				// Step C: Channel Phase
				// In Riftbound, we channel 2 runes
				channelRune(2);
			} else if (step === 'D') {
				// Step D: Draw Phase
				// Draw 1 card
				drawCard();
			} else if (step === 'E') {
				// Step E: Action Phase
			} else if (step === 'F') {
				// Step F: End Phase
			}
		}
	}

	function proceedNextStep() {
		if (activePlaygroundStep === 'A') {
			goToStep('B', true);
		} else if (activePlaygroundStep === 'B') {
			goToStep('C', true);
		} else if (activePlaygroundStep === 'C') {
			goToStep('D', true);
		} else if (activePlaygroundStep === 'D') {
			goToStep('E', true);
		} else if (activePlaygroundStep === 'E') {
			goToStep('F', true);
		} else if (activePlaygroundStep === 'F') {
			turn += 1;
			goToStep('A', true);
		}
	}

	// Spawner Selector
	let filteredSpawnCards = $derived.by(() => {
		const list = cards.filter((c) => isTokenCard(c));

		if (!spawnSearch.trim()) return list.slice(0, 20);
		const q = spawnSearch.toLowerCase();
		return list.filter(
			(c) =>
				c.name_en.toLowerCase().includes(q) ||
				(c.name_th && c.name_th.toLowerCase().includes(q)) ||
				c.type.toLowerCase().includes(q) ||
				c.code.toLowerCase().includes(q)
		).slice(0, 20);
	});

	function spawnCardOnBoard(card: Card) {
		const item: BoardItem = {
			id: Math.random().toString(36).substr(2, 9),
			card,
			isExhausted: false,
			counters: 0,
			isFacedown: spawnTargetZone.endsWith('_hidden')
		};

		if (spawnTargetZone === 'base') {
			playerBase = [...playerBase, item];
		} else if (spawnTargetZone === 'bf1') {
			bf1.playerSide = [...bf1.playerSide, item];
		} else if (spawnTargetZone === 'bf2') {
			bf2.playerSide = [...bf2.playerSide, item];
		} else if (spawnTargetZone === 'bf1_hidden') {
			if (bf1.hiddenCard && !isTokenCard(bf1.hiddenCard.card) && !bf1.hiddenCard.copiedFromReflection && bf1.hiddenCard.card.code !== 'UNL-T06' && bf1.hiddenCard.card.name_en !== 'Reflection') trash = [...trash, bf1.hiddenCard.card];
			bf1.hiddenCard = item;
		} else if (spawnTargetZone === 'bf2_hidden') {
			if (bf2.hiddenCard && !isTokenCard(bf2.hiddenCard.card) && !bf2.hiddenCard.copiedFromReflection && bf2.hiddenCard.card.code !== 'UNL-T06' && bf2.hiddenCard.card.name_en !== 'Reflection') trash = [...trash, bf2.hiddenCard.card];
			bf2.hiddenCard = item;
		}

		isSpawnMenuOpen = false;
		spawnSearch = '';
	}

	function openSpawnMenu(zone: 'base' | 'bf1' | 'bf2' | 'bf1_hidden' | 'bf2_hidden') {
		spawnTargetZone = zone;
		isSpawnMenuOpen = true;
	}

	// Battlefield selection
	function openBfPicker(target: 'bf1' | 'bf2') {
		bfPickerTarget = target;
		isBfPickerOpen = true;
	}

	function setBattlefield(card: Card) {
		if (bfPickerTarget === 'bf1') bf1.card = card;
		else bf2.card = card;
		isBfPickerOpen = false;
	}

	// Pile Viewer return
	function returnCardToHand(card: Card, sourcePile: 'trash' | 'banished' | 'deck') {
		if (sourcePile === 'trash') {
			const idx = trash.findIndex((c) => c.code === card.code);
			if (idx !== -1) trash.splice(idx, 1);
			trash = [...trash];
		} else if (sourcePile === 'banished') {
			const idx = banished.findIndex((c) => c.code === card.code);
			if (idx !== -1) banished.splice(idx, 1);
			banished = [...banished];
		} else if (sourcePile === 'deck') {
			const idx = library.findIndex((c) => c.code === card.code);
			if (idx !== -1) library.splice(idx, 1);
			library = [...library];
		}
		hand = [...hand, card];
	}

	function banishCardFromPile(card: Card, sourcePile: 'trash' | 'deck' | 'banished') {
		if (sourcePile === 'banished') return;
		if (sourcePile === 'trash') {
			const idx = trash.findIndex((c) => c.code === card.code);
			if (idx !== -1) trash.splice(idx, 1);
			trash = [...trash];
		} else if (sourcePile === 'deck') {
			const idx = library.findIndex((c) => c.code === card.code);
			if (idx !== -1) library.splice(idx, 1);
			library = [...library];
		}
		banished = [...banished, card];
	}
</script>

<svelte:head>
	<title>Playground - RiftThai</title>
	<meta name="description" content="พื้นที่ลองเด็คและทดลองเล่นบอร์ดการ์ดเกม Riftbound แบบคนเดียว" />
</svelte:head>

<svelte:window oncontextmenu={(e) => e.preventDefault()} />

<div class="min-h-screen pb-44 text-slate-100 selection:bg-cyan-500/30">
	<!-- Navbar / Header -->
	<header class="border-b border-white/5 bg-slate-950/70 p-4 backdrop-blur-md sticky top-0 z-[100]">
		<div class="mx-auto flex flex-wrap items-center justify-between gap-4 max-w-[1400px]">
			<div class="flex items-center gap-3">
				<a href={deckId ? `/deck/${deckId}` : '/deck'} class="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition">
					&larr; Back to Deck
				</a>
				<span class="text-slate-600">|</span>
				<h1 class="text-lg font-black tracking-widest text-white uppercase italic flex items-center gap-2">
					Playground <span class="text-xs normal-case not-italic font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">Riftbound Board</span>
				</h1>
			</div>

			<!-- Stats moved to inline sidebar -->

			<div class="flex items-center gap-2">
				{#if isGameStarted}
					<button type="button" onclick={startGame} class="border border-white/10 hover:bg-white/5 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold transition">
						Reset Game
					</button>
				{/if}
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-[1400px] p-4">
		<!-- Setup Screen -->
		{#if !isGameStarted}
			<div class="my-12 mx-auto max-w-2xl text-center">
				<div class="rt-panel p-6 sm:p-10 rounded-2xl border border-white/10 bg-[#0a0f18]/90 shadow-2xl backdrop-blur-xl">
					<div class="rt-kicker mb-2">Setup Playground</div>
					<h2 class="text-3xl font-black text-white uppercase italic mb-6">เลือกเด็คเพื่อเข้าบอร์ดทดลอง</h2>

					{#if loadedDeck && loadedDeckZones}
						{@const champion = cards.find((c) => c.code === loadedDeck?.championCode && c.type !== 'Legend')}
						<div class="mb-6 p-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 text-left flex flex-col gap-4">
							<div class="flex justify-between items-center w-full pb-3 border-b border-white/5">
								<div>
									<div class="text-[10px] font-black uppercase text-cyan-300 tracking-wider">โหลดอยู่ (Loaded):</div>
									<div class="text-lg font-black text-white">{loadedDeck.name}</div>
									<div class="text-xs text-slate-400">แก้ไขล่าสุดเมื่อ {new Date(loadedDeck.updatedAt).toLocaleDateString()}</div>
								</div>
								<button type="button" onclick={() => loadedDeck && selectDeck(loadedDeck)} class="bg-cyan-400 text-slate-950 text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-lg shadow-lg hover:bg-cyan-300 transition active:scale-95">
									ตกลง ใช้เด็คนี้เพื่อเล่น
								</button>
							</div>

							<!-- Detailed Deck List Preview (like in deck details page) -->
							<div class="space-y-5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
								<!-- Setup Cards -->
								<div>
									<h4 class="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2">Setup Cards (Legend / Champion / Battlefields)</h4>
									<div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
										{#each loadedDeckZones.legends as item}
											{@render SetupPreviewCard(item.card, item.quantity)}
										{/each}
										{#if champion}
											{@render SetupPreviewCard(champion, 1)}
										{/if}
										{#each loadedDeckZones.battlefields as item}
											{@render SetupPreviewCard(item.card, item.quantity)}
										{/each}
									</div>
								</div>

								<!-- Rune Deck -->
								{#if loadedDeckZones.runes.length > 0}
									<div>
										<h4 class="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2">Rune Deck (รูน)</h4>
										<div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
											{#each loadedDeckZones.runes as item}
												{@render SetupPreviewCard(item.card, item.quantity)}
											{/each}
										</div>
									</div>
								{/if}

								<!-- Main Deck -->
								{#if loadedDeckZones.main.length > 0}
									<div>
										<h4 class="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2">Main Deck (ยูนิต / เวทมนตร์ / อุปกรณ์)</h4>
										<div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
											{#each loadedDeckZones.main as item}
												{@render SetupPreviewCard(item.card, item.quantity)}
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					{#snippet SetupPreviewCard(card: Card, qty: number)}
						<button
							type="button"
							onclick={() => selectedPopupCard = card}
							class="group relative aspect-[132/184] rounded-lg overflow-hidden border border-white/10 bg-slate-900/60 hover:border-cyan-300 transition text-left"
						>
							{#if card.image_url}
								<img src={getCardImageUrl(card.image_url, 120, 'webp')} alt={card.name_en} class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
							{:else}
								<div class="p-1 h-full flex items-center justify-center text-[8px] font-black uppercase text-slate-400 text-center">
									{card.name_en}
								</div>
							{/if}
							<div class="absolute bottom-1 right-1 bg-slate-950/85 text-[8.5px] font-black text-cyan-300 px-1 rounded shadow border border-white/5">
								x{qty}
							</div>
							<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase tracking-wider text-white transition">
								View
							</div>
						</button>
					{/snippet}

					<div class="mb-8">
						<label for="deck-id-input" class="block text-xs font-black uppercase text-slate-400 text-left mb-2 tracking-wider">ใส่ ID เด็ค (จาก URL)</label>
						<div class="flex gap-2">
							<input
								id="deck-id-input"
								type="text"
								bind:value={searchDeckId}
								placeholder="เช่น feature/collection-and-upvotes หรือ UUID อื่นๆ"
								class="flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-300 focus:outline-none"
							/>
							<button type="button" onclick={() => loadDeckById(searchDeckId)} class="bg-slate-800 border border-white/10 text-xs font-black uppercase tracking-wider text-slate-200 px-4 rounded-lg hover:bg-slate-700 transition">
								โหลดเด็ค
							</button>
						</div>
					</div>

					<div class="text-left">
						<h3 class="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">คลังเด็คในเครื่องของคุณ:</h3>
						{#if localDecks.length === 0}
							<div class="text-center p-6 border border-dashed border-white/5 rounded-xl text-slate-500 text-sm font-medium">
								ไม่พบเด็คที่บันทึกในเครื่องนี้ กรุณาสร้างเด็คก่อน
							</div>
						{:else}
							<div class="grid gap-3 sm:grid-cols-2">
								{#each localDecks as d}
									{@const { legend, champion } = getDeckLegendAndChampion(d)}
									<button
										type="button"
										onclick={() => { loadedDeck = d; deckId = d.id; }}
										class="p-4 rounded-xl border border-white/5 bg-slate-900/40 text-left hover:border-cyan-300/40 hover:bg-slate-900/80 transition flex flex-col justify-between gap-3 group {loadedDeck?.id === d.id ? 'ring-2 ring-cyan-400 border-transparent bg-slate-900/90' : ''}"
									>
										<div>
											<div class="font-black text-sm text-slate-200 group-hover:text-cyan-300 transition truncate w-full">{d.name}</div>
											<div class="text-[9px] text-slate-500 mt-1">
												อัปเดต: {new Date(d.updatedAt).toLocaleDateString()}
											</div>
										</div>

										<div class="flex gap-2 w-full border-t border-white/5 pt-2">
											{#if legend}
												<div class="flex items-center gap-1.5 min-w-0 flex-1">
													{#if legend.image_url}
														<img src={getCardImageUrl(legend.image_url, 80, 'webp')} alt={legend.name_en} class="w-6 h-8 object-cover rounded bg-slate-950 shrink-0" />
													{/if}
													<span class="text-[9px] font-bold text-slate-400 truncate">{legend.name_en}</span>
												</div>
											{/if}
											{#if champion}
												<div class="flex items-center gap-1.5 min-w-0 flex-1 border-l border-white/5 pl-2">
													{#if champion.image_url}
														<img src={getCardImageUrl(champion.image_url, 80, 'webp')} alt={champion.name_en} class="w-6 h-8 object-cover rounded bg-slate-950 shrink-0" />
													{/if}
													<span class="text-[9px] font-bold text-slate-400 truncate">{champion.name_en}</span>
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

		{:else}
			<!-- Master Layout Grid: Board on left, Stats on right on PC; Stats on top, Board on bottom on mobile -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				
				<!-- Stats / Resource / Sequencer Sidebar (lg:fixed lg:right-6 lg:top-24 lg:w-72 lg:z-[100], order-1 (top) on mobile, order-2 (right) on PC) -->
				<div class="lg:fixed lg:right-6 lg:top-24 lg:w-72 lg:z-[100] space-y-4 order-1 lg:order-2 w-full lg:w-auto">
					<!-- Deck Identity Runes (above Turn) -->
					{#if activeDeck}
						<div class="rt-panel p-3 rounded-xl border border-white/5 bg-slate-900/60">
							<div class="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-2">Deck Identity Runes</div>
							<div class="flex flex-wrap gap-1.5">
								{#each calculateDeckStats(buildDeckCards(cards, activeDeck.entries ?? [])).domains as dom}
									<div class="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-white/5">
										{#if getDomainIcon(dom.label)}
											<img src={getDomainIcon(dom.label)} class="h-3.5 w-3.5 object-contain" alt={dom.label} />
										{/if}
										<span class="text-[9px] font-black uppercase tracking-wider text-slate-300">{dom.label}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Turn, Energy, Score Card Grid -->
					<div class="grid grid-cols-3 lg:grid-cols-1 gap-3">
						<!-- Turn Card -->
						<div class="rt-panel p-3 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between gap-2">
							<div class="flex items-center justify-between">
								<div>
									<div class="text-[8px] font-black uppercase text-slate-500 tracking-wider">Round / Turn</div>
									<div class="text-xl font-black text-cyan-300">Turn {turn}</div>
								</div>
							</div>
							<button 
								type="button" 
								onclick={proceedNextStep} 
								class="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[9px] font-black tracking-widest uppercase py-1.5 rounded-lg shadow-md hover:from-cyan-300 hover:to-teal-300 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
							>
								PROCEED
							</button>
						</div>

						<!-- Energy Pool -->
						<div class="rt-panel p-3 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between gap-2.5">
							<div>
								<div class="text-[8px] font-black uppercase text-slate-500 tracking-wider">Energy Pool</div>
								<div class="text-xl font-black text-amber-400 mt-0.5">{energy} <span class="text-xs text-slate-500 font-bold">/ {maxEnergy}</span></div>
								
								<!-- Diagonal Bars representing active runes -->
								{#if energyRunes.length > 0}
									<div class="flex items-center gap-1 h-3.5 mt-2 overflow-x-auto custom-scrollbar pb-0.5">
										{#each energyRunes as item}
											{@const colorClass = getRuneColorClass(item.card, item.isExhausted)}
											<div 
												class="h-full w-2 skew-x-[-15deg] rounded-xs border transition-all duration-200 shrink-0 {colorClass}"
												title="{item.card.name_en} {item.isExhausted ? '(Exhausted)' : '(Ready)'}"
											></div>
										{/each}
									</div>
								{:else}
									<div class="text-[8px] text-slate-600 font-bold mt-2">No active runes</div>
								{/if}
							</div>
							<div class="flex gap-1.5">
								<button type="button" onclick={() => {
									const readyRune = activeRunes.find((r) => !r.isExhausted);
									if (readyRune) {
										readyRune.isExhausted = true;
										activeRunes = [...activeRunes];
									}
								}} class="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded font-bold text-[10px] text-slate-200 cursor-pointer">-1</button>
								<button type="button" onclick={() => {
									const exhaustedRune = activeRunes.find((r) => r.isExhausted);
									if (exhaustedRune) {
										exhaustedRune.isExhausted = false;
										activeRunes = [...activeRunes];
									}
								}} class="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded font-bold text-[10px] text-amber-400 cursor-pointer">+1</button>
							</div>
						</div>

						<!-- Score Card -->
						<div class="rt-panel p-3 rounded-xl border border-cyan-500/10 bg-cyan-950/5/20 flex flex-col justify-between gap-2">
							<div>
								<div class="text-[8px] font-black uppercase text-cyan-400 tracking-wider">Score</div>
								<div class="text-xl font-black text-emerald-400 mt-0.5">{playerScore} <span class="text-xs text-slate-500 font-bold">/ 8</span></div>
							</div>
							<div class="flex gap-1.5">
								<button type="button" onclick={() => playerScore = Math.max(0, playerScore - 1)} class="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded font-bold text-[10px] text-slate-200 cursor-pointer">-1</button>
								<button type="button" onclick={() => playerScore = Math.min(8, playerScore + 1)} class="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded font-bold text-[10px] text-emerald-400 cursor-pointer">+1</button>
							</div>
						</div>
					</div>

					<!-- Turn Sequencer Timeline -->
					<div class="rt-panel p-3.5 rounded-xl border border-white/5 bg-slate-900/40">
						<div class="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-2">Turn Sequencer</div>
						
						<!-- Stepper List: Horizontal Scroll on Mobile, Vertical Stack on Desktop -->
						<div class="flex flex-row overflow-x-auto gap-2 lg:flex-col lg:overflow-visible custom-scrollbar pb-1 lg:pb-0">
							{#each playgroundSteps as stepData}
								{@const isActive = activePlaygroundStep === stepData.key}
								<button
									type="button"
									onclick={() => goToStep(stepData.key, true)}
									class="min-w-[100px] flex-1 lg:w-full flex items-center gap-2 p-2 rounded-lg border text-left transition shrink-0 cursor-pointer {isActive ? stepData.color + ' ring-1 ring-white/10' : 'bg-slate-950/20 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'}"
								>
									<div class="w-5.5 h-5.5 rounded bg-black/40 border border-white/5 flex items-center justify-center text-[9px] shrink-0 font-mono font-bold {isActive ? 'text-white font-black' : 'text-slate-500'}">
										{stepData.key}
									</div>
									<div class="min-w-0 flex-1">
										<div class="text-[9px] font-black uppercase tracking-wider">{stepData.label}</div>
									</div>
									<span class="text-xs shrink-0">{stepData.icon}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Left Side: Main Board Areas (lg:col-span-12 lg:pr-80, order-2 (bottom) on mobile, order-1 (left) on PC) -->
				<div class="lg:col-span-12 lg:pr-80 space-y-6 order-2 lg:order-1">
				<!-- Step Description Banner -->
				{#if activePlaygroundStep}
					{@const stepDetails = {
						A: { title: 'A: AWAKEN PHASE', desc: 'ฟื้นสภาพการ์ดยูนิต รูน และการ์ด Legend ทั้งหมดที่เหนื่อยล้า (Exhausted -> Ready) ให้พร้อมกลับมาทำงานในเทิร์นนี้', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300' },
						B: { title: 'B: BEGINNING PHASE', desc: 'เริ่มขั้นตอนเทิร์นใหม่ ตรวจสอบความสามารถของการ์ดที่ทำงาน ณ เริ่มต้นเทิร์น', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300' },
						C: { title: 'C: CHANNEL PHASE', desc: 'อัญเชิญรูนใหม่ 2 ใบลงมาบนแท่นศิลาพูนรูนเพื่อเพิ่มพลังงานสูงสุด', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' },
						D: { title: 'D: DRAW PHASE', desc: 'จั่วการ์ด 1 ใบจากเด็คหลักขึ้นมือเพื่อเป็นกำลังรบ', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' },
						E: { title: 'E: ACTION PHASE', desc: 'ช่วงวางแผนหลักของคุณ! จ่ายพลังงานเพื่อสั่งยูนิตเดินทัพ เล่นการ์ด หรือสั่งเปิดศึก Showdown', color: 'border-amber-500/20 bg-amber-500/5 text-amber-300' },
						F: { title: 'F: END PHASE', desc: 'สิ้นสุดการดำเนินแผนงานย่อย เคลียร์สถานะและความเสียหายสะสมบนตัวยูนิต และเตรียมพร้อมเริ่มขั้นตอนเริ่มต้นเทิร์นถัดไป', color: 'border-rose-500/20 bg-rose-500/5 text-rose-300' }
					}[activePlaygroundStep]}
					<div class="p-4 rounded-xl border {stepDetails.color} flex items-start gap-3 shadow-lg shadow-black/30 backdrop-blur-md">
						<div>
							<div class="text-xs font-black uppercase tracking-wider mb-1">{stepDetails.title}</div>
							<div class="text-[11px] text-slate-400 font-bold leading-relaxed">{stepDetails.desc}</div>
						</div>
					</div>
				{/if}
				
				<!-- Row 1: Battlefields & Legend/Champion -->
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<!-- Battlefield 1 (Left Column) -->
					<div class="lg:col-span-5">
						<div class="rt-panel rounded-xl border border-white/5 bg-slate-950/10 p-4 flex flex-col justify-between min-h-[380px] h-full">
							<!-- Header -->
							<div class="text-center pb-2 border-b border-white/5 mb-3 flex items-center justify-between">
								<span class="text-[10px] font-black tracking-widest text-slate-400 uppercase">BATTLEFIELD 1</span>
								<div class="flex items-center gap-1">
									<button type="button" onclick={() => openSpawnMenu('bf1')} class="text-[9px] bg-cyan-950 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 hover:bg-cyan-900 transition">+ Spawn Card</button>
								</div>
							</div>

							<!-- Battlefield Center Card Belt -->
							<div class="bg-slate-900/60 p-3 rounded-lg border border-white/5 my-3 grid grid-cols-2 gap-3 items-center">
								<!-- The Battlefield card itself -->
								<div class="flex flex-col items-center">
									<span class="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Battlefield Card</span>
									{#if bf1.card}
										<div class="relative group">
											<button type="button" onclick={() => openBfPicker('bf1')} class="w-20 aspect-[184/132] rounded-lg overflow-hidden border border-white/10 shadow-lg relative block">
												<img src={getCardImageUrl(bf1.card.image_url, 120, 'webp')} alt={bf1.card.name_en} class="h-full w-full {bf1.card.name_en === 'Baron Pit' || bf1.card.name_en === 'Brush' ? 'object-contain' : 'object-cover'}" />
												<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase tracking-wider text-white transition">Change</div>
											</button>
											<button
												type="button"
												onclick={(e) => { e.stopPropagation(); selectedPopupCard = bf1.card; }}
												class="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-black/80 hover:bg-black border border-white/10 flex items-center justify-center text-[9px] z-10 cursor-pointer"
												title="ดูรายละเอียดการ์ด"
											>
												i
											</button>
										</div>
									{:else}
										<button type="button" onclick={() => openBfPicker('bf1')} class="w-20 aspect-[184/132] border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-[9px] text-slate-600 bg-slate-950 font-bold hover:border-cyan-300/40 hover:text-slate-400 transition">
											Select
										</button>
									{/if}
								</div>

								<!-- Facedown Zone for HIDDEN cards -->
								<div class="flex flex-col items-center border-l border-white/5 pl-3">
									<div class="flex items-center gap-1 mb-1">
										<span class="text-[8px] font-black uppercase text-slate-500 tracking-wider">Facedown</span>
										<button type="button" onclick={() => openSpawnMenu('bf1_hidden')} class="text-[8px] text-cyan-300 font-bold hover:underline">+</button>
									</div>

									{#if bf1.hiddenCard}
										<div class="relative group">
											{@render BoardCard(bf1.hiddenCard, 'bf1_hidden')}
										</div>
									{:else}
										<div class="w-14 aspect-[132/184] border-2 border-dashed border-slate-700/50 rounded-lg flex items-center justify-center text-[8px] text-slate-600 bg-slate-950/40 text-center p-1 leading-tight font-medium">
											Empty Facedown Zone
										</div>
									{/if}
								</div>
							</div>

							<!-- Player Side at BF1 -->
							<div
								class="flex-1 flex flex-wrap items-center justify-center gap-3 p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10 min-h-[140px] overflow-visible align-content-start transition-colors duration-150"
								ondragover={(e) => {
									e.preventDefault();
									e.currentTarget.classList.add('bg-cyan-500/15', 'border-cyan-400/40');
								}}
								ondragleave={(e) => {
									e.currentTarget.classList.remove('bg-cyan-500/15', 'border-cyan-400/40');
								}}
								ondrop={(e) => {
									e.currentTarget.classList.remove('bg-cyan-500/15', 'border-cyan-400/40');
									const data = e.dataTransfer?.getData('text/plain');
									if (data !== undefined) {
										handleDrop(data, 'bf1');
									}
								}}
							>
								<div class="text-[8px] font-black uppercase text-cyan-500/60 tracking-wider w-full text-center mb-1">Your Forces</div>
								{#each bf1.playerSide as item}
									{@render BoardCard(item, 'bf1')}
								{/each}
								{#if bf1.playerSide.length === 0}
									<div class="text-[10px] text-slate-700 font-bold py-4">Deploy units to contest</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Battlefield 2 (Right Column) -->
					<div class="lg:col-span-5">
						<div class="rt-panel rounded-xl border border-white/5 bg-slate-950/10 p-4 flex flex-col justify-between min-h-[380px] h-full">
							<!-- Header -->
							<div class="text-center pb-2 border-b border-white/5 mb-3 flex items-center justify-between">
								<span class="text-[10px] font-black tracking-widest text-slate-400 uppercase">BATTLEFIELD 2</span>
								<div class="flex items-center gap-1">
									<button type="button" onclick={() => openSpawnMenu('bf2')} class="text-[9px] bg-cyan-950 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 hover:bg-cyan-900 transition">+ Spawn Card</button>
								</div>
							</div>

							<!-- Battlefield Center Card Belt -->
							<div class="bg-slate-900/60 p-3 rounded-lg border border-white/5 my-3 grid grid-cols-2 gap-3 items-center">
								<!-- The Battlefield card itself -->
								<div class="flex flex-col items-center">
									<span class="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Battlefield Card</span>
									{#if bf2.card}
										<div class="relative group">
											<button type="button" onclick={() => openBfPicker('bf2')} class="w-20 aspect-[184/132] rounded-lg overflow-hidden border border-white/10 shadow-lg relative block">
												<img src={getCardImageUrl(bf2.card.image_url, 120, 'webp')} alt={bf2.card.name_en} class="h-full w-full {bf2.card.name_en === 'Baron Pit' || bf2.card.name_en === 'Brush' ? 'object-contain' : 'object-cover'}" />
												<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase tracking-wider text-white transition">Change</div>
											</button>
											<button
												type="button"
												onclick={(e) => { e.stopPropagation(); selectedPopupCard = bf2.card; }}
												class="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-black/80 hover:bg-black border border-white/10 flex items-center justify-center text-[9px] z-10 cursor-pointer"
												title="ดูรายละเอียดการ์ด"
											>
												i
											</button>
										</div>
									{:else}
										<button type="button" onclick={() => openBfPicker('bf2')} class="w-20 aspect-[184/132] border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-[9px] text-slate-600 bg-slate-950 font-bold hover:border-cyan-300/40 hover:text-slate-400 transition">
											Select
										</button>
									{/if}
								</div>

								<!-- Facedown Zone for HIDDEN cards -->
								<div class="flex flex-col items-center border-l border-white/5 pl-3">
									<div class="flex items-center gap-1 mb-1">
										<span class="text-[8px] font-black uppercase text-slate-500 tracking-wider">Facedown</span>
										<button type="button" onclick={() => openSpawnMenu('bf2_hidden')} class="text-[8px] text-cyan-300 font-bold hover:underline">+</button>
									</div>

									{#if bf2.hiddenCard}
										<div class="relative group">
											{@render BoardCard(bf2.hiddenCard, 'bf2_hidden')}
										</div>
									{:else}
										<div class="w-14 aspect-[132/184] border-2 border-dashed border-slate-700/50 rounded-lg flex items-center justify-center text-[8px] text-slate-600 bg-slate-950/40 text-center p-1 leading-tight font-medium">
											Empty Facedown Zone
										</div>
									{/if}
								</div>
							</div>

							<!-- Player Side at BF2 -->
							<div
								class="flex-1 flex flex-wrap items-center justify-center gap-3 p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10 min-h-[140px] overflow-visible align-content-start transition-colors duration-150"
								ondragover={(e) => {
									e.preventDefault();
									e.currentTarget.classList.add('bg-cyan-500/15', 'border-cyan-400/40');
								}}
								ondragleave={(e) => {
									e.currentTarget.classList.remove('bg-cyan-500/15', 'border-cyan-400/40');
								}}
								ondrop={(e) => {
									e.currentTarget.classList.remove('bg-cyan-500/15', 'border-cyan-400/40');
									const data = e.dataTransfer?.getData('text/plain');
									if (data !== undefined) {
										handleDrop(data, 'bf2');
									}
								}}
							>
								<div class="text-[8px] font-black uppercase text-cyan-500/60 tracking-wider w-full text-center mb-1">Your Forces</div>
								{#each bf2.playerSide as item}
									{@render BoardCard(item, 'bf2')}
								{/each}
								{#if bf2.playerSide.length === 0}
									<div class="text-[10px] text-slate-700 font-bold py-4">Deploy units to contest</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Legend & Champion Zones -->
					<div class="lg:col-span-2">
						<div class="rt-panel p-4 rounded-xl border border-cyan-500/10 bg-cyan-950/5/20 h-full flex flex-col justify-between min-h-[380px]">
							<div class="text-center pb-2 border-b border-cyan-500/10 mb-3">
								<span class="text-[10px] font-black tracking-widest text-cyan-400 uppercase">Zones</span>
							</div>
							
							<div class="flex flex-col gap-6 items-center justify-around flex-1">
								<!-- Player Legend -->
								<div class="text-center relative">
									<div class="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Your Legend</div>
									{#if playerLegend}
										<div class="relative inline-block {activeMenuLegendOpen ? 'z-[200]' : 'z-10'}">
											<button
												type="button"
												onclick={() => activeMenuLegendOpen = !activeMenuLegendOpen}
												oncontextmenu={(e) => { e.preventDefault(); isLegendExhausted = !isLegendExhausted; }}
												class="relative w-14 aspect-[132/184] rounded-lg overflow-hidden border border-white/10 shadow-lg block group mx-auto transition-transform {isLegendExhausted ? 'rotate-90 origin-center translate-y-1 mx-2 ring-1 ring-slate-700/50 brightness-[0.6]' : ''}"
											>
												{#if playerLegend.image_url}
													<img src={getCardImageUrl(playerLegend.image_url, 120, 'webp')} alt={playerLegend.name_en} class="h-full w-full object-cover" />
												{:else}
													<div class="p-1 h-full flex flex-col justify-between text-center bg-slate-950">
														<span class="text-[8px] font-black uppercase text-slate-400 block truncate">{playerLegend.name_en}</span>
													</div>
												{/if}
											</button>
											
											<button
												type="button"
												onclick={(e) => { e.stopPropagation(); selectedPopupCard = playerLegend; }}
												class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/80 hover:bg-black border border-white/10 flex items-center justify-center text-[8px] z-10"
												title="ดูรายละเอียดการ์ด"
											>
												i
											</button>

											{#if activeMenuLegendOpen}
												<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 rounded-xl bg-slate-900 border border-white/10 p-1 shadow-2xl z-[130] text-xs">
													<button
														type="button"
														onclick={() => { isLegendExhausted = !isLegendExhausted; activeMenuLegendOpen = false; }}
														class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 transition"
													>
														{isLegendExhausted ? 'Awaken / Ready' : 'Exhaust / Tap'}
													</button>
												</div>
											{/if}
										</div>
									{:else}
										<div class="h-16 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-[9px] text-slate-700 bg-slate-950">Empty</div>
									{/if}
								</div>

								<!-- Player Champion -->
								<div class="text-center relative">
									<div class="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Your Champion</div>
									{#if playerChampion}
										<div class="relative inline-block {activeMenuChampionOpen ? 'z-[200]' : 'z-10'}">
											<button
												type="button"
												onclick={() => activeMenuChampionOpen = !activeMenuChampionOpen}
												class="relative w-14 aspect-[132/184] rounded-lg overflow-hidden border border-white/10 shadow-lg block group mx-auto hover:scale-105 transition-transform"
											>
												{#if playerChampion.image_url}
													<img src={getCardImageUrl(playerChampion.image_url, 120, 'webp')} alt={playerChampion.name_en} class="h-full w-full object-cover" />
												{:else}
													<div class="p-1 h-full flex flex-col justify-between text-center bg-slate-950">
														<span class="text-[8px] font-black uppercase text-slate-400 block truncate">{playerChampion.name_en}</span>
													</div>
												{/if}
											</button>

											<button
												type="button"
												onclick={(e) => { e.stopPropagation(); selectedPopupCard = playerChampion; }}
												class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/80 hover:bg-black border border-white/10 flex items-center justify-center text-[8px] z-10"
												title="ดูรายละเอียดการ์ด"
											>
												i
											</button>

											{#if activeMenuChampionOpen}
												<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 rounded-xl bg-slate-900 border border-white/10 p-1 shadow-2xl z-[130] text-xs">
													<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5 mb-1 truncate">
														Deploy Champion
													</div>
													<button type="button" onclick={() => deployChampion('base')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">
														Deploy to Base
													</button>
													<button type="button" onclick={() => deployChampion('bf1')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">
														Deploy to BF 1
													</button>
													<button type="button" onclick={() => deployChampion('bf2')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">
														Deploy to BF 2
													</button>
												</div>
											{/if}
										</div>
									{:else}
										<div class="h-16 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-[9px] text-slate-700 bg-slate-950">Empty</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Row 2: Player Base & Main Deck -->
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<!-- Base Zone (Units, Gears, Spells) -->
					<div class="lg:col-span-9">
						<div class="rt-panel p-4 rounded-xl border border-cyan-500/10 bg-cyan-950/5/20 h-full">
							<div class="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/10">
								<div class="flex items-center gap-2">
									<span class="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
									<span class="text-[10px] font-black tracking-widest text-cyan-400 uppercase">Your Base</span>
								</div>
								<button type="button" onclick={() => openSpawnMenu('base')} class="text-[9px] bg-cyan-950 border border-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 hover:bg-cyan-900 transition">+ Spawn Card</button>
							</div>

							<!-- Base units wrapper -->
							<div
								class="flex flex-wrap items-center justify-start gap-4 min-h-[120px] p-2 bg-slate-950/20 rounded-lg border-2 border-transparent transition-colors duration-150"
								ondragover={(e) => {
									e.preventDefault();
									e.currentTarget.classList.add('bg-cyan-500/5', 'border-cyan-400/30');
								}}
								ondragleave={(e) => {
									e.currentTarget.classList.remove('bg-cyan-500/5', 'border-cyan-400/30');
								}}
								ondrop={(e) => {
									e.currentTarget.classList.remove('bg-cyan-500/5', 'border-cyan-400/30');
									const data = e.dataTransfer?.getData('text/plain');
									if (data !== undefined) {
										handleDrop(data, 'base');
									}
								}}
							>
								{#if playerBase.length === 0}
									<div class="text-xs text-slate-600 font-bold mx-auto py-6">ลงยูนิตหรือสร้างรูนเพื่อเริ่มจ่ายพลังงาน</div>
								{:else}
									{#each playerBase as item}
										{@render BoardCard(item, 'base')}
									{/each}
								{/if}
							</div>
						</div>
					</div>

					<!-- Main Deck Pile -->
					<div class="lg:col-span-3">
						<div class="rt-panel p-4 rounded-xl border border-white/5 bg-slate-900/60 h-full flex flex-col justify-between min-h-[160px]">
							<div class="text-left pb-2 border-b border-white/5 mb-3">
								<span class="text-[10px] font-black tracking-widest text-slate-400 uppercase">Main Deck</span>
							</div>
							
							<div class="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-white/5 flex-1">
								<div class="h-16 w-12 border border-cyan-500/20 rounded overflow-hidden shadow-inner shrink-0">
									<img src="/images/cardback_main.png" alt="Main Deck Cardback" class="h-full w-full object-cover" />
								</div>
								<div class="flex-1">
									<div class="text-xs font-black uppercase text-slate-300">Deck</div>
									<div class="text-[10px] text-slate-500 mt-1">{library.length} cards left</div>
								</div>
								<div class="flex flex-col gap-1.5">
									<button type="button" onclick={drawCard} disabled={library.length === 0} class="text-[9px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-3 py-1 rounded font-bold uppercase transition disabled:opacity-50">Draw</button>
									<button type="button" onclick={shuffleLibrary} class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded font-bold uppercase transition">Shuffle</button>
									<button type="button" onclick={() => pileViewerType = 'deck'} class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded font-bold uppercase transition">View</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Row 3: Rune Deck, Rune Board, and Trash/Banish -->
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<!-- Rune Deck -->
					<div class="lg:col-span-3">
						<div class="rt-panel p-4 rounded-xl border border-white/5 bg-slate-900/60 h-full flex flex-col justify-between min-h-[160px]">
							<div class="text-left pb-2 border-b border-white/5 mb-3">
								<span class="text-[10px] font-black tracking-widest text-slate-400 uppercase">Rune Deck</span>
							</div>
							
							<div class="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-white/5 flex-1">
								<div class="h-16 w-12 border border-amber-500/20 rounded overflow-hidden shadow-inner shrink-0">
									<img src="/images/Cardback_rune.webp" alt="Rune Deck Cardback" class="h-full w-full object-cover" />
								</div>
								<div class="flex-1">
									<div class="text-xs font-black uppercase text-slate-300">Rune Deck</div>
									<div class="text-[10px] text-slate-500 mt-1">{runeLibrary.length} runes left</div>
								</div>
								<div class="flex flex-col gap-1.5">
									<button type="button" onclick={() => channelRune(1)} disabled={runeLibrary.length === 0} class="text-[9px] bg-amber-500 text-slate-950 px-3 py-1 rounded font-bold uppercase transition hover:bg-amber-400 disabled:opacity-50">Channel</button>
									<button type="button" onclick={() => runeLibrary = shuffle(runeLibrary)} class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded font-bold uppercase transition">Shuffle</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Rune Board (base:rune) -->
					<div class="lg:col-span-6">
						<div class="rt-panel p-4 rounded-xl border border-amber-500/10 bg-amber-950/5/20 h-full">
							<div class="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/10">
								<div class="flex items-center gap-2">
									<span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
									<span class="text-[10px] font-black tracking-widest text-amber-400 uppercase">Rune Board & Altar</span>
								</div>
								<div class="flex gap-2">
									<button type="button" onclick={() => channelRune(1)} disabled={runeLibrary.length === 0} class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded font-black uppercase hover:bg-amber-500/40 transition disabled:opacity-50">Channel 1 Rune</button>
									<button type="button" onclick={() => channelRune(2)} disabled={runeLibrary.length === 0} class="text-[9px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded font-black uppercase hover:bg-amber-400 transition disabled:opacity-50">Channel 2 Runes</button>
								</div>
							</div>

							<!-- Rune slots grid -->
							<div
								class="grid grid-cols-6 sm:grid-cols-12 gap-3 min-h-[90px] p-2 bg-slate-950/20 rounded-lg transition-colors duration-150 border-2 border-transparent"
								ondragover={(e) => {
									e.preventDefault();
									e.currentTarget.classList.add('bg-amber-500/5', 'border-amber-400/30');
								}}
								ondragleave={(e) => {
									e.currentTarget.classList.remove('bg-amber-500/5', 'border-amber-400/30');
								}}
								ondrop={(e) => {
									e.currentTarget.classList.remove('bg-amber-500/5', 'border-amber-400/30');
									const data = e.dataTransfer?.getData('text/plain');
									if (data !== undefined) {
										if (data.startsWith('hand:')) {
											const cardIdx = parseInt(data.substring(5), 10);
											if (!isNaN(cardIdx)) {
												const card = hand[cardIdx];
												if (card.type === 'Rune') {
													playRuneFromHand(cardIdx);
												} else {
													alert('คุณสามารถลากได้เฉพาะการ์ดประเภท Rune (รูน) ลงบนแท่นนี้เท่านั้น');
												}
											}
										} else {
											const cardIdx = parseInt(data, 10);
											if (!isNaN(cardIdx)) {
												const card = hand[cardIdx];
												if (card.type === 'Rune') {
													playRuneFromHand(cardIdx);
												} else {
													alert('คุณสามารถลากได้เฉพาะการ์ดประเภท Rune (รูน) ลงบนแท่นนี้เท่านั้น');
												}
											}
										}
									}
								}}
							>
								{#each Array(12) as _, slotIdx}
									{@const activeRune = activeRunes[slotIdx]}
									{#if activeRune}
										<div class="flex justify-center items-center">
											{@render BoardCard(activeRune, 'rune')}
										</div>
									{:else}
										<div class="border-2 border-dashed border-slate-800/40 rounded-lg flex flex-col items-center justify-center text-[8px] text-slate-700 bg-slate-950/10 aspect-[132/184] h-[80px] leading-tight">
											<span>Slot {slotIdx + 1}</span>
											<span class="text-[6px] opacity-40 mt-0.5">Rune Drop</span>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					</div>

					<!-- Trash & Banish -->
					<div class="lg:col-span-3">
						<div class="rt-panel p-4 rounded-xl border border-white/5 bg-slate-900/60 h-full flex flex-col justify-between gap-3 min-h-[160px]">
							<div class="text-left pb-2 border-b border-white/5">
								<span class="text-[10px] font-black tracking-widest text-slate-400 uppercase">Trash & Banish</span>
							</div>
							
							<!-- Trash -->
							<div class="flex items-center justify-between gap-3 p-2 bg-slate-950 rounded-lg border border-white/5 flex-1">
								<div class="h-10 w-8 border border-rose-500/20 bg-rose-950/20 rounded flex items-center justify-center text-rose-300 font-bold text-xs shadow-inner">
									<svg class="h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
								</div>
								<div class="flex-1">
									<div class="text-[10px] font-black uppercase text-slate-300">Trash</div>
									<div class="text-[9px] text-slate-500">{trash.length} cards</div>
								</div>
								<button type="button" onclick={() => pileViewerType = 'trash'} disabled={trash.length === 0} class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded font-bold uppercase transition disabled:opacity-50">View</button>
							</div>

							<!-- Banish -->
							<div class="flex items-center justify-between gap-3 p-2 bg-slate-950 rounded-lg border border-white/5 flex-1">
								<div class="h-10 w-8 border border-slate-500/20 bg-slate-950 rounded flex items-center justify-center text-slate-400 font-bold text-xs shadow-inner">
									<svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
								</div>
								<div class="flex-1">
									<div class="text-[10px] font-black uppercase text-slate-300">Banish</div>
									<div class="text-[9px] text-slate-500">{banished.length} cards</div>
								</div>
								<button type="button" onclick={() => pileViewerType = 'banished'} disabled={banished.length === 0} class="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded font-bold uppercase transition disabled:opacity-50">View</button>
							</div>
						</div>
					</div>
				</div>


			</div>
			</div>
		{/if}
	</main>

	<!-- Fixed Bottom Hand Area -->
	{#if isGameStarted}
		<div class="fixed bottom-0 left-0 lg:left-[5.75rem] xl:left-[12rem] right-0 bg-slate-950/85 backdrop-blur-xl border-t border-white/5 p-4 shadow-2xl z-[200] min-h-[180px]">
			<div class="mx-auto max-w-[1400px] flex flex-col gap-3">
				<div class="flex justify-between items-center px-2">
					<div class="text-xs font-black uppercase tracking-widest text-slate-400">
						การ์ดบนมือ ({hand.length} ใบ)
					</div>
					<button type="button" onclick={drawCard} disabled={library.length === 0} class="text-[10px] bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-3 py-1 rounded font-black tracking-widest uppercase hover:bg-cyan-500/20 active:scale-95 transition disabled:opacity-50">
						+ จั่ว 1 ใบ
					</button>
				</div>

				<div class="flex flex-wrap items-center gap-4 pb-2 min-h-[120px] overflow-visible">
					{#if hand.length === 0}
						<div class="text-xs text-slate-600 font-bold mx-auto py-6">ไม่มีการ์ดบนมือ จั่วการ์ดเพื่อทดลองเล่น</div>
					{:else}
						{#each hand as card, idx}
							<div
								class="relative shrink-0 transition-all duration-200 hover:-translate-y-2 group cursor-grab active:cursor-grabbing {activeMenuCardIdx === idx ? 'z-[210]' : 'z-10'}"
								draggable="true"
								ondragstart={(e) => {
									e.dataTransfer?.setData('text/plain', 'hand:' + idx);
								}}
							>
								<button
									type="button"
									onclick={() => activeMenuCardIdx = activeMenuCardIdx === idx ? null : idx}
									class="relative rounded-lg border border-white/10 overflow-hidden bg-slate-900 block text-left shadow-lg shadow-black/40 {card.name_en === 'Baron Pit' || card.name_en === 'Brush' ? 'h-[80px] aspect-[184/132]' : 'h-[110px] aspect-[132/184]'} {activeMenuCardIdx === idx ? 'ring-2 ring-cyan-400' : ''}"
								>
									{#if card.image_url}
										<img src={getCardImageUrl(card.image_url, 140, 'webp')} alt={card.name_en} class="h-full w-full {card.name_en === 'Baron Pit' || card.name_en === 'Brush' ? 'object-contain' : 'object-cover'}" />
									{:else}
										<div class="p-2 h-full flex flex-col justify-between text-center">
											<span class="text-[9px] font-black uppercase text-slate-400 block truncate">{card.name_en}</span>
											<span class="text-[10px] text-cyan-300 font-black">{card.energy ?? 0} E</span>
										</div>
									{/if}
								</button>

								<!-- Zoom details icon -->
								<button
									type="button"
									onclick={(e) => { e.stopPropagation(); selectedPopupCard = card; }}
									class="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-black border border-white/10 flex items-center justify-center text-[10px] z-10"
									title="ดูรายละเอียดการ์ด"
								>
									i
								</button>

								<!-- Action Menu Popup inside Hand -->
								{#if activeMenuCardIdx === idx}
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl bg-slate-900 border border-white/10 p-1.5 shadow-2xl z-[120] text-xs">
										<div class="px-2 py-1 text-[9px] font-black text-slate-500 uppercase border-b border-white/5 mb-1 truncate">{card.name_en}</div>
										
										<!-- Standard play to Base -->
										<button type="button" onclick={() => playCard(idx, 'base')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px] font-bold">Play to Base</button>
										
										<div class="h-px bg-white/5 my-1"></div>
										<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Deploy to Battlefield</div>
										<button type="button" onclick={() => playCard(idx, 'bf1')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">Play directly to BF 1</button>
										<button type="button" onclick={() => playCard(idx, 'bf2')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">Play directly to BF 2</button>
										
										<div class="h-px bg-white/5 my-1"></div>
										<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Hidden</div>
										<button type="button" onclick={() => playCard(idx, 'bf1_hidden')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-amber-300 transition text-[11px]">Play Facedown to BF 1</button>
										<button type="button" onclick={() => playCard(idx, 'bf2_hidden')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-amber-300 transition text-[11px]">Play Facedown to BF 2</button>
										
										<div class="h-px bg-white/5 my-1"></div>
										<button type="button" onclick={() => discardFromHand(idx)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-rose-400 transition text-[11px]">Discard</button>
										<button type="button" onclick={() => recycleToDeckBottom(idx)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-400 transition text-[11px]">Recycle</button>
									</div>
								{/if}
							</div>
							{/each}
						{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Snippet: Setup Card Box (Legend / Champion) -->
{#snippet SetupCardBox(card: Card)}
	<button
		type="button"
		onclick={() => selectedPopupCard = card}
		class="relative w-14 aspect-[132/184] rounded-lg overflow-hidden border border-white/10 shadow-lg block group mx-auto"
	>
		{#if card.image_url}
			<img src={getCardImageUrl(card.image_url, 120, 'webp')} alt={card.name_en} class="h-full w-full object-cover" />
		{:else}
			<div class="p-1 h-full flex flex-col justify-between text-center bg-slate-950">
				<span class="text-[8px] font-black uppercase text-slate-400 block truncate">{card.name_en}</span>
			</div>
		{/if}
		<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase tracking-wider text-white transition">View</div>
	</button>
{/snippet}

<!-- Snippet: Board Card Rendering -->
{#snippet BoardCard(item: BoardItem, zone: string)}
	<div 
		class="relative shrink-0 group {activeMenuBoardItem?.item.id === item.id ? 'z-[200]' : 'z-10'} cursor-grab active:cursor-grabbing"
		draggable="true"
		ondragstart={(e) => {
			e.dataTransfer?.setData('text/plain', `board:${zone}:${item.id}`);
		}}
		ondragover={(e) => {
			e.preventDefault();
			e.stopPropagation();
			dragOverCardId = item.id;
		}}
		ondragleave={() => {
			if (dragOverCardId === item.id) {
				dragOverCardId = null;
			}
		}}
		ondrop={(e) => {
			e.preventDefault();
			e.stopPropagation();
			dragOverCardId = null;
			const data = e.dataTransfer?.getData('text/plain');
			if (data) {
				handleDropOnCard(data, item, zone);
			}
		}}
	>
		<!-- Card Item Box -->
		<button
			type="button"
			onclick={() => activeMenuBoardItem = activeMenuBoardItem?.item.id === item.id ? null : { item, zone }}
			oncontextmenu={(e) => {
				e.preventDefault();
				toggleExhaustItem(item, zone);
			}}
			class="relative rounded-lg border overflow-hidden bg-slate-900 block text-left shadow-lg transition-transform hover:scale-105 {item.card.name_en === 'Baron Pit' || item.card.name_en === 'Brush' ? 'w-20 aspect-[184/132]' : 'w-16 aspect-[132/184]'} {item.isExhausted ? 'rotate-90 origin-center translate-y-1 mx-2 ring-1 ring-slate-700/50 brightness-[0.6]' : ''} {(item.damageReceived && item.damageReceived > 0) ? 'border-rose-500 shadow-rose-950/30' : (item.mightModifier && item.mightModifier !== 0) ? 'border-amber-400 shadow-amber-950/30' : item.counters > 0 ? 'border-cyan-400' : 'border-white/10'} {item.copiedFromReflection ? 'grayscale brightness-90 contrast-125' : ''} {dragOverCardId === item.id ? 'ring-2 ring-cyan-400 scale-105 border-transparent' : ''}"
		>
			{#if item.isFacedown}
				<!-- Card Back for Facedown/Hidden cards (Main deck card back) -->
				<img src="/images/cardback_main.png" alt="Hidden Card" class="h-full w-full object-cover" />
			{:else if item.card.image_url}
				<img src={getCardImageUrl(item.card.image_url, 120, 'webp')} alt={item.card.name_en} class="h-full w-full {item.card.name_en === 'Baron Pit' || item.card.name_en === 'Brush' ? 'object-contain' : 'object-cover'}" />
			{:else}
				<div class="p-1 h-full flex flex-col justify-between text-center bg-slate-950">
					<span class="text-[8px] font-black uppercase text-slate-400 block truncate">{item.card.name_en}</span>
					<span class="text-[9px] text-cyan-300 font-black">{item.card.energy ?? 0}</span>
				</div>
			{/if}

			<!-- Might (Combat Power) indicator -->
			{#if item.card.power?.value?.label && !item.isFacedown}
				{@const baseMight = parseInt(item.card.power.value.label) || 0}
				{@const mod = item.mightModifier ?? 0}
				{@const totalMight = baseMight + mod}
				<div 
					class="absolute bottom-1 left-1 h-4 px-1 rounded font-black text-[8px] flex items-center justify-center shadow transition-colors duration-150 {mod > 0 ? 'bg-emerald-600 text-white border border-emerald-400/30' : mod < 0 ? 'bg-red-600 text-white border border-red-400/30' : 'bg-slate-950/90 text-amber-400 border border-amber-400/30'}"
					title="Might: {totalMight} (Base: {baseMight}{mod > 0 ? ' +' + mod : mod < 0 ? ' ' + mod : ''})"
				>
					M:{totalMight}
				</div>
			{:else}
				<!-- If it is not a Unit but has a might modifier, show the modifier fallback -->
				{#if item.mightModifier && item.mightModifier !== 0 && !item.isFacedown}
					<div class="absolute bottom-1 left-1 h-4 px-1 rounded bg-amber-500 text-slate-950 font-black text-[8px] flex items-center justify-center shadow">
						M:{item.mightModifier > 0 ? '+' : ''}{item.mightModifier}
					</div>
				{/if}
			{/if}

			<!-- Damage received indicator -->
			{#if item.damageReceived && item.damageReceived > 0 && !item.isFacedown}
				<div class="absolute top-1 left-1 h-4 px-1 rounded bg-rose-600 text-white font-black text-[8px] flex items-center justify-center shadow">
					DMG:{item.damageReceived}
				</div>
			{/if}

			<!-- Counter indicator -->
			{#if item.counters > 0 && !item.isFacedown}
				<div class="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
					+{item.counters}
				</div>
			{/if}
		</button>

		<!-- Zoom details icon (only visible for revealed cards) -->
		{#if !item.isFacedown}
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); selectedPopupCard = item.card; }}
				class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/80 hover:bg-black border border-white/10 flex items-center justify-center text-[8px] z-10"
				title="ดูรายละเอียดการ์ด"
			>
				i
			</button>
		{/if}

		<!-- Attachments display -->
		{#if item.attachments && item.attachments.length > 0}
			<div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex -space-x-2 z-20 pointer-events-auto">
				{#each item.attachments as att, attIdx}
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							activeMenuBoardItem = { item: att, zone: `attachment:${item.id}:${attIdx}:${zone}` };
						}}
						class="rounded border border-white/20 bg-slate-950 overflow-hidden shadow-md hover:scale-110 hover:z-30 transition-all cursor-grab active:cursor-grabbing {att.card.name_en === 'Baron Pit' || att.card.name_en === 'Brush' ? 'w-9 aspect-[184/132]' : 'w-7 aspect-[132/184]'}"
						title={att.card.name_en}
						draggable="true"
						ondragstart={(e) => {
							e.stopPropagation();
							e.dataTransfer?.setData('text/plain', `board:attachment:${item.id}:${att.id}`);
						}}
					>
						{#if att.card.image_url}
							<img src={getCardImageUrl(att.card.image_url, 80, 'webp')} alt={att.card.name_en} class="h-full w-full {att.card.name_en === 'Baron Pit' || att.card.name_en === 'Brush' ? 'object-contain' : 'object-cover'}" />
						{:else}
							<div class="p-0.5 h-full flex items-center justify-center text-[5px] font-black uppercase text-slate-400 text-center leading-none bg-slate-950">
								{att.card.name_en.substring(0, 3)}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Action Menu for Card on Board -->
		{#if activeMenuBoardItem?.item.id === item.id}
			<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-38 rounded-xl bg-slate-900 border border-white/10 p-1 shadow-2xl z-[120] text-xs">
				<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5 mb-1 truncate">
					{item.isFacedown ? 'Hidden Card' : item.card.name_en}
				</div>
				
				<!-- Reveal Action for Facedown -->
				{#if item.isFacedown}
					<button type="button" onclick={() => revealFacedownItem(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-amber-300 font-bold transition">
						Reveal / หงายการ์ด
					</button>
					<button type="button" onclick={() => returnToHand(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-cyan-300 transition text-[11px]">
						Return to Hand
					</button>
				{:else}
					<button type="button" onclick={() => { toggleExhaustItem(item, zone); activeMenuBoardItem = null; }} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 transition">
						{item.isExhausted ? 'Awaken / Ready' : 'Exhaust / Tap'}
					</button>
 
					{#if item.card.name_en === 'Reflection' || item.card.code === 'UNL-T06' || item.copiedFromReflection}
						<button type="button" onclick={() => openTransformMenu(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-cyan-300 font-bold transition text-[11px]">
							Transform (แปลงร่าง)
						</button>
					{/if}

					{#if zone === 'rune'}
						<button type="button" onclick={() => { recycleRune(item); activeMenuBoardItem = null; }} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-amber-300 font-bold transition text-[11px]">
							Recycle
						</button>
					{:else}
						<button type="button" onclick={() => returnToHand(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-cyan-300 transition text-[11px]">
							Return to Hand
						</button>
						{#if !playerChampion && item.card.type === 'Unit'}
							<button type="button" onclick={() => returnToChampionZone(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-amber-300 transition text-[11px]">
								To Champion Zone
							</button>
						{/if}

						<!-- Tactical Moves in Riftbound -->
						<div class="h-px bg-white/5 my-1"></div>
						<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Movement (เดินทัพ)</div>
						
						{#if zone !== 'base'}
							<button type="button" onclick={() => moveItem(item, zone, 'base')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">
								Move to Base
							</button>
						{/if}
						{#if zone !== 'bf1'}
							<button type="button" onclick={() => moveItem(item, zone, 'bf1')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">Move to BF 1</button>
						{/if}
						{#if zone !== 'bf2'}
							<button type="button" onclick={() => moveItem(item, zone, 'bf2')} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition text-[11px]">Move to BF 2</button>
						{/if}

						<!-- Might Modifier -->
						<div class="h-px bg-white/5 my-1"></div>
						<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Might Modifier (พลังโจมตี)</div>
						<div class="flex gap-1 px-1 mb-1">
							<button type="button" onclick={() => adjustMightModifier(item, 1, zone)} class="flex-1 text-center py-1 rounded bg-slate-950/40 hover:bg-slate-800 text-amber-400 font-bold transition text-[11px] cursor-pointer">
								+1 Might
							</button>
							<button type="button" onclick={() => adjustMightModifier(item, -1, zone)} class="flex-1 text-center py-1 rounded bg-slate-950/40 hover:bg-slate-800 text-slate-400 font-bold transition text-[11px] cursor-pointer">
								-1 Might
							</button>
						</div>

						<!-- Damage Received -->
						<div class="h-px bg-white/5 my-1"></div>
						<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Damage Received (ความเสียหาย)</div>
						<div class="flex gap-1 px-1 mb-1">
							<button type="button" onclick={() => adjustDamageReceived(item, 1, zone)} class="flex-1 text-center py-1 rounded bg-slate-950/40 hover:bg-slate-800 text-rose-400 font-bold transition text-[11px] cursor-pointer">
								+1 DMG
							</button>
							<button type="button" onclick={() => adjustDamageReceived(item, -1, zone)} class="flex-1 text-center py-1 rounded bg-slate-950/40 hover:bg-slate-800 text-slate-400 font-bold transition text-[11px] cursor-pointer" disabled={!((item.damageReceived ?? 0) > 0)}>
								-1 DMG
							</button>
						</div>

						<!-- Counters -->
						<div class="h-px bg-white/5 my-1"></div>
						<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Counters (ตัวนับทั่วไป)</div>
						<div class="flex gap-1 px-1">
							<button type="button" onclick={() => addCounterItem(item, zone)} class="flex-1 text-center py-1 rounded bg-slate-950/40 hover:bg-slate-800 text-cyan-300 transition text-[11px] cursor-pointer">
								+1 Count
							</button>
							<button type="button" onclick={() => removeCounterItem(item, zone)} class="flex-1 text-center py-1 rounded bg-slate-950/40 hover:bg-slate-800 text-slate-400 transition text-[11px] cursor-pointer" disabled={item.counters === 0}>
								-1 Count
							</button>
						</div>

						<!-- Attachments list and detach options -->
						{#if item.attachments && item.attachments.length > 0}
							<div class="h-px bg-white/5 my-1"></div>
							<div class="px-2 py-0.5 text-[8px] font-black text-slate-500 uppercase">Gear & Buffs (ของสวมใส่/บัฟ)</div>
							{#each item.attachments as att, attIdx}
								<div class="flex items-center justify-between px-2 py-1 bg-slate-950/40 rounded border border-white/5 mb-1 gap-1">
									<span class="text-[9px] font-medium text-slate-300 truncate flex-1">{att.card.name_en}</span>
									<div class="flex gap-1 shrink-0">
										<button 
											type="button" 
											onclick={() => {
												detachItem(item, zone, attIdx, 'hand');
												activeMenuBoardItem = null;
											}}
											class="text-[9px] text-cyan-300 hover:underline cursor-pointer"
										>
											Hand
										</button>
										<span class="text-slate-700">|</span>
										<button 
											type="button" 
											onclick={() => {
												detachItem(item, zone, attIdx, 'trash');
												activeMenuBoardItem = null;
											}}
											class="text-[9px] text-rose-400 hover:underline cursor-pointer"
										>
											Trash
										</button>
									</div>
								</div>
							{/each}
						{/if}

						<div class="h-px bg-white/5 my-1"></div>
						<button type="button" onclick={() => removeItemToTrash(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-rose-400 transition">
							Destroy (ลง Trash)
						</button>
						<button type="button" onclick={() => removeItemToBanish(item, zone)} class="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-400 transition">
							Banish (เนรเทศ)
						</button>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Mulligan Phase Modal -->
{#if isMulliganPhase}
	<div class="fixed inset-0 z-[970] grid place-items-center bg-black/85 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-2xl bg-slate-950/90 p-6 border border-white/10 rounded-2xl shadow-2xl text-center">
			<div class="mb-4">
				<p class="rt-kicker text-cyan-300">Game Start</p>
				<h3 class="text-lg font-black uppercase tracking-widest text-white italic">
					ขั้นตอนการมัลลิแกน (Mulligan Phase)
				</h3>
				<p class="text-[11px] text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
					เลือกการ์ดเริ่มต้นบนมือสูงสุด 2 ใบที่ต้องการเปลี่ยนไปวางคว่ำหน้าไว้ที่ใต้กองการ์ดหลักเพื่อจั่วใบใหม่ขึ้นมาแทน (สามารถทำได้เพียงครั้งเดียวต่อเกม และไม่มีการสับเด็คใหม่หลังจากมัลลิแกน)
				</p>
			</div>

			<!-- Hand Cards Display for Mulligan -->
			<div class="grid grid-cols-4 gap-3 my-6 justify-center">
				{#each hand as card, idx}
					{@const isSelected = selectedMulliganIndices.has(idx)}
					<button
						type="button"
						onclick={() => toggleMulliganSelect(idx)}
						class="group relative flex flex-col items-center rounded-xl p-1 transition border-2 {isSelected
							? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
							: 'border-transparent hover:border-white/20'}"
					>
						<img
							src={getCardImageUrl(card.image_url, 140, 'webp')}
							alt={card.name_en}
							class="w-full aspect-[2.5/3.5] object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
						/>
						
						<!-- Selected Indicator overlay -->
						{#if isSelected}
							<div class="absolute inset-0 bg-cyan-950/40 rounded-xl flex items-center justify-center">
								<div class="bg-cyan-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
									เปลี่ยน (Replace)
								</div>
							</div>
						{/if}

						<div class="mt-2 text-center">
							<div class="text-[10px] font-black text-slate-200 truncate max-w-full px-1">{card.name_en}</div>
							<div class="text-[8px] text-slate-500">{card.type}</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center justify-center gap-3">
				<button
					type="button"
					onclick={confirmMulligan}
					class="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase px-6 py-2.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
				>
					ยืนยัน Mulligan ({selectedMulliganIndices.size} ใบ)
				</button>
				<button
					type="button"
					onclick={() => {
						isMulliganPhase = false;
						selectedMulliganIndices = new Set();
						channelRune(2);
					}}
					class="rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase px-6 py-2.5 border border-white/10 transition cursor-pointer"
				>
					ไม่เปลี่ยนการ์ด (Keep Hand)
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Spawn Card Selector Modal -->
{#if isSpawnMenuOpen}
	<div class="fixed inset-0 z-[960] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-2xl bg-slate-950/95 p-6 border border-cyan-500/20 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
			<div class="flex items-center justify-between mb-4 pb-2 border-b border-white/5 shrink-0">
				<div>
					<p class="rt-kicker text-cyan-400">👾 Spawn Token</p>
					<h3 class="text-sm font-black uppercase tracking-widest text-white italic">
						สร้างการ์ด Token ลงสนาม ({spawnTargetZone.toUpperCase()})
					</h3>
				</div>
				<button type="button" onclick={() => isSpawnMenuOpen = false} class="text-slate-400 hover:text-white text-xs font-bold">&times; Close</button>
			</div>

			<input
				type="text"
				bind:value={spawnSearch}
				placeholder="ค้นชื่อการ์ด / รหัส..."
				class="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-cyan-300 focus:outline-none mb-4 shrink-0"
			/>

			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[300px]">
				{#each filteredSpawnCards as c}
					<div class="relative group flex flex-col p-2 bg-slate-900/40 border border-white/5 rounded-xl text-left hover:border-cyan-400/40 hover:bg-slate-900/80 transition gap-2">
						<button
							type="button"
							onclick={() => spawnCardOnBoard(c)}
							class="w-full rounded-lg overflow-hidden border border-white/10 bg-slate-950 relative block cursor-pointer {c.name_en === 'Baron Pit' || c.name_en === 'Brush' ? 'aspect-[184/132]' : 'aspect-[132/184]'}"
						>
							{#if c.image_url}
								<img src={getCardImageUrl(c.image_url, 140, 'webp')} alt={c.name_en} class="h-full w-full {c.name_en === 'Baron Pit' || c.name_en === 'Brush' ? 'object-contain' : 'object-cover'} group-hover:scale-105 transition" />
							{:else}
								<div class="p-1 h-full flex items-center justify-center text-[8px] font-black uppercase text-slate-400 text-center bg-slate-950">
									{c.name_en}
								</div>
							{/if}
						</button>
						<div class="min-w-0 flex items-center justify-between gap-1 mt-1">
							<div class="min-w-0 flex-1">
								<div class="text-[10px] font-black text-slate-200 truncate group-hover:text-cyan-300 transition">{c.name_en}</div>
								<div class="text-[8px] text-slate-500 uppercase">{c.code}</div>
							</div>
							<button
								type="button"
								onclick={() => selectedPopupCard = c}
								class="h-5 w-5 rounded-md bg-black/60 hover:bg-black border border-white/10 flex items-center justify-center text-[8px] text-white shrink-0 cursor-pointer"
								title="ดูรายละเอียดการ์ด"
							>
								i
							</button>
						</div>
					</div>
				{/each}
				{#if filteredSpawnCards.length === 0}
					<div class="col-span-full text-center py-12 text-slate-600 text-xs font-bold">ไม่พบการ์ดที่ค้นหา</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Battlefield Selector Modal -->
{#if isBfPickerOpen}
	<div class="fixed inset-0 z-[960] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-md bg-slate-950 p-6 border border-white/10 rounded-2xl shadow-2xl">
			<div class="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
				<h3 class="text-sm font-black uppercase tracking-widest text-white italic">
					เลือกการ์ดสนามรบ (Battlefield Card)
				</h3>
				<button type="button" onclick={() => isBfPickerOpen = false} class="text-slate-400 hover:text-white text-xs font-bold">&times; Close</button>
			</div>

			<div class="space-y-2 max-h-[350px] overflow-y-auto">
				{#each bfPickerTarget === 'bf1' && activeDeckBattlefields.length > 0 ? activeDeckBattlefields : cards.filter(c => c.type === 'Battlefield' && c.name_en !== 'Baron Pit' && c.name_en !== 'Brush') as c}
					<button
						type="button"
						onclick={() => setBattlefield(c)}
						class="w-full p-3 rounded-lg border border-white/5 bg-slate-900/40 hover:border-cyan-300/40 hover:bg-slate-900 transition text-left flex items-center gap-3"
					>
						<img src={getCardImageUrl(c.image_url, 140, 'webp')} alt={c.name_en} class="w-20 aspect-[184/132] {c.name_en === 'Baron Pit' || c.name_en === 'Brush' ? 'object-contain' : 'object-cover'} rounded border border-white/10 shrink-0" />
						<div>
							<div class="text-xs font-black text-slate-200">{c.name_en}</div>
							<div class="text-[10px] text-slate-500">{c.code}</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Pile Viewer Modal (Deck / Trash / Banish) -->
{#if pileViewerType}
	<div class="fixed inset-0 z-[960] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-2xl bg-slate-950 p-6 border border-white/10 rounded-2xl shadow-2xl">
			<div class="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
				<h3 class="text-sm font-black uppercase tracking-widest text-white italic">
					Pile Viewer: {pileViewerType.toUpperCase()} ({
						pileViewerType === 'deck' ? library.length :
						pileViewerType === 'trash' ? trash.length :
						banished.length
					} ใบ)
				</h3>
				<button type="button" onclick={() => pileViewerType = null} class="text-slate-400 hover:text-white text-xs font-bold">&times; Close</button>
			</div>

			<div class="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[420px] overflow-y-auto p-1">
				{#each currentPile as c, idx}
					<div class="group relative flex flex-col justify-between p-2 rounded-xl bg-slate-900/40 border border-white/5 hover:border-cyan-300/30 transition text-center min-h-[170px]">
						<div class="relative w-full rounded-lg overflow-hidden border border-white/10 bg-slate-950 {c.name_en === 'Baron Pit' || c.name_en === 'Brush' ? 'aspect-[184/132]' : 'aspect-[132/184]'}">
							{#if c.image_url}
								<img src={getCardImageUrl(c.image_url, 120, 'webp')} alt={c.name_en} class="h-full w-full {c.name_en === 'Baron Pit' || c.name_en === 'Brush' ? 'object-contain' : 'object-cover'}" />
							{:else}
								<div class="p-1 h-full flex items-center justify-center text-[8px] font-black uppercase text-slate-400 text-center">
									{c.name_en}
								</div>
							{/if}
							<!-- Clickable overlay to zoom details -->
							<button
								type="button"
								onclick={() => selectedPopupCard = c}
								class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-white transition"
							>
								View
							</button>
						</div>
						<div class="text-left px-1 mt-1 min-w-0">
							<div class="text-[10px] font-black text-slate-200 truncate w-full" title={c.name_en}>{c.name_en}</div>
							<div class="text-[8px] text-slate-500 uppercase">{c.code}</div>
						</div>
						<div class="flex gap-1 mt-2">
							<button type="button" onclick={() => returnCardToHand(c, pileViewerType!)} class="flex-1 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/20 py-1 rounded font-bold uppercase transition hover:bg-cyan-900 text-center">To Hand</button>
							{#if pileViewerType !== 'banished'}
								<button type="button" onclick={() => banishCardFromPile(c, pileViewerType!)} class="flex-1 text-[9px] bg-slate-800 text-slate-400 border border-white/5 py-1 rounded font-bold uppercase transition hover:bg-slate-700 text-center">Banish</button>
							{/if}
						</div>
					</div>
				{/each}

				{#if currentPile.length === 0}
					<div class="col-span-full text-center py-12 text-slate-600 text-xs font-bold">ไม่มีการ์ดในกองนี้</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Card Details Modal (🔍 Zoom) -->
{#if selectedPopupCard}
	{@const hasActions = parseCardAbilityAndBuildActions(selectedPopupCard).actions.length > 0}
	<CardModal
		card={selectedPopupCard}
		closePopup={() => selectedPopupCard = null}
		canEdit={false}
		showAutoSkill={hasActions}
		onAutoSkill={() => runAutoSkillFor(selectedPopupCard!)}
	/>
{/if}

<!-- AI Auto Skill Modal & Overlays -->
{#if autoSkillError}
	<div class="fixed inset-0 z-[980] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-sm rounded-xl p-5 text-center shadow-2xl shadow-black/40 border border-rose-500/20 bg-slate-950">
			<div class="text-rose-400 text-3xl mb-2">⚠️</div>
			<div class="text-sm font-black uppercase text-white">ประมวลผลไม่สำเร็จ</div>
			<div class="text-xs text-slate-400 mt-2 font-medium leading-relaxed">{autoSkillError}</div>
			<button
				type="button"
				class="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition border border-white/5 cursor-pointer"
				onclick={() => autoSkillError = ''}
			>
				ปิดหน้าต่าง
			</button>
		</div>
	</div>
{/if}

{#if skillAnalysisResult && skillCardToTrigger}
	<div class="fixed inset-0 z-[980] grid place-items-center bg-black/85 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-md bg-slate-950/95 p-6 border border-cyan-500/20 rounded-2xl shadow-2xl">
			<div class="mb-4 pb-3 border-b border-white/5 flex items-start justify-between">
				<div>
					<p class="rt-kicker text-cyan-400">🪄 Play Assistant (ระบบจำลองเอฟเฟกต์)</p>
					<h3 class="text-base font-black uppercase tracking-wider text-white">
						{skillCardToTrigger.name_en} {skillCardToTrigger.name_th ? `(${skillCardToTrigger.name_th})` : ''}
					</h3>
				</div>
				<button
					type="button"
					onclick={cancelSkillActions}
					class="text-slate-400 hover:text-white transition text-xs font-black cursor-pointer"
				>
					✕
				</button>
			</div>

			<!-- Ability Summary -->
			<div class="mb-4">
				<span class="text-[9px] font-black uppercase text-slate-500 tracking-wider">สรุปเอฟเฟกต์การ์ด:</span>
				<p class="text-xs text-slate-200 font-bold leading-relaxed mt-0.5 bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
					{skillAnalysisResult.ability_summary || 'ไม่มีการสรุปเอฟเฟกต์'}
				</p>
			</div>

			<!-- Actions List -->
			<div class="mb-5">
				<span class="text-[9px] font-black uppercase text-slate-500 tracking-wider">การปรับปรุงสถานะบอร์ด:</span>
				<div class="mt-1.5 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
					{#if skillAnalysisResult.actions && skillAnalysisResult.actions.length > 0}
						{#each skillAnalysisResult.actions as action}
							<div class="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-white/5">
								<span class="text-cyan-400 text-xs shrink-0 mt-0.5">
									◆
								</span>
								<div class="text-[11px] text-slate-300 font-semibold leading-relaxed">
									{action.description}
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-[11px] text-slate-500 italic p-2 text-center">ไม่มีการเปลี่ยนแปลงสถานะบอร์ด</div>
					{/if}
				</div>
			</div>

			<!-- Optional skill confirmation warning -->
			{#if skillAnalysisResult.requires_user_confirmation}
				<div class="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl mb-6 flex items-start gap-2.5">
					<span class="text-amber-400 font-bold text-xs shrink-0 mt-0.5">[?]</span>
					<div>
						<div class="text-[9px] font-black uppercase tracking-wider text-amber-400">ตัวเลือกเพิ่มเติม (Optional Skill)</div>
						<div class="text-[11px] text-slate-300 font-bold mt-1 leading-relaxed">
							{skillAnalysisResult.confirmation_message || 'ต้องการเปิดใช้งานความสามารถทางเลือกนี้หรือไม่?'}
						</div>
					</div>
				</div>
			{:else}
				<div class="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl mb-6 flex items-start gap-2.5">
					<span class="text-cyan-400 font-bold text-xs shrink-0 mt-0.5">[!]</span>
					<div>
						<div class="text-[9px] font-black uppercase tracking-wider text-cyan-400">ความสามารถบังคับ (Mandatory Skill)</div>
						<div class="text-[11px] text-slate-300 font-bold mt-1 leading-relaxed">
							เอฟเฟกต์ทั้งหมดนี้เป็นความสามารถที่ทำงานอัตโนมัติตามกฎกติกา
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex gap-2.5">
				<button
					type="button"
					onclick={cancelSkillActions}
					class="flex-1 py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
				>
					ยกเลิก (Cancel)
				</button>
				<button
					type="button"
					onclick={executeSkillActions}
					class="flex-1 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-cyan-500/10"
				>
					ตกลงใช้งาน (Execute)
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Reflection Transform Modal -->
{#if isTransformMenuOpen && transformTargetItem}
	{@const filteredUnits = boardUnits.filter(c => 
		(transformSearch.trim() === '' || 
		 c.name_en.toLowerCase().includes(transformSearch.toLowerCase()) || 
		 c.name_th.toLowerCase().includes(transformSearch.toLowerCase()))
	)}
	<div class="fixed inset-0 z-[980] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-2xl bg-slate-950/95 p-6 border border-cyan-500/20 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
			<!-- Header -->
			<div class="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
				<div>
					<p class="rt-kicker text-cyan-400">🔮 Reflection Ability</p>
					<h3 class="text-base font-black uppercase tracking-wider text-white">เลือกยูนิตเพื่อแปลงร่าง (Transform)</h3>
				</div>
				<button
					type="button"
					onclick={() => { isTransformMenuOpen = false; transformTargetItem = null; }}
					class="text-slate-400 hover:text-white transition text-sm font-bold cursor-pointer"
				>
					✕
				</button>
			</div>

			<!-- Search -->
			<div class="mb-4 shrink-0">
				<input
					type="text"
					bind:value={transformSearch}
					placeholder="ค้นหาชื่อการ์ดยูนิตบนบอร์ด..."
					class="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
				/>
			</div>

			<!-- Grid of units -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[300px]">
				{#each filteredUnits as c}
					<button
						type="button"
						onclick={() => transformReflectionTo(c)}
						class="p-2 bg-slate-900/40 border border-white/5 rounded-xl text-left hover:border-cyan-400/40 hover:bg-slate-900/80 transition flex flex-col gap-2 group cursor-pointer"
					>
						<div class="w-full aspect-[132/184] rounded-lg overflow-hidden border border-white/10 bg-slate-950 relative">
							{#if c.image_url}
								<img src={getCardImageUrl(c.image_url, 140, 'webp')} alt={c.name_en} class="h-full w-full object-cover group-hover:scale-105 transition" />
							{/if}
						</div>
						<div class="min-w-0">
							<div class="text-[10px] font-black text-slate-200 truncate group-hover:text-cyan-300 transition">{c.name_en}</div>
							<div class="text-[8px] text-slate-500 uppercase">{c.code}</div>
						</div>
					</button>
				{/each}

				{#if filteredUnits.length === 0}
					<div class="col-span-full text-center py-12 text-slate-600 text-xs font-bold">ไม่พบการ์ดยูนิตบนบอร์ด</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.rt-panel) {
		backdrop-filter: none !important;
		-webkit-backdrop-filter: none !important;
	}
</style>
