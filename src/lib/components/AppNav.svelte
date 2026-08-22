<script lang="ts">
	import SiteMenu from '$lib/components/SiteMenu.svelte';

	type ViewMode = 'gallery' | 'keywords' | 'phases';

	let { viewMode = $bindable() } = $props<{ viewMode: ViewMode }>();

	const navItems: { id: ViewMode; label: string }[] = [
		{ id: 'gallery', label: 'การ์ด' },
		{ id: 'keywords', label: 'คีย์เวิร์ด' },
		{ id: 'phases', label: 'ลำดับเทิร์น' }
	];

	function selectView(mode: ViewMode) {
		viewMode = mode;
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<nav class="sticky top-0 z-[180] border-b border-white/8 bg-slate-950/88 backdrop-blur-xl">
	<div
		class="rt-container grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 md:grid-cols-[1fr_auto_1fr]"
	>
		<a href="/" class="flex w-fit shrink-0 items-center text-white lg:invisible">
			<span class="font-display text-base font-bold tracking-[0.06em] sm:text-lg"
				>RIFT<span class="rt-brand-accent">THAI</span></span
			>
		</a>

		<div class="hidden rounded-xl border border-white/8 bg-white/[0.025] p-1 md:flex">
			{#each navItems as item}
				<button
					class="min-w-24 rounded-lg px-4 py-2.5 text-[11px] font-black tracking-widest uppercase transition {viewMode ===
					item.id
						? 'bg-cyan-300 text-slate-950'
						: 'text-slate-400 hover:bg-white/5 hover:text-white'}"
					onclick={() => selectView(item.id)}
					aria-pressed={viewMode === item.id}
				>
					{item.label}
				</button>
			{/each}
		</div>

		<div class="justify-self-end"><SiteMenu /></div>
	</div>
</nav>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-[180] md:hidden">
	<div
		class="pointer-events-auto grid grid-cols-3 gap-1 border-t border-white/10 bg-slate-950/96 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl"
	>
		{#each navItems as item}
			<button
				class="flex min-h-13 flex-col items-center justify-center rounded-lg text-[9px] font-black tracking-widest uppercase transition {viewMode ===
				item.id
					? 'bg-cyan-300/[0.1] text-cyan-200'
					: 'text-slate-500 active:bg-white/5'}"
				onclick={() => selectView(item.id)}
				aria-pressed={viewMode === item.id}
			>
				{#if item.id === 'gallery'}
					<svg
						class="mb-1 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						><rect width="7" height="7" x="3" y="3" rx="1" /><rect
							width="7"
							height="7"
							x="14"
							y="3"
							rx="1"
						/><rect width="7" height="7" x="14" y="14" rx="1" /><rect
							width="7"
							height="7"
							x="3"
							y="14"
							rx="1"
						/></svg
					>
				{:else if item.id === 'keywords'}
					<svg
						class="mb-1 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						><path
							d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"
						/></svg
					>
				{:else}
					<svg
						class="mb-1 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						><path d="M12 2v20" /><path d="m4.9 4.9 14.2 14.2" /><path d="M2 12h20" /><path
							d="m19.1 4.9-14.2 14.2"
						/></svg
					>
				{/if}
				{item.label}
			</button>
		{/each}
	</div>
</div>
