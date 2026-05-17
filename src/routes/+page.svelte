<script lang="ts">
	import { keywords, iconMappings } from '$lib/data/keywords';
	import CardModal from '$lib/components/CardModal.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import KeywordSection from '$lib/components/KeywordSection.svelte';
	
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
	let viewMode = $state<"gallery" | "keywords">("gallery");

	let sets = $derived(["All", ...new Set(cards.map(c => c.set_name).filter(Boolean))]);
	let types = $derived(["All", ...new Set(cards.map(c => c.type).filter(Boolean))]);

	let filteredCards = $derived(
		cards.filter(c => {
			const matchesSearch = 
				c.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
				c.code.toLowerCase().includes(searchTerm.toLowerCase());
			
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
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30">
	<nav class="sticky top-0 z-50 bg-slate-950/80 border-b border-slate-800 backdrop-blur-xl transition-all duration-300">
		<div class="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 py-4 gap-4">
			<div class="flex items-center gap-2">
				<div class="font-black text-2xl text-white tracking-tighter">RiftThai</div>
			</div>
			
			<div class="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 gap-1 w-full sm:w-auto">
				<button 
					class="flex-1 sm:px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 {viewMode === 'gallery' ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
					onclick={() => viewMode = 'gallery'}
				>
					Gallery
				</button>
				<button 
					class="flex-1 sm:px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 {viewMode === 'keywords' ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
					onclick={() => viewMode = 'keywords'}
				>
					Keywords
				</button>
			</div>

			<div class="hidden sm:flex items-center gap-6">
				<a href="https://riftbound.com" target="_blank" class="text-slate-400 hover:text-white transition-colors text-sm font-bold tracking-tight">Official Site</a>
			</div>
		</div>
	</nav>

	<main class="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
		{#if viewMode === 'gallery'}
			<header class="space-y-8 mb-12 sm:mb-16">
				<SearchBar 
					bind:searchTerm={searchTerm} 
					bind:selectedSet={selectedSet} 
					bind:selectedType={selectedType} 
					sets={sets} 
					types={types} 
					resultsCount={filteredCards.length}
				/>
			</header>

			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-8">
				{#each paginatedCards as card}
					<button 
						class="group flex flex-col text-left transition-all duration-500 hover:-translate-y-2" 
						onclick={() => openPopup(card)}
					>
						<div class="relative w-full aspect-[744/1039] bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center group-hover:border-sky-500/50 group-hover:shadow-sky-500/10 transition-all duration-500">
							{#if card.image_url}
								<img 
									src={card.image_url} 
									alt={card.name_en} 
									loading="lazy" 
									class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 {card.type.includes('Battlefield') ? 'battlefield-rotated' : ''}"
								/>
							{:else}
								<div class="text-slate-600 text-[10px] uppercase font-black tracking-tighter">No Preview</div>
							{/if}
							
							<div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							
							<div class="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
								<div class="flex items-center justify-between">
									<span class="text-[10px] font-black text-sky-400 tracking-widest">{card.code}</span>
									<div class="w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center text-slate-950">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
									</div>
								</div>
							</div>
						</div>
						<div class="mt-4 px-1">
							<h3 class="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-sky-400 transition-colors">{card.name_en}</h3>
							<p class="text-slate-500 text-[10px] sm:text-xs font-bold mt-1 tracking-tight">{card.type}</p>
						</div>
					</button>
				{/each}
			</div>

			{#if filteredCards.length === 0}
				<div class="py-32 flex flex-col items-center justify-center text-center">
					<div class="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
					</div>
					<h3 class="text-xl font-bold text-white mb-2">ไม่พบการ์ดที่ค้นหา</h3>
					<p class="text-slate-500 max-w-xs">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูใหม่อีกครั้ง</p>
				</div>
			{/if}

			{#if totalPages > 1}
				<div class="mt-20 flex flex-col items-center gap-6">
					<div class="flex items-center gap-2">
						<button 
							class="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-white transition-all hover:bg-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed group"
							onclick={() => currentPage--}
							disabled={currentPage === 1}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
						</button>
						
						<div class="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
							{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								if (totalPages <= 5) return i + 1;
								if (currentPage <= 3) return i + 1;
								if (currentPage >= totalPages - 2) return totalPages - 4 + i;
								return currentPage - 2 + i;
							}) as page}
								<button 
									class="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all {currentPage === page ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20 scale-110' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}"
									onclick={() => currentPage = page}
								>
									{page}
								</button>
							{/each}
						</div>

						<button 
							class="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-white transition-all hover:bg-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed group"
							onclick={() => currentPage++}
							disabled={currentPage === totalPages}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
						</button>
					</div>
					<p class="text-slate-500 text-xs font-bold tracking-widest uppercase">Page {currentPage} of {totalPages}</p>
				</div>
			{/if}
		{:else}
			<KeywordSection {keywords} />
		{/if}
	</main>

	<footer class="mt-32 py-16 border-t border-slate-800 bg-slate-950">
		<div class="max-w-[1400px] mx-auto px-8 text-center space-y-8">
			<div class="font-black text-3xl text-white tracking-tighter opacity-50">RiftThai</div>
			<div class="max-w-2xl mx-auto text-slate-500 text-sm font-medium leading-relaxed">
				<p>RiftThai เป็นโปรเจกต์แปลภาษาไทยสำหรับเกม Riftbound เพื่อให้ผู้เล่นชาวไทยเข้าถึงเกมได้ง่ายขึ้น</p>
				<p class="mt-4">All card data, images, and brand assets are property of Riot Games. This is a fan-made translation project.</p>
			</div>
			<div class="flex justify-center gap-8">
				<a href="#" class="text-slate-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">Back to top</a>
			</div>
		</div>
	</footer>
</div>

{#if selectedPopupCard}
	<CardModal card={selectedPopupCard} closePopup={closePopup} />
{/if}

<style>
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
		border-radius: 4px;
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

	@media (max-width: 640px) {
		:global(.kw-inline-badge) {
			font-size: 0.65em;
			padding: 0 8px;
		}
	}
</style>