<script lang="ts">
	import IconSelect from '$lib/components/IconSelect.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';

	let {
		searchTerm = $bindable(),
		selectedSet = $bindable(),
		selectedType = $bindable(),
		selectedDomains = $bindable(),
		selectedEnergy = $bindable(),
		selectedMight = $bindable(),
		sets,
		types,
		domains,
		resultsCount
	} = $props<{
		searchTerm: string;
		selectedSet: string;
		selectedType: string;
		selectedDomains: string[];
		selectedEnergy: number | null;
		selectedMight: number | null;
		sets: string[];
		types: string[];
		domains: string[];
		resultsCount: number;
	}>();

	function getSetIcon(set: string) {
		const lower = set.toLowerCase();
		if (lower === 'origins') return '/images/Set/origins.webp';
		if (lower === 'spiritforged') return '/images/Set/spiritforged.webp';
		if (lower === 'unleashed') return '/images/Set/unleashed.webp';
		if (lower === 'proving grounds') return '/images/Set/proving-grounds.webp';
		return null;
	}

	let setOptions = $derived(sets.filter((set: string) => set !== 'All'));
	let typeOptions = $derived(types.filter((type: string) => type !== 'All'));
	let domainOptions = $derived(domains.filter((domain: string) => domain !== 'All'));
	let filtersOpen = $state(false);
	let domainsOpen = $state(false);
	let activeFilterCount = $derived(
		[selectedSet, selectedType].filter((value) => value !== 'All').length +
			(selectedDomains.length > 0 ? 1 : 0) +
			(selectedEnergy !== null ? 1 : 0) +
			(selectedMight !== null ? 1 : 0)
	);
	let setSelectOptions = $derived([
		{ label: 'All Sets', value: 'All' },
		...setOptions.map((set: string) => {
			const icon = getSetIcon(set);
			return {
				label: set,
				value: set,
				icons: icon ? [{ label: set, src: icon }] : undefined
			};
		})
	]);
	let typeSelectOptions = $derived([
		{ label: 'All Types', value: 'All' },
		...typeOptions.map((type: string) => ({
			label: type,
			value: type,
			icons: getTypeIcons(type).map((icon) => ({
				label: icon.label,
				src: `/images/icons/${icon.src}`
			}))
		}))
	]);
	let isBattlefieldType = $derived(selectedType === 'Battlefield');
	let selectedDomainLabel = $derived(
		selectedDomains.length === 0
			? 'All Domains'
			: selectedDomains.length === 1
				? selectedDomains[0]
				: `${selectedDomains.length} Domains`
	);

	$effect(() => {
		if (isBattlefieldType && selectedDomains.length > 0) {
			selectedDomains = [];
		}
	});

	function toggleDomain(domain: string) {
		if (isBattlefieldType) return;
		selectedDomains = selectedDomains.includes(domain)
			? selectedDomains.filter((selected: string) => selected !== domain)
			: [...selectedDomains, domain];
	}

	function clearDomains() {
		selectedDomains = [];
	}

	function resetFilters() {
		selectedSet = 'All';
		selectedType = 'All';
		selectedDomains = [];
		selectedEnergy = null;
		selectedMight = null;
	}
</script>

<div
	class="rt-panel rt-topline sticky top-[4.75rem] z-[60] mb-7 space-y-3 rounded-xl p-3 shadow-[0_18px_54px_rgba(0,0,0,0.34)] sm:mb-9 sm:p-4"
