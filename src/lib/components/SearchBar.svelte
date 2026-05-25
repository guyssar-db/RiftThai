<script lang="ts">
	import IconSelect from '$lib/components/IconSelect.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';

	let {
		searchTerm = $bindable(),
		selectedSet = $bindable(),
		selectedType = $bindable(),
		selectedDomain = $bindable(),
		sets,
		types,
		domains,
		resultsCount
	} = $props<{
		searchTerm: string;
		selectedSet: string;
		selectedType: string;
		selectedDomain: string;
		sets: string[];
		types: string[];
		domains: string[];
		resultsCount: number;
	}>();

	let setOptions = $derived(sets.filter((set: string) => set !== 'All'));
	let typeOptions = $derived(types.filter((type: string) => type !== 'All'));
	let domainOptions = $derived(domains.filter((domain: string) => domain !== 'All'));
	let filtersOpen = $state(false);
	let activeFilterCount = $derived(
		[selectedSet, selectedType, selectedDomain].filter((value) => value !== 'All').length
	);
	let setSelectOptions = $derived([
		{ label: 'All Sets', value: 'All' },
		...setOptions.map((set: string) => ({
			label: set,
			value: set
		}))
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
	let domainSelectOptions = $derived([
		{ label: 'All Domains', value: 'All' },
		...domainOptions.map((domain: string) => {
			const icon = getDomainIcon(domain);
			return {
				label: domain,
				value: domain,
				icons: icon ? [{ label: domain, src: icon }] : []
			};
		})
	]);
	let isBattlefieldType = $derived(selectedType === 'Battlefield');

	$effect(() => {
		if (isBattlefieldType && selectedDomain !== 'All') {
			selectedDomain = 'All';
		}
	});
</script>

<div class="sticky top-[4.75rem] z-[60] mb-8 space-y-4 rounded-[1.75rem] bg-slate-950/72 p-2 shadow-2xl shadow-slate-950/45 backdrop-blur-2xl sm:mb-10 sm:space-y-5 sm:p-3">
	<div class="flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
		<div class="flex items-center gap-3">
			<div class="h-6 w-1.5 rounded-full bg-cyan-400"></div>
			<h2 class="text-sm font-black uppercase tracking-[0.3em] text-white">Search</h2>
		</div>
		<div class="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300">
			{resultsCount} Cards
		</div>
	</div>

	<div class="relative z-[60] rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-3xl">
		<div class="flex flex-col gap-3 lg:flex-row">
			<div class="flex min-w-0 flex-grow gap-2">
				<div class="group relative min-w-0 flex-grow">
					<div class="pointer-events-none absolute inset-y-0 left-5 flex items-center text-slate-500 transition-colors group-focus-within:text-cyan-400 sm:left-6">
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
					</div>
					<input
						type="text"
						placeholder="ค้นหาชื่อการ์ด, รหัส, ความสามารถ หรือแท็ก..."
						class="w-full rounded-2xl border border-white/5 bg-slate-950/60 py-4 pl-14 pr-4 text-sm font-medium text-white transition-all placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 sm:py-5 sm:pl-16"
						bind:value={searchTerm}
					/>
				</div>

				<button
					type="button"
					class="relative flex h-auto min-w-14 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/60 px-4 text-white transition-all active:scale-95 focus:border-cyan-400/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 lg:hidden"
					aria-label="Toggle filters"
					aria-expanded={filtersOpen}
					onclick={() => (filtersOpen = !filtersOpen)}
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 5h18" />
						<path d="M7 12h10" />
						<path d="M10 19h4" />
					</svg>
					{#if activeFilterCount > 0}
						<span class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[10px] font-black text-slate-950">
							{activeFilterCount}
						</span>
					{/if}
				</button>
			</div>

			<div class="hidden gap-3 lg:flex">
				<IconSelect bind:value={selectedSet} label="All Sets" options={setSelectOptions} />

				<IconSelect bind:value={selectedType} label="All Types" options={typeSelectOptions} />

				<IconSelect
					bind:value={selectedDomain}
					label="All Domains"
					options={domainSelectOptions}
					disabled={isBattlefieldType}
				/>
			</div>
		</div>

		{#if filtersOpen}
			<div class="mt-3 grid grid-cols-1 gap-3 border-t border-white/10 pt-3 lg:hidden">
				<IconSelect bind:value={selectedSet} label="All Sets" options={setSelectOptions} />

				<IconSelect bind:value={selectedType} label="All Types" options={typeSelectOptions} />

				<IconSelect
					bind:value={selectedDomain}
					label="All Domains"
					options={domainSelectOptions}
					disabled={isBattlefieldType}
				/>
			</div>
		{/if}
	</div>
</div>
