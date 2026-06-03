<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import { isRuneCard, isLegendCard, isBattlefieldCard, isMainDeckCard } from '$lib/utils/deck';
	import Toast from '$lib/components/ui/Toast.svelte';

	let { data } = $props();
	let cards = $derived((data.cards as Card[]) || []);
	let sets = $derived(['All', ...new Set(cards.map((c) => c.set_name).filter(Boolean))]);

	let currentUser = $state<{ id: string; profileHandle: string } | null>(null);
	let authLoading = $state(true);
	let collection = $state<Record<string, number>>({});
	let collectionLoading = $state(false);

	let query = $state('');
	let selectedColor = $state('');
	let selectedType = $state('All');
	let selectedSet = $state('');
	let hideUnowned = $state(false);
	let currentPage = $state(1);
	const cardsPerPage = 40;
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
	let selectedPopupCard = $state<Card | null>(null);
	let backupText = $state('');

	function openPopup(card: Card) {
		selectedPopupCard = card;
	}

	function closePopup() {
		selectedPopupCard = null;
	}

	function exportCollectionText() {
		const lines: string[] = [];
		for (const [code, qty] of Object.entries(collection)) {
			if (qty > 0) {
				lines.push(`${code}: ${qty}`);
			}
		}
		backupText = lines.join('\n');
		if (backupText) {
			void navigator.clipboard.writeText(backupText);
			showActionNotice('คัดลอกข้อมูลการ์ดสะสมไปยังคลิปบอร์ดแล้ว', 'success');
		} else {
			showActionNotice('ไม่มีการ์ดสะสมสำหรับส่งออก', 'info');
		}
	}

	async function importCollectionText() {
		if (!currentUser || !backupText.trim()) return;
		collectionLoading = true;
		try {
			const lines = backupText.split('\n');
			const updates: { cardCode: string; quantity: number }[] = [];
			
			for (const line of lines) {
				const cleanLine = line.trim();
				if (!cleanLine) continue;
				
				const match = cleanLine.match(/^([A-Za-z0-9-_]+)\s*(?:[:x*=\s-])\s*(\d+)/i);
				if (match) {
					const code = match[1].trim().toUpperCase();
					const isFoil = code.endsWith('_FOIL');
					const qty = Math.max(0, Math.min(9, parseInt(match[2], 10)));
					
					const baseCode = isFoil ? code.slice(0, -5) : code;
					const exists = cards.some(c => c.code.toUpperCase() === baseCode);
					if (exists) {
						updates.push({ cardCode: code, quantity: qty });
					}
				}
			}
			
			if (updates.length === 0) {
				showActionNotice('ไม่พบรหัสการ์ดและจำนวนที่ถูกต้อง', 'error');
				return;
			}
			
			const response = await fetch('/api/collection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entries: updates })
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload.error || 'Failed to import collection');
			}

			for (const update of updates) {
				if (update.quantity === 0) {
					delete collection[update.cardCode];
				} else {
					collection[update.cardCode] = update.quantity;
				}
			}
			
			collection = { ...collection };
			showActionNotice(`นำเข้าข้อมูลสำเร็จ (${updates.length} รายการ)`, 'success');
			backupText = '';
		} catch (error) {
			console.error('Failed to import text:', error);
			showActionNotice('เกิดข้อผิดพลาดขณะนำเข้าข้อมูล', 'error');
		} finally {
			collectionLoading = false;
		}
	}

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
		actionNotice = null;
		window.setTimeout(() => {
			actionNotice = { message, type };
		}, 0);
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

			if (selectedSet !== 'All' && card.set_name !== selectedSet) return false;

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
				const countNormal = collection[card.code] ?? 0;
				const countFoil = collection[card.code + '_foil'] ?? 0;
				if (countNormal + countFoil <= 0) return false;
			}

			return true;
		})
	);

	let totalPages = $derived(Math.max(1, Math.ceil(filteredCards.length / cardsPerPage)));
	let paginatedCards = $derived(
		filteredCards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)
	);

	$effect(() => {
		query;
		selectedColor;
		selectedType;
		selectedSet;
		hideUnowned;
		currentPage = 1;
	});

	$effect(() => {
		if (currentPage > totalPages) currentPage = totalPages;
	});

	// Stats
	let stats = $derived.by(() => {
		const cardsInSet = selectedSet === 'All' 
			? cards 
			: cards.filter(c => c.set_name === selectedSet);

		const totalCards = cardsInSet.length;
		let uniqueOwned = 0;
		let totalOwned = 0;
		for (const card of cardsInSet) {
			const countNormal = collection[card.code] ?? 0;
			const countFoil = collection[card.code + '_foil'] ?? 0;
			if (countNormal > 0 || countFoil > 0) {
				uniqueOwned++;
				totalOwned += countNormal + countFoil;
			}
		}
		const percentUnique = totalCards > 0 ? Math.round((uniqueOwned / totalCards) * 100) : 0;
		return { totalCards, uniqueOwned, totalOwned, percentUnique };
	});

	function getSetStats(setName: string) {
		const setCards = setName === 'All' 
			? cards 
			: cards.filter(c => c.set_name === setName);
		const totalCards = setCards.length;
		let uniqueOwned = 0;
		let totalOwned = 0;
		for (const card of setCards) {
			const countNormal = collection[card.code] ?? 0;
			const countFoil = collection[card.code + '_foil'] ?? 0;
			if (countNormal > 0 || countFoil > 0) {
				uniqueOwned++;
				totalOwned += countNormal + countFoil;
			}
		}
		const percentUnique = totalCards > 0 ? Math.round((uniqueOwned / totalCards) * 100) : 0;
		return { totalCards, uniqueOwned, totalOwned, percentUnique };
	}

	let setStatsSummary = $derived.by(() => {
		return {
			Origins: getSetStats('Origins'),
			Spiritforged: getSetStats('Spiritforged'),
			Unleashed: getSetStats('Unleashed'),
			'Proving Grounds': getSetStats('Proving Grounds'),
			All: getSetStats('All')
		};
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

	function increment(cardCode: string, type: 'normal' | 'foil' = 'normal') {
		const suffix = type === 'foil' ? '_foil' : '';
		const current = collection[cardCode + suffix] ?? 0;
		void updateQuantity(cardCode + suffix, current + 1);
	}

	function decrement(cardCode: string, type: 'normal' | 'foil' = 'normal') {
		const suffix = type === 'foil' ? '_foil' : '';
		const current = collection[cardCode + suffix] ?? 0;
		if (current > 0) {
			void updateQuantity(cardCode + suffix, current - 1);
		}
	}

	async function setPlaysets() {
		if (!currentUser) return;
		
		const isAll = selectedSet === 'All';
		const confirmMsg = isAll 
			? 'ต้องการตั้งค่าการ์ดทั้งหมดในทุกชุดให้เป็น Playset หรือไม่?' 
			: `ต้องการตั้งค่าการ์ดทั้งหมดในชุด ${selectedSet} ให้เป็น Playset หรือไม่?`;
			
		if (!confirm(confirmMsg)) return;
		
		collectionLoading = true;
		try {
			if (isAll) {
				await fetch('/api/collection', { method: 'DELETE' });
			}

			const setCards = isAll 
				? cards 
				: cards.filter(c => c.set_name === selectedSet);

			const entries: { cardCode: string; quantity: number }[] = [];
			const nextCollection = isAll ? {} : { ...collection };

			for (const card of setCards) {
				let qty = 3;
				if (isLegendCard(card) || isBattlefieldCard(card)) qty = 1;
				entries.push({ cardCode: card.code, quantity: qty });
				nextCollection[card.code] = qty;
			}

			const response = await fetch('/api/collection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entries })
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload.error || 'Failed to batch update playset');
			}

			collection = nextCollection;
			const successMsg = isAll 
				? 'ตั้งค่า Playset สำหรับการ์ดทั้งหมดสำเร็จ' 
				: `ตั้งค่า Playset สำหรับการ์ดในชุด ${selectedSet} สำเร็จ`;
			showActionNotice(successMsg, 'success');
		} catch (error) {
			console.error('Failed to set playsets:', error);
			showActionNotice('พบข้อผิดพลาดขณะบันทึกข้อมูลสะสม', 'error');
		} finally {
			collectionLoading = false;
		}
	}

	async function clearCollection() {
		if (!currentUser) return;

		const isAll = selectedSet === 'All';
		const confirmMsg = isAll 
			? 'ต้องการล้างข้อมูลการ์ดสะสมทั้งหมดในทุกชุดหรือไม่?' 
			: `ต้องการล้างข้อมูลการ์ดสะสมทั้งหมดในชุด ${selectedSet} หรือไม่?`;

		if (!confirm(confirmMsg)) return;

		collectionLoading = true;
		try {
			if (isAll) {
				const response = await fetch('/api/collection', {
					method: 'DELETE'
				});
				if (!response.ok) {
					const payload = await response.json().catch(() => ({}));
					throw new Error(payload.error || 'Failed to clear collection');
				}
				collection = {};
			} else {
				const setCards = cards.filter(c => c.set_name === selectedSet);
				const entries: { cardCode: string; quantity: number }[] = [];
				const nextCollection = { ...collection };

				for (const card of setCards) {
					entries.push({ cardCode: card.code, quantity: 0 });
					entries.push({ cardCode: card.code + '_foil', quantity: 0 });
					delete nextCollection[card.code];
					delete nextCollection[card.code + '_foil'];
				}

				const response = await fetch('/api/collection', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ entries })
				});

				if (!response.ok) {
					const payload = await response.json().catch(() => ({}));
					throw new Error(payload.error || 'Failed to clear set collection');
				}

				collection = nextCollection;
			}

			const successMsg = isAll 
				? 'ล้างข้อมูลการ์ดสะสมทั้งหมดสำเร็จ' 
				: `ล้างข้อมูลการ์ดสะสมในชุด ${selectedSet} สำเร็จ`;
			showActionNotice(successMsg, 'success');
		} catch (error) {
			console.error('Failed to clear collection:', error);
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
			<Toast
				show={true}
				message={actionNotice.message}
				type={actionNotice.type}
				onclose={() => actionNotice = null}
			/>
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
		{:else if selectedSet === ''}
			<!-- Set Selection Grid -->
			<section class="space-y-6 max-w-7xl mx-auto py-2">
				<header class="text-center py-6">
					<h2 class="text-2xl font-black text-white uppercase italic tracking-wide">เลือกชุดการ์ดเพื่อจัดการสะสม</h2>
					<p class="text-xs text-slate-400 mt-2">เลือกเซ็ตการ์ดด้านล่างเพื่อตรวจสอบ สถิติ และจัดการจำนวนการ์ดที่คุณสะสมไว้</p>
				</header>

				<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<!-- Origins Set -->
					<button
						type="button"
						onclick={() => selectedSet = 'Origins'}
						class="rt-panel group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 p-5 text-left transition duration-200 hover:scale-[1.02] hover:shadow-cyan-400/10 hover:border-cyan-400/30 cursor-pointer"
					>
						<div class="flex flex-col items-center py-6">
							<img src="/images/Set/origins.webp" class="h-14 object-contain group-hover:scale-105 transition" alt="Origins Set" />
						</div>
						<div class="mt-4 border-t border-white/5 pt-4">
							<h3 class="text-sm font-black text-white italic uppercase">Origins</h3>
							<p class="text-[9px] text-slate-500 font-bold uppercase mt-1">ชุดหลัก (Base Set)</p>
							
							<div class="mt-4 space-y-2">
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">การ์ดทั้งหมด</span>
									<span class="text-white font-black">{setStatsSummary.Origins.totalCards} ใบ</span>
								</div>
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">สะสมแล้ว</span>
									<span class="text-cyan-300 font-black">{setStatsSummary.Origins.uniqueOwned} ใบ</span>
								</div>
								<div class="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
									<div class="h-full bg-cyan-300" style="width: {setStatsSummary.Origins.percentUnique}%"></div>
								</div>
								<div class="text-right text-[9px] font-black text-slate-400 mt-1">{setStatsSummary.Origins.percentUnique}%</div>
							</div>
						</div>
					</button>

					<!-- Spiritforged Set -->
					<button
						type="button"
						onclick={() => selectedSet = 'Spiritforged'}
						class="rt-panel group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 p-5 text-left transition duration-200 hover:scale-[1.02] hover:shadow-purple-500/10 hover:border-purple-500/30 cursor-pointer"
					>
						<div class="flex flex-col items-center py-6">
							<img src="/images/Set/spiritforged.webp" class="h-14 object-contain group-hover:scale-105 transition" alt="Spiritforged Set" />
						</div>
						<div class="mt-4 border-t border-white/5 pt-4">
							<h3 class="text-sm font-black text-white italic uppercase">Spiritforged</h3>
							<p class="text-[9px] text-slate-500 font-bold uppercase mt-1">ชุดเสริม (Expansion Set)</p>
							
							<div class="mt-4 space-y-2">
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">การ์ดทั้งหมด</span>
									<span class="text-white font-black">{setStatsSummary.Spiritforged.totalCards} ใบ</span>
								</div>
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">สะสมแล้ว</span>
									<span class="text-purple-300 font-black">{setStatsSummary.Spiritforged.uniqueOwned} ใบ</span>
								</div>
								<div class="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
									<div class="h-full bg-purple-400" style="width: {setStatsSummary.Spiritforged.percentUnique}%"></div>
								</div>
								<div class="text-right text-[9px] font-black text-slate-400 mt-1">{setStatsSummary.Spiritforged.percentUnique}%</div>
							</div>
						</div>
					</button>

					<!-- Unleashed Set -->
					<button
						type="button"
						onclick={() => selectedSet = 'Unleashed'}
						class="rt-panel group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 p-5 text-left transition duration-200 hover:scale-[1.02] hover:shadow-amber-500/10 hover:border-amber-500/30 cursor-pointer"
					>
						<div class="flex flex-col items-center py-6">
							<img src="/images/Set/unleashed.webp" class="h-14 object-contain group-hover:scale-105 transition" alt="Unleashed Set" />
						</div>
						<div class="mt-4 border-t border-white/5 pt-4">
							<h3 class="text-sm font-black text-white italic uppercase">Unleashed</h3>
							<p class="text-[9px] text-slate-500 font-bold uppercase mt-1">ชุดเสริม (Expansion Set)</p>
							
							<div class="mt-4 space-y-2">
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">การ์ดทั้งหมด</span>
									<span class="text-white font-black">{setStatsSummary.Unleashed.totalCards} ใบ</span>
								</div>
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">สะสมแล้ว</span>
									<span class="text-amber-300 font-black">{setStatsSummary.Unleashed.uniqueOwned} ใบ</span>
								</div>
								<div class="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
									<div class="h-full bg-amber-400" style="width: {setStatsSummary.Unleashed.percentUnique}%"></div>
								</div>
								<div class="text-right text-[9px] font-black text-slate-400 mt-1">{setStatsSummary.Unleashed.percentUnique}%</div>
							</div>
						</div>
					</button>

					<!-- Proving Grounds Set -->
					<button
						type="button"
						onclick={() => selectedSet = 'Proving Grounds'}
						class="rt-panel group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 p-5 text-left transition duration-200 hover:scale-[1.02] hover:shadow-emerald-500/10 hover:border-emerald-500/30 cursor-pointer"
					>
						<div class="flex flex-col items-center py-3">
							<img src="/images/Set/proving-grounds.webp" class="h-20 object-contain group-hover:scale-105 transition" alt="Proving Grounds Set" />
						</div>
						<div class="mt-4 border-t border-white/5 pt-4">
							<h3 class="text-sm font-black text-white italic uppercase">Proving Grounds</h3>
							<p class="text-[9px] text-slate-500 font-bold uppercase mt-1">ชุดเสริมพิเศษ (Special Set)</p>
							
							<div class="mt-4 space-y-2">
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">การ์ดทั้งหมด</span>
									<span class="text-white font-black">{setStatsSummary['Proving Grounds'].totalCards} ใบ</span>
								</div>
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">สะสมแล้ว</span>
									<span class="text-emerald-300 font-black">{setStatsSummary['Proving Grounds'].uniqueOwned} ใบ</span>
								</div>
								<div class="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
									<div class="h-full bg-emerald-400" style="width: {setStatsSummary['Proving Grounds'].percentUnique}%"></div>
								</div>
								<div class="text-right text-[9px] font-black text-slate-400 mt-1">{setStatsSummary['Proving Grounds'].percentUnique}%</div>
							</div>
						</div>
					</button>

					<!-- All Cards -->
					<button
						type="button"
						onclick={() => selectedSet = 'All'}
						class="rt-panel group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-slate-950/30 p-5 text-left transition duration-200 hover:scale-[1.02] hover:shadow-cyan-500/10 hover:border-cyan-500/30 cursor-pointer"
					>
						<div class="flex flex-col items-center py-4">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-cyan-400 group-hover:scale-105 transition">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-12-3h12m-12-3h12m-12-3h12m-12-3h12m-12-3h12" />
							</svg>
						</div>
						<div class="mt-4 border-t border-white/5 pt-4">
							<h3 class="text-sm font-black text-white italic uppercase">All Cards</h3>
							<p class="text-[9px] text-slate-500 font-bold uppercase mt-1">จัดการทั้งหมด (Manage All)</p>
							
							<div class="mt-4 space-y-2">
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">การ์ดทั้งหมด</span>
									<span class="text-white font-black">{setStatsSummary.All.totalCards} ใบ</span>
								</div>
								<div class="flex justify-between text-[11px] font-bold">
									<span class="text-slate-400">สะสมแล้ว</span>
									<span class="text-cyan-300 font-black">{setStatsSummary.All.uniqueOwned} ใบ</span>
								</div>
								<div class="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
									<div class="h-full bg-cyan-300" style="width: {setStatsSummary.All.percentUnique}%"></div>
								</div>
								<div class="text-right text-[9px] font-black text-slate-400 mt-1">{setStatsSummary.All.percentUnique}%</div>
							</div>
						</div>
					</button>
				</div>
			</section>
		{:else}
			<div class="mb-4">
				<button 
					type="button" 
					onclick={() => selectedSet = ''}
					class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-4 py-2.5 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
				>
					&larr; กลับไปเลือกชุดการ์ด (Back to Sets)
				</button>
			</div>

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
									bind:value={selectedSet}
									class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-bold text-white focus:border-cyan-300/50 focus:outline-none"
								>
									{#each sets as set}
										<option value={set}>{set}</option>
									{/each}
								</select>

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

							{#if query || selectedColor || selectedType !== 'All' || selectedSet !== 'All' || hideUnowned}
								<button
									type="button"
									class="text-xs font-black tracking-widest text-cyan-300 uppercase transition hover:text-cyan-100"
									onclick={() => {
										query = '';
										selectedColor = '';
										selectedType = 'All';
										selectedSet = 'All';
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
							{#each paginatedCards as card}
								{@const countNormal = collection[card.code] ?? 0}
								{@const countFoil = collection[card.code + '_foil'] ?? 0}
								{@const countTotal = countNormal + countFoil}
								<div class="rt-panel group flex flex-col overflow-hidden rounded-xl border transition {countTotal > 0 ? 'border-cyan-300/25 bg-[#0a1120]/50' : 'border-white/5 bg-slate-950/20'}">
									<!-- Image Wrapper -->
									<button
										type="button"
										class="relative aspect-[744/1039] overflow-hidden bg-black/10 text-left w-full focus:outline-none"
										onclick={() => openPopup(card)}
										aria-label="View card details"
									>
										<img
											src={getCardImageUrl(card.image_url, 260, 'webp')}
											class="h-full w-full object-contain transition duration-200 {countTotal === 0 ? 'opacity-40 grayscale-[40%]' : ''} {card.type === 'Battlefield' ? 'battlefield-rotated' : 'group-hover:scale-[1.03]'}"
											alt={card.name_en}
											loading="lazy"
										/>
										{#if countTotal > 0}
											<div class="absolute top-2 left-2 z-10 rounded-lg bg-cyan-300 text-slate-950 font-black text-[10px] px-2 py-0.5 shadow-lg flex flex-col gap-0.5 items-start">
												<span>Owned: {countTotal}</span>
												{#if countFoil > 0}
													<span class="rounded bg-pink-500 text-white text-[8px] px-1 font-extrabold uppercase animate-pulse">F: {countFoil}</span>
												{/if}
											</div>
										{/if}
									</button>

									<!-- Card Details & Controller -->
									<div class="flex flex-col flex-1 p-2.5">
										<div class="min-w-0 flex-1">
											<h3 class="truncate text-xs font-black text-white">{card.name_th || card.name_en}</h3>
											<p class="truncate text-[9px] font-black tracking-wider text-slate-500 uppercase mt-0.5">{card.name_en}</p>
										</div>

										<!-- Non-Foil Counter -->
										<div class="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2">
											<span class="text-[9px] font-black uppercase text-slate-400 tracking-wider">Non-Foil</span>
											<div class="flex items-center gap-1.5">
												<button
													type="button"
													class="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-slate-950 text-xs font-black text-slate-400 hover:border-cyan-300/30 hover:text-white transition disabled:opacity-40"
													onclick={() => decrement(card.code, 'normal')}
													disabled={countNormal === 0}
													aria-label="Decrease normal"
												>
													-
												</button>
												<span class="text-xs font-black text-white min-w-[1rem] text-center">
													{countNormal}
												</span>
												<button
													type="button"
													class="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-slate-950 text-xs font-black text-slate-400 hover:border-cyan-300/30 hover:text-white transition disabled:opacity-40"
													onclick={() => increment(card.code, 'normal')}
													disabled={countNormal >= 9}
													aria-label="Increase normal"
												>
													+
												</button>
											</div>
										</div>

										<!-- Foil Counter -->
										<div class="mt-2 flex items-center justify-between">
											<span class="text-[9px] font-black uppercase bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-widest font-mono">Foil (F)</span>
											<div class="flex items-center gap-1.5">
												<button
													type="button"
													class="flex h-6 w-6 items-center justify-center rounded border border-pink-500/20 bg-slate-950 text-xs font-black text-pink-400 hover:border-pink-500/50 hover:text-pink-300 transition disabled:opacity-40"
													onclick={() => decrement(card.code, 'foil')}
													disabled={countFoil === 0}
													aria-label="Decrease foil"
												>
													-
												</button>
												<span class="text-xs font-black text-pink-400 min-w-[1rem] text-center font-mono">
													{countFoil}
												</span>
												<button
													type="button"
													class="flex h-6 w-6 items-center justify-center rounded border border-pink-500/20 bg-slate-950 text-xs font-black text-pink-400 hover:border-pink-500/50 hover:text-pink-300 transition disabled:opacity-40"
													onclick={() => increment(card.code, 'foil')}
													disabled={countFoil >= 9}
													aria-label="Increase foil"
												>
													+
												</button>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<Pagination bind:currentPage {totalPages} />
					{/if}
				</div>

				<!-- Stats & Options Column -->
				<div class="space-y-6">
					
					<!-- Collection Status Card -->
					<div class="rt-panel rt-scanline rounded-xl p-5">
						<h2 class="text-lg font-black text-white uppercase italic">Collection Progress ({selectedSet === 'All' ? 'All Sets' : selectedSet})</h2>
						
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
								{#if selectedSet === 'All'}
									ตั้งค่าการ์ดทั้งหมดเป็น Playset
								{:else}
									ตั้งค่าการ์ดในชุดนี้เป็น Playset
								{/if}
							</button>

							<button
								type="button"
								class="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-300/20 bg-rose-300/5 px-4 text-xs font-black tracking-widest text-rose-300 uppercase transition hover:bg-rose-300/10 hover:text-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
								onclick={clearCollection}
								disabled={collectionLoading || Object.keys(collection).length === 0}
							>
								{#if selectedSet === 'All'}
									ล้างข้อมูลคอลเล็กชันทั้งหมด
								{:else}
									ล้างข้อมูลชุดนี้ทั้งหมด
								{/if}
							</button>
						</div>
					</div>

					<!-- Import / Export Panel -->
					<div class="rt-panel rounded-xl p-5">
						<h2 class="text-lg font-black text-white uppercase italic">Import / Export Backup</h2>
						<p class="rt-copy mt-2 text-xs">สำรองข้อมูลหรือนำเข้าคอลเล็กชันของคุณจากข้อความ</p>

						<div class="mt-4 space-y-3">
							<textarea
								bind:value={backupText}
								placeholder="วางรหัสการ์ดสะสมเพื่อนำเข้า... เช่น:&#13;RT-001: 3&#13;RT-002: 1"
								class="h-32 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-300/50 focus:outline-none"
							></textarea>
							
							<div class="grid grid-cols-2 gap-2">
								<button
									type="button"
									class="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/5 text-xs font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/10 hover:text-white"
									onclick={exportCollectionText}
								>
									Export Text
								</button>
								<button
									type="button"
									class="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-300/5 text-xs font-black tracking-widest text-emerald-100 uppercase transition hover:bg-emerald-300/10 hover:text-white disabled:opacity-50"
									onclick={importCollectionText}
									disabled={collectionLoading || !backupText.trim()}
								>
									Import Text
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

{#if selectedPopupCard}
	<CardModal card={selectedPopupCard} {closePopup} canEdit={false} />
{/if}