>
	<div class="flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
		<div class="flex items-center gap-3">
			<div class="h-7 w-1 rounded-sm bg-cyan-300 shadow-[0_0_18px_rgba(83,234,253,0.38)]"></div>
			<h2 class="text-sm font-black tracking-[0.22em] text-white uppercase">Card Index</h2>
		</div>
		<div class="rt-chip">
			{resultsCount} Cards
		</div>
	</div>

	<div class="relative z-[60] rounded-lg border border-cyan-300/10 bg-black/25 p-2 shadow-inner shadow-cyan-300/5">
		<div class="flex min-w-0 gap-2">
			<div class="group relative min-w-0 flex-grow">
				<div
					class="pointer-events-none absolute inset-y-0 left-5 flex items-center text-slate-500 transition-colors group-focus-within:text-cyan-300 sm:left-6"
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
					>
				</div>
				<input
					type="text"
					placeholder="ค้นหาชื่อการ์ด, รหัส, ความสามารถ หรือแท็ก..."
					class="w-full rounded-md border border-white/10 bg-[#070a12]/86 py-4 pr-12 pl-14 text-sm font-medium text-white shadow-inner shadow-black/20 transition-all placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10 focus:outline-none sm:py-5 sm:pl-16 sm:pr-14"
					bind:value={searchTerm}
				/>
				{#if searchTerm}
					<button
						type="button"
						class="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
						onclick={() => (searchTerm = '')}
						aria-label="Clear search"
					>
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>

			<button
				type="button"
				class="relative flex h-auto min-w-14 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#070a12]/86 px-4 text-white transition-all focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10 focus:outline-none active:scale-95"
				aria-label="Toggle filters"
				aria-expanded={filtersOpen}
				onclick={() => (filtersOpen = !filtersOpen)}
			>
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 5h18" />
					<path d="M7 12h10" />
					<path d="M10 19h4" />
				</svg>
				{#if activeFilterCount > 0}
					<span
						class="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-md bg-cyan-300 px-1 text-[10px] font-black text-slate-950"
					>
						{activeFilterCount}
					</span>
				{/if}
			</button>
		</div>

		<!-- Horizontal Button Filters (Piltover Archive Style) -->
		<div class="{filtersOpen ? 'flex' : 'hidden'} flex-col gap-4 border-t border-white/5 pt-4 mt-4">
			
			<!-- Card Types Filter Row -->
			<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
				<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase lg:w-20 shrink-0">Types</span>
				<div class="flex flex-wrap gap-1.5">
					{#each types as type}
						{@const active = selectedType === type}
						{@const icons = getTypeIcons(type)}
						<button
							type="button"
							class="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer
							{active
								? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.15)]'
								: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}"
							onclick={() => (selectedType = type)}
						>
							{#if icons.length > 0}
								<div class="flex gap-0.5">
									{#each icons as icon}
										<img src="/images/icons/{icon.src}" class="h-4 w-4 object-contain" alt="" />
									{/each}
								</div>
							{/if}
							<span>{type === 'All' ? 'All Types' : type}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Domains Filter Row -->
			<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
				<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase lg:w-20 shrink-0">Domains</span>
				<div class="flex flex-wrap items-center gap-2">
					<button
						type="button"
						class="flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-black tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer
						{selectedDomains.length === 0
							? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.15)]'
							: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}
						{isBattlefieldType ? 'opacity-40 cursor-not-allowed' : ''}"
						disabled={isBattlefieldType}
						onclick={clearDomains}
					>
						All Domains
					</button>

					{#each domainOptions as domain}
						{@const active = selectedDomains.includes(domain)}
						{@const icon = getDomainIcon(domain)}
						{@const glowClass = 
							domain === 'Fury' ? 'border-red-500/80 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.3)]' :
							domain === 'Calm' ? 'border-blue-500/80 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.3)]' :
							domain === 'Mind' ? 'border-purple-500/80 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.3)]' :
							domain === 'Body' ? 'border-green-500/80 bg-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.3)]' :
							domain === 'Chaos' ? 'border-orange-500/80 bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.3)]' :
							domain === 'Order' ? 'border-yellow-500/80 bg-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.3)]' :
							'border-cyan-500/80 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
						}
						<button
							type="button"
							class="group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-[0.9] cursor-pointer
							{active
								? glowClass
								: 'border-white/5 bg-slate-950/40 opacity-40 grayscale hover:opacity-85 hover:grayscale-[50%] hover:scale-105'}
							{isBattlefieldType ? 'opacity-20 cursor-not-allowed pointer-events-none' : ''}"
							disabled={isBattlefieldType}
							onclick={() => toggleDomain(domain)}
							title={domain}
						>
							{#if icon}
								<img src={icon} class="h-5.5 w-5.5 object-contain transition group-hover:scale-110" alt={domain} />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Sets Filter Row -->
			<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
				<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase lg:w-20 shrink-0">Sets</span>
				<div class="flex flex-wrap gap-1.5">
					{#each sets as set}
						{@const active = selectedSet === set}
						{@const icon = getSetIcon(set)}
						<button
							type="button"
							class="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer
							{active
								? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.15)]'
								: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}"
							onclick={() => (selectedSet = set)}
						>
							{#if icon}
								<img src={icon} class="h-4 w-4 object-contain" alt="" />
							{/if}
							<span>{set === 'All' ? 'All Sets' : set}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Energy Filter Row -->
			<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
				<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase lg:w-20 shrink-0">Energy</span>
				<div class="flex flex-wrap gap-1.5">
					<button
						type="button"
						class="flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-black tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer
						{selectedEnergy === null
							? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.15)]'
							: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}"
						onclick={() => (selectedEnergy = null)}
					>
						All
					</button>

					{#each [0, 1, 2, 3, 4, 5, 6, 7] as cost}
						{@const active = selectedEnergy === cost}
						<button
							type="button"
							class="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all active:scale-[0.9] cursor-pointer
							{active
								? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.25)]'
								: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}"
							onclick={() => (selectedEnergy = active ? null : cost)}
						>
							{cost === 7 ? '7+' : cost}
						</button>
					{/each}
				</div>
			</div>

			<!-- Might Filter Row -->
			<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
				<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase lg:w-20 shrink-0">Might</span>
				<div class="flex flex-wrap gap-1.5">
					<button
						type="button"
						class="flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-black tracking-wider uppercase transition-all active:scale-[0.97] cursor-pointer
						{selectedMight === null
							? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.15)]'
							: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}"
						onclick={() => (selectedMight = null)}
					>
						All
					</button>

					{#each [0, 1, 2, 3, 4, 5, 6, 7] as powerValue}
						{@const active = selectedMight === powerValue}
						<button
							type="button"
							class="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all active:scale-[0.9] cursor-pointer
							{active
								? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-200 shadow-[0_0_12px_rgba(83,234,253,0.25)]'
								: 'border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/15 hover:text-white'}"
							onclick={() => (selectedMight = active ? null : powerValue)}
						>
							{powerValue === 7 ? '7+' : powerValue}
						</button>
					{/each}
				</div>
			</div>

			<!-- Reset Button Row -->
			{#if activeFilterCount > 0}
				<div class="flex justify-end pt-2 border-t border-white/5">
					<button
						type="button"
						class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 text-xs font-black uppercase tracking-widest text-rose-300 transition-all hover:bg-rose-500/20 active:scale-95 cursor-pointer"
						onclick={resetFilters}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
							<path fill-rule="evenodd" d="M8.75 1a7.75 7.75 0 0 0-7.75 7.75 7.75 7.75 0 0 0 13.897 4.705l3.966 3.965a.75.75 0 1 0 1.06-1.06l-3.965-3.966A7.75 7.75 0 0 0 8.75 1Zm-6.25 7.75a6.25 6.25 0 1 1 10.89 4.079.75.75 0 0 1-.14.453 6.25 6.25 0 0 1-10.75-4.532Zm9.124-2.828a.75.75 0 0 0-1.06 0L8.75 7.69 6.936 5.876a.75.75 0 0 0-1.06 1.06L7.69 8.75l-1.814 1.814a.75.75 0 0 0 1.06 1.06L8.75 9.81l1.814 1.814a.75.75 0 0 0 1.06-1.06L9.81 8.75l1.814-1.814a.75.75 0 0 0 0-1.06Z" clip-rule="evenodd" />
						</svg>
						Clear Filters
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
