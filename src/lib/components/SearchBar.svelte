<script lang="ts">
	let {
		searchTerm = $bindable(),
		selectedSet = $bindable(),
		selectedType = $bindable(),
		sets,
		types,
		resultsCount
	} = $props<{
		searchTerm: string;
		selectedSet: string;
		selectedType: string;
		sets: string[];
		types: string[];
		resultsCount: number;
	}>();

	let setOptions = $derived(sets.filter((set: string) => set !== 'All'));
	let typeOptions = $derived(types.filter((type: string) => type !== 'All'));
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
		<div class="flex items-center gap-3">
			<div class="h-6 w-1.5 rounded-full bg-cyan-400"></div>
			<h2 class="text-sm font-black uppercase tracking-[0.3em] text-white">Search</h2>
		</div>
		<div class="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300">
			{resultsCount} Cards
		</div>
	</div>

	<div class="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-3xl lg:flex-row">
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

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex">
			<div class="relative min-w-0 lg:min-w-[180px]">
				<select
					class="w-full cursor-pointer appearance-none rounded-2xl border border-white/5 bg-slate-950/60 px-5 py-4 pr-10 text-xs font-black uppercase tracking-widest text-white transition-all focus:border-cyan-400/50 focus:outline-none sm:py-5"
					bind:value={selectedSet}
				>
					<option value="All">All Sets</option>
					{#each setOptions as set}
						<option value={set}>{set}</option>
					{/each}
				</select>
				<div class="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
				</div>
			</div>

			<div class="relative min-w-0 lg:min-w-[180px]">
				<select
					class="w-full cursor-pointer appearance-none rounded-2xl border border-white/5 bg-slate-950/60 px-5 py-4 pr-10 text-xs font-black uppercase tracking-widest text-white transition-all focus:border-cyan-400/50 focus:outline-none sm:py-5"
					bind:value={selectedType}
				>
					<option value="All">All Types</option>
					{#each typeOptions as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
				<div class="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
				</div>
			</div>
		</div>
	</div>
</div>
