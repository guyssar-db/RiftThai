<script lang="ts">
	interface Props {
		message?: string;
		type?: 'success' | 'error' | 'info';
		show?: boolean;
		duration?: number;
		onclose?: () => void;
	}

	let {
		message = '',
		type = 'info',
		show = $bindable(false),
		duration = 2600,
		onclose
	}: Props = $props();

	let timer: number;

	$effect(() => {
		if (show) {
			if (timer) clearTimeout(timer);
			timer = window.setTimeout(() => {
				show = false;
				if (onclose) onclose();
			}, duration);
		}
		return () => {
			if (timer) clearTimeout(timer);
		};
	});
</script>

{#if show}
	<div
		class="rt-toast fixed top-20 right-4 z-[970] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border bg-slate-950/95 text-slate-100 shadow-2xl shadow-black/55 backdrop-blur-xl sm:right-6 
		{type === 'success' ? 'border-emerald-300/30 shadow-emerald-950/20' : ''}
		{type === 'error' ? 'border-rose-300/30 shadow-rose-950/25' : ''}
		{type === 'info' ? 'border-cyan-300/30 shadow-cyan-950/20' : ''}"
		role="status"
		aria-live="polite"
	>
		<div
			class="h-1 
			{type === 'success' ? 'bg-emerald-300' : ''}
			{type === 'error' ? 'bg-rose-300' : ''}
			{type === 'info' ? 'bg-cyan-300' : ''}"
		></div>
		<div
			class="rt-toast-progress 
			{type === 'success' ? 'bg-emerald-300/80' : ''}
			{type === 'error' ? 'bg-rose-300/80' : ''}
			{type === 'info' ? 'bg-cyan-300/80' : ''}"
		></div>
		<div class="flex items-start gap-3 p-4">
			<div
				class="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border 
				{type === 'success' ? 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100' : ''}
				{type === 'error' ? 'border-rose-300/25 bg-rose-300/12 text-rose-100' : ''}
				{type === 'info' ? 'border-cyan-300/25 bg-cyan-300/12 text-cyan-100' : ''}"
			>
				<span
					class="h-2.5 w-2.5 rounded-full 
					{type === 'success' ? 'bg-emerald-300' : ''}
					{type === 'error' ? 'bg-rose-300' : ''}
					{type === 'info' ? 'bg-cyan-300' : ''}"
				></span>
			</div>
			<div class="min-w-0">
				<div
					class="text-[0.65rem] font-black tracking-[0.22em] uppercase 
					{type === 'success' ? 'text-emerald-200' : ''}
					{type === 'error' ? 'text-rose-200' : ''}
					{type === 'info' ? 'text-cyan-200' : ''}"
				>
					{type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'}
				</div>
				<div class="mt-1 text-sm leading-snug font-black text-white">{message}</div>
			</div>
		</div>
	</div>
{/if}
