<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		subtitle?: string;
		onclose?: () => void;
		children?: Snippet;
	}

	let {
		open = $bindable(false),
		title = '',
		subtitle = '',
		onclose,
		children
	}: Props = $props();

	function close() {
		open = false;
		if (onclose) onclose();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[950] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
		<div class="rt-panel w-full max-w-sm overflow-hidden rounded-xl shadow-2xl shadow-black/50">
			<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
				<div>
					{#if title}
						<div class="text-xs font-black tracking-[0.22em] text-cyan-300 uppercase">{title}</div>
					{/if}
					{#if subtitle}
						<div class="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{subtitle}</div>
					{/if}
				</div>
				<button
					type="button"
					class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 cursor-pointer"
					aria-label="Close popup"
					onclick={close}
				>
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
					>
						<path d="M6 18 18 6" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>

			<div class="p-4">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}
