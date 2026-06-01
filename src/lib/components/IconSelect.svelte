<script lang="ts">
	type Option = {
		label: string;
		value: string;
		icons?: { label: string; src: string }[];
	};

	let {
		value = $bindable(),
		label,
		options,
		disabled = false
	} = $props<{
		value: string;
		label: string;
		options: Option[];
		disabled?: boolean;
	}>();

	let isOpen = $state(false);
	let selectedOption = $derived(options.find((option: Option) => option.value === value) ?? options[0]);

	function selectOption(nextValue: string) {
		value = nextValue;
		isOpen = false;
	}
</script>

<div class="relative min-w-0 {isOpen ? 'z-[1000]' : 'z-[130]'} lg:min-w-[180px]">
	<button
		type="button"
		class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-slate-950/68 px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-white shadow-inner shadow-black/20 transition-all hover:border-cyan-300/25 hover:bg-slate-950/82 focus:border-cyan-400/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-45 sm:py-5"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		{disabled}
		onclick={() => (isOpen = !isOpen)}
		onblur={(event) => {
			if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
				isOpen = false;
			}
		}}
	>
		<span class="flex min-w-0 items-center gap-2">
			{#if selectedOption?.icons?.length}
				<span class="flex shrink-0 items-center gap-1">
					{#each selectedOption.icons as icon}
						<img src={icon.src} class="h-5 w-5 object-contain" alt="{icon.label} icon" />
					{/each}
				</span>
			{/if}
			<span class="truncate">{selectedOption?.label ?? label}</span>
		</span>
		<svg class="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>

	{#if isOpen && !disabled}
		<div
			class="absolute inset-x-0 top-full z-[1000] mt-2 max-h-72 w-full min-w-0 overflow-y-auto rounded-2xl border border-cyan-300/15 bg-slate-950/96 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:left-auto lg:right-0 lg:max-h-80 lg:min-w-56"
			role="listbox"
			tabindex="-1"
		>
			{#each options as option}
				<button
					type="button"
					class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black uppercase tracking-widest transition {value === option.value ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'}"
					role="option"
					aria-selected={value === option.value}
					onclick={() => selectOption(option.value)}
				>
					<span class="flex h-6 w-10 shrink-0 items-center gap-1">
						{#each option.icons ?? [] as icon}
							<img src={icon.src} class="h-5 w-5 object-contain" alt="{icon.label} icon" />
						{/each}
					</span>
					<span class="truncate">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
