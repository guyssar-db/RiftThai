<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		[key: string]: any;
	}

	let {
		type = 'button',
		variant = 'primary',
		disabled = false,
		class: className = '',
		onclick,
		children,
		...restProps
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-black tracking-widest uppercase transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 {variant === 'primary' ? 'bg-gradient-to-r from-cyan-300 to-cyan-100 text-slate-950 hover:brightness-105' : ''} {variant === 'secondary' ? 'border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white' : ''} {variant === 'ghost' ? 'border border-cyan-300/20 bg-cyan-300/8 text-cyan-100 hover:bg-cyan-300/14 hover:text-white' : ''} {variant === 'warning' ? 'border border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20' : ''} {variant === 'danger' ? 'border border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20' : ''} {className}"
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</button>
