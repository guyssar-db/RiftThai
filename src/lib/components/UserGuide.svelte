<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let isOpen = $state(false);
	let currentStep = $state(0);

	const steps = [
		{
			title: 'Welcome to RiftThai!',
			titleTh: 'ยินดีต้อนรับสู่ RiftThai!',
			desc: 'เว็บบิลเดอร์และเครื่องมือส่งออกรูปภาพเด็คระดับพรีเมียมสำหรับเกมการ์ด Riftbound จัดเด็คของคุณอย่างง่ายดายและแชร์ให้เพื่อน ๆ ได้ทันที!',
			badge: 'แนะนำ',
			graphic: 'welcome'
		},
		{
			title: 'Start Building Decks',
			titleTh: 'การเริ่มต้นสร้างเด็ค',
			desc: 'กดปุ่ม "New Deck" เพื่อตั้งต้นเด็คของคุณจากศูนย์ หรือวาง "Share Code" ในช่องนำเข้าการ์ด (Import) เพื่อเปิดเด็คที่ผู้อื่นแชร์มาได้ทันทีอย่างรวดเร็ว',
			badge: 'บิลเดอร์',
			graphic: 'start'
		},
		{
			title: 'Standard Deck Constraints',
			titleTh: 'ข้อกำหนดการจัดเด็คมาตรฐาน',
			desc: 'Main Deck จะต้องมี 39 ใบ (ยังไม่รวม Champion อีก 1 ใบ และใส่ซ้ำชื่อเดียวกันได้สูงสุด 3 ใบ) ส่วน Rune Deck สามารถใส่ได้สูงสุด 12 ใบ และ Battlefield จำกัด 1 ใบต่อชื่อ (การ์ดในตำนานอย่าง Baron Pit จะย้ายไปเป็น Token โดยอัติโนมัติ)',
			badge: 'กฎกติกา',
			graphic: 'constraints'
		},
		{
			title: 'New Sideboard Support!',
			titleTh: 'ใหม่! ระบบเด็คสำรอง (Sideboard)',
			desc: 'เพิ่มความยืดหยุ่นในการจัดเด็คด้วยระบบเด็คสำรอง (Sideboard) ใส่การ์ดได้สูงสุด 8 ใบ! โดยจำกัดให้ใส่ได้เฉพาะการ์ด Main Deck เท่านั้น และคิดลิมิตการ์ด 3 ใบต่อชื่อร่วมกับเด็คหลัก',
			badge: 'ฟีเจอร์ใหม่',
			graphic: 'sideboard'
		},
		{
			title: 'Premium PNG Exporter',
			titleTh: 'เครื่องมือส่งออกภาพระดับโปร',
			desc: 'เปลี่ยนเด็คของคุณให้เป็นงานศิลปะส่งออก PNG ความละเอียดสูงได้ทั้งรูปแบบแนวตั้ง (Portrait) และแนวนอน (Landscape) พร้อมระบบหมุนรูป Baron Pit แนวตั้งอัตโนมัติ และลายน้ำพรีเมียม riftthai.guyssar.com',
			badge: 'การส่งออก',
			graphic: 'export'
		},
		{
			title: 'Support RiftThai Developer',
			titleTh: 'ร่วมสนับสนุนผู้พัฒนา RiftThai',
			desc: 'หากคุณชื่นชอบเว็บบิลเดอร์จัดเด็คและระบบฐานข้อมูลนี้ คุณสามารถแวะไปร่วมสนับสนุนค่าโดเมน ค่าเซิร์ฟเวอร์ และเปย์กาแฟเป็นกำลังใจให้ผู้พัฒนาได้ผ่านเมนู "Donate / สนับสนุน" ในแถบเมนูหลักได้เลยครับ! ❤️',
			badge: 'สนับสนุน',
			graphic: 'support'
		}
	];

	onMount(() => {
		if (!browser) return;

		const handleOpenGuide = () => {
			currentStep = 0;
			isOpen = true;
		};
		window.addEventListener('riftthai-open-guide', handleOpenGuide);

		// Check if user has already completed the guide
		const isCompleted = localStorage.getItem('riftthai-guide-completed');
		if (!isCompleted) {
			// Auto open on first visit after a brief delay
			setTimeout(() => {
				isOpen = true;
			}, 1200);
		}

		return () => {
			window.removeEventListener('riftthai-open-guide', handleOpenGuide);
		};
	});

	function closeGuide() {
		isOpen = false;
		if (browser) {
			localStorage.setItem('riftthai-guide-completed', 'true');
		}
	}

	function startGuide() {
		currentStep = 0;
		isOpen = true;
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			currentStep += 1;
		} else {
			closeGuide();
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep -= 1;
		}
	}
