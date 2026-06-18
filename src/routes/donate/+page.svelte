<script lang="ts">
	import SiteMenu from '$lib/components/SiteMenu.svelte';

	const supportItems = [
		{
			title: 'Server & Domain',
			detail: 'ช่วยค่า hosting, domain และ service ฝั่ง backend ที่ใช้กับระบบค้นหา เด็ค และหน้าเครื่องมือต่าง ๆ',
			value: 'Online'
		},
		{
			title: 'Thai Data',
			detail: 'ช่วยดูแลคำแปลไทย ชื่อการ์ด คีย์เวิร์ด รายละเอียดกฎ และข้อมูลที่ต้องอัปเดตตามชุดใหม่',
			value: 'Accurate'
		},
		{
			title: 'Community Tools',
			detail: 'ช่วยต่อยอด deck builder, export PNG, share code, FAQ และฟีเจอร์ที่ทำให้ผู้เล่นใช้งานง่ายขึ้น',
			value: 'Useful'
		}
	];

	const donateSteps = [
		'สแกน QR PromptPay',
		'ใส่จำนวนเงินที่ต้องการสนับสนุน'
	];
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<div class="flex min-w-0 items-center gap-3">
				<a
					href="/"
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/5 text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/25 sm:w-auto sm:px-4"
					aria-label="Back to home"
				>
					<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="m15 18-6-6 6-6" />
					</svg>
					<span class="hidden text-xs font-black uppercase tracking-widest sm:ml-2 sm:block">Back</span>
				</a>

				<a href="/" class="shrink-0 text-xl font-black uppercase italic text-white sm:text-2xl">
					Rift<span class="text-cyan-300">Thai</span>
				</a>
			</div>
			<SiteMenu active="donate" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline rt-scanline relative mb-6 overflow-hidden rounded-xl">
			<div class="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl"></div>
			<div class="pointer-events-none absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl"></div>

			<div class="rt-rule-line relative grid gap-6 p-5 pl-7 sm:p-7 sm:pl-9 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
				<div class="min-w-0">
					<p class="rt-kicker mb-3">Support RiftThai</p>
					<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">Donate</h1>
					<p class="rt-copy mt-3 max-w-2xl text-sm sm:text-base">
						ถ้าเว็บนี้ช่วยให้ค้นหาการ์ด อ่านคำแปลไทย หรือจัดเด็คได้ง่ายขึ้น สามารถสนับสนุนค่าใช้จ่ายของเว็บได้จาก QR ด้านล่าง
					</p>
				</div>

				<div class="rounded-xl border border-white/10 bg-black/25 p-4">
					<p class="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Current Mode</p>
					<div class="mt-3 text-2xl font-black uppercase italic text-white">Donate Only</div>
					<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
						ตอนนี้เป็นการสนับสนุนเว็บโดยตรง ยังไม่ใช่ระบบเติมเงินหรือปลดล็อกฟีเจอร์
					</p>
				</div>
			</div>
		</header>

		<section class="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
			<aside class="rt-panel rt-topline overflow-hidden rounded-xl">
				<div class="border-b border-white/10 p-5 sm:p-6">
					<p class="rt-kicker mb-3">Quick Support</p>
					<h2 class="text-2xl font-black uppercase italic text-white">PromptPay / QR</h2>
					<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
						สแกน QR เพื่อสนับสนุน RiftThai ได้โดยตรง จำนวนเงินเลือกได้ตามสะดวก
					</p>
				</div>

				<div class="grid place-items-center bg-slate-950/45 p-6 text-center">
					<div class="rounded-2xl border border-cyan-300/15 bg-cyan-300/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
						<div
							class="donate-qr-frame shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white p-1.5"
						>
							<img
								src="/images/PromptPay.jfif"
								alt="PromptPay QR สำหรับสนับสนุน RiftThai"
								class="rounded object-contain"
								style="width: 100%; height: 100%; display: block;"
								loading="eager"
							/>
						</div>
					</div>

					<div class="mt-5 w-full rounded-lg border border-white/10 bg-black/25 p-4 text-left">
						<div class="text-sm font-black text-white">วิธีสนับสนุน</div>
						<ol class="mt-3 space-y-2">
							{#each donateSteps as step, index}
								<li class="flex gap-3 text-sm font-semibold leading-relaxed text-slate-400">
									<span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-300/12 text-xs font-black text-cyan-100">
										{index + 1}
									</span>
									<span>{step}</span>
								</li>
							{/each}
						</ol>
					</div>
				</div>
			</aside>

			<div class="space-y-5">
				<section class="grid gap-3 md:grid-cols-3">
					{#each supportItems as item}
						<article class="rt-panel rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/25">
							<div class="flex items-start justify-between gap-3">
								<h3 class="text-lg font-black uppercase italic text-white">{item.title}</h3>
								<span class="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-cyan-100">
									{item.value}
								</span>
							</div>
							<p class="mt-3 text-sm font-semibold leading-relaxed text-slate-400">{item.detail}</p>
						</article>
					{/each}
				</section>

				<section class="rt-panel rounded-xl p-5 sm:p-6">
					<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="rt-kicker mb-3">Transparency</p>
							<h2 class="text-2xl font-black uppercase italic text-white">เงินสนับสนุนเอาไปทำอะไร</h2>
						</div>
						<a href="/chat" class="rt-action w-fit">Send Feedback</a>
					</div>

					<div class="mt-5 grid gap-3 sm:grid-cols-2">
						<div class="rounded-lg border border-white/10 bg-black/20 p-4">
							<div class="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Maintain</div>
							<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
								ดูแลเว็บให้ใช้งานได้ต่อเนื่อง แก้ปัญหารูปไม่โหลด ปรับ performance และจัดการข้อมูลที่เปลี่ยนตาม official source
							</p>
						</div>
						<div class="rounded-lg border border-white/10 bg-black/20 p-4">
							<div class="text-sm font-black uppercase tracking-[0.2em] text-orange-200">Build</div>
							<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
								เพิ่มฟีเจอร์ที่ผู้เล่นใช้จริง เช่น หน้า deck detail, export ภาพ, import/share deck และ Q&A ภาษาไทย
							</p>
						</div>
					</div>
				</section>

				<section class="rt-panel rounded-xl p-5 sm:p-6">
					<p class="rt-kicker mb-3">Note</p>
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-lg border border-amber-300/20 bg-amber-300/8 p-4">
							<div class="text-lg font-black uppercase italic text-amber-100">Manual Donate</div>
							<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
								ระบบนี้ยังไม่มี webhook ตรวจยอดอัตโนมัติ ถ้าต้องตรวจสอบรายการย้อนหลังให้ใช้สลิปเป็นหลัก
							</p>
						</div>
						<a
							href="/deck"
							class="rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/8"
						>
							<div class="text-lg font-black uppercase italic text-white">Share Decks</div>
							<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
								อีกวิธีช่วยเว็บคือแชร์เด็คและ feedback เพื่อให้เครื่องมือดีขึ้นสำหรับผู้เล่นคนอื่น
							</p>
						</a>
					</div>
				</section>
			</div>
		</section>
	</main>
</div>

<style>
	.donate-qr-frame {
		width: 180px;
		height: 180px;
	}

	@media (min-width: 1024px) {
		.donate-qr-frame {
			width: 250px;
			height: 250px;
		}
	}
</style>
