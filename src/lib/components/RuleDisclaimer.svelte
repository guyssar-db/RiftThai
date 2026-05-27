<script lang="ts">
	let {
		compact = false,
		class: className = ''
	}: {
		compact?: boolean;
		class?: string;
	} = $props();
</script>

<div
	class="rounded-lg border border-amber-300/20 bg-amber-300/[0.07] text-amber-100 {compact
		? 'px-3 py-2 text-[11px]'
		: 'p-4 text-sm'} {className}"
>
	<p class="font-bold leading-relaxed">
		ข้อมูลใน RiftThai เป็นสรุปและคำแปลเพื่อช่วยทำความเข้าใจ อาจไม่ถูกต้อง 100%
		สำหรับการตัดสินกฎ การแข่งขัน หรือเคสที่มีผลต่อเกมจริง ควรตรวจสอบกับ
		<a class="underline decoration-amber-200/50 underline-offset-4 hover:text-white" href="https://riftbound.com/" target="_blank" rel="noreferrer">
			Official Rules
		</a>
		และเว็บไซต์ทางการประกอบเสมอ
	</p>
</div>
