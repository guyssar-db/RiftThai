<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		checked?: boolean;
		required?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: any;
	}

	let {
		checked = $bindable(false),
		required = false,
		class: className = '',
		children,
		...restProps
	}: Props = $props();
</script>

<label class="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed font-semibold text-slate-500 cursor-pointer select-none {className}">
	<input
		type="checkbox"
		bind:checked
		{required}
		class="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950 accent-cyan-300 cursor-pointer"
		{...restProps}
	/>
	<span>
		{#if children}
			{@render children()}
		{/if}
	</span>
</label>
