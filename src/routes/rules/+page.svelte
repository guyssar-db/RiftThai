<script lang="ts">
	import AppFooter from '$lib/components/AppFooter.svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';

	let activeTab = $state<'overview' | 'setup' | 'types' | 'phases' | 'combat'>('overview');
	let activePhaseStep = $state(0);
	let activeCombatStep = $state(0);

	const tabs = [
		{ id: 'overview', name: 'วิธีเล่นพื้นฐาน', desc: 'เป้าหมายและวิธีชนะ' },
		{ id: 'setup', name: 'การเตรียมเริ่มเกม', desc: 'Game Setup & Mulligan' },
		{ id: 'types', name: 'ประเภทการ์ด', desc: 'ทำความรู้จักการ์ดแต่ละแบบ' },
		{ id: 'phases', name: 'ขั้นตอนการเล่น', desc: 'Turn Structure & Steps' },
		{ id: 'combat', name: 'ระบบการต่อสู้', desc: 'Showdown & Chain' }
	] as const;

	function selectTab(tabId: typeof activeTab) {
		activeTab = tabId;
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<div class="rt-page-shell pb-20 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-white/10 bg-slate-950/82 backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<div class="flex min-w-0 items-center gap-3">
				<a
					href="/"
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25 sm:w-auto sm:px-4"
					aria-label="Back to gallery"
				>
					<svg
						class="h-5 w-5 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					<span class="hidden text-xs font-black tracking-widest uppercase sm:ml-2 sm:block"
						>Back</span
					>
				</a>

				<a
					href="/"
					class="min-w-0 shrink-0 text-xl font-black tracking-tight text-white uppercase italic sm:text-2xl"
				>
					Rift<span class="text-cyan-400">Thai</span>
				</a>
			</div>

			<SiteMenu active="rules" />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10 lg:py-12">
		<!-- Header -->
		<header class="mb-8 border-b border-white/10 pb-6">
			<div>
				<p class="rt-kicker text-cyan-300">How to Play</p>
				<h1 class="rt-heading text-3xl uppercase italic sm:text-5xl lg:text-6xl">
					วิธีเล่นและ <span class="text-cyan-400">กฎกติกา</span>
				</h1>
				<p class="rt-copy mt-3 max-w-2xl text-xs text-slate-400 sm:text-sm">
					สรุปกติกาการเล่นเบื้องต้นของ Riftbound TCG อธิบายโครงสร้างเทิร์น ลำดับเฟส
					และขั้นตอนการเปิดศึกชิงพื้นที่ในกระดานรบ
				</p>
			</div>
		</header>

		<!-- Main Grid -->
		<div class="grid gap-6 lg:grid-cols-[280px_1fr]">
			<!-- Sidenav (Tabs Selector) -->
			<aside class="flex flex-col gap-2">
				<div class="rt-panel hidden flex-col gap-1 p-3 lg:flex">
					<div class="px-2 py-1 text-[9px] font-black tracking-[0.25em] text-slate-500 uppercase">
						Rules Menu
					</div>
					{#each tabs as t}
						<button
							type="button"
							class="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition {activeTab ===
							t.id
								? 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
								: 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}"
							onclick={() => selectTab(t.id)}
						>
							<span class="text-xs font-black tracking-wider uppercase">{t.name}</span>
							<span class="text-[9px] leading-normal font-medium opacity-70">{t.desc}</span>
						</button>
					{/each}
				</div>

				<!-- Mobile Tab Selector -->
				<div class="flex flex-wrap gap-2 lg:hidden">
					{#each tabs as t}
						<button
							type="button"
							class="rounded-full border px-4 py-2 text-xs font-black tracking-wider uppercase transition {activeTab ===
							t.id
								? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
								: 'border-white/10 bg-slate-950/40 text-slate-400 hover:text-white'}"
							onclick={() => selectTab(t.id)}
						>
							{t.name}
						</button>
					{/each}
				</div>
			</aside>

			<!-- Content Panel -->
			<main class="rt-panel rounded-xl bg-slate-950/30 p-5 backdrop-blur-md sm:p-8">
				{#if activeTab === 'overview'}
					<!-- TAB 1: OVERVIEW -->
					<div class="animate-fadeIn space-y-8">
						<section>
							<h2
								class="mb-4 border-b border-white/5 pb-2 text-xl font-black text-white uppercase italic"
							>
								ภาพรวมของเกม Riftbound
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								<strong>Riftbound</strong> คือเกมการ์ดสะสมแนวกลยุทธ์ (Tactical Card Game)
								ที่ผู้เล่นจะต้องจัดเด็คจากโดเมนพลัง (Domain) ต่าง ๆ
								และอัญเชิญยูนิตทหารหรือร่ายเวทมนตร์ลงบนกระดานเพื่อแข่งขันกัน
								<strong>ยึดครองพื้นที่สนามรบ (Battlefields)</strong>
								และทำคะแนนให้ครบตามเป้าหมายของโหมดนั้น ๆ (โหมดแข่งขัน 1v1 Duel คือทำคะแนนให้ครบ
								<strong>8 คะแนน</strong> ก่อนเพื่อชนะเกม)
							</p>
						</section>

						<section class="grid gap-6 md:grid-cols-2">
							<div class="rt-panel bg-white/2 p-5">
								<h3 class="mb-2 text-xs font-black tracking-widest text-cyan-300 uppercase">
									วิธีการชนะและคิดคะแนน
								</h3>
								<ul class="list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-400">
									<li>
										<strong class="text-slate-200">การ Hold (รักษาการควบคุม):</strong> ใน Beginning Phase
										คุณจะ Hold และทำคะแนนจาก Battlefield ที่คุณเป็นผู้ควบคุม ไม่ได้ตัดสินด้วยจำนวนยูนิต
									</li>
									<li>
										<strong class="text-slate-200">การ Conquer (ยึดครอง):</strong> เมื่อผู้เล่นได้
										Control Battlefield ที่ยังไม่ได้ score ในเทิร์นนั้น จะ Conquer และได้สูงสุด
										<strong>1 คะแนน</strong>
									</li>
									<li>
										<strong class="text-slate-200">คะแนนสุดท้าย:</strong> คะแนนชนะจาก Conquer จะได้เมื่อเทิร์นนั้น
										score ครบทุก Battlefield แล้วเท่านั้น หากยังไม่ครบให้จั่ว 1 ใบแทน
									</li>
								</ul>
							</div>
							<div class="rt-panel bg-white/2 p-5">
								<h3 class="mb-2 text-xs font-black tracking-widest text-cyan-300 uppercase">
									พื้นที่บนกระดานรบ (The Board)
								</h3>
								<ul class="list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-400">
									<li>
										<strong class="text-slate-200">Base (ฐาน):</strong> พื้นที่หลังสุดของผู้เล่นแต่ละฝั่ง
										ใช้สำหรับวาง Rune และลง Unit หรือ Gear โดย Gear ปกติจะลงมาในสภาพ Ready ยูนิตใน Base
										ไม่สามารถต่อสู้โดยตรงได้ ต้องสั่งเคลื่อนทัพออกไป
									</li>
									<li>
										<strong class="text-slate-200">Battlefields (สนามรบ):</strong> พื้นที่เลนต่อสู้ตรงกลางที่เป็นจุดชิงชัยระหว่างสองผู้เล่น
										ยูนิตในพื้นที่นี้จะปะทะกันในช่วง Showdown
									</li>
								</ul>
							</div>
						</section>

						<section class="border-t border-white/5 pt-6">
							<h2 class="mb-3 text-xs font-black tracking-widest text-white uppercase italic">
								โครงสร้างการจัดเด็คขั้นพื้นฐาน
							</h2>
							<div class="grid gap-4 text-center sm:grid-cols-3">
								<div
									class="flex flex-col items-center justify-between rounded-lg border border-white/5 bg-slate-900/60 p-4"
								>
									<img
										src="/images/cardback_main.png"
										alt="Main Deck Cardback"
										class="mb-2 h-28 rounded-md object-contain shadow-lg"
									/>
									<div class="text-[10px] font-black text-slate-200 uppercase">Main Deck</div>
									<div class="mt-1 text-[10px] text-slate-500">
										อย่างน้อย 40 ใบ (ใส่ซ้ำชื่อได้สูงสุด 3 ใบ)
									</div>
								</div>
								<div
									class="flex flex-col items-center justify-between rounded-lg border border-white/5 bg-slate-900/60 p-4"
								>
									<img
										src="/images/Cardback_rune.webp"
										alt="Rune Deck Cardback"
										class="mb-2 h-28 rounded-md object-contain shadow-lg"
									/>
									<div class="text-[10px] font-black text-slate-200 uppercase">Rune Deck</div>
									<div class="mt-1 text-[10px] text-slate-500">12 ใบ (แยกทรัพยากร)</div>
								</div>
								<div
									class="flex flex-col items-center justify-between rounded-lg border border-white/5 bg-slate-900/60 p-4"
								>
									<img
										src="/images/Cardback_legend_and_battlefield.webp"
										alt="Legend Cardback"
										class="mb-2 h-28 rounded-md object-contain shadow-lg"
									/>
									<div class="text-[10px] font-black text-slate-200 uppercase">Legend</div>
									<div class="mt-1 text-[10px] text-slate-500">Legend Card</div>
								</div>
							</div>
						</section>
					</div>
				{:else if activeTab === 'setup'}
					<!-- TAB 2: SETUP -->
					<div class="animate-fadeIn space-y-8">
						<section>
							<h2
								class="mb-4 border-b border-white/5 pb-2 text-xl font-black text-white uppercase italic"
							>
								การเตรียมบอร์ดและเริ่มเกม (Game Setup)
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								ก่อนที่การต่อสู้ใน Rift จะเริ่มขึ้น
								ผู้เล่นทั้งสองฝั่งจะต้องเตรียมความพร้อมของทรัพยากรและสนามตามขั้นตอนดังนี้:
							</p>
						</section>

						<div class="relative space-y-6 border-l-2 border-cyan-500/30 pl-6">
							<!-- Setup Step 1 -->
							<div class="relative">
								<div
									class="absolute top-0 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 text-[8px] font-black text-slate-950"
								>
									1
								</div>
								<h3 class="text-xs font-black tracking-wider text-cyan-300 uppercase">
									วางการ์ดฮีโร่ (Place the Heroes)
								</h3>
								<div class="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
									<p>
										• <strong>Champion Legend:</strong> วางการ์ด Legend หงายหน้าในโซน Legend (Legend Zone)
										ประจำฝั่งตนเอง การ์ดใบนี้ทำงานตลอดเวลาและระบุโดเมนสีรูนของเด็คเรา
									</p>
									<p>
										• <strong>Chosen Champion:</strong> ดึงยูนิตแชมเปี้ยนที่ตรงกับเลเจนด์ออกจากเด็คหลัก
										แล้ววางหงายหน้าไว้ในโซนแชมเปี้ยน (Champion Zone) การ์ดใบนี้จะไม่อยู่ในกองการ์ดหลัก
										และพร้อมให้คุณอัญเชิญลงสนามเมื่อจ่ายค่าร่ายทรัพยากรครบถ้วน
									</p>
								</div>
							</div>

							<!-- Setup Step 2 -->
							<div class="relative">
								<div
									class="absolute top-0 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 text-[8px] font-black text-slate-950"
								>
									2
								</div>
								<h3 class="text-xs font-black tracking-wider text-cyan-300 uppercase">
									จัดเตรียมเด็คการ์ด (Prepare the Decks)
								</h3>
								<div class="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
									<p>
										• <strong>Main Deck:</strong> หลังแยก Chosen Champion
										ให้สับการ์ดที่เหลือและวางคว่ำใน Main Deck Zone หากจัดเด็คขั้นต่ำ 40 ใบจะเหลือ
										<strong>39 ใบ</strong>; เด็คสามารถมีมากกว่า 40 ใบได้
									</p>
									<p>
										• <strong>Rune Deck:</strong> สับกองการ์ดรูน <strong>12 ใบ</strong> และวางคว่ำหน้าลงในโซนรูน
										(Rune Zone)
									</p>
									<p>
										• ในการแข่งขันระดับทางการ ให้ยื่นกองการ์ดให้คู่ต่อสู้สับหรือตัด (Cut)
										ก่อนเริ่มเล่น
									</p>
								</div>
							</div>

							<!-- Setup Step 3 -->
							<div class="relative">
								<div
									class="absolute top-0 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 text-[8px] font-black text-slate-950"
								>
									3
								</div>
								<h3 class="text-xs font-black tracking-wider text-cyan-300 uppercase">
									สร้างสนามรบ (Establish the Battlefields)
								</h3>
								<div class="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
									<p>
										• ในโหมด 1v1 Duel ผู้เล่นแต่ละคนสุ่ม Battlefield 1 ใบจาก 3 ใบของตนเอง อีก 2
										ใบจะไม่ใช้ในเกมนี้
									</p>
									<p>
										• นำ Battlefield ที่สุ่มได้ของทั้งสองคนวางพร้อมกันใน Battlefield Zone
										รวมเป็นสนามรบ 2 แห่ง
									</p>
								</div>
							</div>

							<!-- Setup Step 4 -->
							<div class="relative">
								<div
									class="absolute top-0 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 text-[8px] font-black text-slate-950"
								>
									4
								</div>
								<h3 class="text-xs font-black tracking-wider text-cyan-300 uppercase">
									สุ่มหาผู้เล่นเทิร์นแรกและจั่วการ์ด (Determine Turn Order & Draw)
								</h3>
								<div class="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
									<p>
										• สุ่มหาผู้เล่นคนแรก (First Player) โดยการทอยเต๋า หรือคว่ำการ์ด Battlefield
										แล้วสุ่มเลือกขึ้นมาหนึ่งใบ
									</p>
									<p>
										• ผู้เล่นทั้งสองฝั่งจั่วการ์ดเริ่มต้นขึ้นมือคนละ <strong>4 ใบ</strong> จากกอง Main
										Deck ของตนเอง
									</p>
								</div>
							</div>

							<!-- Setup Step 5 -->
							<div class="relative">
								<div
									class="absolute top-0 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 text-[8px] font-black text-slate-950"
								>
									5
								</div>
								<h3 class="text-xs font-black tracking-wider text-cyan-300 uppercase">
									การประเมินมัลลิแกน (Evaluate the Mulligan)
								</h3>
								<div class="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
									<p>
										• เลือกการ์ดบนมือเริ่มต้นได้ <strong>สูงสุด 2 ใบ</strong> แล้วพักไว้ก่อน จากนั้นจั่วทดแทนเท่าจำนวนที่พักไว้
										และค่อย Recycle การ์ดที่พักไว้ลงใต้ Main Deck
									</p>
								</div>
							</div>
						</div>

						<section class="border-t border-white/5 pt-6">
							<h3 class="mb-3 text-xs font-black tracking-widest text-cyan-300 uppercase">
								ความแตกต่างของทรัพยากรในเทิร์นแรก (First Turn Differences)
							</h3>
							<div class="grid gap-4 sm:grid-cols-2">
								<div class="rounded-lg border border-white/5 bg-slate-900/60 p-4">
									<h4 class="text-xs font-black text-white uppercase">
										ผู้เล่นคนแรก (First Player)
									</h4>
									<p class="mt-1 text-[11px] leading-relaxed text-slate-400">
										เริ่มเทิร์นแรกด้วย Start of Turn ตามลำดับ A–D: Awaken, Beginning, Channel Rune 2
										ใบ และจั่วการ์ด 1 ใบใน Draw Step จากนั้นจึงเข้าสู่ Action Phase
									</p>
								</div>
								<div class="rounded-lg border border-white/5 bg-slate-900/60 p-4">
									<h4 class="text-xs font-black text-white uppercase">
										ผู้เล่นคนที่สอง (Second Player)
									</h4>
									<p class="mt-1 text-[11px] leading-relaxed text-slate-400">
										เมื่อเริ่มเทิร์นแรกของตนเอง จะได้สิทธิ์พิเศษชดเชยการเริ่มทีหลัง โดยจะ Channel
										Rune ได้ <strong>3 ใบ</strong> แทน 2 ใบตามปกติ
									</p>
								</div>
							</div>
						</section>
					</div>
				{:else if activeTab === 'types'}
					<!-- TAB 3: CARD TYPES -->
					<div class="animate-fadeIn space-y-8">
						<section>
							<h2
								class="mb-4 border-b border-white/5 pb-2 text-xl font-black text-white uppercase italic"
							>
								ประเภทของการ์ดใน Riftbound
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								ในระหว่างการเล่น ผู้เล่นจะได้อัญเชิญวัตถุต่าง ๆ ลงสู่สนาม
								ซึ่งการ์ดแต่ละประเภทจะมีกฎและการประมวลผลที่เฉพาะตัว ดังนี้:
							</p>
						</section>

						<div class="space-y-4">
							<div
								class="flex flex-col items-start gap-4 rounded-lg border border-white/5 bg-white/2 p-4 sm:flex-row"
							>
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-1"
								>
									<img
										src="/images/icons/champion.avif"
										alt="Champion"
										class="h-4.5 w-4.5 object-contain"
									/>
								</div>
								<div>
									<h3 class="text-xs font-black tracking-wider text-white uppercase">
										Champion & Legend
									</h3>
									<p class="mt-1 text-xs leading-relaxed text-slate-400">
										<strong>Legend Card:</strong> อยู่นอกกองการ์ดปกติ
										ใช้ระบุค่าสเตตัสความปลอดภัยของแชมเปี้ยน และ passive ติดตัว และเป็นตัวระบุ Domain
										Identity (สีรูนที่เราสามารถร่ายได้)<br />
										<strong>Chosen Champion:</strong> แชมเปี้ยนยูนิตเริ่มต้นของเราที่เริ่มเกมในโซนแชมเปี้ยน
										และสามารถนำมาอัปเกรดความสามารถเพิ่มเติมได้
									</p>
								</div>
							</div>

							<div
								class="flex flex-col items-start gap-4 rounded-lg border border-white/5 bg-white/2 p-4 sm:flex-row"
							>
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-500/10 p-1.5"
								>
									<img src="/images/icons/unit.avif" alt="Unit" class="h-7 w-7 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black tracking-wider text-white uppercase">
										Unit (ยูนิตทหาร)
									</h3>
									<p class="mt-1 text-xs leading-relaxed text-slate-400">
										ตัวละครที่จะส่งลงสนามที่ Base เพื่อเดินทัพเข้ายึด Battlefield ยูนิตมีค่า <strong
											>Might (พลังต่อสู้)</strong
										> สามารถสั่งเหนื่อย (Exhaust) เพื่อเดินหน้า ถอยหลัง หรือใช้ความสามารถพิเศษ และสามารถติดดาเมจสะสมได้
									</p>
								</div>
							</div>

							<div
								class="flex flex-col items-start gap-4 rounded-lg border border-white/5 bg-white/2 p-4 sm:flex-row"
							>
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-500/10 p-1.5"
								>
									<img src="/images/icons/gear.avif" alt="Gear" class="h-7 w-7 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black tracking-wider text-white uppercase">
										Gear (การ์ดถาวรประเภทเกียร์)
									</h3>
									<p class="mt-1 text-xs leading-relaxed text-slate-400">
										Gear เป็นการ์ดถาวรที่ปกติจะลงในสภาพ Ready ที่ Base และทำงานตามข้อความบนการ์ด
										เฉพาะ Gear ที่เป็น <strong>Equipment</strong> และมีความสามารถ
										<strong>Equip</strong> เท่านั้นที่สามารถจ่ายค่าความสามารถเพื่อติดกับ Unit ได้ ส่วน
										Gear อื่นจะอยู่บนบอร์ดและทำงานโดยไม่ต้องติดกับ Unit
									</p>
								</div>
							</div>

							<div
								class="flex flex-col items-start gap-4 rounded-lg border border-white/5 bg-white/2 p-4 sm:flex-row"
							>
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10 p-1.5"
								>
									<img src="/images/icons/spell.avif" alt="Spell" class="h-7 w-7 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black tracking-wider text-white uppercase">
										Spell (การ์ดเวทมนตร์)
									</h3>
									<p class="mt-1 text-xs leading-relaxed text-slate-400">
										Spell จะถูกวางบน Chain ให้ผู้เล่นตอบสนองตาม Priority เมื่อ resolve
										แล้วจึงทำตามเอฟเฟกต์และส่งลง Trash โดย Spell ที่มี Reaction
										สามารถเล่นในจังหวะที่กฎอนุญาตระหว่าง Chain ได้
									</p>
								</div>
							</div>
						</div>
					</div>
				{:else if activeTab === 'phases'}
					<!-- TAB 4: TURN PHASES (INTERACTIVE STEPPER) -->
					<div class="animate-fadeIn space-y-8">
						<section>
							<h2
								class="mb-4 border-b border-white/5 pb-2 text-xl font-black text-white uppercase italic"
							>
								ขั้นตอนลำดับเทิร์น (Turn Structure)
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								ในเทิร์นของผู้เล่นหลัก (Turn Player) จะดำเนินตามลำดับขั้นตอนหลัก 3 เฟส
								คลิกเลือกเฟสเพื่อดูลำดับเหตุการณ์และช่วงเวลาเปิดจังหวะร่าย Reaction (Timing
								Windows):
							</p>
						</section>

						<!-- Interactive Phase Stepper Bar -->
						<div class="grid grid-cols-3 gap-2 border-b border-white/10 pb-4">
							<button
								type="button"
								class="flex flex-col items-center justify-center rounded-lg border p-3 text-center transition {activePhaseStep ===
								0
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/5'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
								onclick={() => (activePhaseStep = 0)}
							>
								<span class="text-[10px] font-black uppercase opacity-60">Phase 1</span>
								<span class="mt-1 text-xs font-black uppercase">Start of Turn</span>
							</button>
							<button
								type="button"
								class="flex flex-col items-center justify-center rounded-lg border p-3 text-center transition {activePhaseStep ===
								1
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/5'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
								onclick={() => (activePhaseStep = 1)}
							>
								<span class="text-[10px] font-black uppercase opacity-60">Phase 2</span>
								<span class="mt-1 text-xs font-black uppercase">Action Phase</span>
							</button>
							<button
								type="button"
								class="flex flex-col items-center justify-center rounded-lg border p-3 text-center transition {activePhaseStep ===
								2
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/5'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
								onclick={() => (activePhaseStep = 2)}
							>
								<span class="text-[10px] font-black uppercase opacity-60">Phase 3</span>
								<span class="mt-1 text-xs font-black uppercase">End of Turn</span>
							</button>
						</div>

						<!-- Phase Detail Display Card -->
						<div class="rt-panel space-y-6 rounded-xl border border-white/5 bg-slate-900/40 p-6">
							{#if activePhaseStep === 0}
								<!-- Phase 1: Start of Turn -->
								<div class="animate-fadeIn space-y-4">
									<div class="flex items-center gap-2 text-cyan-300">
										<span class="text-xl">🌅</span>
										<h3 class="text-sm font-black tracking-wider uppercase">
											Start of Turn Phase (ช่วงเริ่มเทิร์น)
										</h3>
									</div>
									<p class="text-xs leading-relaxed text-slate-400">
										เมื่อเริ่มต้นเทิร์น ผู้เล่นจะดำเนินการตามขั้นตอนเรียงลำดับ (Step) แบบอัตโนมัติ
										ห้ามร่ายการ์ดประเภทอื่นจนกว่าจะเคลียร์สเต็ปเหล่านี้เสร็จสิ้น:
									</p>
									<div class="space-y-3 border-l-2 border-cyan-500/30 pl-4">
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>A. Awaken Step (คืนสภาพ):</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												การ์ดทั้งหมดบนบอร์ดฝั่งเรา และการ์ดรูนใน Rune Pool ที่นอนตะแคง (Exhausted)
												จะเปลี่ยนสถานะกลับมาตั้งตรง (Ready) เพื่อพร้อมทำงานอีกครั้ง
											</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>B. Beginning Step (นับแต้มคุมพื้นที่):</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												คุณจะ Hold Battlefield ทุกแห่งที่คุณเป็นผู้ควบคุมใน Beginning Phase และ
												score จากแต่ละแห่งได้ตามกฎ โดยไม่เปรียบเทียบจำนวนยูนิตของสองฝ่าย
											</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>C. Channel Step (เปิดรูนใหม่):</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												จั่วรูน 2 ใบแรกจากกองรูน (Rune Deck)
												หงายหน้าขึ้นสนามเพื่อรับทรัพยากรมาใช้จ่ายร่ายเวทมนตร์และยูนิตในเทิร์นนี้
											</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>D. Draw Step (จั่วการ์ดขึ้นมือ):</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												จั่วการ์ด 1 ใบจาก Main Deck ขึ้นสู่มือ
												รวมถึงผู้เล่นคนแรกในเทิร์นแรกสุดของเกม
											</p>
										</div>
									</div>
									<div
										class="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
									>
										<strong>Timing Warning:</strong> ในช่วงเริ่มต้นเทิร์นนี้ จะยังไม่มีจังหวะในการร่ายการ์ดประเภท
										Spell ปกติ (Sorcery speed) ผู้เล่นต้องรอจนเข้าสู่ Action Phase
									</div>
								</div>
							{:else if activePhaseStep === 1}
								<!-- Phase 2: Action Phase -->
								<div class="animate-fadeIn space-y-4">
									<div class="flex items-center gap-2 text-cyan-300">
										<h3 class="text-sm font-black tracking-wider uppercase">
											Action Phase (ช่วงเวลาทำยุทธการ)
										</h3>
									</div>
									<p class="text-xs leading-relaxed text-slate-400">
										นี่คือเฟสหลักของการเล่น ผู้เล่นหลักสามารถประกาศกระทำแอ็กชัน (Discretionary
										Actions) กี่ครั้งก็ได้ในลำดับใดก็ได้ ตราบใดที่ยังมีค่าจ่ายทรัพยากรเพียงพอ:
									</p>
									<div class="grid gap-3 sm:grid-cols-2">
										<div class="rounded-lg border border-white/5 bg-white/2 p-3">
											<span class="text-[10px] font-black text-slate-200"
												>PLAY A CARD (ร่ายการ์ด)</span
											>
											<p class="mt-1 text-[11px] text-slate-400">
												เล่น Unit หรือ Gear ลงใน Base หรือร่าย Spell เพื่อใช้งานเอฟเฟกต์ โดย
												Equipment สามารถใช้ Equip เพื่อติดกับ Unit ได้ตามข้อความบนการ์ด
											</p>
										</div>
										<div class="rounded-lg border border-white/5 bg-white/2 p-3">
											<span class="text-[10px] font-black text-slate-200"
												>MOVE UNIT (สั่งเคลื่อนทัพ)</span
											>
											<p class="mt-1 text-[11px] text-slate-400">
												สั่งเหนื่อย (Exhaust) ยูนิตเพื่อเดินหน้าขึ้นสนามรบ (Advance) หรือถอยทัพ
												(Retreat)
											</p>
										</div>
										<div class="rounded-lg border border-white/5 bg-white/2 p-3">
											<span class="text-[10px] font-black text-slate-200"
												>SET HIDDEN (หมอบคว่ำหน้า)</span
											>
											<p class="mt-1 text-[11px] text-slate-400">
												การ์ดที่มี Hidden สามารถจ่าย 1 Power เพื่อวางคว่ำใน Facedown Zone ของ
												Battlefield ที่คุณควบคุม แล้วเล่นภายหลังตาม timing ของการ์ด
											</p>
										</div>
										<div class="rounded-lg border border-white/5 bg-white/2 p-3">
											<span class="text-[10px] font-black text-slate-200"
												>INITIATE SHOWDOWN (เปิดศึกตัดสิน)</span
											>
											<p class="mt-1 text-[11px] text-slate-400">
												Standard Move ยูนิตหนึ่งใบหรือหลายใบพร้อมกันไป Battlefield เดียวกัน
												หากยูนิตฝ่ายตรงข้ามอยู่ร่วมสนามจะ stage Combat; การ Move
												ไปสนามว่างที่ยังไม่มีผู้ควบคุมจะ stage Non-Combat Showdown และ Spell หรือ
												effect อื่นก็ทำให้เกิด Combat ได้
											</p>
										</div>
									</div>
									<div
										class="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-300"
									>
										💬 <strong>Priority:</strong> เมื่อเกิด Chain ผู้เล่นผลัดกันรับ Priority
										และตอบด้วยการ์ดหรือ ability ที่มี timing ถูกต้อง เช่น <strong>Reaction</strong> ไม่ใช่การ์ดหรือ
										ability ทุกชนิดจะเล่นแทรกได้เสมอ
									</div>
								</div>
							{:else}
								<!-- Phase 3: End of Turn -->
								<div class="animate-fadeIn space-y-4">
									<div class="flex items-center gap-2 text-cyan-300">
										<span class="text-xl">🌙</span>
										<h3 class="text-sm font-black tracking-wider uppercase">
											End of Turn Phase (ช่วงจบเทิร์น)
										</h3>
									</div>
									<p class="text-xs leading-relaxed text-slate-400">
										เมื่อผู้เล่นหลักไม่มีแอ็กชันให้ทำและประกาศจบเทิร์น
										กระบวนการเคลียร์บอร์ดตามลำดับจะทำงานเพื่อส่งมอบเทิร์น:
									</p>
									<div class="space-y-3 border-l-2 border-cyan-500/30 pl-4">
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>1. End Step Triggers:</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												เอฟเฟกต์การ์ดที่ระบุคำว่า "At the end of turn..."
												จะทริกเกอร์และเคลียร์ผลลัพธ์ในขั้นตอนนี้
											</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>2. Global Heal (ล้างแผลสะสม):</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												นำ Damage Counters ทั้งหมดออกจากยูนิตทุกตัวที่เหลืออยู่บนกระดาน
											</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase"
												>3. Resource Decay (พลังงานสลาย):</span
											>
											<p class="mt-0.5 text-xs text-slate-300">
												ล้างค่าพลังงาน Energy และพลังรูนที่เหลืออยู่ทั้งหมดในรูนพูลให้กลายเป็นศูนย์
												(สะสมข้ามเทิร์นไม่ได้)
											</p>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'combat'}
					<!-- TAB 5: COMBAT & CHAIN (INTERACTIVE STEPPER) -->
					<div class="animate-fadeIn space-y-8">
						<section>
							<h2
								class="mb-4 border-b border-white/5 pb-2 text-xl font-black text-white uppercase italic"
							>
								ระบบการต่อสู้ (Combat Showdown)
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								Combat เกิดเมื่อยูนิตของผู้เล่นฝ่ายตรงข้ามอยู่ที่ Battlefield เดียวกัน
								ซึ่งอาจเกิดจาก Standard Move, การเล่น Unit, Spell หรือ effect อื่น ส่วนการ Move ไป
								Battlefield ว่างที่ยังไม่มีผู้ควบคุมจะเกิด Non-Combat Showdown:
							</p>
						</section>

						<!-- Horizontal Combat Timeline -->
						<div class="relative flex flex-col justify-between gap-2 pb-2 md:flex-row md:gap-4">
							<button
								type="button"
								class="flex-1 rounded-lg border p-3 text-left transition md:text-center {activeCombatStep ===
								0
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:text-slate-200'}"
								onclick={() => (activeCombatStep = 0)}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 1</span>
								<span class="text-xs font-black">Showdown Window</span>
							</button>
							<button
								type="button"
								class="flex-1 rounded-lg border p-3 text-left transition md:text-center {activeCombatStep ===
								1
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:text-slate-200'}"
								onclick={() => (activeCombatStep = 1)}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 2</span>
								<span class="text-xs font-black">Assign Might Damage</span>
							</button>
							<button
								type="button"
								class="flex-1 rounded-lg border p-3 text-left transition md:text-center {activeCombatStep ===
								2
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:text-slate-200'}"
								onclick={() => (activeCombatStep = 2)}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 3</span>
								<span class="text-xs font-black">Cleanup & Deathknell</span>
							</button>
							<button
								type="button"
								class="flex-1 rounded-lg border p-3 text-left transition md:text-center {activeCombatStep ===
								3
									? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-lg'
									: 'border-white/5 bg-slate-900/30 text-slate-400 hover:text-slate-200'}"
								onclick={() => (activeCombatStep = 3)}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 4</span>
								<span class="text-xs font-black">Contested Result</span>
							</button>
						</div>

						<!-- Combat Details Display Card -->
						<div class="rt-panel space-y-4 rounded-xl border border-white/5 bg-slate-900/40 p-6">
							{#if activeCombatStep === 0}
								<div class="animate-fadeIn space-y-2">
									<h3 class="text-sm font-black text-cyan-300">
										Step 1: Showdown Window (ช่วงเล่นการ์ดก่อนปะทะ)
									</h3>
									<p class="text-xs leading-relaxed text-slate-300">
										ผู้เล่นผลัดกันได้รับ Focus และ Priority เพื่อเล่นการ์ดหรือใช้ ability ที่มี <strong
											>Action</strong
										>
										หรือ <strong>Reaction</strong> ตาม timing รวมถึงเล่นการ์ด Hidden ที่ถูกต้อง เมื่อทุกคนผ่าน
										Focus โดยไม่ทำ action เพิ่ม Showdown จะปิดและเข้าสู่ Combat Damage
									</p>
								</div>
							{:else if activeCombatStep === 1}
								<div class="animate-fadeIn space-y-2">
									<h3 class="text-sm font-black text-cyan-300">
										Step 2: Assign Might Damage (คำนวณชนดาเมจ)
									</h3>
									<p class="text-xs leading-relaxed text-slate-300">
										รวม Might ปัจจุบันของแต่ละฝ่าย จากนั้น Attacker assign damage ก่อนและ Defender
										assign damage ถัดมา การ assign ยังไม่ใช่การทำดาเมจ เมื่อทั้งสองฝ่าย assign
										เสร็จจึง deal damage พร้อมกันตามลำดับดังนี้:
									</p>
									<ol class="list-decimal space-y-1.5 pl-5 text-xs text-slate-400">
										<li>
											<strong class="text-slate-200">Tank:</strong> ต้อง assign damage ให้ยูนิตที่มี Tank
											ก่อน
										</li>
										<li>
											<strong class="text-slate-200">Unit ปกติ:</strong> เมื่อจัดการ Tank ครบแล้ว จึง
											assign damage ให้ยูนิตที่ไม่มี Tank และไม่มี Backline
										</li>
										<li>
											<strong class="text-slate-200">Backline:</strong> assign damage เป็นลำดับสุดท้าย
											หลังจากไม่มี Tank หรือ Unit ปกติให้เลือกแล้ว
										</li>
									</ol>
									<p class="text-xs leading-relaxed text-slate-300">
										เมื่อเลือกยูนิตแล้วต้อง assign <strong>lethal damage</strong> ให้เพียงพอก่อนจึงกระจายส่วนเกินไปตัวถัดไป
										เว้นแต่ effect เปลี่ยนกฎนี้ จากนั้นบันทึก damage ที่ deal เป็น Damage Counters บนยูนิต
									</p>
								</div>
							{:else if activeCombatStep === 2}
								<div class="animate-fadeIn space-y-2">
									<h3 class="text-sm font-black text-cyan-300">
										Step 3: Cleanup & Deathknell (เก็บกวาดสุสาน)
									</h3>
									<p class="text-xs leading-relaxed text-slate-300">
										เริ่ม Combat Cleanup โดยตรวจยูนิตที่มี Damage Counters เท่ากับหรือมากกว่า Might:
										บันทึกและ trigger Deathknell ก่อน จากนั้นจึง kill ยูนิตเหล่านั้นและส่งลง Trash
									</p>
									<p class="text-xs text-slate-300">
										หลังจัดการยูนิตที่ตาย ให้ <strong>Heal ยูนิตทุกตัว</strong> บนกระดาน หาก Defender
										ยังอยู่ ให้ Recall Attacker ที่ยังอยู่ใน Battlefield กลับ Base แล้วจึง Determine Combat
										Result
									</p>
								</div>
							{:else}
								<div class="animate-fadeIn space-y-2">
									<h3 class="text-sm font-black text-cyan-300">
										Step 4: Contested Result (เช็กการพิชิตสนามรบ)
									</h3>
									<p class="text-xs leading-relaxed text-slate-300">
										หากทั้งสองฝ่ายยังมียูนิตอยู่หลัง Combat Cleanup จะเป็น <strong>No Result</strong
										> และ stage Combat รอบใหม่ หากทั้งสองฝ่ายไม่เหลือยูนิตจะเป็น No Result เช่นกัน
									</p>
									<p class="text-xs leading-relaxed text-slate-300">
										หากไม่มี Showdown หรือ Combat staged และเหลือยูนิตของผู้เล่นเพียงฝ่ายเดียว
										ผู้เล่นคนนั้นจะได้ Control Battlefield ไม่ว่าจะเป็น Attacker หรือ Defender และจะ <strong
											>Conquer</strong
										> หากยังไม่ได้ score Battlefield นี้ในเทิร์นนั้น
									</p>
									<p class="text-xs text-slate-500">
										*หมายเหตุ:* ยูนิตที่พิชิตสำเร็จจะยังคงยืนตำแหน่งอยู่ที่ Battlefield
										เลนนั้นต่อเพื่อป้องกันศึกในรอบถัดไป
									</p>
								</div>
							{/if}
						</div>

						<section class="border-t border-white/5 pt-6">
							<h3 class="mb-2 text-xs font-black tracking-widest text-white uppercase italic">
								ระบบ Chain และการตอบสนอง (Reaction)
							</h3>
							<p class="text-xs leading-relaxed text-slate-400">
								เมื่อเล่นการ์ดหรือ activate ability ที่ใช้ Chain รายการนั้นจะเข้า <strong
									>Chain (ลูกโซ่)</strong
								>
								ผู้เล่นผลัดกันรับ Priority และอาจตอบด้วยการ์ดหรือ ability ที่มี
								<strong>Reaction</strong> ตาม timing จากนั้น resolve รายการใหม่สุดก่อน (Last-in, First-out)
							</p>
						</section>
					</div>
				{/if}
			</main>
		</div>
	</main>

	<!-- Spacer & Footer -->
	<div class="h-20"></div>
	<AppFooter />
</div>

<style>
	/* Subtle transition animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
