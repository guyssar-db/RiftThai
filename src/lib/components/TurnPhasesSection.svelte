<script lang="ts">
	const phases = [
		{
			id: 1,
			name: 'AWAKEN PHASE',
			nameTh: 'เฟสเตรียมพร้อม',
			color: 'text-sky-500',
			bg: 'bg-sky-500',
			border: 'border-sky-500/20',
			hoverBorder: 'hover:border-sky-500/50',
			details: [
				'ถอดสถานะ <b>มึนงง (Stun)</b>',
				'เปลี่ยนการ์ดที่ <b>เหนื่อย (Exhausted)</b> ทั้งหมด (Units, Runes, Champions, Gear) กลับมาเป็น <b>พร้อม (Ready)</b>'
			]
		},
		{
			id: 2,
			name: 'BEGINNING PHASE',
			nameTh: 'เฟสเริ่มต้น',
			color: 'text-indigo-500',
			bg: 'bg-indigo-500',
			border: 'border-indigo-500/20',
			hoverBorder: 'hover:border-indigo-500/50',
			details: [
				'ตรวจสอบแต้ม <b>Hold</b>: ได้รับ 1 แต้มต่อ 1 Battlefield ที่เราคุมได้',
				'ความสามารถ <b>"At the start of your turn..."</b> ทั้งหมดทำงาน'
			]
		},
		{
			id: 3,
			name: 'CHANNEL PHASE',
			nameTh: 'เฟสรูน',
			color: 'text-amber-500',
			bg: 'bg-amber-500',
			border: 'border-amber-500/20',
			hoverBorder: 'hover:border-amber-500/50',
			details: [
				'นำ <b>รูน 2 ใบ</b> จาก Rune Deck เข้าสู่สนาม (ในสภาพหงายหน้า)',
				'<i>พิเศษ:</i> หากคุณเป็นผู้เล่นคนที่สองในเทิร์นแรก ให้ Channel รูนเพิ่มเป็น 3 ใบ'
			]
		},
		{
			id: 4,
			name: 'DRAW PHASE',
			nameTh: 'เฟสจั่วการ์ด',
			color: 'text-violet-500',
			bg: 'bg-violet-500',
			border: 'border-violet-500/20',
			hoverBorder: 'hover:border-violet-500/50',
			details: ['จั่วการ์ด 1 ใบจาก <b>Main Deck</b> ขึ้นมือ']
		},
		{
			id: 5,
			name: 'ACTION PHASE',
			nameTh: 'เฟสหลัก (ทำแอ็คชัน)',
			color: 'text-emerald-500',
			bg: 'bg-emerald-500',
			border: 'border-emerald-500',
			hoverBorder: 'hover:border-emerald-500',
			description:
				'ผู้เล่นสามารถเลือกทำสิ่งเหล่านี้ "กี่ครั้งก็ได้" และ "สลับลำดับกันได้" ตราบเท่าที่มีทรัพยากรเพียงพอ:',
			actions: [
				{ label: 'Play Card', desc: 'จ่าย Energy + รูน ลงยูนิต/ร่ายเวท' },
				{ label: 'Set Hidden', desc: 'จ่าย 1 Power Rune วางการ์ดคว่ำหน้า' },
				{ label: 'Use Ability', desc: 'สั่ง Exhaust ยูนิตเพื่อใช้ความสามารถ' },
				{ label: 'Move Unit', desc: 'สั่ง Exhaust ยูนิตเพื่อเดินหน้าในเลน' }
			]
		},
		{
			id: 6,
			name: 'END OF TURN',
			nameTh: 'เฟสจบเทิร์น',
			color: 'text-rose-500',
			bg: 'bg-rose-500',
			border: 'border-rose-500/20',
			hoverBorder: 'hover:border-rose-500/50',
			details: [
				'ผลลัพธ์ <b>"this turn"</b> ทั้งหมดหมดผลลง',
				'<b>Global Heal:</b> ฟื้นฟูพลังชีวิตยูนิตทุกตัวบนกระดานจนเต็ม',
				'ประกาศส่งเทิร์นให้ผู้เล่นฝั่งตรงข้าม'
			]
		}
	];

	const combatSteps = [
		{ title: 'Pre-Combat Window', desc: 'ร่าย Reaction/Action สวนกันรอบสุดท้าย' },
		{ title: 'Assign Damage', desc: 'คำนวณ Might และหักล้างพลังชีวิตยูนิต' },
		{ title: 'Cleanup & Deathknell', desc: 'ยูนิตตายลงสุสาน และสกิล [Deathknell] ทำงาน' },
		{
			title: 'Contested Check',
			desc: 'เช็คการยึดพื้นที่หากยึดสำเร็จจะเรียกว่า Conquer และจะได้รับ +1 แต้ม หรือ เริ่มศึกรอบใหม่หากมีตัวใหม่ปรากฏ'
		}
	];

	const speeds = [
		{
			name: 'Normal Speed',
			nameTh: 'ความเร็วปกติ',
			badgeColor: '#475569',
			border: 'border-slate-800/60',
			desc: 'ใช้ได้ในเทิร์นตัวเองเท่านั้น (เปิด Chain ได้อย่างเดียว)',
			sampleImage:
				'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a7a34129e64f0296bf2da166c2b06ed156d568db-744x1039.png',
			rules: ['ห้ามใช้ในจังหวะ Showdown', 'ห้ามใช้ร่ายต่อท้าย Chain อื่น']
		},
		{
			name: 'Action Speed',
			nameTh: 'ความเร็วแอ็กชัน',
			badgeColor: '#107361',
			border: 'border-slate-800/60',
			desc: 'ใช้ได้ทั้งในเทิร์นตัวเอง และในช่วง Showdown',
			sampleImage:
				'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/81d1c47459606f7b627778cce9b5f0e44d80f7fa-744x1039.png',
			rules: ['ห้ามใช้ร่ายต่อท้าย Chain อื่น', 'ต้องรอให้ Chain ว่าง (Empty) ถึงจะเริ่มใช้ได้']
		},
		{
			name: 'Reaction Speed',
			nameTh: 'ความเร็วรีแอ็กชัน',
			badgeColor: '#107361',
			border: 'border-slate-800/60',
			desc: 'ใช้ได้ทุกเวลา (เทิร์นเรา, เทิร์นคู่แข่ง, Showdown)',
			sampleImage:
				'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4d9cc1c13b75933e509e642213f13359350cd3f9-744x1039.png',
			rules: [
				'ใช้ร่ายต่อท้าย (Chain) ได้ทุกสถานการณ์',
				'ใช้ขัดขวางหรือตอบโต้ Action/Reaction อื่นได้'
			]
		}
	];
