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
	let selectedOption = $derived(
		options.find((option: Option) => option.value === value) ?? options[0]
	);

	function selectOption(nextValue: string) {
		value = nextValue;
		isOpen = false;
	}
</script>

<div class="relative min-w-0 {isOpen ? 'z-[1000]' : 'z-[130]'}">
	<button
		type="button"
		class="flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3.5 text-left text-xs font-bold text-white transition hover:border-white/15 hover:bg-black/30 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/[0.07] focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
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

	{#if isOpen && !disabled}
		<div
			class="absolute inset-x-0 top-full z-[1000] mt-2 max-h-72 w-full min-w-0 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/98 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl lg:max-h-80"
			role="listbox"
			tabindex="-1"
		>
			{#each options as option}
				<button
					type="button"
					class="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-bold transition {value ===
					option.value
						? 'bg-cyan-300/[0.1] text-cyan-100'
						: 'text-slate-300 hover:bg-white/5 hover:text-white'}"
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
