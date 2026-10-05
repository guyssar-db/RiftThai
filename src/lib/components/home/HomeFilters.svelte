<script lang="ts">
	import StatSlider from './StatSlider.svelte';
	import { getDomainIcon } from '$lib/data/domainIcons';
	let {
		searchTerm = $bindable(''),
		selectedSet = $bindable('All'),
		selectedType = $bindable('All'),
		selectedGearGroup = $bindable('All'),
		selectedDomains = $bindable<string[]>([]),
		selectedEnergy = $bindable<number | null>(null),
		selectedMight = $bindable<number | null>(null),
		selectedPower = $bindable<number | null>(null),
		selectedRarity = $bindable('All'),
		sortMode = $bindable('latest'),
		ownershipFilter = $bindable('all'),
		ownershipOptions = [],
		ownershipDisabled = false,
		rail = false,
		sets,
		types,
		domains,
		rarities,
		resultsCount
	}: {
		searchTerm: string;
		selectedSet: string;
		selectedType: string;
		selectedGearGroup: string;
		selectedDomains: string[];
		selectedEnergy: number | null;
		selectedMight: number | null;
		selectedPower: number | null;
		selectedRarity: string;
		sortMode: string;
		ownershipFilter?: string;
		ownershipOptions?: { label: string; value: string }[];
		ownershipDisabled?: boolean;
		rail?: boolean;
		sets: string[];
		types: string[];
		domains: string[];
		rarities: string[];
		resultsCount: number;
	} = $props();
	let open = $state(false);
	$effect(() => {
		if (rail) open = true;
	});
	let showMight = $derived(['All', 'Unit', 'Champion'].includes(selectedType));
	let showEnergy = $derived(!['Rune', 'Token', 'Basic'].includes(selectedType));
	let showGearGroup = $derived(selectedType === 'Gear');
	let active = $derived(
		Number(selectedSet !== 'All') +
			Number(selectedType !== 'All') +
			Number(showGearGroup && selectedGearGroup !== 'All') +
			Number(selectedRarity !== 'All') +
			selectedDomains.length +
			Number(selectedEnergy !== null) +
			Number(selectedPower !== null) +
			Number(selectedMight !== null) +
			Number(ownershipOptions.length > 0 && ownershipFilter !== 'all')
	);
	$effect(() => {
		if (!showMight) selectedMight = null;
		if (!showEnergy) selectedEnergy = null;
		if (!showGearGroup) selectedGearGroup = 'All';
		if (ownershipOptions.length === 0) ownershipFilter = 'all';
	});
	function toggle(domain: string) {
		selectedDomains = selectedDomains.includes(domain)
			? selectedDomains.filter((d) => d !== domain)
			: [...selectedDomains, domain];
	}
	function reset() {
		selectedSet = 'All';
		selectedType = 'All';
		selectedGearGroup = 'All';
		selectedRarity = 'All';
		selectedDomains = [];
		selectedEnergy = null;
		selectedPower = null;
		selectedMight = null;
		ownershipFilter = 'all';
	}
</script>

