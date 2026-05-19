<script lang="ts">
	import { keywords, iconMappings } from '$lib/data/keywords';
	import CardModal from '$lib/components/CardModal.svelte';
	import TurnPhasesSection from '$lib/components/TurnPhasesSection.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import KeywordSection from '$lib/components/KeywordSection.svelte';
	import { navigating } from '$app/stores';
	
	let { data } = $props();

	interface Card {
		code: string;
		name_en: string;
		ability_en: string;
		name_th: string;
		ability_th: string;
		image_url: string;
		type: string;
		energy: number | null;
		power: {
			label: string;
			value: {
				id: number;
				label: string;
			};
		} | null;
		rarity: string;
		domains: string[];
		set_name: string;
	}

	let cards = $derived(data.cards as Card[] || []);
	
	let searchTerm = $state("");
	let selectedSet = $state("All");
	let selectedType = $state("All");
	let viewMode = $state<"gallery" | "keywords" | "phases">("gallery");

	let sets = $derived(["All", ...new Set(cards.map(c => c.set_name).filter(Boolean))]);
	let types = $derived(["All", ...new Set(cards.map(c => c.type).filter(Boolean))]);

	let filteredCards = $derived(
		cards.filter(c => {
			const searchLower = searchTerm.toLowerCase();
			const matchesSearch = 
				c.name_en.toLowerCase().includes(searchLower) || 
				c.name_th.toLowerCase().includes(searchLower) ||
				c.code.toLowerCase().includes(searchLower) ||
				c.ability_en.toLowerCase().includes(searchLower) ||
				c.ability_th.toLowerCase().includes(searchLower) ||
				(c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchLower)));
			
			const matchesSet = selectedSet === "All" || c.set_name === selectedSet;
			const matchesType = selectedType === "All" || c.type === selectedType;
			
			return matchesSearch && matchesSet && matchesType;
		})
	);

	let currentPage = $state(1);
	const cardsPerPage = 48;
	
	let totalPages = $derived(Math.ceil(filteredCards.length / cardsPerPage));
	let paginatedCards = $derived(filteredCards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage));

	$effect(() => {
		searchTerm; selectedSet; selectedType;
		currentPage = 1;
	});

	let selectedPopupCard = $state<Card | null>(null);

	function openPopup(card: Card) {
		selectedPopupCard = card;
	}

	function closePopup() {
		selectedPopupCard = null;
	}

	let isFiltering = $state(false);
	$effect(() => {
		searchTerm; selectedSet; selectedType;
		isFiltering = true;
		const timer = setTimeout(() => (isFiltering = false), 300);
		return () => clearTimeout(timer);
	});

	let isLoading = $derived(!!$navigating || isFiltering);
</script>

