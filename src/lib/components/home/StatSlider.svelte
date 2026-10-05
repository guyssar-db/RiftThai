<script lang="ts">
	let {
		label,
		max,
		value = $bindable(null)
	}: { label: string; max: number; value: number | null } = $props();
	let position = $derived(value ?? 0);
	const text = (n: number) => (n === 0 ? 'All' : n === max ? max + '+' : String(n));
</script>

<div class="home-stat-slider">
	<label
		><span>{label}</span><output>{text(position)}</output>
		<input
			type="range"
			min="0"
			{max}
			step="1"
			value={position}
			aria-label={label}
			aria-valuetext={text(position)}
			oninput={(e) => (value = Number(e.currentTarget.value) || null)}
			style:--fill={(position / max) * 100 + '%'}
		/>
	</label>
	<div class="home-slider-ticks">
		{#each Array.from({ length: max + 1 }, (_, i) => i) as n}
			<button
				type="button"
				aria-label={label + ' ' + text(n)}
				aria-pressed={position === n}
				onclick={() => (value = n || null)}>{text(n)}</button
			>
		{/each}
	</div>
</div>
