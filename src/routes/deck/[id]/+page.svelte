<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import DeckValidationPanel from '$lib/components/DeckValidationPanel.svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import PlaytestModal from '$lib/components/PlaytestModal.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { usesLandscapeCardFrame } from '$lib/utils/cardPresentation';
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
		validateDeck,
		writeDeckCollectionToStorage,
		type DeckCard,
		type DeckCollection,
		type StoredDeck
	} from '$lib/utils/deck';
	import { getAuthSession } from '$lib/utils/authSession';
	import { getUserCollection } from '$lib/utils/collectionCache';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let deckId = $derived(data.deckId ?? '');
	let loadedDeck = $derived(data.loadedDeck as StoredDeck | null);
	let collection = $state<DeckCollection | null>(null);
	let isLoading = $state(true);
	let isPlaytestOpen = $state(false);
	let userCardCollection = $state<Record<string, number>>({});
	let selectedPopupCard = $state<Card | null>(null);
	let currentUser = $state<{
		id: string;
		email: string;
		displayName: string;
		isAdmin: boolean;
	} | null>(null);

	function openCardPopup(card: Card) {
		selectedPopupCard = card;
	}

	function closeCardPopup() {
		selectedPopupCard = null;
	}

	$effect(() => {
		if (!browser) return;
		void loadUserCollection();
	});

	async function loadUserCollection() {
		try {
			const session = await getAuthSession<{
				user?: { id: string; email: string; displayName: string; isAdmin: boolean };
			}>();
			currentUser = session.user || null;
			if (session.user) {
				userCardCollection = await getUserCollection();
			}
		} catch {}
	}

	function openPlaytest() {
		isPlaytestOpen = true;
	}

	function closePlaytest() {
		isPlaytestOpen = false;
	}

	let selectedDeck = $derived(
		loadedDeck ?? collection?.decks.find((deck) => deck.id === deckId) ?? null
	);
	let isLocal = $derived(Boolean(collection?.decks.some((deck) => deck.id === deckId)));
	let deckCards = $derived(buildDeckCards(cards, selectedDeck?.entries ?? []));
	let sideboardCards = $derived(buildDeckCards(cards, selectedDeck?.sideboardEntries ?? []));
	let stats = $derived(calculateDeckStats(deckCards, sideboardCards));
	let zones = $derived(getDeckZones(deckCards));
	let championCard = $derived(getChampionCard(cards, selectedDeck?.championCode));
	let hasDeck = $derived(deckCards.length > 0 || sideboardCards.length > 0);
	let deckValidation = $derived(validateDeck(cards, selectedDeck));
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	function showActionNotice(message: string, type: 'success' | 'error' | 'info' = 'info') {
		actionNotice = null;
		window.setTimeout(() => {
			actionNotice = { message, type };
		}, 0);
	}

	async function toggleDeckHidden() {
		if (!selectedDeck?.onlineId) return;
		try {
			const nextHidden = !selectedDeck.hidden;
			const res = await fetch('/api/decks', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deckId: selectedDeck.id, hidden: nextHidden })
			});
			if (!res.ok) throw new Error('อัปเดตเด็คไม่สำเร็จ');
			showActionNotice(nextHidden ? 'ซ่อนเด็คสำเร็จ' : 'แสดงเด็คสำเร็จ', 'success');
			if (browser) {
				window.location.reload();
			}
		} catch {
			showActionNotice('เกิดข้อผิดพลาด', 'error');
		}
	}

	async function deleteDeckAdmin() {
		if (!selectedDeck?.onlineId) return;
		if (!confirm('ยืนยันที่จะลบเด็คนี้ใช่หรือไม่?')) return;
		try {
			const res = await fetch(`/api/decks?deckId=${selectedDeck.id}`, {
				method: 'DELETE'
			});
			if (!res.ok) throw new Error('ลบเด็คไม่สำเร็จ');
			showActionNotice('ลบเด็คสำเร็จ', 'success');
			goto('/deck');
		} catch {
			showActionNotice('เกิดข้อผิดพลาด', 'error');
		}
	}

	async function banOwner() {
		if (!selectedDeck?.owner?.id) return;
		if (!confirm(`ยืนยันที่จะแบนผู้ใช้ ${selectedDeck.owner.displayName} หรือไม่?`)) return;
		try {
			const res = await fetch('/api/admin/ban', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: selectedDeck.owner.id, action: 'ban' })
			});
			if (!res.ok) throw new Error('แบนผู้ใช้ไม่สำเร็จ');
			showActionNotice('แบนผู้ใช้สำเร็จและตัดการเชื่อมต่อแล้ว', 'success');
		} catch {
			showActionNotice('เกิดข้อผิดพลาด', 'error');
		}
	}

	let collectionStats = $derived.by(() => {
		if (!userCardCollection || Object.keys(userCardCollection).length === 0 || !selectedDeck)
			return null;

		let requiredTotal = 0;
		let ownedTotal = 0;
		const missingList: { card: Card; quantity: number }[] = [];

		const entriesList = [...(selectedDeck.entries ?? []), ...(selectedDeck.sideboardEntries ?? [])];
		if (selectedDeck.championCode && championCard) {
			entriesList.push({ code: selectedDeck.championCode, quantity: 1 });
		}

		for (const entry of entriesList) {
			const card = cards.find((c) => c.code === entry.code);
			if (!card) continue;

			requiredTotal += entry.quantity;
			const owned =
				(userCardCollection[card.code] ?? 0) + (userCardCollection[card.code + '_foil'] ?? 0);
			ownedTotal += Math.min(entry.quantity, owned);

			if (owned < entry.quantity) {
				missingList.push({
					card,
					quantity: entry.quantity - owned
				});
			}
		}

		return {
			requiredTotal,
			ownedTotal,
			missingCount: requiredTotal - ownedTotal,
			missingList
		};
	});

	function copyMissingList(missingList: { card: Card; quantity: number }[]) {
		const text = missingList.map((item) => `${item.quantity}x ${item.card.name_en}`).join('\n');
		navigator.clipboard
			.writeText(text)
			.then(() => {
				showActionNotice('คัดลอกรายชื่อการ์ดที่ขาดไปยังคลิปบอร์ดแล้ว', 'success');
			})
			.catch(() => {
				showActionNotice('คัดลอกล้มเหลว', 'error');
			});
	}

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

	function cloneDeckToLocal() {
		if (!selectedDeck || !collection) return;
		const nextCollection = { ...collection };
		const newDeck: StoredDeck = {
			id: crypto.randomUUID(),
			name: `${selectedDeck.name} (Copy)`,
			championCode: selectedDeck.championCode,
			entries: selectedDeck.entries.map((e) => ({ ...e })),
			sideboardEntries: (selectedDeck.sideboardEntries || []).map((e) => ({ ...e })),
			updatedAt: new Date().toISOString(),
			visibility: 'private',
			source: 'local'
		};
		nextCollection.decks = [newDeck, ...nextCollection.decks];
		writeDeckCollectionToStorage(localStorage, nextCollection);
		collection = nextCollection;
		goto(`/deck/${newDeck.id}/edit`);
	}

	function getLegendChampionCards() {
		return [...zones.legends, ...(championCard ? [{ card: championCard, quantity: 1 }] : [])];
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

	<nav
		class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
	>
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a
				href="/deck"
				class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic"
			>
				Rift<span class="rt-brand-accent">Thai</span>
			</a>
			<SiteMenu active="deck" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		{#if selectedDeck}
			<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
				<div
					class="pointer-events-none absolute -top-20 -right-12 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl"
				></div>
				<div class="rt-rule-line relative p-5 pl-7 sm:p-7 sm:pl-9">
					<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
						<div class="min-w-0">
							<p class="rt-kicker mb-3">รายละเอียดเด็ค</p>
							<h1 class="rt-heading text-4xl break-words uppercase italic sm:text-6xl">
								{getDeckTitle(selectedDeck)}
							</h1>
							<p class="rt-copy mt-3 text-sm">
								Updated {new Date(selectedDeck.updatedAt).toLocaleDateString()} · {stats.total} cards
								{#if selectedDeck.owner}
									· Creator: <a
										href="/profile/{selectedDeck.owner.profileSlug}"
										class="font-bold text-cyan-300 hover:underline"
										>{selectedDeck.owner.displayName}</a
									>
								{/if}
							</p>
							{#if isLocal && (selectedDeck.source !== 'online' || !selectedDeck.onlineId)}
								<div
									class="mt-4 rounded-lg border border-amber-300/20 bg-amber-400/5 p-3.5 text-xs text-amber-200"
								>
									<div class="flex items-start gap-2.5">
										<svg
											class="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
											/>
										</svg>
										<div>
											<span class="mb-1 block font-black tracking-wider uppercase"
												>เด็คในเครื่อง (บันทึกเฉพาะอุปกรณ์นี้)</span
											>
											คนอื่นจะไม่สามารถเข้าดูลิงก์นี้ได้ หากต้องการแชร์ให้เพื่อน กรุณาไปที่
											<a href="/deck" class="font-bold text-white underline hover:text-cyan-300"
												>คลังเด็ค</a
											>
											แล้วกดปุ่มสามจุด (&vellip;) เพื่อ <strong>บันทึกออนไลน์</strong>
											และตั้งค่าเป็น <strong>สาธารณะ</strong>
										</div>
									</div>
								</div>
							{:else if selectedDeck.onlineId}
								<div class="mt-4 flex flex-wrap gap-2">
									{#if selectedDeck.hidden}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-rose-300 uppercase"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
											Hidden (ซ่อนโดย Admin)
										</span>
									{/if}
									{#if selectedDeck.visibility === 'public'}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-emerald-300 uppercase"
										>
											<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
											Public (สาธารณะ)
										</span>
									{:else if selectedDeck.visibility === 'unlisted'}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-300 uppercase"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
											Unlisted (ไม่เป็นสาธารณะ - ดูได้เฉพาะผู้มีลิงก์)
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-slate-400 uppercase"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
											Private (ส่วนตัว)
										</span>
									{/if}
								</div>
							{/if}
						</div>
						<div class="flex flex-wrap gap-2">
							<a
								href="/deck"
								class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
							>
								กลับ
							</a>
							{#if hasDeck}
								<button
									onclick={openPlaytest}
									class="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 px-4 text-xs font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14 hover:text-white"
								>
									Playtest
								</button>
							{/if}
							{#if isLocal}
								<a href="/deck/{selectedDeck.id}/edit" class="rt-action">แก้ไขเด็ค</a>
							{:else}
								<button onclick={cloneDeckToLocal} class="rt-action cursor-pointer"
									>คัดลอกไปยังเด็คของฉัน</button
								>
							{/if}
							{#if currentUser?.isAdmin && selectedDeck.onlineId}
								<button
									onclick={toggleDeckHidden}
									class="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 text-xs font-black tracking-widest text-amber-200 uppercase transition hover:bg-amber-500/20"
								>
									{selectedDeck.hidden ? 'Unhide Deck' : 'Hide Deck'}
								</button>
								<button
									onclick={deleteDeckAdmin}
									class="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-red-500/20 bg-red-500/10 px-4 text-xs font-black tracking-widest text-red-200 uppercase transition hover:bg-red-500/20"
								>
									ลบเด็ค (ผู้ดูแล)
								</button>
								{#if selectedDeck.owner?.id}
									<button
										onclick={banOwner}
										class="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-rose-600/20 bg-rose-600/10 px-4 text-xs font-black tracking-widest text-rose-200 uppercase transition hover:bg-rose-600/20"
									>
										Ban Owner
									</button>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			</header>

			{#if actionNotice}
				<Toast
					show={true}
					message={actionNotice.message}
					type={actionNotice.type}
					onclose={() => (actionNotice = null)}
				/>
			{/if}

			{#if collectionStats && collectionStats.missingCount > 0}
				<div class="mb-6 rounded-xl border border-amber-300/20 bg-amber-400/5 p-4 sm:p-5">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-start gap-3">
							<div class="mt-0.5 rounded-full bg-amber-400 p-2 text-slate-950 shadow-lg">
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="3"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<div>
								<h3 class="text-sm font-black tracking-wider text-white uppercase">
									คอลเล็กชันของคุณขาดการ์ดสำหรับเด็คนี้อีก {collectionStats.missingCount} ใบ
								</h3>
								<p class="mt-1 text-xs leading-relaxed text-slate-300">
									คุณสะสมการ์ดในเด็คนี้ได้ {collectionStats.ownedTotal} / {collectionStats.requiredTotal}
									ใบ (ขาดอีก {collectionStats.missingList.length} แบบ)
								</p>
							</div>
						</div>

						<button
							type="button"
							class="inline-flex min-h-10 cursor-pointer items-center justify-center self-start rounded-lg border border-amber-200/20 bg-amber-400/10 px-4 text-xs font-black tracking-widest text-amber-200 uppercase transition hover:bg-amber-400/20 sm:self-center"
							onclick={() => copyMissingList(collectionStats.missingList)}
						>
							คัดลอกการ์ดที่ขาด
						</button>
					</div>
				</div>
			{:else if collectionStats && collectionStats.missingCount === 0}
				<div class="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
					<div class="flex items-start gap-3">
						<div class="mt-0.5 rounded-full bg-emerald-500 p-2 text-slate-950 shadow-lg">
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="3"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-black tracking-wider text-white uppercase">
								คุณมีการ์ดครบสำหรับประกอบเด็คนี้แล้ว!
							</h3>
							<p class="mt-1 text-xs leading-relaxed text-slate-300">
								คุณมีการ์ดสะสมทั้งหมด {collectionStats.requiredTotal} / {collectionStats.requiredTotal}
								ใบที่เด็คนี้ต้องการในบัญชีของคุณเรียบร้อยแล้ว
							</p>
						</div>
					</div>
				</div>
			{/if}

			{#if !hasDeck}
				<section class="rt-panel rounded-xl p-8 text-center">
					<h2 class="text-2xl font-black text-white uppercase italic">เด็คยังว่าง</h2>
					<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">ยังไม่มีการ์ดในเด็คนี้</p>
					{#if isLocal}
						<a href="/deck/{selectedDeck.id}/edit" class="rt-action mt-6">เริ่มจัดเด็ค</a>
					{:else}
						<button onclick={cloneDeckToLocal} class="rt-action mt-6 cursor-pointer"
							>คัดลอกไปยังเด็คของฉัน</button
						>
					{/if}
				</section>
			{:else}
				<DeckValidationPanel validation={deckValidation} />

				<section class="mb-6 grid gap-5 lg:grid-cols-3">
					{@render ChartPanel('Cost Curve', stats.costs)}
					{@render ChartPanel('Card Types', stats.types)}
					{@render ChartPanel('Main Domains', stats.domains, true)}
				</section>

				<section class="mb-6 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black text-white uppercase italic">Legend + Champion</h2>
						{@render CardList(getLegendChampionCards(), false, true)}
					</div>
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black text-white uppercase italic">Battlefield</h2>
						{@render CardList(zones.battlefields, true)}
					</div>
				</section>

				<section class="space-y-5">
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black text-white uppercase italic">Main Deck</h2>
						{@render CardList(zones.main)}
					</div>
					<div class="rt-panel rounded-xl p-5">
						<h2 class="mb-4 text-lg font-black text-white uppercase italic">Rune Deck</h2>
						{@render CardList(zones.runes)}
					</div>
					{#if sideboardCards.length > 0}
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black text-white uppercase italic">Sideboard</h2>
							{@render CardList(sideboardCards)}
						</div>
					{/if}
					{#if zones.tokens.length > 0}
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black text-white uppercase italic">การ์ด Token</h2>
							{@render CardList(zones.tokens)}
						</div>
					{/if}
					{#if zones.other.length > 0}
						<div class="rt-panel rounded-xl p-5">
							<h2 class="mb-4 text-lg font-black text-white uppercase italic">การ์ดอื่นๆ</h2>
							{@render CardList(zones.other)}
						</div>
					{/if}
				</section>
			{/if}
		{:else}
			<div class="rt-panel mx-auto w-full max-w-xs rounded-xl p-5 text-center">
				<div
					class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"
				></div>
				<div class="mt-4 text-sm font-black tracking-widest text-white uppercase">
					กำลังโหลดเด็ค
				</div>
			</div>
		{/if}
	</main>
</div>

{#if selectedDeck}
	<PlaytestModal deck={selectedDeck} {cards} isOpen={isPlaytestOpen} onClose={closePlaytest} />
{/if}

{#snippet ChartPanel(title: string, items: { label: string; count: number }[], icons = false)}
	<div class="rt-panel rounded-xl p-5">
		<h2 class="mb-4 text-lg font-black text-white uppercase italic">{title}</h2>
		<div class="space-y-3">
			{#each items as item}
				<div>
					<div
						class="mb-1 flex items-center justify-between gap-3 text-xs font-black tracking-widest uppercase"
					>
						<span class="flex min-w-0 items-center gap-2 text-slate-300">
							{#if icons && getDomainIcon(item.label)}
								<img
									src={getDomainIcon(item.label) ?? ''}
									class="h-4 w-4 object-contain"
									alt={item.label}
								/>
							{/if}
							<span class="truncate">{item.label}</span>
						</span>
						<span class="text-cyan-200">{item.count}</span>
					</div>
					<div class="h-2 overflow-hidden rounded-sm bg-black/30">
						<div
							class="h-full bg-cyan-300"
							style="width: {(item.count / getMaxCount(items)) * 100}%"
						></div>
					</div>
				</div>
			{:else}
				<p class="text-sm font-bold text-slate-500">ไม่มีข้อมูล</p>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet CardList(items: DeckCard[], horizontal = false, isLegend = false)}
	<div
		class={horizontal
			? 'grid gap-3 sm:grid-cols-2'
			: isLegend
				? 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4'
				: 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-8'}
	>
		{#each items as item}
			{@const owned = userCardCollection[item.card.code] ?? 0}
			{@const isMissing = Object.keys(userCardCollection).length > 0 && owned < item.quantity}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<article
				class={horizontal
					? `group grid min-h-32 cursor-pointer grid-cols-[8.5rem_1fr] gap-3 rounded-lg border p-2 transition hover:scale-[1.01] hover:border-cyan-300/35 sm:grid-cols-[10.5rem_1fr] ${isMissing ? 'border-amber-500/30 bg-slate-950/80 shadow-[inset_0_0_12px_rgba(245,158,11,0.03)]' : 'border-white/10 bg-slate-950/70'}`
					: `group min-w-0 cursor-pointer rounded-lg border p-2 transition hover:scale-[1.01] hover:border-cyan-300/35 ${isMissing ? 'border-amber-500/30 bg-slate-950/80 shadow-[inset_0_0_12px_rgba(245,158,11,0.03)]' : 'border-white/10 bg-slate-950/70'}`}
				onclick={() => openCardPopup(item.card)}
			>
				<div class="relative overflow-hidden rounded-md bg-slate-950">
					{#if item.card.image_url}
						<img
							src={getCardImageUrl(item.card.image_url, 260, 'webp')}
							class="{horizontal
								? 'aspect-[1039/744] h-full w-full object-contain'
								: 'aspect-[744/1039] w-full object-contain'} {!horizontal &&
							usesLandscapeCardFrame(item.card)
								? 'battlefield-rotated'
								: ''}"
							alt={item.card.name_en}
							loading="lazy"
						/>
					{/if}
					<div class="absolute top-2 right-2 left-2 z-10 flex items-center justify-between gap-1">
						{#if Object.keys(userCardCollection).length > 0}
							<div
								class="rounded-md border px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase shadow-md backdrop-blur
								{owned >= item.quantity
									? 'border-emerald-400 bg-emerald-500/80 text-white'
									: owned > 0
										? 'border-amber-400 bg-amber-500/80 text-white'
										: 'border-rose-400 bg-rose-500/80 text-white'}"
								title="มีอยู่: {owned} / {item.quantity}"
							>
								<span class="hidden sm:inline">มี: </span>{owned}/{item.quantity}
							</div>
						{:else}
							<div></div>
						{/if}
						<div
							class="rounded-md bg-cyan-300 px-1.5 py-0.5 text-[10px] font-black text-slate-950 shadow-lg"
						>
							x{item.quantity}
						</div>
					</div>
				</div>
				<div class={horizontal ? 'min-w-0 self-center py-1 pr-1' : 'min-w-0 px-1 pt-2 pb-1'}>
					<div class="truncate text-sm font-black text-white uppercase italic">
						{item.card.name_en}
					</div>
					<div
						class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase"
					>
						<span class="truncate">{item.card.type}</span>
						<span class="text-slate-700">/</span>
						<span class="truncate">{item.card.code}</span>
					</div>
					<div class="mt-2 flex max-h-6 flex-wrap gap-1 overflow-hidden">
						{#each item.card.domains ?? [] as domain}
							{#if getDomainIcon(domain)}
								<img
									src={getDomainIcon(domain) ?? ''}
									class="h-5 w-5 object-contain"
									alt={domain}
									title={domain}
								/>
							{:else}
								<span
									class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black tracking-widest text-slate-300 uppercase"
								>
									{domain}
								</span>
							{/if}
						{/each}
					</div>
				</div>
			</article>
		{:else}
			<p class="col-span-full text-sm font-bold text-slate-500">ไม่มีการ์ด</p>
		{/each}
	</div>
{/snippet}

{#if selectedPopupCard}
	<CardModal card={selectedPopupCard} closePopup={closeCardPopup} canEdit={false} />
{/if}
