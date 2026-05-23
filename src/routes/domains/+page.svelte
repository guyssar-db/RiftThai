<script lang="ts">
	import AppFooter from '$lib/components/AppFooter.svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';

	type Domain = {
		name: string;
		colorName: string;
		icon: string;
		accent: string;
		summary: string;
		bestFor: string;
		strengths: string[];
		pros: string[];
		cons: string[];
		description: string[];
	};

	const domains: Domain[] = [
		{
			name: 'Fury',
			colorName: 'Red',
			icon: 'rune_fury.svg',
			accent: 'rose',
			summary: 'เกมบุกเร็ว, ทำดาเมจ, Conquer, เสี่ยงเพื่อ tempo',
			bestFor: 'ผู้เล่นที่ชอบกดดันคู่แข่งตั้งแต่ต้นเกม',
			strengths: ['Aggression', 'Conquer', 'Damage', 'Accelerate', 'Assault'],
			pros: [
				'เปิดเกมเร็วและบังคับให้คู่แข่งต้องตอบรับแรงกดดัน',
				'มีเครื่องมือช่วยชนะ battlefield ผ่าน damage, Assault และ Accelerate',
				'ลงโทษคู่แข่งที่ setup ช้าหรือมือไม่พร้อมได้ดี'
			],
			cons: [
				'ถ้าเกมยืดอาจเสีย value เพราะใช้ทรัพยากรเร็ว',
				'บางแผนต้อง discard หรือแลกการ์ดเพื่อ tempo',
				'แพ้ทางเด็คที่กัน damage หรือ stabilize battlefield ได้ทัน'
			],
			description: [
				'Fury คือ Domain สายบุกและ tempo จุดเด่นคือการกดดัน battlefield ให้เร็วที่สุดด้วยยูนิตที่โจมตีแรง การทำดาเมจโดยตรง และ keyword ที่ช่วยเร่งจังหวะ เช่น Accelerate หรือเพิ่มพลังตอนโจมตีอย่าง Assault',
				'ข้อดีคือเริ่มเกมได้ดุดันและบังคับให้คู่แข่งต้องตั้งรับ แต่หลายใบมักแลกกับความเสี่ยง เช่น discard หรือใช้ทรัพยากรเร็วเกินไป ถ้าเกมยืดและปิดไม่ลง อาจเสีย value ระยะยาวได้'
			]
		},
		{
			name: 'Calm',
			colorName: 'Green',
			icon: 'rune_calm.svg',
			accent: 'emerald',
			summary: 'ป้องกัน, Reaction, เคลื่อนย้าย, Hold battlefield',
			bestFor: 'ผู้เล่นที่ชอบอ่านเกมและตอบโต้จังหวะสำคัญ',
			strengths: ['Defense', 'Hold', 'Moving', 'Reaction', 'Tricks'],
			pros: [
				'ป้องกันยูนิตสำคัญและรักษาพื้นที่บน battlefield ได้ดี',
				'มี Reaction และ trick ที่ทำให้คู่แข่งคำนวณ combat ยาก',
				'เหมาะกับการชนะด้วย tempo เล็ก ๆ และการยืนบอร์ดระยะยาว'
			],
			cons: [
				'ดาเมจและ removal ตรง ๆ มักไม่หนักเท่า domain อื่น',
				'ต้องอ่านจังหวะคู่แข่งแม่น ถ้าใช้ Reaction ผิดจังหวะจะเสีย value',
				'อาจปิดเกมช้าหากไม่มี threat ที่กดดันพอ'
			],
			description: [
				'Calm เป็น Domain สายรับและตอบโต้ เน้น Reaction, การป้องกันยูนิต, การย้ายตำแหน่ง และการ Hold battlefield ให้ได้นานกว่าคู่แข่ง จุดแข็งไม่ใช่การล้างกระดานหนัก ๆ แต่คือการทำให้แผนของคู่แข่งพลาดจังหวะ',
				'Calm เหมาะกับเด็คที่อยากชนะด้วยการยืนพื้นที่สำคัญ อ่านการเคลื่อนไหวของคู่แข่ง และใช้ trick ใน combat ให้ได้เปรียบทีละน้อย'
			]
		},
		{
			name: 'Mind',
			colorName: 'Blue',
			icon: 'rune_mind.svg',
			accent: 'sky',
			summary: 'วางแผนล่วงหน้า, Hidden, จั่วการ์ด, trick',
			bestFor: 'ผู้เล่นที่ชอบเกมยาวและชนะด้วยความได้เปรียบ',
			strengths: ['Plan Ahead', 'Hidden', 'Gear', 'Tricks', 'Draw'],
			pros: [
				'สร้าง card advantage และเล่นเกมยาวได้แข็งแรง',
				'Hidden และ trick ทำให้คู่แข่งเดาทางยาก',
				'มีเครื่องมือ setup แผนซับซ้อนและพลิกจังหวะสำคัญ'
			],
			cons: [
				'ต้องใช้เวลา setup จึงอาจโดนเด็คเร็วลงโทษ',
				'การเล่นผิดลำดับหรือซ่อนผิดใบทำให้เสีย tempo ชัดเจน',
				'บาง removal หรือ payoff มีต้นทุนสูง ต้องบริหารทรัพยากรดี'
			],
			description: [
				'Mind คือ Domain ของการวางแผนและความได้เปรียบระยะยาว มักเกี่ยวข้องกับการจั่วการ์ด, Hidden, Gear, trick และแผนที่ต้องเตรียมไว้ล่วงหน้าหลายเทิร์น',
				'จุดเด่นคือเล่นแบบคุมข้อมูลและบังคับให้คู่แข่งเดาทางผิด การ์ด Hidden ช่วยซ่อน threat หรือ interaction ไว้ก่อนใช้งานจริง เหมาะกับคนที่ชอบ bluff, setup และค่อย ๆ สร้าง advantage'
			]
		},
		{
			name: 'Body',
			colorName: 'Orange',
			icon: 'rune_body.svg',
			accent: 'amber',
			summary: 'Ramp, buff, ยูนิตใหญ่, ชนะ combat',
			bestFor: 'ผู้เล่นที่ชอบลง threat ใหญ่และปิดเกมด้วยพลัง',
			strengths: ['Ramp', 'Buffs', 'Win Fights', 'Ready', 'High Might'],
			pros: [
				'มี ramp ช่วยลงการ์ดใหญ่หรือ threat สำคัญก่อนเวลา',
				'ชนะ combat ได้ด้วย Might สูงและ buff ที่ชัดเจน',
				'เล่นตรงไปตรงมา เหมาะกับการคุม battlefield ด้วย stat'
			],
			cons: [
				'ถ้า ramp ไม่มา หรือ threat โดนจัดการ จะเสียจังหวะมาก',
				'แผนอาจอ่านง่ายกว่าพวก trick/control domain',
				'ต้องระวังการลงทุนกับยูนิตตัวเดียวแล้วโดน bounce, kill หรือ stun'
			],
			description: [
				'Body เป็น Domain ของพลังและการเร่งทรัพยากร จุดเด่นคือ ramp, buff, ยูนิต Might สูง และการชนะ fight ด้วย stat ที่เหนือกว่า เด็ค Body มักต้องการสร้างจังหวะที่ลงการ์ดใหญ่ก่อนคู่แข่งรับมือทัน',
				'ข้อดีคือเล่นตรงไปตรงมาและมี threat ชัดเจน ถ้าได้ ramp หรือ buff ถูกจังหวะจะครอง battlefield ได้เร็วมาก แต่ต้องระวังการโดน disrupt ก่อน threat ใหญ่จะสร้างผลลัพธ์'
			]
		},
		{
			name: 'Chaos',
			colorName: 'Purple',
			icon: 'rune_chaos.svg',
			accent: 'violet',
			summary: 'discard, ใช้ trash, play pattern แปลก, disrupt',
			bestFor: 'ผู้เล่นที่ชอบเกมพลิกแพลงและเล่นนอกกรอบ',
			strengths: ['Discard', 'Trash', 'Selection', 'Hidden', 'Disruption'],
			pros: [
				'มีมุมเล่นแปลกและ disrupt แผนคู่แข่งได้หลายทาง',
				'ใช้ trash เป็นทรัพยากร ทำให้การ์ดที่เสียไปยังกลับมาสร้าง value ได้',
				'เหมาะกับการพลิกเกมด้วย effect ที่คู่แข่งคาดเดายาก'
			],
			cons: [
				'ต้องเข้าใจ timing และ resource management มากกว่า domain พื้นฐาน',
				'บางแผนมีความเสี่ยงสูง ถ้าเจอจังหวะผิดจะเสียทั้งมือหรือ tempo',
				'ผลลัพธ์บางอย่างไม่เสถียรเท่าแผนที่เล่นตรง ๆ'
			],
			description: [
				'Chaos เป็น Domain ที่เล่นกับความไม่แน่นอนและทรัพยากรนอกมือ เช่น discard, การนำการ์ดจาก trash กลับมาใช้, การบีบทรัพยากรคู่แข่ง และ effect ที่ทำให้เกมเปลี่ยนทิศแบบคาดเดายาก',
				'Chaos เหมาะกับผู้เล่นที่ชอบทำลายแผนคู่แข่งและหา line การเล่นแปลก ๆ จุดแข็งคือความยืดหยุ่นและมุมโจมตีที่คาดเดายาก แต่ต้องบริหารจังหวะและทรัพยากรให้แม่น'
			]
		},
		{
			name: 'Order',
			colorName: 'Yellow',
			icon: '8bb1b193a8e1adc26ca28e1a21da8d1e2f5d2f72-64x64.png',
			accent: 'yellow',
			summary: 'token, sacrifice, Deathknell, kill effect',
			bestFor: 'ผู้เล่นที่ชอบสร้างบอร์ดกว้างและแลกทรัพยากรคุ้ม',
			strengths: ['Tokens', 'Kill', 'Deathknell', 'Sacrifice', 'Symmetrical Effects'],
			pros: [
				'สร้างบอร์ดกว้างและกดดันหลาย battlefield ได้ดี',
				'เปลี่ยนการตายของยูนิตเป็น value ผ่าน Deathknell และ sacrifice payoff',
				'effect แบบทั้งสองฝ่ายมักเข้าทางตัวเองเมื่อเตรียมบอร์ดไว้แล้ว'
			],
			cons: [
				'ต้องมีชิ้นส่วน synergy ครบพอ ไม่งั้น token อาจแรงไม่พอ',
				'แพ้ทางการล้างบอร์ดหรือ effect ที่ตัด payoff ก่อน sacrifice',
				'ต้องวางลำดับการแลกยูนิตให้ดี ไม่งั้นจะเสีย board presence เอง'
			],
			description: [
				'Order เป็น Domain ที่เน้นโครงสร้างและการแลกทรัพยากรอย่างมีระบบ จุดเด่นคือ token, sacrifice, Deathknell, kill effect และ effect แบบสมมาตรที่กระทบทั้งสองฝ่าย แต่ Order มักเปลี่ยนการสูญเสียของตัวเองเป็น value ได้',
				'เด็ค Order มักสร้างบอร์ดกว้าง ใช้ยูนิตจำนวนมากกดดันสนาม แล้วเปลี่ยนการตายของยูนิตให้เป็น advantage ผ่าน Deathknell หรือ sacrifice payoff'
			]
		}
	];

	const accentClasses: Record<string, string> = {
		rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
		emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
		sky: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
		amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
		violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
		yellow: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100'
	};
