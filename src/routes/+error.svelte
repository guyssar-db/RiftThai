<script lang="ts">
	import { page } from '$app/stores';

	const titleByStatus: Record<number, string> = {
		400: 'คำขอไม่ถูกต้อง',
		401: 'กรุณาเข้าสู่ระบบ',
		403: 'ไม่มีสิทธิ์เข้าถึง',
		404: 'ไม่พบหน้านี้',
		500: 'เซิร์ฟเวอร์ขัดข้อง'
	};

	let status = $derived($page.status);
	let title = $derived(titleByStatus[status] ?? 'เกิดข้อผิดพลาด');
	let message = $derived(
		status === 404
			? 'ไม่พบหน้าที่ต้องการ หรือ URL อาจถูกย้ายไปแล้ว'
			: status >= 500
				? 'ระบบมีปัญหาชั่วคราว ลองรีเฟรชหรือกลับไปหน้าแรกก่อน'
				: $page.error?.message || 'คำขอนี้ไม่สามารถดำเนินการได้'
	);
</script>

<div class="rt-page-shell flex min-h-dvh items-center px-4 py-12 text-slate-100">
	<div class="mesh-gradient"></div>

	<main class="rt-panel rt-topline mx-auto w-full max-w-2xl overflow-hidden rounded-xl">
		<div class="rt-rule-line p-6 pl-8 sm:p-8 sm:pl-10">
			<p class="rt-kicker mb-3">ข้อผิดพลาดของ RiftThai</p>
			<div class="text-7xl leading-none font-black text-amber-200 italic sm:text-8xl">{status}</div>
			<h1 class="rt-heading mt-4 text-3xl uppercase italic sm:text-5xl">{title}</h1>
			<p class="rt-copy mt-4 text-sm sm:text-base">{message}</p>
		</div>

		<div class="flex flex-wrap gap-3 border-t border-white/10 bg-slate-950/35 p-4">
			<a href="/" class="rt-action">หน้าแรก</a>
			<a
				href="/deck"
				class="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
			>
				เด็ค
			</a>
		</div>
	</main>
</div>