</script>

<!-- Floating Help Beacon in bottom-left corner -->
<button
	type="button"
	class="fixed bottom-4 left-4 z-[800] hidden md:flex h-12 items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/92 px-4 text-xs font-black uppercase tracking-widest text-cyan-200 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl transition hover:scale-[1.05] hover:border-cyan-300/60 active:scale-[0.98] sm:bottom-6 sm:left-6"
	onclick={startGuide}
	aria-label="Open User Guide"
>
	<span class="relative flex h-2 w-2">
		<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
		<span class="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
	</span>
	Guide / คู่มือ
</button>

{#if isOpen}
	<div
		class="fixed inset-0 z-[1000] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<!-- Walkthrough Card Container -->
		<div
			class="rt-panel rt-topline relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-950 p-6 shadow-2xl shadow-cyan-950/10 transition-all duration-300 sm:p-8"
		>
			<!-- Header Badge -->
			<div class="flex items-center justify-between gap-4">
				<span class="rounded-full border border-cyan-300/25 bg-cyan-300/12 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-200">
					{steps[currentStep].badge}
				</span>
				<button
					type="button"
					class="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition"
					onclick={closeGuide}
				>
					Skip
				</button>
			</div>

			<!-- Dynamic Visual Graphic Emulator -->
			<div class="relative my-6 flex h-48 w-full items-center justify-center rounded-xl border border-white/5 bg-slate-900/60 overflow-hidden">
				<div class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/5 blur-3xl"></div>
				<div class="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-amber-200/5 blur-3xl"></div>

				{#if steps[currentStep].graphic === 'welcome'}
					<div class="text-center p-4">
						<div class="text-5xl font-black italic text-white drop-shadow">Rift<span class="text-cyan-300">Thai</span></div>
						<div class="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Deckbuilder Companion</div>
					</div>
				{:else if steps[currentStep].graphic === 'start'}
					<div class="flex items-center gap-3">
						<div class="flex h-12 w-28 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-[10px] font-black uppercase tracking-widest text-cyan-100 shadow-md shadow-black/40">
							New Deck
						</div>
						<div class="text-slate-500 font-bold">OR</div>
						<div class="flex h-12 w-28 items-center justify-center rounded-lg border border-white/10 bg-slate-950 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
							[Paste Code]
						</div>
					</div>
				{:else if steps[currentStep].graphic === 'constraints'}
					<div class="grid grid-cols-3 gap-3 w-4/5 text-center">
						<div class="rounded-lg border border-white/10 bg-slate-950 p-2.5">
							<div class="text-lg font-black text-cyan-300">39</div>
							<div class="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Main</div>
						</div>
						<div class="rounded-lg border border-white/10 bg-slate-950 p-2.5">
							<div class="text-lg font-black text-cyan-300">12</div>
							<div class="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Runes</div>
						</div>
						<div class="rounded-lg border border-white/10 bg-slate-950 p-2.5">
							<div class="text-lg font-black text-cyan-300">Max 3</div>
							<div class="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Copies</div>
						</div>
					</div>
				{:else if steps[currentStep].graphic === 'sideboard'}
					<div class="flex flex-col items-center gap-2 text-center">
						<div class="flex items-center gap-2 rounded-lg border border-amber-200/25 bg-amber-300/10 px-4 py-2 font-black uppercase italic text-amber-200">
							Sideboard / 8 Cards
						</div>
						<div class="text-[9px] font-black uppercase tracking-widest text-slate-500">Main + Sideboard Combined Limit Enforced</div>
					</div>
				{:else if steps[currentStep].graphic === 'export'}
					<div class="flex items-center gap-3">
						<div class="relative h-28 w-20 rounded-md border border-cyan-300/30 bg-slate-950/80 p-1 flex flex-col justify-between shadow-xl shadow-cyan-950/20">
							<div class="text-[7px] font-black uppercase tracking-wider text-cyan-300">Portrait</div>
							<div class="h-2 w-full bg-cyan-300/20 rounded-sm"></div>
							<div class="h-2 w-2/3 bg-cyan-300/15 rounded-sm"></div>
						</div>
						<div class="text-slate-600 font-black">&harr;</div>
						<div class="relative h-20 w-28 rounded-md border border-cyan-300/30 bg-slate-950/80 p-1 flex flex-col justify-between shadow-xl shadow-cyan-950/20">
							<div class="text-[7px] font-black uppercase tracking-wider text-cyan-300">Landscape</div>
							<div class="grid grid-cols-2 gap-1 mt-1">
								<div class="h-2 bg-cyan-300/20 rounded-sm"></div>
								<div class="h-2 bg-cyan-300/15 rounded-sm"></div>
							</div>
						</div>
					</div>
				{:else if steps[currentStep].graphic === 'support'}
					<div class="flex flex-col items-center gap-3">
						<div class="relative flex items-center justify-center">
							<div class="absolute inset-0 animate-ping rounded-full bg-rose-500/20 blur-sm"></div>
							<div class="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 shadow-lg shadow-rose-950/20 text-rose-300">
								<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-8 w-8 animate-pulse text-rose-400">
									<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
								</svg>
							</div>
						</div>
						<div class="flex items-center gap-2 rounded-full border border-rose-300/15 bg-rose-300/6 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-rose-200">
							Donate / สนับสนุนผู้พัฒนา
						</div>
					</div>
				{/if}
			</div>

			<!-- Dynamic Guide Content -->
			<div class="min-h-36">
				<div class="text-[10px] font-black uppercase tracking-widest text-slate-500">
					Step {currentStep + 1} of {steps.length}
				</div>
				<h3 class="mt-1 text-2xl font-black uppercase italic text-white drop-shadow">
					{steps[currentStep].titleTh}
				</h3>
				<h4 class="text-xs font-black uppercase tracking-widest text-cyan-300/80 mt-0.5">
					{steps[currentStep].title}
				</h4>
				<p class="mt-3 text-sm font-medium leading-relaxed text-slate-300">
					{steps[currentStep].desc}
				</p>
			</div>

			<!-- Wizard Navigation Controls -->
			<div class="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
				<!-- Prev Button -->
				<button
					type="button"
					class="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-0"
					disabled={currentStep === 0}
					onclick={prevStep}
				>
					Back
				</button>

				<!-- Progress Indicators (Dots) -->
				<div class="flex items-center gap-1.5">
					{#each steps as _, idx}
						<div class="h-1.5 rounded-full transition-all duration-300 {idx === currentStep ? 'w-4 bg-cyan-300' : 'w-1.5 bg-slate-700'}"></div>
					{/each}
				</div>

				<!-- Next / Finish Button -->
				<button
					type="button"
					class="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-300 px-5 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-200 active:scale-[0.98]"
					onclick={nextStep}
				>
					{currentStep === steps.length - 1 ? 'Finish' : 'Next'}
				</button>
			</div>
		</div>
	</div>
{/if}
