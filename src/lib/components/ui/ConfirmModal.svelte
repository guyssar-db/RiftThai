<script lang="ts">
	interface Props {
		open?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		confirmType?: 'primary' | 'danger';
		onconfirm: () => void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		title = 'Confirm action',
		message = 'Are you sure you want to perform this action?',
		confirmText = 'Confirm / ยืนยัน',
		cancelText = 'ยกเลิก',
		confirmType = 'primary',
		onconfirm,
		oncancel
	}: Props = $props();

	function close() {
		open = false;
		if (oncancel) oncancel();
	}

	function handleConfirm() {
		open = false;
		onconfirm();
	}
</script>

{#if open}
	<!-- Overlay Backdrop -->
	<div
		class="fixed inset-0 z-[1000] grid place-items-center bg-[#030712]/80 p-4 backdrop-blur-md transition-opacity duration-200"
	>
		<!-- Modal Container -->
		<div
			class="rt-panel animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] duration-200"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-white/5 px-5 py-4">
				<div>
					<div class="text-xs font-black tracking-[0.22em] text-cyan-300 uppercase">{title}</div>
				</div>
				<button
					type="button"
					class="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none"
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

			<!-- Message body -->
			<div class="px-5 py-6">
				<p class="text-sm leading-relaxed font-semibold whitespace-pre-line text-slate-300">
					{message}
				</p>
			</div>

			<!-- Actions Footer -->
			<div class="flex justify-end gap-3 border-t border-white/5 bg-slate-950/40 px-5 py-4">
				<button
					type="button"
					class="h-10 cursor-pointer rounded-lg border border-white/10 bg-slate-950 px-4 text-xs font-black tracking-widest text-slate-400 uppercase transition hover:bg-white/5 hover:text-white focus:outline-none"
					onclick={close}
				>
					{cancelText}
				</button>
				<button
					type="button"
					class="h-10 cursor-pointer rounded-lg px-5 text-xs font-black tracking-widest uppercase transition focus:outline-none {confirmType ===
					'danger'
						? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-400'
						: 'bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:bg-cyan-200'}"
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