</script>

<div class="animate-in fade-in space-y-20 py-8 duration-1000">
	<!-- Header -->
	<div class="space-y-4 text-center">
		<p class="rt-kicker">โครงสร้างเทิร์น</p>
		<h2 class="rt-heading text-4xl uppercase italic sm:text-6xl">
			ลำดับ<span class="text-emerald-400">การเล่น</span>
		</h2>
	</div>

	<!-- Flowchart Container -->
	<div class="mx-auto max-w-6xl px-6">
		<div class="flex flex-col items-center space-y-12">
			<!-- Phases 1-4 (Fast Flow) -->
			<div class="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{#each phases.slice(0, 4) as phase}
					<div class="rt-panel rounded-xl p-6 transition-all duration-300 hover:bg-white/10">
						<div class="{phase.color} mb-2 text-xs font-black tracking-[0.3em] uppercase italic">
							Phase 0{phase.id}
						</div>
						<h3 class="mb-6 text-xl font-black tracking-tight text-white uppercase sm:text-2xl">
							{phase.name}
						</h3>
						<ul class="space-y-4">
							{#each phase.details as detail}
								<li
									class="flex items-start gap-3 text-sm leading-relaxed text-slate-400 italic sm:text-base"
								>
									<div
										class="mt-2 h-1.5 w-1.5 rounded-full {phase.bg} shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
									></div>
									<span>{@html detail}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<!-- Animated Connector -->
			<div class="z-20 -my-6 flex flex-col items-center">
				<div
					class="h-12 w-px animate-pulse bg-gradient-to-b from-transparent via-emerald-500 to-transparent"
				></div>
				<div class="animate-bounce text-emerald-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="m7 13 5 5 5-5" /><path d="M12 6v12" /></svg
					>
				</div>
			</div>

			<!-- Phase 5: Action HUB -->
			<div class="relative w-full">
				<div
					class="rt-panel relative z-10 rounded-xl border-emerald-500/20 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:p-10"
				>
					<div class="flex flex-col gap-12 lg:flex-row">
						<!-- Main HUB Info -->
						<div class="space-y-8 lg:w-1/2">
							<div>
								<div
									class="mb-2 text-xs font-black tracking-[0.4em] text-emerald-500 uppercase italic"
								>
									Phase 05 — Critical Engagement
								</div>
								<h3 class="text-5xl font-black tracking-tighter text-white uppercase italic">
									{phases[4].name}
								</h3>
							</div>
							<p class="max-w-md text-base leading-relaxed font-medium text-slate-400 italic">
								{phases[4].description}
							</p>

							<div
								class="flex items-center gap-4 rounded-lg border border-amber-500/10 bg-amber-500/5 p-5 backdrop-blur-xl"
							>
								<span class="text-2xl font-black text-amber-500">!</span>
								<div class="text-sm leading-relaxed font-medium text-amber-200/60 italic">
									คู่แข่งสามารถประกาศร่าย [Reaction] เพื่อขัดจังหวะได้ทุกครั้งที่คุณทำการ Action ใดๆ
									บนสนามรบ
								</div>
							</div>
						</div>

						<!-- Actions Grid -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-1/2">
							{#each phases[4].actions as action}
								<div
									class="group/item relative overflow-hidden rounded-lg border border-white/5 bg-slate-950/50 p-5 transition-all duration-300 hover:border-emerald-500/40"
								>
									<div
										class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover/item:opacity-100"
									></div>
									<div class="mb-2 text-xs font-black tracking-[0.2em] text-emerald-400 uppercase">
										{action.label}
									</div>
									<div class="text-sm leading-relaxed text-slate-400 italic">{action.desc}</div>
								</div>
							{/each}

							<!-- Showdown Trigger -->
							<div
								class="group/sd flex cursor-pointer items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/10 p-6 shadow-xl shadow-rose-500/5 transition-all duration-300 hover:border-rose-500/40 hover:bg-rose-500/20"
							>
								<div class="space-y-1">
									<div class="text-md font-bold tracking-tight text-rose-200/40 uppercase italic">
										ประกาศเปิดศึกตัดสินพื้นที่ในเลนทันที
									</div>
								</div>
								<div class="text-rose-500 transition-transform duration-500 group-hover:scale-125">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-10 w-10"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg
									>
								</div>
							</div>
						</div>
					</div>

					<!-- Combat Steps (Sub-Flow) -->
					<div class="mt-12 border-t border-white/5 pt-12">
						<div class="mb-10 text-center">
							<span class="text-xs font-black tracking-[0.4em] text-slate-500 uppercase italic"
								>ลำดับการต่อสู้</span
							>
						</div>
						<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
							{#each combatSteps as step, i}
								<div class="group/step relative flex flex-col items-center text-center">
									<div
										class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-rose-500/20 bg-slate-950 text-sm font-black text-rose-500 shadow-2xl transition-all duration-300 group-hover:border-rose-500/50"
									>
										{i + 1}
									</div>
									<div
										class="mb-1 text-sm font-black tracking-tight text-slate-200 uppercase italic"
									>
										{step.title}
									</div>
									<div class="px-2 text-xs leading-relaxed text-slate-500 italic">{step.desc}</div>

									{#if i < 3}
										<div
											class="absolute top-6 -right-3 hidden text-white/5 transition-colors duration-500 group-hover:text-rose-500/20 md:block"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-6 w-6"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg
											>
										</div>
									{/if}
								</div>
							{/each}
						</div>
						<div class="mt-10 text-center">
							<div
								class="inline-flex items-center gap-3 rounded-full border border-white/5 bg-slate-950/80 px-6 py-2 text-xs font-bold tracking-wider text-slate-500 italic"
							>
								<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
								<span>Global Heal (Step 5) เกิดขึ้นหลังจากทุกการตัดสินผลการต่อสู้</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Animated Connector -->
			<div class="z-10 -my-6 flex flex-col items-center">
				<div
					class="h-12 w-px animate-pulse bg-gradient-to-b from-transparent via-rose-500 to-transparent"
				></div>
				<div class="animate-bounce text-rose-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="m7 13 5 5 5-5" /><path d="M12 6v12" /></svg
					>
				</div>
			</div>

			<!-- Phase 6: End -->
			<div class="group w-full max-w-lg">
				<div
					class="rt-panel relative overflow-hidden rounded-xl p-8 transition-all duration-300 hover:border-rose-500/30 hover:bg-white/10"
				>
					<div class="mb-2 text-xs font-black tracking-[0.4em] text-rose-500 uppercase italic">
						Phase 06 — Termination
					</div>
					<h3 class="mb-6 text-4xl font-black tracking-tighter text-white uppercase italic">
						{phases[5].name}
					</h3>
					<ul class="space-y-4">
						{#each phases[5].details as detail}
							<li class="flex items-start gap-4 text-base font-medium text-slate-400 italic">
								<div
									class="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
								></div>
								<span>{@html detail}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Loop Back Arrow -->
			<div class="group flex cursor-default flex-col items-center pt-12 opacity-10">
				<div
					class="mb-4 text-xs font-black tracking-[0.5em] text-slate-400 uppercase transition-colors group-hover:text-white"
				>
					รอเริ่มเทิร์นถัดไป
				</div>
				<div
					class="relative h-20 w-48 rounded-b-[4rem] border-2 border-t-0 border-slate-800 transition-colors duration-1000 group-hover:border-cyan-500"
				>
					<div
						class="absolute -top-2 -right-2 text-slate-800 transition-colors group-hover:text-cyan-500"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="4"><path d="m7 11 5-5 5 5" /></svg
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Card Speeds Section -->
	<div class="mx-auto max-w-6xl border-t border-white/5 px-6 pt-24">
		<div class="mb-16 space-y-2 text-center">
			<p class="rt-kicker">ช่วงเวลาที่เล่นได้</p>
			<h3 class="rt-heading text-3xl uppercase italic sm:text-4xl">
				ความเร็ว<span class="text-cyan-400">ของการ์ด</span>
			</h3>
		</div>

		<div class="grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
			{#each speeds as speed}
				<div class="group flex flex-col gap-10">
					<!-- Sample Card -->
					<div class="perspective-1000 relative mx-auto aspect-[744/1039] w-full max-w-[280px]">
						<div
							class="h-full w-full overflow-hidden rounded-xl border border-white/5 bg-slate-900 shadow-2xl transition-all duration-300 group-hover:border-cyan-500/30"
						>
							<img src={speed.sampleImage} alt={speed.name} class="h-full w-full object-cover" />
							<div
								class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"
							></div>
						</div>
						<!-- Float Tag -->
						<div
							class="glass-panel absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-white/10 px-6 py-2 whitespace-nowrap shadow-2xl"
						>
							<span class="text-[10px] font-black tracking-widest text-cyan-400 uppercase"
								>ตัวอย่างการ์ด</span
							>
						</div>
					</div>

					<!-- Info Panel -->
					<div
						class="rt-panel relative flex-grow overflow-hidden rounded-xl p-6 transition-all duration-300 hover:bg-white/10 sm:p-8"
					>
						<div class="mb-8 flex flex-col gap-6">
							<span
								class="kw-inline-badge w-fit origin-left scale-125 shadow-none"
								style="background-color: {speed.badgeColor}; border: none;"
							>
								<span>{speed.name}</span>
							</span>
						</div>
						<p class="mb-8 text-xs leading-relaxed font-medium text-slate-400 italic">
							{speed.desc}
						</p>
						<ul class="space-y-4">
							{#each speed.rules as rule}
								<li
									class="flex items-start gap-3 text-[10px] leading-relaxed text-slate-500 italic"
								>
									<div
										class="mt-1.5 h-1 w-1 rounded-full bg-slate-700 transition-colors group-hover:bg-cyan-500"
									></div>
									<span class="text-xs">{rule}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Chain Stack Section -->
	<div class="mx-auto max-w-5xl pt-24">
		<div
			class="rt-panel relative overflow-hidden rounded-xl p-6 shadow-[0_40px_100px_rgba(0,0,0,0.4)] sm:p-10 lg:p-14"
		>
			<div
				class="absolute top-0 right-0 rotate-12 p-12 opacity-5 transition-transform duration-1000 group-hover:rotate-0"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-64 w-64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1"><path d="M5 12h14m-7-7 7 7-7 7" /></svg
				>
			</div>

			<div class="relative z-10 mb-20 flex flex-col items-center space-y-6 text-center">
				<div
					class="rounded-lg border border-amber-500/20 bg-amber-500/10 px-6 py-2 text-[10px] font-black tracking-[0.4em] text-amber-500 uppercase"
				>
					ลำดับการตอบโต้ขั้นสูง
				</div>
				<h4 class="rt-heading text-4xl uppercase italic sm:text-5xl">
					การเรียง<span class="text-amber-500">เอฟเฟกต์</span>
				</h4>
				<p class="max-w-md text-sm leading-relaxed font-medium text-slate-400 italic">
					เมื่อมีการร่ายเวทหรือใช้สกิลสวนกัน ระบบจะประมวลผลจากจุดศูนย์กลางความขัดแย้งย้อนกลับมา <b
						>"หลังสุดย้อนกลับมาหน้าสุด"</b
					> (LIFO Logic)
				</p>
			</div>

			<div class="relative z-10 mb-20 flex flex-col items-center justify-center gap-12 lg:flex-row">
				<!-- Connector Line -->
				<div
					class="absolute top-8 right-20 left-20 -z-10 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block"
				></div>

				<div class="group flex cursor-default flex-col items-center gap-4">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-slate-950 text-xl font-black text-amber-500 italic transition-all duration-300 group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
					>
						1
					</div>
					<div class="space-y-1 text-center">
						<div class="text-xs font-black tracking-widest text-white uppercase italic">
							เริ่มต้น
						</div>
						<div class="max-w-[120px] text-[9px] leading-relaxed font-medium text-slate-500 italic">
							ผู้เล่นประกาศร่ายการ์ดใบแรกเปิดลำดับ
						</div>
					</div>
				</div>

				<div class="hidden animate-pulse text-white/5 lg:block">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"><path d="M5 12h14m-7-7 7 7-7 7" /></svg
					>
				</div>

				<div class="group flex cursor-default flex-col items-center gap-4">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-slate-950 text-xl font-black text-amber-500 italic transition-all duration-300 group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
					>
						2
					</div>
					<div class="space-y-1 text-center">
						<div class="text-xs font-black tracking-widest text-white uppercase italic">ตอบโต้</div>
						<div class="max-w-[120px] text-[9px] leading-relaxed font-medium text-slate-500 italic">
							คู่แข่งร่าย [Reaction] สวนกลับได้ไม่จำกัด
						</div>
					</div>
				</div>

				<div class="hidden animate-pulse text-white/5 lg:block">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"><path d="M5 12h14m-7-7 7 7-7 7" /></svg
					>
				</div>

				<div class="group flex cursor-default flex-col items-center gap-4">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-lg border border-amber-400 bg-amber-500 text-xl font-black text-slate-950 italic shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300"
					>
						3
					</div>
					<div class="space-y-1 text-center">
						<div class="text-xs font-black tracking-widest text-amber-500 uppercase italic">
							แก้เอฟเฟกต์
						</div>
						<div class="max-w-[120px] text-[9px] leading-relaxed font-medium text-slate-500 italic">
							ประมวลผลจากใบสุดท้ายย้อนกลับมา
						</div>
					</div>
				</div>
			</div>

			<!-- Additional Rules Grid -->
			<div class="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2">
				<div
					class="rounded-lg border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:bg-white/10"
				>
					<div
						class="mb-4 flex items-center gap-3 text-sm font-black tracking-tight text-white italic"
					>
						<div class=" border-l-3 border-l-amber-500 p-2">
							ต้องจ่าย Energy และทรัพยากรที่จำเป็นทันทีที่ประกาศร่าย (ประกาศเข้า Stack)
							โดยไม่คำนึงว่าผลลัพธ์สุดท้ายจะโดนยกเลิกหรือไม่
						</div>
					</div>
				</div>
				<div
					class="rounded-lg border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:bg-white/10"
				>
					<div
						class="mb-4 flex items-center gap-3 text-sm font-black tracking-tight text-white italic"
					>
						<div class="border-l-3 border-l-rose-500 p-2">
							หากเป้าหมายของการ์ด (ยูนิต/พื้นที่) หายไปหรือถูกทำลายก่อนที่ลำดับความสามารถจะประมวลผล
							การ์ดใบนั้นจะทำให้เป้าหมายเป็นโมฆะทันที
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(2rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-in {
		animation: in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	.perspective-1000 {
		perspective: 1000px;
	}
</style>
