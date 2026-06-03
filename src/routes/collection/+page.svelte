<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { isRuneCard, isLegendCard, isBattlefieldCard, isMainDeckCard } from '$lib/utils/deck';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);

	let currentUser = $state<{ id: string; profileHandle: string } | null>(null);
	let authLoading = $state(true);
	let collection = $state<Record<string, number>>({});
	let collectionLoading = $state(false);

	let query = $state('');
	let selectedColor = $state('');
	let selectedType = $state('All');
	let hideUnowned = $state(false);
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	const cardTypes = ['All', 'Unit', 'Spell', 'Gear', 'Rune', 'Battlefield', 'Legend'];

	onMount(() => {
		void loadSession();
		const syncAuth = () => void loadSession();
		window.addEventListener('riftthai-auth-changed', syncAuth);
		return () => window.removeEventListener('riftthai-auth-changed', syncAuth);
	});

	async function loadSession() {
		authLoading = true;
		try {
			const response = await fetch('/api/auth/session');
			const payload = await response.json().catch(() => ({}));
			currentUser = payload.user || null;
			if (currentUser) {
				void loadCollection();
			}
		} catch {
			currentUser = null;
		} finally {
			authLoading = false;
		}
	}

	async function loadCollection() {
		collectionLoading = true;
		try {
			const response = await fetch('/api/collection');
			const payload = await response.json().catch(() => ({}));
			if (response.ok) {
				collection = payload.collection || {};
			}
		} catch (error) {
			console.error('Failed to load collection:', error);
		} finally {
			collectionLoading = false;
		}
	}

	function openAuth(mode: 'login' | 'register') {
		window.dispatchEvent(new CustomEvent('riftthai-open-auth', { detail: { mode } }));
	}

	function showActionNotice(message: string, type: 'success' | 'error' | 'info' = 'info') {
		actionNotice = { message, type };
		window.setTimeout(() => {
			if (actionNotice?.message === message) actionNotice = null;
		}, 2600);
	}

	// Filtered cards based on criteria
	let filteredCards = $derived(
		cards.filter((card) => {
			const search = query.trim().toLowerCase();
			if (search) {
				const matchesText = [card.name_en, card.name_th, card.code]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(search));
				if (!matchesText) return false;
			}

			if (selectedColor) {
				const domains = card.domains || [];
				if (selectedColor === 'Colorless') {
					if (domains.length > 0 && !domains.includes('Colorless')) return false;
				} else {
					if (!domains.includes(selectedColor)) return false;
				}
			}

			if (selectedType !== 'All') {
				if (selectedType === 'Rune' && !isRuneCard(card)) return false;
				if (selectedType === 'Legend' && !isLegendCard(card)) return false;
				if (selectedType === 'Battlefield' && !isBattlefieldCard(card)) return false;
				if (selectedType === 'Unit' && card.type !== 'Unit') return false;
				if (selectedType === 'Spell' && card.type !== 'Spell') return false;
				if (selectedType === 'Gear' && card.type !== 'Gear') return false;
			}

			if (hideUnowned) {
				const count = collection[card.code] ?? 0;
				if (count <= 0) return false;
			}

			return true;
		})
	);

	// Stats
	// Stats
	let stats = $derived.by(() => {
		const totalCards = cards.length;
		let uniqueOwned = 0;
		let totalOwned = 0;
		for (const card of cards) {
			const count = collection[card.code] ?? 0;
			if (count > 0) {
				uniqueOwned++;
				totalOwned += count;
			}
		}
		const percentUnique = totalCards > 0 ? Math.round((uniqueOwned / totalCards) * 100) : 0;
		return { totalCards, uniqueOwned, totalOwned, percentUnique };
	});

	async function updateQuantity(cardCode: string, quantity: number) {
		if (!currentUser) return;
		const qty = Math.max(0, Math.min(9, quantity));
		const previousQty = collection[cardCode] ?? 0;

		// Optimistic UI update
		collection = { ...collection, [cardCode]: qty };

		try {
			const response = await fetch('/api/collection', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ cardCode, quantity: qty })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(payload.error || 'Failed to update quantity');
			}
		} catch (error) {
			// Rollback on error
			collection = { ...collection, [cardCode]: previousQty };
			showActionNotice(error instanceof Error ? error.message : 'Error updating collection', 'error');
		}
	}

	function increment(cardCode: string) {
		const current = collection[cardCode] ?? 0;
		void updateQuantity(cardCode, current + 1);
	}

	function decrement(cardCode: string) {
		const current = collection[cardCode] ?? 0;
		if (current > 0) {
			void updateQuantity(cardCode, current - 1);
		}
	}

	async function setPlaysets() {
		if (!currentUser || !confirm('ต้องการตั้งค่าการ์ดทั้งหมดให้เป็น Playset หรือไม่?')) return;
		
		collectionLoading = true;
		try {
			for (const card of cards) {
				let qty = 3;
				if (isLegendCard(card) || isBattlefieldCard(card)) qty = 1;
				collection[card.code] = qty;
				
				await fetch('/api/collection', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cardCode: card.code, quantity: qty })
				});
			}
			showActionNotice('ตั้งค่า Playset สำหรับการ์ดทั้งหมดสำเร็จ', 'success');
		} catch (error) {
			showActionNotice('พบข้อผิดพลาดขณะบันทึกข้อมูลสะสม', 'error');
		} finally {
			collectionLoading = false;
		}
	}

	async function clearCollection() {
		if (!currentUser || !confirm('ต้องการล้างข้อมูลการ์ดสะสมทั้งหมดหรือไม่?')) return;

		collectionLoading = true;
		try {
			for (const code of Object.keys(collection)) {
				await fetch('/api/collection', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cardCode: code, quantity: 0 })
				});
			}
			collection = {};
			showActionNotice('ล้างข้อมูลการ์ดสะสมสำเร็จ', 'success');
		} catch (error) {
			showActionNotice('พบข้อผิดพลาดขณะล้างข้อมูลสะสม', 'error');
		} finally {
			collectionLoading = false;
		}
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<div class="flex min-w-0 items-center gap-3">
				<a
					href="/"
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/5 text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/25 sm:w-auto sm:px-4"
					aria-label="Back to home"
				>
					<svg
						class="h-5 w-5 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					<span class="hidden text-xs font-black tracking-widest uppercase sm:ml-2 sm:block">Back</span>
				</a>

				<a href="/" class="shrink-0 text-xl font-black text-white uppercase italic sm:text-2xl">
					Rift<span class="text-cyan-300">Thai</span>
				</a>
			</div>
			<SiteMenu active="collection" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		{#if actionNotice}
			<div
				class="animate-in fade-in slide-in-from-top-4 fixed top-20 right-4 z-[300] flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-wider shadow-2xl backdrop-blur-xl duration-150
				{actionNotice.type === 'success'
					? 'border-emerald-300/20 bg-emerald-950/90 text-emerald-300'
					: actionNotice.type === 'error'
						? 'border-rose-300/20 bg-rose-950/90 text-rose-300'
						: 'border-cyan-300/20 bg-cyan-950/90 text-cyan-300'}"
			>
				{actionNotice.message}
			</div>
		{/if}

		<header class="rt-panel rt-topline rt-scanline mb-6 rounded-xl p-5 sm:p-7">
			<p class="rt-kicker mb-3">Collection Tracker</p>
			<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">การ์ดสะสม</h1>
			<p class="rt-copy mt-3 max-w-xl text-sm leading-relaxed">
				จัดการบันทึกจำนวนการ์ดสะสมที่คุณเป็นเจ้าของ เพื่อระบบจะนำจำนวนการ์ดสะสมไปใช้เปรียบเทียบในหน้าสร้างและดูเด็คต่างๆ ได้อย่างอัตโนมัติ
			</p>
		</header>

		{#if authLoading}
			<section class="rt-panel rounded-xl p-12 text-center">
				<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
				<div class="mt-4 text-sm font-black tracking-widest text-white uppercase">Loading Profile</div>
			</section>
		{:else if !currentUser}
			<section class="rt-panel rounded-xl p-10 text-center max-w-lg mx-auto">
				<h2 class="text-2xl font-black text-white uppercase italic">Login Required</h2>
				<p class="rt-copy mt-3 text-sm">
					โปรดเข้าสู่ระบบเพื่อใช้งานระบบการ์ดสะสม เพื่อบันทึกจำนวนการ์ดของคุณลงในบัญชีส่วนตัวและซิงก์ข้อมูลไปใช้ในระบบจัดเด็ค
				</p>
				<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<button
						type="button"
						class="h-11 rounded-lg bg-cyan-300 px-6 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200"
						onclick={() => openAuth('login')}
					>
						Login / เข้าสู่ระบบ
					</button>
					<button
						type="button"
						class="h-11 rounded-lg border border-cyan-300/20 px-6 text-xs font-black tracking-widest text-cyan-200 uppercase transition hover:bg-cyan-300/10"
						onclick={() => openAuth('register')}
					>
						Register / สมัครสมาชิก
					</button>
				</div>
			</section>
		{:else}
			<!-- Collection Dashboard -->
			<div class="grid gap-6 md:grid-cols-[1fr_minmax(240px,360px)]">
				
				<!-- Main Workspace -->
				<div class="space-y-6">
					
					<!-- Toolbar & Filters -->
					<div class="rt-panel rounded-xl p-4 sm:p-5">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0 flex-1">
								<input
									type="search"
									placeholder="ค้นหาชื่อการ์ด / โค้ดการ์ด (Search name / code)..."
									bind:value={query}
									class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 text-xs font-bold text-white placeholder-slate-500 focus:border-cyan-300/50 focus:outline-none focus:ring-0"
								/>
							</div>
							
							<div class="flex flex-wrap items-center gap-2">
								<select
									bind:value={selectedType}
									class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-bold text-white focus:border-cyan-300/50 focus:outline-none"
								>
									{#each cardTypes as type}
										<option value={type}>{type}</option>
									{/each}
								</select>

								<label
									class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-black tracking-widest text-slate-300 uppercase cursor-pointer select-none"
								>
									<input type="checkbox" bind:checked={hideUnowned} class="h-4 w-4 accent-cyan-300" />
									มีแล้วเท่านั้น
								</label>
							</div>
						</div>

						<!-- Color/Domain Filters -->
						<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
							<div class="flex flex-wrap items-center gap-1.5" title="Filter by Color / Domain">
								{#each ['Body', 'Calm', 'Chaos', 'Fury', 'Mind', 'Order', 'Colorless'] as domain}
									{@const icon = getDomainIcon(domain)}
									<button
										type="button"
										class="relative h-10 w-10 rounded-lg border p-2 transition {selectedColor === domain
											? 'border-cyan-300 bg-cyan-300/18 shadow-[0_0_12px_rgba(83,234,253,0.38)]'
											: 'border-white/10 bg-slate-950/70 hover:border-cyan-300/30'}"
										onclick={() => (selectedColor = selectedColor === domain ? '' : domain)}
										aria-label="Filter by {domain}"
										title={domain}
									>
										{#if icon}
											<img src={icon} class="h-full w-full object-contain" alt={domain} />
										{:else}
											<span class="text-[9px] font-black uppercase text-slate-400">CL</span>
										{/if}
									</button>
								{/each}
							</div>

							{#if query || selectedColor || selectedType !== 'All' || hideUnowned}
								<button
									type="button"
									class="text-xs font-black tracking-widest text-cyan-300 uppercase transition hover:text-cyan-100"
									onclick={() => {
										query = '';
										selectedColor = '';
										selectedType = 'All';
										hideUnowned = false;
									}}
								>
									Clear Filters
								</button>
							{/if}
						</div>
					</div>

					<!-- Cards Grid -->
					{#if collectionLoading}
						<div class="rt-panel rounded-xl p-12 text-center">
							<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
							<div class="mt-4 text-sm font-black tracking-widest text-white uppercase">Updating Collection</div>
						</div>
					{:else if filteredCards.length === 0}
						<div class="rt-panel rounded-xl p-8 text-center">
							<h2 class="text-xl font-black text-white uppercase italic">No Cards Found</h2>
							<p class="rt-copy mt-2 text-xs">ไม่พบการ์ดตรงตามเงื่อนไข ลองล้างฟิลเตอร์หรือค้นหาอีกครั้ง</p>
						</div>
					{:else}
						<div class="grid gap-3 grid-cols-2 min-[500px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
							{#each filteredCards as card}
								{@const count = collection[card.code] ?? 0}
								<div class="rt-panel group flex flex-col overflow-hidden rounded-xl border transition {count > 0 ? 'border-cyan-300/25 bg-[#0a1120]/50' : 'border-white/5 bg-slate-950/20'}">
									<!-- Image Wrapper -->
									<div class="relative aspect-[744/1039] overflow-hidden bg-black/10">
										<img
											src={getCardImageUrl(card.image_url, 260, 'webp')}
											class="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03] {count === 0 ? 'opacity-40 grayscale-[40%]' : ''}"
											alt={card.name_en}
											loading="lazy"
										/>
										{#if count > 0}
											<div class="absolute top-2 left-2 z-10 rounded-lg bg-cyan-300 text-slate-950 font-black text-[10px] px-2 py-0.5 shadow-lg">
												Owned: {count}
											</div>
										{/if}
									</div>

									<!-- Card Details & Controller -->
									<div class="flex flex-col flex-1 p-2.5">
										<div class="min-w-0 flex-1">
											<h3 class="truncate text-xs font-black text-white">{card.name_th || card.name_en}</h3>
											<p class="truncate text-[9px] font-black tracking-wider text-slate-500 uppercase mt-0.5">{card.name_en}</p>
										</div>

										<div class="mt-3 flex items-center justify-between gap-1 border-t border-white/5 pt-2">
											<button
												type="button"
												class="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-slate-950 text-xs font-black text-slate-400 hover:border-cyan-300/30 hover:text-white transition disabled:opacity-40"
												onclick={() => decrement(card.code)}
												disabled={count === 0}
												aria-label="Decrease"
											>
												-
											</button>
											<span class="text-xs font-black text-white min-w-[1.25rem] text-center">
												{count}
											</span>
											<button
												type="button"
												class="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-slate-950 text-xs font-black text-slate-400 hover:border-cyan-300/30 hover:text-white transition disabled:opacity-40"
												onclick={() => increment(card.code)}
												disabled={count >= 9}
												aria-label="Increase"
											>
												+
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Stats & Options Column -->
				<div class="space-y-6">
					
					<!-- Collection Status Card -->
					<div class="rt-panel rt-scanline rounded-xl p-5">
						<h2 class="text-lg font-black text-white uppercase italic">Collection Progress</h2>
						
						<!-- Progress Bar -->
						<div class="mt-4">
							<div class="flex items-center justify-between text-xs font-black text-slate-400">
								<span>Completion</span>
								<span class="text-cyan-300">{stats.percentUnique}%</span>
							</div>
							<div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
								<div class="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-300" style="width: {stats.percentUnique}%"></div>
							</div>
						</div>

						<div class="mt-5 grid grid-cols-2 gap-3 text-center">
							<div class="rounded-lg bg-black/20 border border-white/5 p-3">
								<div class="text-xl font-black text-white">{stats.uniqueOwned}</div>
								<div class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">Unique Cards</div>
							</div>
							<div class="rounded-lg bg-black/20 border border-white/5 p-3">
								<div class="text-xl font-black text-cyan-300">{stats.totalOwned}</div>
								<div class="mt-1 text-[9px] font-black tracking-widest text-slate-500 uppercase">Total Owned</div>
							</div>
						</div>
					</div>

					<!-- Options Panel -->
					<div class="rt-panel rounded-xl p-5">
						<h2 class="text-lg font-black text-white uppercase italic">Quick Setup</h2>
						<p class="rt-copy mt-2 text-xs">คำสั่งพิเศษช่วยจัดการคอลเล็กชันของคุณอย่างรวดเร็ว</p>

						<div class="mt-4 space-y-2">
							<button
								type="button"
								class="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/5 px-4 text-xs font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
								onclick={setPlaysets}
								disabled={collectionLoading}
							>
								ตั้งค่าการ์ดทุกใบเป็น Playset
							</button>

							<button
								type="button"
								class="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 text-xs font-black tracking-widest text-rose-300 uppercase transition hover:bg-rose-300/10 hover:text-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
								onclick={clearCollection}
								disabled={collectionLoading || Object.keys(collection).length === 0}
							>
								ล้างข้อมูลคอลเล็กชันทั้งหมด
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
