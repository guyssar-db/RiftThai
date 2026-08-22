<script lang="ts">
	let {
		title = 'ไม่พบการ์ด',
		message = 'ไม่พบการ์ดที่ค้นหา ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง',
		showReset = false,
		onreset
	} = $props<{ title?: string; message?: string; showReset?: boolean; onreset?: () => void }>();
</script>

<div class="flex flex-col items-center justify-center gap-6 py-28 text-center">
	<div
		class="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500"
	>
		<svg class="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
			/></svg
		>
	</div>
	<div class="space-y-2 px-4">
		<h3 class="text-2xl font-black tracking-tight text-white uppercase italic sm:text-3xl">
			{title}
		</h3>
		<p class="mx-auto max-w-md text-sm leading-relaxed font-medium text-slate-500">{message}</p>
		{#if showReset && onreset}
			<button type="button" class="rt-button rt-button-primary mt-5" onclick={onreset}
				>ล้างคำค้นหาและตัวกรอง</button
			>
		{/if}
	</div>
</div>
