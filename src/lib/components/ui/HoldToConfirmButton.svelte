<script lang="ts">
	let {
		label = 'Hold to confirm',
		holdingLabel = 'กดค้าง',
		duration = 3000,
		disabled = false,
		onconfirm,
		class: className = ''
	} = $props<{
		label?: string;
		holdingLabel?: string;
		duration?: number;
		disabled?: boolean;
		onconfirm: () => void;
		class?: string;
	}>();

	let progress = $state(0);
	let holding = $state(false);
	let timer: number | undefined;
	let startedAt = 0;

	function stopHolding(reset = true) {
		holding = false;
		if (timer) window.clearInterval(timer);
		timer = undefined;
		if (reset) progress = 0;
	}

	function startHolding() {
		if (disabled || holding) return;
		holding = true;
		startedAt = performance.now();
		progress = 0;
		timer = window.setInterval(() => {
			progress = Math.min(100, ((performance.now() - startedAt) / duration) * 100);
			if (progress >= 100) {
				stopHolding(false);
				onconfirm();
			}
		}, 32);
	}

	$effect(() => () => stopHolding());
</script>

<button
	type="button"
	class="rt-button rt-button-danger relative isolate overflow-hidden {className}"
	{disabled}
	onpointerdown={(event) => {
		event.preventDefault();
		startHolding();
	}}
	onpointerup={() => stopHolding()}
	onpointercancel={() => stopHolding()}
	onpointerleave={() => stopHolding()}
	onkeydown={(event) => {
		if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
			event.preventDefault();
			startHolding();
		}
	}}
	onkeyup={(event) => {
		if (event.key === 'Enter' || event.key === ' ') stopHolding();
	}}
	onblur={() => stopHolding()}
	aria-label={`${label}. Hold for ${duration / 1000} seconds.`}
>
	<span
		class="absolute inset-y-0 left-0 -z-10 bg-rose-300/30 transition-[width] duration-75"
		style:width={`${progress}%`}
		aria-hidden="true"
	></span>
	<span
		>{holding
			? `${holdingLabel}… ${Math.ceil((duration * (1 - progress / 100)) / 1000)} วิ`
			: label}</span
	>
	<span
		class="sr-only"
		role="progressbar"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={Math.round(progress)}
	>
		{Math.round(progress)}%
	</span>
</button>
