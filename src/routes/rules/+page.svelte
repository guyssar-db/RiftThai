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
					<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="m15 18-6-6 6-6" />
					</svg>
					<span class="hidden text-xs font-black uppercase tracking-widest sm:ml-2 sm:block">Back</span>
				</a>

				<a href="/" class="min-w-0 shrink-0 text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl">
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
				<p class="rt-copy mt-3 max-w-2xl text-xs sm:text-sm text-slate-400">
					สรุปกติกาการเล่นเบื้องต้นของ Riftbound TCG อธิบายโครงสร้างเทิร์น ลำดับเฟส และขั้นตอนการเปิดศึกชิงพื้นที่ในกระดานรบ
				</p>
			</div>
		</header>

		<!-- Main Grid -->
		<div class="grid gap-6 lg:grid-cols-[280px_1fr]">
			<!-- Sidenav (Tabs Selector) -->
			<aside class="flex flex-col gap-2">
				<div class="rt-panel hidden flex-col gap-1 p-3 lg:flex">
					<div class="px-2 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
						Rules Menu
					</div>
					{#each tabs as t}
						<button
							type="button"
							class="w-full text-left rounded-lg px-3 py-2.5 transition flex flex-col gap-0.5 {activeTab === t.id
								? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
								: 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}"
							onclick={() => selectTab(t.id)}
						>
							<span class="text-xs font-black uppercase tracking-wider">{t.name}</span>
							<span class="text-[9px] font-medium opacity-70 leading-normal">{t.desc}</span>
						</button>
					{/each}
				</div>

				<!-- Mobile Tab Selector -->
				<div class="flex flex-wrap gap-2 lg:hidden">
					{#each tabs as t}
						<button
							type="button"
							class="rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition border {activeTab === t.id
								? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300'
								: 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-white'}"
							onclick={() => selectTab(t.id)}
						>
							{t.name}
						</button>
					{/each}
				</div>
			</aside>

			<!-- Content Panel -->
			<main class="rt-panel rounded-xl p-5 sm:p-8 bg-slate-950/30 backdrop-blur-md">
				{#if activeTab === 'overview'}
					<!-- TAB 1: OVERVIEW -->
					<div class="space-y-8 animate-fadeIn">
						<section>
							<h2 class="text-xl font-black text-white uppercase italic border-b border-white/5 pb-2 mb-4">
								ภาพรวมของเกม Riftbound
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								<strong>Riftbound</strong> คือเกมการ์ดสะสมแนวกลยุทธ์ (Tactical Card Game) ที่ผู้เล่นจะต้องจัดเด็คจากโดเมนพลัง (Domain) ต่าง ๆ และอัญเชิญยูนิตทหารหรือร่ายเวทมนตร์ลงบนกระดานเพื่อแข่งขันกัน <strong>ยึดครองพื้นที่สนามรบ (Battlefields)</strong> และทำคะแนนให้ครบตามเป้าหมายของโหมดนั้น ๆ (โหมดแข่งขัน 1v1 Duel คือทำคะแนนให้ครบ <strong>8 คะแนน</strong> ก่อนเพื่อชนะเกม)
							</p>
						</section>

						<section class="grid gap-6 md:grid-cols-2">
							<div class="rt-panel p-5 bg-white/2">
								<h3 class="text-xs font-black uppercase tracking-widest text-cyan-300 mb-2">วิธีการชนะและคิดคะแนน</h3>
								<ul class="space-y-2 text-xs text-slate-400 leading-relaxed list-disc pl-4">
									<li><strong class="text-slate-200">การ Hold (คุมเลน):</strong> ในช่วงเริ่มเทิร์นของคุณ (Beginning Phase) หากคุณมียูนิตใน Battlefield นั้นมากกว่าฝ่ายตรงข้าม คุณจะได้ <strong>1 คะแนน</strong></li>
									<li><strong class="text-slate-200">การ Conquer (ยึดเลน):</strong> เมื่อสิ้นสุดศึกต่อสู้ (Showdown) หากยูนิตฝ่ายเราล้างสนามศัตรูในเลนนั้นจนว่าง และเรามียูนิตที่เหลือรอดอยู่อย่างน้อย 1 ตัว เราจะได้ <strong>1 คะแนน</strong> ทันที</li>
								</ul>
							</div>
							<div class="rt-panel p-5 bg-white/2">
								<h3 class="text-xs font-black uppercase tracking-widest text-cyan-300 mb-2">พื้นที่บนกระดานรบ (The Board)</h3>
								<ul class="space-y-2 text-xs text-slate-400 leading-relaxed list-disc pl-4">
									<li><strong class="text-slate-200">Base (ฐาน):</strong> พื้นที่หลังสุดของผู้เล่นแต่ละฝั่ง ใช้สำหรับวาง Rune และลง Unit หรือ Gear โดย Gear ปกติจะลงมาในสภาพ Ready ยูนิตใน Base ไม่สามารถต่อสู้โดยตรงได้ ต้องสั่งเคลื่อนทัพออกไป</li>
									<li><strong class="text-slate-200">Battlefields (สนามรบ):</strong> พื้นที่เลนต่อสู้ตรงกลางที่เป็นจุดชิงชัยระหว่างสองผู้เล่น ยูนิตในพื้นที่นี้จะปะทะกันในช่วง Showdown</li>
								</ul>
							</div>
						</section>

						<section class="border-t border-white/5 pt-6">
							<h2 class="text-xs font-black uppercase tracking-widest text-white italic mb-3">โครงสร้างการจัดเด็คขั้นพื้นฐาน</h2>
							<div class="grid gap-4 sm:grid-cols-3 text-center">
								<div class="p-4 bg-slate-900/60 rounded-lg border border-white/5 flex flex-col items-center justify-between">
									<img src="/images/cardback_main.png" alt="Main Deck Cardback" class="h-28 object-contain rounded-md mb-2 shadow-lg" />
									<div class="text-[10px] font-black text-slate-200 uppercase">Main Deck</div>
									<div class="text-[10px] text-slate-500 mt-1">อย่างน้อย 40 ใบ (ใส่ซ้ำชื่อได้สูงสุด 3 ใบ)</div>
								</div>
								<div class="p-4 bg-slate-900/60 rounded-lg border border-white/5 flex flex-col items-center justify-between">
									<img src="/images/Cardback_rune.webp" alt="Rune Deck Cardback" class="h-28 object-contain rounded-md mb-2 shadow-lg" />
									<div class="text-[10px] font-black text-slate-200 uppercase">Rune Deck</div>
									<div class="text-[10px] text-slate-500 mt-1">12 ใบ (แยกทรัพยากร)</div>
								</div>
								<div class="p-4 bg-slate-900/60 rounded-lg border border-white/5 flex flex-col items-center justify-between">
									<img src="/images/Cardback_legend_and_battlefield.webp" alt="Legend Cardback" class="h-28 object-contain rounded-md mb-2 shadow-lg" />
									<div class="text-[10px] font-black text-slate-200 uppercase">Legend</div>
									<div class="text-[10px] text-slate-500 mt-1">Legend Card</div>
								</div>
							</div>
						</section>
					</div>
				{:else if activeTab === 'setup'}
					<!-- TAB 2: SETUP -->
					<div class="space-y-8 animate-fadeIn">
						<section>
							<h2 class="text-xl font-black text-white uppercase italic border-b border-white/5 pb-2 mb-4">
								การเตรียมบอร์ดและเริ่มเกม (Game Setup)
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								ก่อนที่การต่อสู้ใน Rift จะเริ่มขึ้น ผู้เล่นทั้งสองฝั่งจะต้องเตรียมความพร้อมของทรัพยากรและสนามตามขั้นตอนดังนี้:
							</p>
						</section>

						<div class="relative pl-6 border-l-2 border-cyan-500/30 space-y-6">
							<!-- Setup Step 1 -->
							<div class="relative">
								<div class="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950">1</div>
								<h3 class="text-xs font-black uppercase text-cyan-300 tracking-wider">วางการ์ดฮีโร่ (Place the Heroes)</h3>
								<div class="text-xs text-slate-400 leading-relaxed mt-1.5 space-y-1">
									<p>• <strong>Champion Legend:</strong> วางการ์ด Legend หงายหน้าในโซน Legend (Legend Zone) ประจำฝั่งตนเอง การ์ดใบนี้ทำงานตลอดเวลาและระบุโดเมนสีรูนของเด็คเรา</p>
									<p>• <strong>Chosen Champion:</strong> ดึงยูนิตแชมเปี้ยนที่ตรงกับเลเจนด์ออกจากเด็คหลัก แล้ววางหงายหน้าไว้ในโซนแชมเปี้ยน (Champion Zone) การ์ดใบนี้จะไม่อยู่ในกองการ์ดหลัก และพร้อมให้คุณอัญเชิญลงสนามเมื่อจ่ายค่าร่ายทรัพยากรครบถ้วน</p>
								</div>
							</div>

							<!-- Setup Step 2 -->
							<div class="relative">
								<div class="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950">2</div>
								<h3 class="text-xs font-black uppercase text-cyan-300 tracking-wider">จัดเตรียมเด็คการ์ด (Prepare the Decks)</h3>
								<div class="text-xs text-slate-400 leading-relaxed mt-1.5 space-y-1">
									<p>• <strong>Main Deck:</strong> สับกองการ์ดหลักที่เหลือจำนวน <strong>39 ใบ</strong> และวางคว่ำหน้าลงในโซนกองหลัก (Main Deck Zone)</p>
									<p>• <strong>Rune Deck:</strong> สับกองการ์ดรูน <strong>12 ใบ</strong> และวางคว่ำหน้าลงในโซนรูน (Rune Zone)</p>
									<p>• ในการแข่งขันระดับทางการ ให้ยื่นกองการ์ดให้คู่ต่อสู้สับหรือตัด (Cut) ก่อนเริ่มเล่น</p>
								</div>
							</div>

							<!-- Setup Step 3 -->
							<div class="relative">
								<div class="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950">3</div>
								<h3 class="text-xs font-black uppercase text-cyan-300 tracking-wider">สร้างสนามรบ (Establish the Battlefields)</h3>
								<div class="text-xs text-slate-400 leading-relaxed mt-1.5 space-y-1">
									<p>• ผู้เล่นทั้งสองฝั่งเลือกการ์ดสนามรบ (Battlefield Card) 1 ใบแบบลับๆ จากพูล 3 ตัวเลือกของตนเอง</p>
									<p>• วางการ์ด Battlefield ที่เลือกแบบคว่ำหน้าตรงกลางระหว่างผู้เล่น แล้วเปิดเผยพร้อมกันเพื่อรวมเป็นพื้นที่เลนรบตรงกลาง (Central Play Zone)</p>
								</div>
							</div>

							<!-- Setup Step 4 -->
							<div class="relative">
								<div class="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950">4</div>
								<h3 class="text-xs font-black uppercase text-cyan-300 tracking-wider">สุ่มหาผู้เล่นเทิร์นแรกและจั่วการ์ด (Determine Turn Order & Draw)</h3>
								<div class="text-xs text-slate-400 leading-relaxed mt-1.5 space-y-1">
									<p>• สุ่มหาผู้เล่นคนแรก (First Player) โดยการทอยเต๋า หรือคว่ำการ์ด Battlefield แล้วสุ่มเลือกขึ้นมาหนึ่งใบ</p>
									<p>• ผู้เล่นทั้งสองฝั่งจั่วการ์ดเริ่มต้นขึ้นมือคนละ <strong>4 ใบ</strong> จากกอง Main Deck ของตนเอง</p>
								</div>
							</div>

							<!-- Setup Step 5 -->
							<div class="relative">
								<div class="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950">5</div>
								<h3 class="text-xs font-black uppercase text-cyan-300 tracking-wider">การประเมินมัลลิแกน (Evaluate the Mulligan)</h3>
								<div class="text-xs text-slate-400 leading-relaxed mt-1.5 space-y-1">
									<p>• เลือกเปลี่ยนการ์ดบนมือเริ่มต้นได้ <strong>สูงสุด 2 ใบ</strong> โดยนำวางคว่ำหน้าไว้ที่ใต้กอง Main Deck จากนั้นจั่วการ์ดใหม่ขึ้นมือทดแทนในจำนวนเท่าเดิม (สามารถมัลลิแกนได้เพียง 1 ครั้งต่อเกม และไม่มีการสับเด็คใหม่หลังจากมัลลิแกน)</p>
								</div>
							</div>
						</div>

						<section class="border-t border-white/5 pt-6">
							<h3 class="text-xs font-black uppercase tracking-widest text-cyan-300 mb-3">ความแตกต่างของทรัพยากรในเทิร์นแรก (First Turn Differences)</h3>
							<div class="grid gap-4 sm:grid-cols-2">
								<div class="p-4 bg-slate-900/60 rounded-lg border border-white/5">
									<h4 class="text-xs font-black text-white uppercase">ผู้เล่นคนแรก (First Player)</h4>
									<p class="text-[11px] text-slate-400 leading-relaxed mt-1">
										เริ่มเทิร์นแรกด้วย Start of Turn ตามลำดับ A–D: Awaken, Beginning, Channel Rune 2 ใบ และจั่วการ์ด 1 ใบใน Draw Step จากนั้นจึงเข้าสู่ Action Phase
									</p>
								</div>
								<div class="p-4 bg-slate-900/60 rounded-lg border border-white/5">
									<h4 class="text-xs font-black text-white uppercase">ผู้เล่นคนที่สอง (Second Player)</h4>
									<p class="text-[11px] text-slate-400 leading-relaxed mt-1">
										เมื่อเริ่มเทิร์นแรกของตนเอง จะได้สิทธิ์พิเศษชดเชยการเริ่มทีหลัง โดยจะทำการอัญเชิญรูน (Channel Rune) ได้ **3 ใบ** แทนที่จะเป็น 2 ใบตามปกติ
									</p>
								</div>
							</div>
						</section>
					</div>
				{:else if activeTab === 'types'}
					<!-- TAB 3: CARD TYPES -->
					<div class="space-y-8 animate-fadeIn">
						<section>
							<h2 class="text-xl font-black text-white uppercase italic border-b border-white/5 pb-2 mb-4">
								ประเภทของการ์ดใน Riftbound
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								ในระหว่างการเล่น ผู้เล่นจะได้อัญเชิญวัตถุต่าง ๆ ลงสู่สนาม ซึ่งการ์ดแต่ละประเภทจะมีกฎและการประมวลผลที่เฉพาะตัว ดังนี้:
							</p>
						</section>

						<div class="space-y-4">
							<div class="flex flex-col sm:flex-row gap-4 p-4 bg-white/2 rounded-lg border border-white/5 items-start">
								<div class="h-10 w-10 shrink-0 bg-cyan-500/10 border border-cyan-400/20 rounded-lg flex items-center justify-center gap-1 p-1">
									<img src="/images/icons/champion.avif" alt="Champion" class="h-4.5 w-4.5 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black uppercase text-white tracking-wider">Champion & Legend</h3>
									<p class="text-xs text-slate-400 leading-relaxed mt-1">
										<strong>Legend Card:</strong> อยู่นอกกองการ์ดปกติ ใช้ระบุค่าสเตตัสความปลอดภัยของแชมเปี้ยน และ passive ติดตัว และเป็นตัวระบุ Domain Identity (สีรูนที่เราสามารถร่ายได้)<br />
										<strong>Chosen Champion:</strong> แชมเปี้ยนยูนิตเริ่มต้นของเราที่เริ่มเกมในโซนแชมเปี้ยน และสามารถนำมาอัปเกรดความสามารถเพิ่มเติมได้
									</p>
								</div>
							</div>

							<div class="flex flex-col sm:flex-row gap-4 p-4 bg-white/2 rounded-lg border border-white/5 items-start">
								<div class="h-10 w-10 shrink-0 bg-rose-500/10 border border-rose-400/20 rounded-lg flex items-center justify-center p-1.5">
									<img src="/images/icons/unit.avif" alt="Unit" class="h-7 w-7 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black uppercase text-white tracking-wider">Unit (ยูนิตทหาร)</h3>
									<p class="text-xs text-slate-400 leading-relaxed mt-1">
										ตัวละครที่จะส่งลงสนามที่ Base เพื่อเดินทัพเข้ายึด Battlefield ยูนิตมีค่า <strong>Might (พลังต่อสู้)</strong> สามารถสั่งเหนื่อย (Exhaust) เพื่อเดินหน้า ถอยหลัง หรือใช้ความสามารถพิเศษ และสามารถติดดาเมจสะสมได้
									</p>
								</div>
							</div>

							<div class="flex flex-col sm:flex-row gap-4 p-4 bg-white/2 rounded-lg border border-white/5 items-start">
								<div class="h-10 w-10 shrink-0 bg-amber-500/10 border border-amber-400/20 rounded-lg flex items-center justify-center p-1.5">
									<img src="/images/icons/gear.avif" alt="Gear" class="h-7 w-7 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black uppercase text-white tracking-wider">Gear (การ์ดถาวรประเภทเกียร์)</h3>
									<p class="text-xs text-slate-400 leading-relaxed mt-1">
										Gear เป็นการ์ดถาวรที่ปกติจะลงในสภาพ Ready ที่ Base และทำงานตามข้อความบนการ์ด เฉพาะ Gear ที่เป็น <strong>Equipment</strong> และมีความสามารถ <strong>Equip</strong> เท่านั้นที่สามารถจ่ายค่าความสามารถเพื่อติดกับ Unit ได้ ส่วน Gear อื่นจะอยู่บนบอร์ดและทำงานโดยไม่ต้องติดกับ Unit
									</p>
								</div>
							</div>

							<div class="flex flex-col sm:flex-row gap-4 p-4 bg-white/2 rounded-lg border border-white/5 items-start">
								<div class="h-10 w-10 shrink-0 bg-violet-500/10 border border-violet-400/20 rounded-lg flex items-center justify-center p-1.5">
									<img src="/images/icons/spell.avif" alt="Spell" class="h-7 w-7 object-contain" />
								</div>
								<div>
									<h3 class="text-xs font-black uppercase text-white tracking-wider">Spell (การ์ดเวทมนตร์)</h3>
									<p class="text-xs text-slate-400 leading-relaxed mt-1">
										เวทมนตร์อิมแพ็คระยะสั้น เมื่อจ่ายค่าร่ายและเล่นแล้ว จะเกิดผลลัพธ์การแก้ไขทันที (Resolve) และการ์ดจะถูกส่งลงสุสาน (Trash) โดยตรง มีเวทมนตร์ความเร็วระดับ Reaction ที่ร่ายสวนขัดจังหวะฝ่ายตรงข้ามได้
									</p>
								</div>
							</div>
						</div>
					</div>
				{:else if activeTab === 'phases'}
					<!-- TAB 4: TURN PHASES (INTERACTIVE STEPPER) -->
					<div class="space-y-8 animate-fadeIn">
						<section>
							<h2 class="text-xl font-black text-white uppercase italic border-b border-white/5 pb-2 mb-4">
								ขั้นตอนลำดับเทิร์น (Turn Structure)
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								ในเทิร์นของผู้เล่นหลัก (Turn Player) จะดำเนินตามลำดับขั้นตอนหลัก 3 เฟส คลิกเลือกเฟสเพื่อดูลำดับเหตุการณ์และช่วงเวลาเปิดจังหวะร่าย Reaction (Timing Windows):
							</p>
						</section>

						<!-- Interactive Phase Stepper Bar -->
						<div class="grid grid-cols-3 gap-2 border-b border-white/10 pb-4">
							<button 
								type="button" 
								class="flex flex-col items-center justify-center p-3 rounded-lg border text-center transition {activePhaseStep === 0 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/5' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
								onclick={() => activePhaseStep = 0}
							>
								<span class="text-[10px] font-black uppercase opacity-60">Phase 1</span>
								<span class="text-xs font-black uppercase mt-1">Start of Turn</span>
							</button>
							<button 
								type="button" 
								class="flex flex-col items-center justify-center p-3 rounded-lg border text-center transition {activePhaseStep === 1 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/5' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
								onclick={() => activePhaseStep = 1}
							>
								<span class="text-[10px] font-black uppercase opacity-60">Phase 2</span>
								<span class="text-xs font-black uppercase mt-1">Action Phase</span>
							</button>
							<button 
								type="button" 
								class="flex flex-col items-center justify-center p-3 rounded-lg border text-center transition {activePhaseStep === 2 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/5' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
								onclick={() => activePhaseStep = 2}
							>
								<span class="text-[10px] font-black uppercase opacity-60">Phase 3</span>
								<span class="text-xs font-black uppercase mt-1">End of Turn</span>
							</button>
						</div>

						<!-- Phase Detail Display Card -->
						<div class="rt-panel p-6 bg-slate-900/40 border border-white/5 rounded-xl space-y-6">
							{#if activePhaseStep === 0}
								<!-- Phase 1: Start of Turn -->
								<div class="space-y-4 animate-fadeIn">
									<div class="flex items-center gap-2 text-cyan-300">
										<span class="text-xl">🌅</span>
										<h3 class="text-sm font-black uppercase tracking-wider">Start of Turn Phase (ช่วงเริ่มเทิร์น)</h3>
									</div>
									<p class="text-xs text-slate-400 leading-relaxed">
										เมื่อเริ่มต้นเทิร์น ผู้เล่นจะดำเนินการตามขั้นตอนเรียงลำดับ (Step) แบบอัตโนมัติ ห้ามร่ายการ์ดประเภทอื่นจนกว่าจะเคลียร์สเต็ปเหล่านี้เสร็จสิ้น:
									</p>
									<div class="space-y-3 pl-4 border-l-2 border-cyan-500/30">
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">A. Awaken Step (คืนสภาพ):</span>
											<p class="text-xs text-slate-300 mt-0.5">การ์ดทั้งหมดบนบอร์ดฝั่งเรา และการ์ดรูนใน Rune Pool ที่นอนตะแคง (Exhausted) จะเปลี่ยนสถานะกลับมาตั้งตรง (Ready) เพื่อพร้อมทำงานอีกครั้ง</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">B. Beginning Step (นับแต้มคุมพื้นที่):</span>
											<p class="text-xs text-slate-300 mt-0.5">ตรวจเช็กบอร์ด หากเรามียูนิตที่ Active ใน Battlefield เลนนั้นมากกว่าฝ่ายตรงข้าม จะถือว่าเราคุมพื้นที่เลนนั้นได้สำเร็จ และได้รับ <strong>1 แต้ม (Hold Score)</strong> ทันที</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">C. Channel Step (เปิดรูนใหม่):</span>
											<p class="text-xs text-slate-300 mt-0.5">จั่วรูน 2 ใบแรกจากกองรูน (Rune Deck) หงายหน้าขึ้นสนามเพื่อรับทรัพยากรมาใช้จ่ายร่ายเวทมนตร์และยูนิตในเทิร์นนี้</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">D. Draw Step (จั่วการ์ดขึ้นมือ):</span>
											<p class="text-xs text-slate-300 mt-0.5">จั่วการ์ด 1 ใบจาก Main Deck ขึ้นสู่มือ รวมถึงผู้เล่นคนแรกในเทิร์นแรกสุดของเกม</p>
										</div>
									</div>
									<div class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-xs">
										<strong>Timing Warning:</strong> ในช่วงเริ่มต้นเทิร์นนี้ จะยังไม่มีจังหวะในการร่ายการ์ดประเภท Spell ปกติ (Sorcery speed) ผู้เล่นต้องรอจนเข้าสู่ Action Phase
									</div>
								</div>
							{:else if activePhaseStep === 1}
								<!-- Phase 2: Action Phase -->
								<div class="space-y-4 animate-fadeIn">
									<div class="flex items-center gap-2 text-cyan-300">
										<h3 class="text-sm font-black uppercase tracking-wider">Action Phase (ช่วงเวลาทำยุทธการ)</h3>
									</div>
									<p class="text-xs text-slate-400 leading-relaxed">
										นี่คือเฟสหลักของการเล่น ผู้เล่นหลักสามารถประกาศกระทำแอ็กชัน (Discretionary Actions) กี่ครั้งก็ได้ในลำดับใดก็ได้ ตราบใดที่ยังมีค่าจ่ายทรัพยากรเพียงพอ:
									</p>
									<div class="grid gap-3 sm:grid-cols-2">
										<div class="p-3 bg-white/2 rounded-lg border border-white/5">
											<span class="text-[10px] font-black text-slate-200">PLAY A CARD (ร่ายการ์ด)</span>
											<p class="text-[11px] text-slate-400 mt-1">เล่น Unit หรือ Gear ลงใน Base หรือร่าย Spell เพื่อใช้งานเอฟเฟกต์ โดย Equipment สามารถใช้ Equip เพื่อติดกับ Unit ได้ตามข้อความบนการ์ด</p>
										</div>
										<div class="p-3 bg-white/2 rounded-lg border border-white/5">
											<span class="text-[10px] font-black text-slate-200">MOVE UNIT (สั่งเคลื่อนทัพ)</span>
											<p class="text-[11px] text-slate-400 mt-1">สั่งเหนื่อย (Exhaust) ยูนิตเพื่อเดินหน้าขึ้นสนามรบ (Advance) หรือถอยทัพ (Retreat)</p>
										</div>
										<div class="p-3 bg-white/2 rounded-lg border border-white/5">
											<span class="text-[10px] font-black text-slate-200">SET HIDDEN (หมอบคว่ำหน้า)</span>
											<p class="text-[11px] text-slate-400 mt-1">จ่ายค่าร่ายการ์ดเพื่อหมอบคว่ำไว้ใต้ Battlefield เป็นกับดักลับแบบซ่อนเร้น</p>
										</div>
										<div class="p-3 bg-white/2 rounded-lg border border-white/5">
											<span class="text-[10px] font-black text-slate-200">INITIATE SHOWDOWN (เปิดศึกตัดสิน)</span>
											<p class="text-[11px] text-slate-400 mt-1">เลือก Move ยูนิตของคุณกี่ใบก็ได้ไปยัง Battlefield ที่คู่แข่งควบคุมอยู่ เมื่อยูนิตเข้าไป สนามนั้นจะกลายเป็น Contested และเริ่ม Showdown</p>
										</div>
									</div>
									<div class="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs">
										💬 <strong>Reaction Window:</strong> ทุกครั้งที่เราเล่นการ์ดหรือใช้ความสามารถ คู่แข่งจะมีสิทธิ์ร่ายเวทมนตร์หรือใช้เอฟเฟกต์ประเภท <strong>Reaction</strong> แทรกเข้ามาใน Chain เสมอ
									</div>
								</div>
							{:else}
								<!-- Phase 3: End of Turn -->
								<div class="space-y-4 animate-fadeIn">
									<div class="flex items-center gap-2 text-cyan-300">
										<span class="text-xl">🌙</span>
										<h3 class="text-sm font-black uppercase tracking-wider">End of Turn Phase (ช่วงจบเทิร์น)</h3>
									</div>
									<p class="text-xs text-slate-400 leading-relaxed">
										เมื่อผู้เล่นหลักไม่มีแอ็กชันให้ทำและประกาศจบเทิร์น กระบวนการเคลียร์บอร์ดตามลำดับจะทำงานเพื่อส่งมอบเทิร์น:
									</p>
									<div class="space-y-3 pl-4 border-l-2 border-cyan-500/30">
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">1. End Step Triggers:</span>
											<p class="text-xs text-slate-300 mt-0.5">เอฟเฟกต์การ์ดที่ระบุคำว่า "At the end of turn..." จะทริกเกอร์และเคลียร์ผลลัพธ์ในขั้นตอนนี้</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">2. Global Heal (ล้างแผลสะสม):</span>
											<p class="text-xs text-slate-300 mt-0.5">ล้างค่าดาเมจ (Damage Counters) ที่สะสมอยู่บนตัวยูนิตทั้งหมดที่เหลือรอดอยู่บนสนามรบให้เต็มตามเดิม (ยกเว้นผลของพิษหรือคำสาปพิเศษ)</p>
										</div>
										<div>
											<span class="text-[10px] font-black text-cyan-400 uppercase">3. Resource Decay (พลังงานสลาย):</span>
											<p class="text-xs text-slate-300 mt-0.5">ล้างค่าพลังงาน Energy และพลังรูนที่เหลืออยู่ทั้งหมดในรูนพูลให้กลายเป็นศูนย์ (สะสมข้ามเทิร์นไม่ได้)</p>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'combat'}
					<!-- TAB 5: COMBAT & CHAIN (INTERACTIVE STEPPER) -->
					<div class="space-y-8 animate-fadeIn">
						<section>
							<h2 class="text-xl font-black text-white uppercase italic border-b border-white/5 pb-2 mb-4">
								ระบบการต่อสู้ (Combat Showdown)
							</h2>
							<p class="text-sm leading-relaxed text-slate-300">
								Showdown เริ่มเมื่อผู้เล่น Move ยูนิตกี่ใบก็ได้ไปยัง Battlefield ที่คู่แข่งควบคุมอยู่ ทำให้สนามนั้นกลายเป็น Contested จากนั้นจึงประมวลผลการต่อสู้ตามลำดับด้านล่าง:
							</p>
						</section>

						<!-- Horizontal Combat Timeline -->
						<div class="relative flex flex-col md:flex-row justify-between gap-2 md:gap-4 pb-2">
							<button 
								type="button"
								class="flex-1 p-3 rounded-lg border text-left md:text-center transition {activeCombatStep === 0 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:text-slate-200'}"
								onclick={() => activeCombatStep = 0}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 1</span>
								<span class="text-xs font-black">Pre-Combat Reaction</span>
							</button>
							<button 
								type="button"
								class="flex-1 p-3 rounded-lg border text-left md:text-center transition {activeCombatStep === 1 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:text-slate-200'}"
								onclick={() => activeCombatStep = 1}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 2</span>
								<span class="text-xs font-black">Assign Might Damage</span>
							</button>
							<button 
								type="button"
								class="flex-1 p-3 rounded-lg border text-left md:text-center transition {activeCombatStep === 2 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:text-slate-200'}"
								onclick={() => activeCombatStep = 2}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 3</span>
								<span class="text-xs font-black">Cleanup & Deathknell</span>
							</button>
							<button 
								type="button"
								class="flex-1 p-3 rounded-lg border text-left md:text-center transition {activeCombatStep === 3 ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg' : 'bg-slate-900/30 border-white/5 text-slate-400 hover:text-slate-200'}"
								onclick={() => activeCombatStep = 3}
							>
								<span class="block text-[9px] font-bold opacity-60">Step 4</span>
								<span class="text-xs font-black">Contested Result</span>
							</button>
						</div>

						<!-- Combat Details Display Card -->
						<div class="rt-panel p-6 bg-slate-900/40 border border-white/5 rounded-xl space-y-4">
							{#if activeCombatStep === 0}
								<div class="space-y-2 animate-fadeIn">
									<h3 class="text-sm font-black text-cyan-300">Step 1: Pre-Combat Reaction Window (ก่อนปะทะ)</h3>
									<p class="text-xs text-slate-300 leading-relaxed">
										เมื่อมีการประกาศศึกตัดสิน ทั้งผู้เล่นบุกและผู้ป้องกันจะมีโอกาสประกาศสลับกันร่ายการ์ดประเภท **Reaction** หรือสั่งเปิดการ์ดคว่ำหมอบ (Hidden Card) ใต้พื้นที่รบเพื่อบวกพลังเกราะ, บัฟยูนิต หรือสลายพลังการ์ดเป้าหมายก่อนที่จะเกิดการยิงพลังชนกันในสเต็ปถัดไป
									</p>
									<p class="text-xs text-slate-500">
										*เคล็ดลับ:* นี่เป็นโอกาสสุดท้ายในการเอาตัวรอดหรือปรับแต่งบอร์ด หากก้าวข้ามขั้นตอนนี้จะถอยหลังกลับมาร่ายการ์ดช่วยชีวิตไม่ได้แล้ว
									</p>
								</div>
							{:else if activeCombatStep === 1}
								<div class="space-y-2 animate-fadeIn">
									<h3 class="text-sm font-black text-cyan-300">Step 2: Assign Might Damage (คำนวณชนดาเมจ)</h3>
									<p class="text-xs text-slate-300 leading-relaxed">
										นำค่า Might ของยูนิตทั้งหมดของแต่ละฝั่งที่อยู่ในเลนนั้นมารวมกันและปะทะพลังกันแบบพร้อมกัน (Simultaneous Damage) กฎการกระจายดาเมจมีดังนี้:
									</p>
									<ul class="space-y-1.5 text-xs text-slate-400 list-disc pl-5">
										<li><strong class="text-slate-200">Tank First:</strong> ยูนิตที่มีความสามารถ Tank ต้องตกเป็นเป้าหมายและรับความเสียหายก่อนยูนิตอื่นๆ</li>
										<li><strong class="text-slate-200">Backline Last:</strong> ยูนิตแนวหลังจะโดนดาเมจเป็นลำดับสุดท้ายหลังจากยูนิตตัวหน้าในเลนตายหมดแล้ว</li>
										<li>ความเสียหายจะถูกบันทึกเป็นค่าบาดเจ็บสะสม (Damage Counters) บนตัวยูนิต</li>
									</ul>
								</div>
							{:else if activeCombatStep === 2}
								<div class="space-y-2 animate-fadeIn">
									<h3 class="text-sm font-black text-cyan-300">Step 3: Cleanup & Deathknell (เก็บกวาดสุสาน)</h3>
									<p class="text-xs text-slate-300 leading-relaxed">
										ตรวจสอบยูนิตในเลนทั้งหมด ตัวใดที่ได้รับบาดเจ็บสะสมเท่ากับหรือมากกว่าค่า Might จะถูกตัดสินว่าตายทันที และส่งลงสุสาน (Trash Zone) ของเจ้าของการ์ดนั้น
									</p>
									<p class="text-xs text-slate-300">
										เมื่อยูนิตตาย ความสามารถประเภท **Deathknell (เสียงระฆังมรณะ)** ทั้งหมดจะทริกเกอร์และเข้าสู่ Chain เพื่อแก้ไขผลลัพธ์
									</p>
								</div>
							{:else}
								<div class="space-y-2 animate-fadeIn">
									<h3 class="text-sm font-black text-cyan-300">Step 4: Contested Result (เช็กการพิชิตสนามรบ)</h3>
									<p class="text-xs text-slate-300 leading-relaxed">
										เมื่อการต่อสู้จบสิ้นลงและบอร์ดฝั่งตรงข้ามในเลนรบนั้นว่างเปล่า (ไม่มีศัตรูเหลือรอด) ในขณะที่ยูนิตฝั่งผู้บุกยังมีชีวิตรอดอยู่ในเลนอย่างน้อย 1 ตัว จะนับว่าฝั่งบุกทำ **Conquer (ยึดครองสำเร็จ)** ได้รับคะแนน <strong>+1 แต้ม</strong> ทันที
									</p>
									<p class="text-xs text-slate-500">
										*หมายเหตุ:* ยูนิตที่พิชิตสำเร็จจะยังคงยืนตำแหน่งอยู่ที่ Battlefield เลนนั้นต่อเพื่อป้องกันศึกในรอบถัดไป
									</p>
								</div>
							{/if}
						</div>

						<section class="border-t border-white/5 pt-6">
							<h3 class="text-xs font-black uppercase tracking-widest text-white italic mb-2">ระบบ Chain และการตอบสนอง (Reaction)</h3>
							<p class="text-xs text-slate-400 leading-relaxed">
								เมื่อใดก็ตามที่จะมีการร่ายเวทมนตร์หรือกดใช้สกิล จะเกิดการนำเอฟเฟกต์นั้นเข้าไปตั้งแถวรอใน **Chain (ลูกโซ่)** ฝั่งตรงข้ามจะมีโอกาสเล่นการ์ดหรือสกิลระดับความเร็ว **Reaction** เพื่อแทรกสวนขึ้นมาทับด้านบน การแก้ไขเอฟเฟกต์จะทำจากบนสุดลงล่างสุด (First-in, Last-out)
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