</script>

<svelte:head>
	<title>Domains - RiftThai</title>
	<meta
		name="description"
		content="สรุปจุดเด่นของแต่ละ Domain ใน Riftbound ทั้ง Fury, Calm, Mind, Body, Chaos และ Order"
	/>
</svelte:head>

<div class="relative min-h-dvh overflow-x-hidden pb-20 font-sans text-slate-100 selection:bg-cyan-400/30">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-white/5 bg-slate-950/75 backdrop-blur-2xl">
		<div class="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
			<div class="flex min-w-0 items-center gap-3">
				<a
					href="/"
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25 sm:w-auto sm:px-4"
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

			<SiteMenu active="domains" />
		</div>
	</nav>

	<main class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
		<header class="mb-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-end">
			<div class="max-w-4xl">
				<p class="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300/80">
					Riftbound Domain Guide
				</p>
				<h1 class="text-4xl font-black uppercase italic tracking-tight text-white sm:text-6xl lg:text-7xl">
					จุดเด่นของแต่ละ <span class="text-cyan-400">Domain</span>
				</h1>
				<p class="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-400 sm:text-base">
					Domain คือแนวทางหลักของการ์ดและเด็คใน Riftbound แต่ละ Domain มี identity,
					mechanic และจังหวะการเล่นต่างกัน การเลือกคู่ Domain จึงเป็นตัวกำหนดว่าเด็คจะบุกเร็ว,
					ตั้งรับ, วางแผนยาว หรือแลกทรัพยากรแบบไหน
				</p>
			</div>

			<div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
				<div class="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
					Beginner Picks
				</div>
				<div class="space-y-3 text-sm font-bold leading-relaxed text-slate-300">
					<p><span class="text-white">เริ่มง่าย:</span> Fury หรือ Body</p>
					<p><span class="text-white">เล่นรับ:</span> Calm</p>
					<p><span class="text-white">เกมยาว:</span> Mind</p>
					<p><span class="text-white">พลิกแพลง:</span> Chaos</p>
					<p><span class="text-white">บอร์ดกว้าง:</span> Order</p>
				</div>
			</div>
		</header>

		<section class="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 backdrop-blur-2xl">
			<div class="grid grid-cols-[0.75fr_1.25fr] border-b border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:grid-cols-[0.6fr_1.4fr_1fr]">
				<div>Domain</div>
				<div>จุดเด่นหลัก</div>
				<div class="hidden sm:block">เหมาะกับ</div>
			</div>
			{#each domains as domain}
				<a
					href="#{domain.name.toLowerCase()}"
					class="grid grid-cols-[0.75fr_1.25fr] gap-3 border-b border-white/5 px-4 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[0.6fr_1.4fr_1fr]"
				>
					<div class="flex min-w-0 items-center gap-3">
						<img src="/images/icons/{domain.icon}" class="h-8 w-8 shrink-0 object-contain" alt="{domain.name} rune" />
						<div class="min-w-0">
							<div class="truncate text-sm font-black uppercase tracking-wide text-white">
								{domain.name}
							</div>
							<div class="text-[10px] font-black uppercase tracking-widest text-slate-600">
								{domain.colorName}
							</div>
						</div>
					</div>
					<div class="text-xs font-bold leading-relaxed text-slate-300 sm:text-sm">{domain.summary}</div>
					<div class="hidden text-xs font-medium leading-relaxed text-slate-500 sm:block">
						{domain.bestFor}
					</div>
				</a>
			{/each}
		</section>

		<section class="grid gap-5 lg:grid-cols-2">
			{#each domains as domain}
				<article
					id={domain.name.toLowerCase()}
					class="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl transition hover:border-cyan-400/20 sm:p-6"
				>
					<div class="mb-5 flex items-start justify-between gap-4">
						<div class="flex min-w-0 items-center gap-4">
							<div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-slate-950/70">
								<img src="/images/icons/{domain.icon}" class="h-9 w-9 object-contain" alt="{domain.name} rune" />
							</div>
							<div class="min-w-0">
								<h2 class="text-2xl font-black uppercase italic tracking-tight text-white">
									{domain.name}
								</h2>
								<p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
									{domain.colorName} Domain
								</p>
							</div>
						</div>
						<span class="rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest {accentClasses[domain.accent]}">
							{domain.colorName}
						</span>
					</div>

					<div class="mb-5 flex flex-wrap gap-2">
						{#each domain.strengths as strength}
							<span class="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
								{strength}
							</span>
						{/each}
					</div>

					<div class="space-y-4 text-sm font-medium leading-7 text-slate-300">
						{#each domain.description as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>

					<div class="mt-5 grid gap-3 sm:grid-cols-2">
						<div class="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
							<div class="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
								ข้อดี
							</div>
							<ul class="space-y-2 text-xs font-medium leading-relaxed text-slate-300">
								{#each domain.pros as pro}
									<li class="flex gap-2">
										<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"></span>
										<span>{pro}</span>
									</li>
								{/each}
							</ul>
						</div>

						<div class="rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-4">
							<div class="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-rose-300">
								ข้อเสีย
							</div>
							<ul class="space-y-2 text-xs font-medium leading-relaxed text-slate-300">
								{#each domain.cons as con}
									<li class="flex gap-2">
										<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-300"></span>
										<span>{con}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>

					<div class="mt-5 rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-xs font-bold leading-relaxed text-slate-400">
						<span class="text-white">เหมาะกับ:</span> {domain.bestFor}
					</div>
				</article>
			{/each}
		</section>
	</main>

	<AppFooter />
</div>
