<script lang="ts">
	import { onMount } from 'svelte';
	import { motionPreferenceKey, reduceMotion } from '$lib/utils/motion';
	let reduced = $state(false);
	onMount(() => { reduced = reduceMotion(); });
	function update() {
		try { localStorage.setItem(motionPreferenceKey, String(reduced)); } catch { /* Session only. */ }
		document.documentElement.dataset.reduceMotion = String(reduced);
		window.dispatchEvent(new Event('riftthai-motion-change'));
	}
</script>

<label class="flex items-center justify-between gap-4 rounded-xl border border-white/10 p-4 text-sm text-slate-200">
	<span>ลดแอนิเมชัน<span class="mt-1 block text-xs text-slate-400">บันทึกสำหรับเบราว์เซอร์นี้</span></span>
	<input type="checkbox" bind:checked={reduced} onchange={update} class="h-5 w-5 accent-cyan-400" />
</label>
