<script lang="ts">
	import type { DeckValidation } from '$lib/utils/deck';

	let { validation }: { validation: DeckValidation } = $props();

	let topIssue = $derived(validation.issues[0] ?? null);
</script>

<section
	class="mb-5 rounded-xl border px-3 py-3 {validation.isReady
		? 'border-emerald-300/20 bg-emerald-300/7'
		: 'border-amber-200/20 bg-slate-950/55'}"
>
	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex min-w-0 items-start gap-3">
			<span
				class="mt-1 h-3 w-3 shrink-0 rounded-full {validation.isReady
					? 'bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.35)]'
					: 'bg-amber-200 shadow-[0_0_16px_rgba(253,230,138,0.32)]'}"
			></span>
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-sm font-black tracking-widest text-white uppercase">Deck Check</h2>
					<span
						class="rounded-md px-2 py-0.5 text-[10px] font-black tracking-widest uppercase {validation.isReady
							? 'bg-emerald-300 text-slate-950'
							: 'bg-amber-200 text-slate-950'}"
					>
						{validation.isReady ? 'Ready' : `${validation.errorCount} Fix`}
					</span>
					{#if validation.warningCount > 0}
						<span
							class="rounded-md border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-100 uppercase"
						>
							{validation.warningCount} Warn
						</span>
					{/if}
				</div>
				<p class="mt-1 truncate text-xs font-semibold text-slate-400">
					{validation.isReady
						? 'ผ่านเงื่อนไขหลักแล้ว พร้อม save / share / export'
						: topIssue?.message}
				</p>
			</div>
		</div>

		<div class="flex flex-wrap gap-1.5">
			{#each validation.checks as check}
				<span
					class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black tracking-widest uppercase {check.status ===
					'pass'
						? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
						: check.status === 'warn'
							? 'border-amber-200/20 bg-amber-300/10 text-amber-100'
							: 'border-rose-300/20 bg-rose-500/10 text-rose-100'}"
				>
					<span
						class="h-1.5 w-1.5 rounded-full {check.status === 'pass'
							? 'bg-emerald-300'
							: check.status === 'warn'
								? 'bg-amber-200'
								: 'bg-rose-300'}"
					></span>
					{check.label}
					{check.value}
				</span>
			{/each}
		</div>
	</div>

	{#if validation.issues.length > 1}
		<details class="mt-3 border-t border-white/10 pt-3">
			<summary
				class="cursor-pointer text-xs font-black tracking-widest text-slate-400 uppercase hover:text-white"
			>
				Show all issues ({validation.issues.length})
			</summary>
			<div class="mt-3 grid gap-2">
				{#each validation.issues as issue}
					<div
						class="rounded-lg border px-3 py-2 text-xs font-bold {issue.severity === 'error'
							? 'border-rose-300/20 bg-rose-500/8 text-rose-100'
							: 'border-amber-200/20 bg-amber-300/8 text-amber-100'}"
					>
						<span class="font-black tracking-widest uppercase">{issue.label}:</span>
						{issue.message}
					</div>
				{/each}
			</div>
		</details>
	{/if}
</section>
