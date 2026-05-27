<script lang="ts">
	import RuleDisclaimer from '$lib/components/RuleDisclaimer.svelte';
</script>

<footer class="mt-20 border-t border-white/10 bg-slate-950/70 py-12 backdrop-blur-2xl sm:mt-28 sm:py-16">
	<div class="rt-container grid gap-8 md:grid-cols-[1fr_420px]">
		<div class="space-y-5 text-center md:text-left">
			<div class="text-4xl font-black uppercase italic tracking-tight text-white">
				Rift<span class="text-cyan-400">Thai</span>
			</div>
			<p class="mx-auto max-w-md text-sm font-medium leading-relaxed text-slate-400 md:mx-0">
				โปรเจกต์แปลภาษาไทยสำหรับ Riftbound TCG เพื่อให้ผู้เล่นไทยค้นหาและอ่านการ์ดได้ง่ายขึ้น
			</p>
			<a href="/" class="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:text-cyan-300">
				Back to top
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m18 15-6-6-6 6" /></svg>
			</a>
			<div class="flex flex-wrap justify-center gap-4 text-xs font-black uppercase tracking-widest text-slate-500 md:justify-start">
				<a class="transition hover:text-cyan-300" href="/privacy">Privacy Policy</a>
				<a class="transition hover:text-cyan-300" href="/terms">Terms</a>
				<a class="transition hover:text-cyan-300" href="/chat">Support</a>
			</div>
		</div>

		<div class="space-y-4">
			<RuleDisclaimer />

			<div class="rt-panel-quiet rounded-xl p-5">
				<div class="mb-3 text-[16px] font-black uppercase tracking-widest text-slate-500">Legal Disclaimer</div>
				<p class="text-[14px] font-medium leading-relaxed text-slate-500">
					RiftThai ถูกสร้างขึ้นภายใต้นโยบาย "Legal Jibber Jabber" ของ Riot Games โดยใช้ทรัพย์สินที่เป็นกรรมสิทธิ์ของ Riot Games<br> Riot Games ไม่รับรองหรือให้การสนับสนุนโปรเจ็กต์นี้
				</p>
			</div>
		</div>
	</div>
	<div class="rt-container mt-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
		&copy; 2026 RiftThai Community
	</div>
</footer>
