<script lang="ts">
	import IconSelect from '$lib/components/IconSelect.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';

	let {
		searchTerm = $bindable(),
		selectedSet = $bindable(),
		selectedType = $bindable(),
		selectedDomains = $bindable(),
		sets,
		types,
		domains,
		resultsCount
	} = $props<{
		searchTerm: string;
		selectedSet: string;
		selectedType: string;
		selectedDomains: string[];
		sets: string[];
		types: string[];
		domains: string[];
		resultsCount: number;
	}>();

	let setOptions = $derived(sets.filter((set: string) => set !== 'All'));
	let typeOptions = $derived(types.filter((type: string) => type !== 'All'));
	let domainOptions = $derived(domains.filter((domain: string) => domain !== 'All'));
	let filtersOpen = $state(false);
	let domainsOpen = $state(false);
	let activeFilterCount = $derived(
		[selectedSet, selectedType].filter((value) => value !== 'All').length +
			(selectedDomains.length > 0 ? 1 : 0)
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
		<div class="flex flex-col gap-3 lg:flex-row">
			<div class="flex min-w-0 flex-grow gap-2">
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
						class="w-full rounded-md border border-white/10 bg-[#070a12]/86 py-4 pr-4 pl-14 text-sm font-medium text-white shadow-inner shadow-black/20 transition-all placeholder:text-slate-600 focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10 focus:outline-none sm:py-5 sm:pl-16"
						bind:value={searchTerm}
					/>
				</div>

				<button
					type="button"
					class="relative flex h-auto min-w-14 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#070a12]/86 px-4 text-white transition-all focus:border-cyan-300/55 focus:ring-4 focus:ring-cyan-300/10 focus:outline-none active:scale-95 lg:hidden"
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

			<div class="hidden gap-3 lg:flex">
				<IconSelect bind:value={selectedSet} label="All Sets" options={setSelectOptions} />

				<IconSelect bind:value={selectedType} label="All Types" options={typeSelectOptions} />

				<div class="relative min-w-0 {domainsOpen ? 'z-[1000]' : 'z-[130]'} lg:min-w-[210px]">
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-slate-950/68 px-5 py-4 text-left text-xs font-black tracking-widest text-white uppercase shadow-inner shadow-black/20 transition-all hover:border-cyan-300/25 hover:bg-slate-950/82 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 sm:py-5"
						aria-haspopup="listbox"
						aria-expanded={domainsOpen}
						disabled={isBattlefieldType}
						onclick={() => (domainsOpen = !domainsOpen)}
						onblur={(event) => {
							if (
								!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)
							) {
								domainsOpen = false;
							}
						}}
					>
						<span class="flex min-w-0 items-center gap-2">
							{#if selectedDomains.length > 0}
								<span class="flex shrink-0 items-center -space-x-1">
									{#each selectedDomains.slice(0, 3) as domain}
										{@const icon = getDomainIcon(domain)}
										{#if icon}
											<img
												src={icon}
												class="h-5 w-5 rounded-full bg-slate-950 object-contain"
												alt="{domain} icon"
											/>
										{/if}
									{/each}
								</span>
							{/if}
							<span class="truncate">{selectedDomainLabel}</span>
						</span>
						<svg
							class="h-4 w-4 shrink-0 text-slate-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>

					{#if domainsOpen && !isBattlefieldType}
						<div
							class="absolute inset-x-0 top-full z-[1000] mt-2 max-h-72 w-full min-w-0 overflow-y-auto rounded-2xl border border-cyan-300/15 bg-slate-950/96 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:right-0 lg:left-auto lg:max-h-80 lg:min-w-60"
							role="listbox"
							tabindex="-1"
						>
							<button
								type="button"
								class="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-xs font-black tracking-widest uppercase transition {selectedDomains.length ===
								0
									? 'bg-cyan-400 text-slate-950'
									: 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'}"
								role="option"
								aria-selected={selectedDomains.length === 0}
								onclick={clearDomains}
							>
								<span>All Domains</span>
								{#if selectedDomains.length === 0}
									<span>✓</span>
								{/if}
							</button>
							{#each domainOptions as domain}
								{@const icon = getDomainIcon(domain)}
								{@const selected = selectedDomains.includes(domain)}
								<button
									type="button"
									class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black tracking-widest uppercase transition {selected
										? 'bg-cyan-400 text-slate-950'
										: 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'}"
									role="option"
									aria-selected={selected}
									onclick={() => toggleDomain(domain)}
								>
									<span class="flex h-6 w-10 shrink-0 items-center gap-1">
										{#if icon}
											<img src={icon} class="h-5 w-5 object-contain" alt="{domain} icon" />
										{/if}
									</span>
									<span class="min-w-0 flex-1 truncate">{domain}</span>
									<span
										class="grid h-5 w-5 place-items-center rounded border {selected
											? 'border-slate-950/30 bg-slate-950/15'
											: 'border-white/15'}"
									>
										{#if selected}
											<svg
												class="h-3.5 w-3.5"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="4"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="m5 12 4 4L19 6" />
											</svg>
										{/if}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if filtersOpen}
			<div class="mt-3 grid grid-cols-1 gap-3 border-t border-white/10 pt-3 lg:hidden">
				<IconSelect bind:value={selectedSet} label="All Sets" options={setSelectOptions} />

				<IconSelect bind:value={selectedType} label="All Types" options={typeSelectOptions} />

				<div class="relative min-w-0 {domainsOpen ? 'z-[1000]' : 'z-[130]'}">
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-slate-950/68 px-5 py-4 text-left text-xs font-black tracking-widest text-white uppercase shadow-inner shadow-black/20 transition-all hover:border-cyan-300/25 hover:bg-slate-950/82 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 sm:py-5"
						aria-haspopup="listbox"
						aria-expanded={domainsOpen}
						disabled={isBattlefieldType}
						onclick={() => (domainsOpen = !domainsOpen)}
						onblur={(event) => {
							if (
								!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)
							) {
								domainsOpen = false;
							}
						}}
					>
						<span class="flex min-w-0 items-center gap-2">
							{#if selectedDomains.length > 0}
								<span class="flex shrink-0 items-center -space-x-1">
									{#each selectedDomains.slice(0, 3) as domain}
										{@const icon = getDomainIcon(domain)}
										{#if icon}
											<img
												src={icon}
												class="h-5 w-5 rounded-full bg-slate-950 object-contain"
												alt="{domain} icon"
											/>
										{/if}
									{/each}
								</span>
							{/if}
							<span class="truncate">{selectedDomainLabel}</span>
						</span>
						<svg
							class="h-4 w-4 shrink-0 text-slate-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>

					{#if domainsOpen && !isBattlefieldType}
						<div
							class="absolute inset-x-0 top-full z-[1000] mt-2 max-h-72 w-full min-w-0 overflow-y-auto rounded-2xl border border-cyan-300/15 bg-slate-950/96 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl"
							role="listbox"
							tabindex="-1"
						>
							<button
								type="button"
								class="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-xs font-black tracking-widest uppercase transition {selectedDomains.length ===
								0
									? 'bg-cyan-400 text-slate-950'
									: 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'}"
								role="option"
								aria-selected={selectedDomains.length === 0}
								onclick={clearDomains}
							>
								<span>All Domains</span>
								{#if selectedDomains.length === 0}
									<span>✓</span>
								{/if}
							</button>
							{#each domainOptions as domain}
								{@const icon = getDomainIcon(domain)}
								{@const selected = selectedDomains.includes(domain)}
								<button
									type="button"
									class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black tracking-widest uppercase transition {selected
										? 'bg-cyan-400 text-slate-950'
										: 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'}"
									role="option"
									aria-selected={selected}
									onclick={() => toggleDomain(domain)}
								>
									<span class="flex h-6 w-10 shrink-0 items-center gap-1">
										{#if icon}
											<img src={icon} class="h-5 w-5 object-contain" alt="{domain} icon" />
										{/if}
									</span>
									<span class="min-w-0 flex-1 truncate">{domain}</span>
									<span
										class="grid h-5 w-5 place-items-center rounded border {selected
											? 'border-slate-950/30 bg-slate-950/15'
											: 'border-white/15'}"
									>
										{#if selected}
											<svg
												class="h-3.5 w-3.5"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="4"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="m5 12 4 4L19 6" />
											</svg>
										{/if}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
