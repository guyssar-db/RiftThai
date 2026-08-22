<script lang="ts">
	import RuleDisclaimer from '$lib/components/RuleDisclaimer.svelte';
</script>

<footer class="mt-20 border-t border-white/8 bg-slate-950/55 py-10 sm:mt-24 sm:py-14">
	<div class="rt-container grid gap-8 md:grid-cols-[1fr_420px]">
		<div class="space-y-5 text-center md:text-left">
			<div class="font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
				Rift<span class="rt-brand-accent">Thai</span>
			</div>
			<p class="mx-auto max-w-md text-sm leading-relaxed font-medium text-slate-400 md:mx-0">
				โปรเจกต์แปลภาษาไทยสำหรับ Riftbound TCG เพื่อให้ผู้เล่นไทยค้นหาและอ่านการ์ดได้ง่ายขึ้น
			</p>
			<a
				href="/"
				class="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-xs font-black tracking-widest text-white uppercase transition hover:text-cyan-300 focus-visible:ring-4 focus-visible:ring-cyan-300/20 focus-visible:outline-none"
			>
				กลับด้านบน
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
					><path d="m18 15-6-6-6 6" /></svg
				>
			</a>
			<div
				class="flex flex-wrap justify-center gap-4 text-xs font-black tracking-widest text-slate-500 uppercase md:justify-start"
			>
				<a
					class="inline-flex min-h-11 items-center rounded-lg px-2 transition hover:text-cyan-300 focus-visible:ring-4 focus-visible:ring-cyan-300/20 focus-visible:outline-none"
					href="/privacy"
					target="_blank"
					rel="noopener noreferrer">นโยบายความเป็นส่วนตัว</a
				>
				<a
					class="inline-flex min-h-11 items-center rounded-lg px-2 transition hover:text-cyan-300 focus-visible:ring-4 focus-visible:ring-cyan-300/20 focus-visible:outline-none"
					href="/terms"
					target="_blank"
					rel="noopener noreferrer">ข้อกำหนดการใช้งาน</a
				>
				<a
					class="inline-flex min-h-11 items-center rounded-lg px-2 transition hover:text-cyan-300 focus-visible:ring-4 focus-visible:ring-cyan-300/20 focus-visible:outline-none"
					href="/chat">ติดต่อทีมงาน</a
				>
			</div>
		</div>

		<div class="space-y-4">
			<RuleDisclaimer />

			<div class="rt-panel-quiet rounded-xl p-5">
				<div class="mb-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
					ข้อสงวนสิทธิ์
				</div>
				<p class="text-[14px] leading-relaxed font-medium text-slate-500">
					RiftThai ถูกสร้างขึ้นภายใต้นโยบาย "Legal Jibber Jabber" ของ Riot Games
					โดยใช้ทรัพย์สินที่เป็นกรรมสิทธิ์ของ Riot Games<br /> Riot Games ไม่รับรองหรือให้การสนับสนุนโปรเจ็กต์นี้
				</p>
			</div>
		</div>
	</div>
	<div
		class="rt-container mt-10 text-center text-[10px] font-black tracking-widest text-slate-600 uppercase"
	>
		&copy; 2026 ชุมชน RiftThai
	</div>
</footer>