<div class="min-h-dvh text-slate-100 font-sans selection:bg-cyan-500/30 pb-24 sm:pb-0 relative">
	<div class="mesh-gradient"></div>

	{#if !!$navigating}
		<div class="fixed top-0 left-0 right-0 h-1 z-[200] overflow-hidden bg-slate-900">
			<div class="h-full bg-cyan-500 animate-loading-bar"></div>
		</div>
	{/if}

	<!-- Desktop & Mobile Header -->
	<nav class="sticky top-0 z-50 glass-panel border-b border-white/5 transition-all duration-300">
		<div class="max-w-[1440px] mx-auto flex justify-between items-center px-6 py-4">
			<div class="flex items-center gap-3 group cursor-pointer">
				<div class="font-black text-2xl text-white tracking-tighter uppercase italic">RiftThai</div>
			</div>
			
			<!-- Desktop Nav -->
			<div class="hidden md:flex bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 backdrop-blur-md">
				<button 
					class="px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 {viewMode === 'gallery' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
					onclick={() => viewMode = 'gallery'}
				>
					Gallery
				</button>
				<button 
					class="px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 {viewMode === 'keywords' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
					onclick={() => viewMode = 'keywords'}
				>
					Keywords
				</button>
				<button 
					class="px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 {viewMode === 'phases' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
					onclick={() => viewMode = 'phases'}
				>
					Phases
				</button>
			</div>

			<div class="flex items-center gap-6">
				<a
					href="/qa"
					class="font-black text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400 transition-colors"
				>
					Q&A
				</a>
				<div class="w-px h-4 bg-white/10"></div>
				<a href="https://riftbound.com" target="_blank" class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white transition-all hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">Official</a>
			</div>		</div>
	</nav>

	<!-- Mobile Bottom Navigation -->
	<div class="md:hidden fixed bottom-8 left-0 right-0 z-50 px-6 pointer-events-none">
		<div class="max-w-md mx-auto glass-panel border-white/10 p-2 rounded-[2rem] shadow-2xl shadow-black/80 flex gap-1 pointer-events-auto">
			<button 
				class="flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-500 {viewMode === 'gallery' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-500'}"
				onclick={() => { viewMode = 'gallery'; window.scrollTo({top: 0, behavior: 'smooth'}); }}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
				<span class="text-[9px] font-black uppercase tracking-widest">Gallery</span>
			</button>
			<button 
				class="flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-500 {viewMode === 'keywords' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-500'}"
				onclick={() => { viewMode = 'keywords'; window.scrollTo({top: 0, behavior: 'smooth'}); }}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
				<span class="text-[9px] font-black uppercase tracking-widest">Keywords</span>
			</button>
			<button 
				class="flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-500 {viewMode === 'phases' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-500'}"
				onclick={() => { viewMode = 'phases'; window.scrollTo({top: 0, behavior: 'smooth'}); }}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m19.07 4.93-14.14 14.14"/></svg>
				<span class="text-[9px] font-black uppercase tracking-widest">Phases</span>
			</button>
		</div>
	</div>

	<main class="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 sm:py-20">
		{#if viewMode === 'gallery'}
			<header class="space-y-12 mb-16 sm:mb-24">
				<div class="text-center space-y-4 mb-16">
					<h1 class="text-5xl sm:text-8xl font-black text-white tracking-tighter italic uppercase">
						Rift<span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Thai</span>
					</h1>
				</div>
				<SearchBar 
					bind:searchTerm={searchTerm} 
					bind:selectedSet={selectedSet} 
					bind:selectedType={selectedType} 
					sets={sets} 
					types={types} 
					resultsCount={filteredCards.length}
				/>
			</header>

			{#if isLoading}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-10">
					{#each Array(12) as _}
						<div class="flex flex-col gap-5 animate-pulse">
							<div class="w-full aspect-[744/1039] bg-white/5 rounded-3xl border border-white/10"></div>
							<div class="space-y-3 px-2">
								<div class="h-5 bg-white/5 rounded-lg w-3/4"></div>
								<div class="h-3 bg-white/5 rounded-lg w-1/2"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-10">
					{#each paginatedCards as card}
						<button 
							class="group flex flex-col text-left transition-all duration-700 hover:-translate-y-4" 
							onclick={() => openPopup(card)}
						>
							<div class="relative w-full aspect-[744/1039] bg-slate-900 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center transition-all duration-700 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] group-active:scale-95">
								{#if card.image_url}
									<picture class="w-full h-full">
										<source srcset={card.image_url.replace('.png', '.avif').replace('.jpg', '.avif')} type="image/avif" />
										<img 
											src={card.image_url} 
											alt={card.name_en} 
											loading="lazy" 
											class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 {card.type.includes('Battlefield') ? 'battlefield-rotated' : ''}"
										/>
									</picture>
								{:else}
									<div class="text-slate-600 text-[10px] uppercase font-black tracking-widest italic">Signal Lost</div>
								{/if}
								
								<!-- Hover Overlay -->
								<div class="absolute inset-0 bg-gradient-to-t from-cyan-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
								
								<!-- Floating Badge -->
								<div class="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
									<span class="text-[9px] font-black text-white tracking-widest">{card.code}</span>
								</div>

								<div class="absolute bottom-6 left-6 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
									<div class="w-full h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20">
										View Details
									</div>
								</div>
							</div>
							<div class="mt-6 px-2 space-y-1">
								<h3 class="font-black text-white text-sm sm:text-base line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300 italic tracking-tight uppercase">{card.name_en}</h3>
								<div class="flex items-center gap-2">
									<div class="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
									<p class="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">{card.type}</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}

			{#if filteredCards.length === 0 && !isLoading}
				<div class="py-40 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
					<div class="relative group">
						<div class="absolute -inset-8 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
						<div class="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center relative backdrop-blur-xl">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
						</div>
					</div>
					<div class="space-y-2">
						<h3 class="text-3xl font-black text-white italic uppercase tracking-tighter">No Signal Found</h3>
						<p class="text-slate-500 font-medium tracking-wide">ไม่พบการ์ดที่ค้นหา ลองเปลี่ยนตัวกรองดูใหม่อีกครั้ง</p>
					</div>
				</div>
			{/if}

			{#if totalPages > 1}
				<div class="mt-32 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom duration-1000">
					<div class="flex items-center gap-4">
						<button 
							class="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white transition-all hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-500 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white group"
							onclick={() => { currentPage--; window.scrollTo({top: 0, behavior: 'smooth'}); }}
							disabled={currentPage === 1}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
						</button>
						
						<div class="flex items-center bg-white/5 border border-white/10 rounded-[1.5rem] p-1.5 gap-1 backdrop-blur-xl">
							{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								if (totalPages <= 5) return i + 1;
								if (currentPage <= 3) return i + 1;
								if (currentPage >= totalPages - 2) return totalPages - 4 + i;
								return currentPage - 2 + i;
							}) as page}
								<button 
									class="w-12 h-12 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-500 {currentPage === page ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}"
									onclick={() => { currentPage = page; window.scrollTo({top: 0, behavior: 'smooth'}); }}
								>
									{page}
								</button>
							{/each}
						</div>

						<button 
							class="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white transition-all hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-500 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white group"
							onclick={() => { currentPage++; window.scrollTo({top: 0, behavior: 'smooth'}); }}
							disabled={currentPage === totalPages}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
						</button>
					</div>
					<div class="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">Page {currentPage} of {totalPages}</div>
				</div>
			{/if}
		{:else if viewMode === 'keywords'}
			<KeywordSection {keywords} />
		{:else if viewMode === 'phases'}
			<TurnPhasesSection />
		{/if}
	</main>

	<footer class="mt-48 py-24 border-t border-white/5 bg-slate-950/50 backdrop-blur-3xl relative overflow-hidden">
		<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
		<div class="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]"></div>
		
		<div class="max-w-[1440px] mx-auto px-8 relative z-10">
			<div class="grid md:grid-cols-2 gap-16 items-center">
				<div class="space-y-8 text-center md:text-left">
					<div class="font-black text-5xl text-white tracking-tighter italic uppercase">Rift<span class="text-cyan-500">Thai</span></div>
					<p class="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
						RiftThai เป็นโปรเจกต์แปลภาษาไทยสำหรับเกม Riftbound TCG เพื่อให้ผู้เล่นชาวไทยเข้าถึงเกมได้ง่ายขึ้น
					</p>
					<div class="flex justify-center md:justify-start gap-8">
						<a href="#" class="text-white hover:text-cyan-400 transition-colors font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
							Back to top
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m18 15-6-6-6 6"/></svg>
						</a>
					</div>
				</div>
				<div class="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
					<div class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Legal Disclaimer</div>
					<p class="text-[10px] text-slate-500 leading-relaxed font-medium">
						RiftThai isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
					</p>
				</div>
			</div>
			<div class="mt-24 pt-12 border-t border-white/5 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
				&copy; 2026 RiftThai Community
			</div>
		</div>
	</footer>
</div>

{#if selectedPopupCard}
	<CardModal card={selectedPopupCard} closePopup={closePopup} canEdit={data.canEdit} />
{/if}

<style>
	@keyframes loading-bar {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(0); }
		100% { transform: translateX(100%); }
	}

	.animate-loading-bar {
		animation: loading-bar 1.5s infinite linear;
	}

	:global(.kw-inline-badge) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: white;
		padding: 0 12px;
		margin: 2px 4px;
		font-weight: 900;
		font-size: 0.75em;
		transform: skewX(-13deg);
		box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		vertical-align: middle;
		height: 1.8em;
		line-height: 1;
		border: 1px solid rgba(255,255,255,0.2);
	}

	:global(.kw-inline-badge > *) {
		transform: skewX(13deg);
	}

	:global(.inline-icon) {
		display: inline-block;
		height: 1.3em;
		width: auto;
		vertical-align: middle;
		margin: 0 2px;
		filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.5));
		position: relative;
		top: -1px;
	}

	:global(.icon-energy-circle) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: white;
		color: black;
		width: 1.3em;
		height: 1.3em;
		border-radius: 50%;
		font-weight: 900;
		font-size: 0.7em;
		vertical-align: middle;
		margin: 0 2px;
		box-shadow: 1px 2px 4px rgba(0,0,0,0.3);
		position: relative;
		top: -2px;
	}

	.battlefield-rotated {
		transform: rotate(90deg) scale(1.4);
		object-fit:contain;
	}

	.custom-scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.custom-scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	@media (max-width: 640px) {
		:global(.kw-inline-badge) {
			font-size: 0.65em;
			padding: 0 8px;
		}
	}
</style>