<script lang="ts">
	import SiteMenu from '$lib/components/SiteMenu.svelte';

	type ViewMode = 'gallery' | 'keywords' | 'phases';

	let { viewMode = $bindable() } = $props<{ viewMode: ViewMode }>();

	const navItems: { id: ViewMode; label: string }[] = [
		{ id: 'gallery', label: 'Gallery' },
		{ id: 'keywords', label: 'Keywords' },
		{ id: 'phases', label: 'Phases' }
	];

	function selectView(mode: ViewMode) {
		viewMode = mode;
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<nav class="sticky top-0 z-[180] border-b border-white/5 bg-slate-950/75 backdrop-blur-2xl">
	<div class="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
		<a href="/" class="shrink-0 text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl">
			Rift<span class="text-cyan-400">Thai</span>
		</a>

		<div class="hidden rounded-2xl border border-white/10 bg-white/5 p-1 md:flex">
			{#each navItems as item}
				<button
					class="min-w-28 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition {viewMode === item.id ? 'bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}"
					onclick={() => selectView(item.id)}
				>
					{item.label}
				</button>
			{/each}
		</div>

		<SiteMenu />
	</div>
</nav>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-[180] px-4 md:hidden">
	<div class="pointer-events-auto mx-auto grid max-w-sm grid-cols-3 gap-1 rounded-[1.75rem] border border-white/10 bg-slate-950/85 p-2 shadow-2xl shadow-black/70 backdrop-blur-2xl">
		{#each navItems as item}
			<button
				class="flex min-h-14 flex-col items-center justify-center rounded-2xl text-[9px] font-black uppercase tracking-widest transition {viewMode === item.id ? 'bg-cyan-400 text-slate-950' : 'text-slate-500 active:bg-white/5'}"
				onclick={() => selectView(item.id)}
			>
				{#if item.id === 'gallery'}
					<svg class="mb-1 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
				{:else if item.id === 'keywords'}
					<svg class="mb-1 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" /></svg>
				{:else}
					<svg class="mb-1 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2v20" /><path d="m4.9 4.9 14.2 14.2" /><path d="M2 12h20" /><path d="m19.1 4.9-14.2 14.2" /></svg>
				{/if}
				{item.label}
			</button>
		{/each}
	</div>
</div>
