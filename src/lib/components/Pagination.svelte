<script lang="ts">
	let { currentPage = $bindable(), totalPages } = $props<{
		currentPage: number;
		totalPages: number;
	}>();

	let visiblePages = $derived(
		Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
			if (totalPages <= 5) return i + 1;
			if (currentPage <= 3) return i + 1;
			if (currentPage >= totalPages - 2) return totalPages - 4 + i;
			return currentPage - 2 + i;
		})
	);

	function goTo(page: number) {
		currentPage = page;
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

{#if totalPages > 1}
	<div class="mt-16 flex flex-col items-center gap-5 sm:mt-24">
		<div class="rt-panel-quiet flex max-w-full items-center gap-2 overflow-x-auto rounded-xl p-1.5 sm:gap-3">
			<button
				class="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white transition hover:bg-cyan-300 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12"
				onclick={() => goTo(currentPage - 1)}
				disabled={currentPage === 1}
				aria-label="Previous page"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m15 18-6-6 6-6" /></svg>
			</button>

			{#each visiblePages as page}
				<button
					class="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xs font-black transition {currentPage === page ? 'bg-cyan-300 text-slate-950' : 'text-slate-500 hover:bg-white/5 hover:text-white'} sm:h-12 sm:w-12"
					onclick={() => goTo(page)}
					aria-current={currentPage === page ? 'page' : undefined}
				>
					{page}
				</button>
			{/each}

			<button
				class="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white transition hover:bg-cyan-300 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12"
				onclick={() => goTo(currentPage + 1)}
				disabled={currentPage === totalPages}
				aria-label="Next page"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m9 18 6-6-6-6" /></svg>
			</button>
		</div>
		<div class="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
			Page {currentPage} of {totalPages}
		</div>
	</div>
{/if}
