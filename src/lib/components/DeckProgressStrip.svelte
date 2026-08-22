<script lang="ts">
	import {
		maxMainDeckCards,
		maxRuneCards,
		maxSideboardCards,
		requiredBattlefieldCards,
		type DeckStats,
		type DeckValidation
	} from '$lib/utils/deck';

	let { stats, validation }: { stats: DeckStats; validation: DeckValidation } = $props();

	const items = $derived([
		{
			label: 'สนาม',
			value: stats.battlefieldTotal,
			max: requiredBattlefieldCards,
			optional: false
		},
		{ label: 'Main', value: stats.mainTotal, max: maxMainDeckCards, optional: false },
		{ label: 'Rune', value: stats.runeTotal, max: maxRuneCards, optional: false },
		{ label: 'สำรอง', value: stats.sideboardTotal, max: maxSideboardCards, optional: true }
	]);

	function percent(value: number, max: number) {
		return `${Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100))}%`;
	}

	function isComplete(item: (typeof items)[number]) {
		return item.optional ? item.value <= item.max : item.value === item.max;
	}
</script>

<section
	class="mb-4 rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-xl shadow-black/20 backdrop-blur-xl"
>
	<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
		<div class="flex min-w-0 items-center gap-3">
			<div
				class="grid h-10 w-10 shrink-0 place-items-center rounded-lg {validation.isReady
					? 'bg-emerald-300 text-slate-950'
					: 'bg-amber-200 text-slate-950'}"
			>
				<span class="text-xs font-black">{validation.isReady ? 'OK' : validation.errorCount}</span>
			</div>
			<div class="min-w-0">
				<div class="text-sm font-black tracking-widest text-white uppercase">
					{validation.isReady ? 'เด็คพร้อมเล่น' : 'เด็คยังต้องแก้ไข'}
				</div>
				<div class="mt-0.5 truncate text-xs font-semibold text-slate-500">
					{validation.isReady
						? 'ผ่านเงื่อนไขหลักแล้ว'
						: (validation.issues[0]?.message ?? 'ตรวจสอบเงื่อนไขของเด็ค')}
				</div>
			</div>
		</div>

		<div class="grid gap-2 sm:grid-cols-2 xl:min-w-[42rem] xl:grid-cols-4">
			{#each items as item}
				<div class="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
					<div
						class="mb-1 flex items-center justify-between gap-3 text-[10px] font-black tracking-widest uppercase"
					>
						<span class="text-slate-400">{item.label}</span>
						<span
							class={item.value > item.max
								? 'text-rose-100'
								: isComplete(item)
									? 'text-emerald-100'
									: 'text-amber-100'}
						>
							{item.value}/{item.max}
						</span>
					</div>
					<div class="h-1.5 overflow-hidden rounded-full bg-slate-800">
						<div
							class="h-full rounded-full {item.value > item.max
								? 'bg-rose-300'
								: isComplete(item)
									? 'bg-emerald-300'
									: 'bg-amber-200'}"
							style={`width: ${percent(item.value, item.max)}`}
						></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
