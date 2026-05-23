<script lang="ts">
	type MenuItem = {
		label: string;
		href: string;
		external?: boolean;
		active?: boolean;
	};

	let { active = '' } = $props<{ active?: 'domains' | 'qa' | '' }>();
	let isOpen = $state(false);

	let menuItems = $derived<MenuItem[]>([
		{ label: 'Domains', href: '/domains', active: active === 'domains' },
		{ label: 'Q&A', href: '/qa', active: active === 'qa' },
		{ label: 'Official', href: 'https://riftbound.com', external: true }
	]);
</script>

<div class="relative">
	<div class="hidden items-center gap-2 sm:gap-4 md:flex">
		{#each menuItems as item}
			<a
				href={item.href}
				target={item.external ? '_blank' : undefined}
				rel={item.external ? 'noreferrer' : undefined}
				class="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest transition {item.active ? 'bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:bg-white/5 hover:text-cyan-300'} {item.external ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10' : ''}"
			>
				{item.label}
			</a>
		{/each}
	</div>

	<button
		class="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25 md:hidden"
		type="button"
		aria-label="Open menu"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
	>
		{#if isOpen}
			<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
				<path d="M6 18 18 6" />
				<path d="m6 6 12 12" />
			</svg>
		{:else}
			<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
				<path d="M4 7h16" />
				<path d="M4 12h16" />
				<path d="M4 17h16" />
			</svg>
		{/if}
	</button>

	{#if isOpen}
		<div class="absolute right-0 top-14 z-[80] w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl md:hidden">
			{#each menuItems as item}
				<a
					href={item.href}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noreferrer' : undefined}
					class="flex min-h-12 items-center justify-between rounded-xl px-4 text-xs font-black uppercase tracking-widest transition {item.active ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'}"
					onclick={() => (isOpen = false)}
				>
					{item.label}
					{#if item.external}
						<svg class="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
							<path d="M15 3h6v6" />
							<path d="M10 14 21 3" />
							<path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
						</svg>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
