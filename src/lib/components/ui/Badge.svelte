<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'public' | 'unlisted' | 'private' | 'danger' | 'default';
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		class: className = '',
		children
	}: Props = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border {className} 
	{variant === 'public' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : ''}
	{variant === 'unlisted' ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' : ''}
	{variant === 'private' ? 'border-slate-500/20 bg-slate-500/10 text-slate-400' : ''}
	{variant === 'danger' ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : ''}
	{variant === 'default' ? 'border-white/10 bg-slate-800 text-slate-300' : ''}"
>
	{#if variant === 'public'}
		<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
	{:else}
		<span class="h-1.5 w-1.5 rounded-full 
			{variant === 'unlisted' ? 'bg-cyan-400' : ''}
			{variant === 'private' ? 'bg-slate-400' : ''}
			{variant === 'danger' ? 'bg-rose-400' : ''}
			{variant === 'default' ? 'bg-slate-400' : ''}
		"></span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</span>
