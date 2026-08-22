<script lang="ts">
	import IconSelect from '$lib/components/IconSelect.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	import { getSetIcon } from '$lib/data/setIcons';
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

	let filtersOpen = $state(false);
	let domainOptions = $derived(domains.filter((domain: string) => domain !== 'All'));
	let activeFilterCount = $derived(
		[selectedSet, selectedType].filter((value) => value !== 'All').length +
			(selectedDomains.length > 0 ? 1 : 0) +
			(selectedEnergy !== null ? 1 : 0) +
			(selectedMight !== null ? 1 : 0)
	);
	let setSelectOptions = $derived(
		sets.map((set: string) => {
			const icon = getSetIcon(set);
			return {
				label: set === 'All' ? 'ทุกชุด' : set,
				value: set,
				icons: icon ? [{ label: set, src: icon }] : undefined
			};
		})
	);
	let typeSelectOptions = $derived(
		types.map((type: string) => ({
			label: type === 'All' ? 'ทุกประเภท' : type,
			value: type,
			icons: getTypeIcons(type).map((icon) => ({
				label: icon.label,
				src: `/images/icons/${icon.src}`
			}))
		}))
	);
	let isBattlefieldType = $derived(selectedType === 'Battlefield');

	$effect(() => {
		if (isBattlefieldType && selectedDomains.length > 0) selectedDomains = [];
	});

	function toggleDomain(domain: string) {
		if (isBattlefieldType) return;
		selectedDomains = selectedDomains.includes(domain)
			? selectedDomains.filter((selected: string) => selected !== domain)
			: [...selectedDomains, domain];
	}

	function resetFilters() {
		selectedSet = 'All';
		selectedType = 'All';
		selectedDomains = [];
		selectedEnergy = null;
		selectedMight = null;
	}
</script>

<section
	class="home-search rt-panel top-[4.5rem] z-[60] mb-7 rounded-2xl p-3 sm:mb-9 sm:p-4 lg:sticky"
	aria-label="ค้นหาและกรองการ์ด"
>
	<div class="mb-3 flex items-center justify-between gap-3 px-1">
		<div>
			<p class="rt-kicker">คลังข้อมูลการ์ด</p>
			<h2 class="mt-0.5 font-display text-base font-bold text-white">ค้นหาการ์ด</h2>
		</div>
		<div class="rt-chip" aria-live="polite">{resultsCount} ใบ</div>
	</div>

	<div class="flex min-w-0 gap-2">
		<div class="group relative min-w-0 flex-1">
			<svg
				class="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-300"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
			</svg>
			<input
				type="search"
				placeholder="ค้นหาชื่อการ์ด รหัส ความสามารถ หรือแท็ก..."
				class="h-13 w-full rounded-xl border border-white/10 bg-black/20 pr-11 pl-12 text-sm font-medium text-white transition placeholder:text-slate-600 focus:border-cyan-300/45 focus:bg-black/30 focus:ring-4 focus:ring-cyan-300/[0.07] focus:outline-none"
				bind:value={searchTerm}
			/>
			{#if searchTerm}
				<button
					type="button"
					class="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white"
					onclick={() => (searchTerm = '')}
					aria-label="ล้างคำค้นหา"
				>
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg
					>
				</button>
			{/if}
		</div>

		<button
			type="button"
			class="relative flex h-13 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition {filtersOpen ||
			activeFilterCount > 0
				? 'border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100'
				: 'border-white/10 bg-white/[0.025] text-slate-300 hover:bg-white/[0.05]'}"
			aria-label="ตัวกรอง"
			aria-expanded={filtersOpen}
			onclick={() => (filtersOpen = !filtersOpen)}
		>
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg
			>
			<span class="hidden sm:inline">ตัวกรอง</span>
			{#if activeFilterCount > 0}
				<span
					class="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-slate-950"
					>{activeFilterCount}</span
				>
			{/if}
		</button>
	</div>

	{#if filtersOpen}
		<div class="mt-3 border-t border-white/8 pt-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="grid gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-slate-500 uppercase"
						>ประเภทการ์ด</span
					>
					<IconSelect bind:value={selectedType} label="ประเภทการ์ด" options={typeSelectOptions} />
				</div>
				<div class="grid gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-slate-500 uppercase"
						>ชุดการ์ด</span
					>
					<IconSelect bind:value={selectedSet} label="ชุดการ์ด" options={setSelectOptions} />
				</div>
			</div>

			<fieldset class="mt-4" disabled={isBattlefieldType}>
				<div class="mb-2 flex items-center justify-between gap-3">
					<legend class="text-[10px] font-bold tracking-widest text-slate-500 uppercase"
						>โดเมน</legend
					>
					{#if isBattlefieldType}<span class="text-[10px] text-slate-600"
							>Battlefield ไม่ใช้โดเมน</span
						>{/if}
				</div>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						class="h-10 rounded-xl border px-3 text-xs font-bold transition {selectedDomains.length ===
						0
							? 'border-cyan-300/30 bg-cyan-300/[0.09] text-cyan-100'
							: 'border-white/8 bg-white/[0.025] text-slate-400 hover:text-white'}"
						onclick={() => (selectedDomains = [])}
					>
						ทั้งหมด
					</button>
					{#each domainOptions as domain}
						{@const icon = getDomainIcon(domain)}
						{@const active = selectedDomains.includes(domain)}
						<button
							type="button"
							class="flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition {active
								? 'border-cyan-300/30 bg-cyan-300/[0.09] text-cyan-100'
								: 'border-white/8 bg-white/[0.025] text-slate-400 hover:border-white/15 hover:text-white'}"
							onclick={() => toggleDomain(domain)}
							aria-pressed={active}
						>
							{#if icon}<img src={icon} class="h-5 w-5 object-contain" alt="" />{/if}
							<span>{domain}</span>
						</button>
					{/each}
				</div>
			</fieldset>

			<div class="mt-4 grid gap-4 border-t border-white/8 pt-4 md:grid-cols-2">
				{#each [{ label: 'Energy', value: selectedEnergy }, { label: 'Might', value: selectedMight }] as group}
					<fieldset class="min-w-0">
						<legend class="mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
							>{group.label}</legend
						>
						<div class="flex gap-1.5 overflow-x-auto pb-1">
							{#each [null, 0, 1, 2, 3, 4, 5, 6, 7] as amount}
								{@const active = group.value === amount}
								<button
									type="button"
									class="h-10 min-w-10 rounded-lg border text-xs font-bold transition {active
										? 'border-cyan-300/30 bg-cyan-300/[0.09] text-cyan-100'
										: 'border-white/8 bg-white/[0.025] text-slate-400 hover:text-white'}"
									onclick={() => {
										if (group.label === 'Energy') selectedEnergy = amount;
										else selectedMight = amount;
									}}
									aria-pressed={active}
								>
									{amount === null ? 'ทั้งหมด' : amount === 7 ? '7+' : amount}
								</button>
							{/each}
						</div>
					</fieldset>
				{/each}
			</div>

			<div class="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
				<p class="text-xs text-slate-500">
					พบการ์ด <span class="font-bold text-slate-200">{resultsCount}</span> ใบ
				</p>
				{#if activeFilterCount > 0}
					<button
						type="button"
						class="min-h-10 rounded-lg px-3 text-xs font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
						onclick={resetFilters}>ล้างตัวกรอง</button
					>
				{/if}
			</div>
		</div>
	{/if}
</section>