<section class="home-filters" class:home-filters-rail={rail} aria-label="ค้นหาและกรองการ์ด">
	<div class="home-search-row">
		<label class="home-search-input"
			><svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg
			><input
				type="search"
				aria-label="ค้นหาการ์ด"
				placeholder="ค้นหาชื่อการ์ด รหัส หรือความสามารถ…"
				bind:value={searchTerm}
			/></label
		>
		<button
			class="home-filter-toggle"
			aria-expanded={open}
			aria-controls="home-filter-options"
			onclick={() => (open = !open)}
			><svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg
			>ตัวกรอง{#if active}<span>{active}</span>{/if}</button
		>
	</div>
	{#if active}
		<div class="active-filter-chips" aria-label="ตัวกรองที่เลือก">
			{#if selectedSet !== 'All'}<button onclick={() => selectedSet = 'All'} aria-label="ลบตัวกรองชุด {selectedSet}">{selectedSet} ×</button>{/if}
			{#if selectedType !== 'All'}<button onclick={() => selectedType = 'All'} aria-label="ลบตัวกรองประเภท {selectedType}">{selectedType} ×</button>{/if}
			{#if selectedGearGroup !== 'All'}<button onclick={() => selectedGearGroup = 'All'} aria-label="ลบตัวกรอง Gear {selectedGearGroup}">Gear {selectedGearGroup} ×</button>{/if}
			{#if selectedRarity !== 'All'}<button onclick={() => selectedRarity = 'All'} aria-label="ลบตัวกรองความหายาก {selectedRarity}">{selectedRarity} ×</button>{/if}
			{#each selectedDomains as domain}<button onclick={() => toggle(domain)} aria-label="ลบตัวกรองโดเมน {domain}">{domain} ×</button>{/each}
			{#if selectedEnergy !== null}<button onclick={() => selectedEnergy = null} aria-label="ลบตัวกรอง Energy">Energy {selectedEnergy}{selectedEnergy === 7 ? '+' : ''} ×</button>{/if}
			{#if selectedPower !== null}<button onclick={() => selectedPower = null} aria-label="ลบตัวกรอง Power">Power {selectedPower}{selectedPower === 3 ? '+' : ''} ×</button>{/if}
			{#if selectedMight !== null}<button onclick={() => selectedMight = null} aria-label="ลบตัวกรอง Might">Might {selectedMight}{selectedMight === 7 ? '+' : ''} ×</button>{/if}
			{#if ownershipOptions.length > 0 && ownershipFilter !== 'all'}<button onclick={() => ownershipFilter = 'all'} aria-label="ลบตัวกรองการ์ดสะสม">{ownershipOptions.find((option) => option.value === ownershipFilter)?.label ?? ownershipFilter} ×</button>{/if}
			<button onclick={reset}>ล้างทั้งหมด</button>
		</div>
	{/if}
	<div
		id="home-filter-options"
		class="home-filter-options"
		class:home-filter-options-open={open}
		aria-hidden={!open}
		inert={!open}
	>
		<label
			>ชุดการ์ด<select bind:value={selectedSet}
				>{#each sets as s}<option value={s}>{s === 'All' ? 'ทั้งหมด' : s}</option>{/each}</select
			></label
		>
		<label
			>ประเภท<select bind:value={selectedType}
				>{#each types as t}<option value={t}>{t === 'All' ? 'ทั้งหมด' : t}</option>{/each}</select
			></label
		>
		{#if showGearGroup}
			<label
				>หมวด Gear<select bind:value={selectedGearGroup}
					><option value="All">All Gear</option><option value="Equipment">Gear Equipment</option><option value="Unit">Gear Unit</option></select
				></label
			>
		{/if}
		<label
			>ความหายาก<select bind:value={selectedRarity}
				>{#each rarities as r}<option value={r}>{r === 'All' ? 'ทั้งหมด' : r}</option
					>{/each}</select
			></label
		>
		{#if ownershipOptions.length > 0}
			<label
				>การ์ดสะสม<select bind:value={ownershipFilter} disabled={ownershipDisabled}
					>{#each ownershipOptions as option}<option value={option.value}>{option.label}</option>{/each}</select
				></label
			>
		{/if}
		<fieldset class="home-domains">
			<legend>Domain · เลือกได้หลายโดเมน</legend>
			<div>
				<button aria-pressed={selectedDomains.length === 0} onclick={() => (selectedDomains = [])}
					>ทั้งหมด</button
				>
				{#each domains.filter((d) => d !== 'All') as d}<button
						aria-pressed={selectedDomains.includes(d)}
						onclick={() => toggle(d)}
						>{#if getDomainIcon(d)}<img
								src={getDomainIcon(d)}
								alt=""
								width="18"
								height="18"
							/>{/if}{d}<span aria-hidden="true">{selectedDomains.includes(d) ? '✓' : ''}</span
						></button
					>{/each}
			</div>
		</fieldset>
		{#if showEnergy}<StatSlider label="Energy" max={7} bind:value={selectedEnergy} />{/if}
		<StatSlider label="Power" max={3} bind:value={selectedPower} />
		{#if showMight}<StatSlider label="Might" max={7} bind:value={selectedMight} />{/if}
		<button class="home-reset" onclick={reset}>ล้างตัวกรอง</button>
	</div>
	<div class="home-results">
		<span aria-live="polite">{resultsCount.toLocaleString()} การ์ด</span><label
			>เรียงตาม <select bind:value={sortMode}
				><option value="latest">ชุดล่าสุด</option><option value="name">ชื่อ A–Z</option><option
					value="energy">ค่าร่ายน้อย → มาก</option
				></select
			></label
		>
	</div>
</section>
