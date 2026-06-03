<script lang="ts">
	import { keywords, iconMappings } from '$lib/data/keywords';
	import { getRarityIcon } from '$lib/data/rarityIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageSources } from '$lib/utils/cardImages';
	let { card, closePopup, canEdit } = $props<{
		card: Card;
		closePopup: () => void;
		canEdit: boolean;
	}>();

	let isEditing = $state(false);
	let tempAbilityEn = $state('');
	let tempAbilityTh = $state('');
	let isSaving = $state(false);
	let modalImageSources = $derived(getCardImageSources(card.image_url, [360, 480, 640, 744]));
	let isReportOpen = $state(false);
	let reportType = $state('translation');
	let reportMessage = $state('');
	let isReportSubmitting = $state(false);
	let reportNotice = $state('');

	let activeTooltip = $state('');
	let verticalTransform = $state('');
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	$effect(() => {
		tempAbilityEn = card.ability_en;
		tempAbilityTh = card.ability_th;
	});

	async function handleSave() {
		isSaving = true;
		const response = await fetch('/api/update-card', {
			method: 'POST',
			body: JSON.stringify({
				code: card.code,
				ability_en: tempAbilityEn,
				ability_th: tempAbilityTh
			}),
			headers: { 'Content-Type': 'application/json' }
		});

		const result = await response.json();
		if (result.success) {
			card.ability_en = tempAbilityEn;
			card.ability_th = tempAbilityTh;
			isEditing = false;
			alert('Saved successfully!');
		} else {
			alert('Failed to save: ' + result.message);
		}
		isSaving = false;
	}

	async function submitReport() {
		const message = reportMessage.trim();
		if (message.length < 4 || isReportSubmitting) return;

		isReportSubmitting = true;
		reportNotice = '';

		try {
			const response = await fetch('/api/card-reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cardCode: card.code,
					cardName: card.name_en,
					reportType,
					message
				})
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Could not submit report');
			reportNotice = 'Report submitted. Thank you.';
			reportMessage = '';
			isReportOpen = false;
		} catch (error) {
			reportNotice = error instanceof Error ? error.message : 'Could not submit report';
		} finally {
			isReportSubmitting = false;
		}
	}

	function showTooltip(e: Event) {
		const target = e.target as HTMLElement;
		const trigger = target.closest('[data-tooltip]') as HTMLElement;
		if (trigger) {
			activeTooltip = trigger.getAttribute('data-tooltip') || '';
			const rect = trigger.getBoundingClientRect();
			// Calculate initial horizontal position (center of trigger)
			let calculatedX = rect.left + rect.width / 2;

			// Estimate tooltip width (using the largest max-w for general calculation)
			const tooltipMaxWidth = window.innerWidth < 640 ? 280 : 320; // Rough estimate from Tailwind classes
			const tooltipHalfWidth = tooltipMaxWidth / 2;

			// Adjust calculatedX to keep tooltip within viewport
			if (calculatedX - tooltipHalfWidth < 0) {
				// If it goes off left
				calculatedX = tooltipHalfWidth + 10; // Add some padding
			} else if (calculatedX + tooltipHalfWidth > window.innerWidth) {
				// If it goes off right
				calculatedX = window.innerWidth - tooltipHalfWidth - 10; // Add some padding
			}

			tooltipX = calculatedX; // Assign to state

			// Calculate vertical position (existing logic)
			if (rect.top < 100) {
				tooltipY = rect.bottom + 8;
				verticalTransform = '';
			} else {
				tooltipY = rect.top - 8;
				verticalTransform = 'translateY(-100%)';
			}
		}
	}

	const domainIconMap: Record<string, string> = {
		Fury: 'rune_fury.svg',
		Calm: 'rune_calm.svg',
		Chaos: 'rune_chaos.svg',
		Mind: 'rune_mind.svg',
		Body: 'rune_body.svg',
		Order: 'rune_order.svg'
	};

	const rarityStyles: Record<string, string> = {
		Common: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
		Uncommon: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
		Rare: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
		Epic: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
		Legendary: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
		Champion: 'border-rose-400/30 bg-rose-400/10 text-rose-200'
	};

	function rarityClass(rarity: string) {
		return rarityStyles[rarity] ?? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
	}

	const mechanics: Record<string, string> = {
		Ready:
			'Ready (ตั้งตรง): ยูนิตพร้อมสามารถเคลื่อนย้าย (move) หรือใช้สกิลที่ต้องให้ Exhaust (นอนตะแคง) ได้',
		Exhausted:
			'Exhausted (นอนตะแคง): ยูนิตไม่สามารถเคลื่อนย้าย (move) หรือใช้สกิลที่ต้องให้ Exhaust (นอนตะแคง) ได้',
		Exhaust: 'Exhaust: การสั่งให้นอนตะแคงเพื่อใช้งานความสามารถหรือเคลื่อนที่',
		Buff: 'Buff: การเพิ่มค่าพลังหรือความสามารถให้ยูนิต',
		Channel: 'Channel: การจั่วเปิดการ์ดรูนใบใหม่จากกองรูน',
		Recycle: 'Recycle: การนำการ์ดรูนหรือการ์ดจากมือตามที่มาของการ์ดนั้นส่งกลับเข้าใต้กอง',
		Conquer: 'Conquer: ชนะการประจันหน้า (Showdown) และยึดพื้นที่สำเร็จ',
		Hold: 'Hold: การควบคุมสนามรบต่อเนื่องจนถึง BEGINNING PHASE',
		Banish:
			'Banish: การ์ดที่โดนส่งมาโซนนี้จะหลุดออกนอกวงโคจรของระบบเกมโดยสิ้นเชิง มันจะไม่ได้อยู่บนสนาม ไม่ได้อยู่ในมือ ไม่ได้อยู่ในกองทิ้ง และไม่สามารถใช้การ์ดชุบชีวิตทั่วไปดึงกลับมาใช้งานได้อีกเลย'
	};

	function parseAbility(text: string) {
		if (!text) return '';
		let processed = text;
		const placeholders: Record<string, string> = {};
		let phCount = 0;

		function addPH(html: string) {
			const id = `___PH${phCount++}___`;
			placeholders[id] = html;
			return id;
		}

		// 1. Convert Thai keywords to English for standard processing
		const keywordReplacements: Record<string, string> = {
			'\\[แอ็คชัน\\]': '[Action]',
			'\\[รีแอ็คชัน\\]': '[Reaction]',
			'\\[เร่งความเร็ว\\]': '[Accelerate]',
			'\\[ซ่อน\\]': '[Hidden]',
			'\\[กองทัพ\\]': '[Legion]',
			'\\[แทงค์\\]': '[Tank]',
			'\\[แนวหลัง\\]': '[Backline]',
			'\\[ทรงพลัง\\]': '[Mighty]',
			'\\[เสียงระฆังมรณะ\\]': '[Deathknell]',
			'\\[เชื่อมต่อ\\]': '[Channel]',
			'\\[รีไซเคิล\\]': '[Recycle]',
			'\\[นิมิต\\]': '[Vision]',
			'\\[ทำนาย\\]': '[Predict]',
			'\\[แก๊งค์\\]': '[Ganking]',
			'\\[ชั่วคราว\\]': '[Temporary]'
		};

		Object.entries(keywordReplacements).forEach(([th, en]) => {
			processed = processed.replace(new RegExp(th, 'g'), en);
		});

		processed = processed.replace(/\[บุกทะลวง\s*(\d+)?\]/g, (m, p1) =>
			p1 ? `[Assault ${p1}]` : '[Assault]'
		);
		processed = processed.replace(/\[เกราะป้องกัน\s*(\d+)?\]/g, (m, p1) =>
			p1 ? `[Shield ${p1}]` : '[Shield]'
		);
		processed = processed.replace(/\[เบี่ยงเบน\s*(\d+)?\]/g, (m, p1) =>
			p1 ? `[Deflect ${p1}]` : '[Deflect]'
		);
		processed = processed.replace(/\[ล่า\s*(\d+)?\]/g, (m, p1) => (p1 ? `[Hunt ${p1}]` : '[Hunt]'));
		processed = processed.replace(/\[เลเวล\s*(\d+)?\]/g, (m, p1) =>
			p1 ? `[Level ${p1}]` : '[Level]'
		);

		// 2. Identify and hide tokens into placeholders to prevent nested replacements

		// Rainbow Rune [c]
		processed = processed.replace(/\[c\]/gi, () =>
			addPH(
				`<img src="/images/icons/rune_rainbow.svg" class="inline-icon" title="Any Rune" alt="Any Rune" />`
			)
		);

		// Energy Icons
		processed = processed.replace(/:rb_energy_(\d+):/g, (match, p1) =>
			addPH(`<span class="icon-energy-circle" title="Energy: ${p1}">${p1}</span>`)
		);

		// Other Icons from mappings
		Object.entries(iconMappings).forEach(([key, value]) => {
			processed = processed.replace(new RegExp(key, 'g'), () =>
				addPH(
					`<img src="/images/icons/${value.icon}" class="inline-icon" title="${value.hint}" alt="${key}" />`
				)
			);
		});

		// Keep keyword costs inside the same keyword background.
		processed = processed.replace(
			/\[(Repeat|Equip)\]((?:\s*___PH\d+___)+)/gi,
			(_match, keyword, costs) => {
				const kw = keywords.find((k) => k.name_en.toLowerCase() === keyword.toLowerCase());
				const bgColor = kw ? kw.color : '#107361';
				const hint = kw ? kw.description_th : '';
				return addPH(
					`<span class="kw-inline-badge kw-cost-badge cursor-pointer outline-none" tabindex="0" data-tooltip="${hint}" style="background-color: ${bgColor}; border: none; shadow: none;"><span>${keyword}</span>${costs}</span>`
				);
			}
		);

		// Keywords [Badge]
		processed = processed.replace(/\[([^\]]+)\]/g, (match, p1) => {
			const trimmedP1 = p1.trim();
			const hasArrow = trimmedP1.endsWith('>');
			const displayP1 = hasArrow ? trimmedP1.slice(0, -1).trim() : p1;

			const cleanP1 = displayP1.split(' ')[0];
			const kw = keywords.find(
				(k) =>
					k.name_en.toLowerCase() === cleanP1.toLowerCase() ||
					k.name_th.toLowerCase() === cleanP1.toLowerCase() ||
					cleanP1.toLowerCase().includes(k.name_en.toLowerCase())
			);
			const bgColor = kw ? kw.color : '#107361';
			const hint = kw ? kw.description_th : '';
			const className = hasArrow
				? 'kw-inline-badge kw-arrow cursor-pointer outline-none'
				: 'kw-inline-badge cursor-pointer outline-none';

			if (hint) {
				return addPH(
					`<span class="${className}" tabindex="0" data-tooltip="${hint}" style="background-color: ${bgColor}; border: none; shadow: none;"><span>${displayP1}</span></span>`
				);
			}
			return addPH(
				`<span class="${hasArrow ? 'kw-inline-badge kw-arrow' : 'kw-inline-badge'}" style="background-color: ${bgColor}; border: none; shadow: none;"><span>${displayP1}</span></span>`
			);
		});

		// Mechanics (Ready, Exhaust, etc.)
		const sortedMechanics = Object.entries(mechanics).sort((a, b) => b[0].length - a[0].length);
		sortedMechanics.forEach(([key, hint]) => {
			const regex = new RegExp(`\\b(${key})\\b`, 'gi');
			processed = processed.replace(regex, (match) =>
				addPH(
					`<span class="text-cyan-400 underline decoration-cyan-400/30 decoration-dotted underline-offset-4 cursor-pointer inline-block outline-none font-bold" tabindex="0" data-tooltip="${hint}">${match}</span>`
				)
			);
		});

		// 2.5 Style text in parentheses as gray
		processed = processed.replace(/\(([^)]+)\)/g, (match, p1) =>
			addPH(`<span class="text-slate-500 font-medium italic">(${p1})</span>`)
		);

		// 3. Restore all placeholders back to HTML (in reverse order to handle nesting)
		const entries = Object.entries(placeholders);
		for (let i = entries.length - 1; i >= 0; i--) {
			const [id, html] = entries[i];
			processed = processed.replace(id, html);
		}

		return processed.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />');
	}

	function formatTranslatedAbility(text: string, sourceText: string) {
		if (!text) return '';

		let formatted = text.replace(/\\n/g, '\n');
		const sourceHasStructuredLines = /\\n|\n/.test(sourceText || '');

		if (sourceHasStructuredLines) {
			formatted = formatted
				.replace(
					/\s+(\[(?:Action|Reaction|Repeat|Equip|Hidden|Accelerate|Deathknell|Level|Tank|Assault|Shield|Deflect|Hunt|Ganking|Temporary|Vision|Predict|Quick-Draw|Weaponmaster)\b[^\]]*\])/g,
					'\n$1'
				)
				.replace(
					/(\[(?:Action|Reaction|Repeat|Equip|Hidden|Accelerate|Deathknell|Level|Tank|Assault|Shield|Deflect|Hunt|Ganking|Temporary|Vision|Predict|Quick-Draw|Weaponmaster)\b[^\]]*\](?:\s*:rb_[a-z0-9_]+:)*\s*\([^)]*\))\s+(?=\S)/g,
					'$1\n'
				)
				.replace(/([.)])\s+(?=\[)/g, '$1\n');
		}

		return formatted.replace(/\n{3,}/g, '\n\n').trim();
	}

	function handleMouseOut(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const trigger = target.closest('[data-tooltip]') as HTMLElement;
		const related = e.relatedTarget as Node;
		if (trigger && related && trigger.contains(related)) {
			return;
		}
		activeTooltip = '';
	}

	function hideTooltip() {
		activeTooltip = '';
	}

	function toggleTooltip(e: Event) {
		const target = e.target as HTMLElement;
		const trigger = target.closest('[data-tooltip]') as HTMLElement;
		if (trigger) {
			e.stopPropagation(); // Prevent modal background click
			const hint = trigger.getAttribute('data-tooltip') || '';
			if (activeTooltip === hint) {
				activeTooltip = '';
			} else {
				showTooltip(e);
			}
		} else {
			activeTooltip = '';
		}
	}
</script>

{#if activeTooltip}
	<div
		class="animate-in fade-in zoom-in pointer-events-none fixed z-[9999] max-w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-slate-900/95 p-4 text-center font-sans text-xs leading-relaxed font-medium
               whitespace-normal text-white shadow-2xl
               backdrop-blur-xl duration-200 sm:max-w-[320px] sm:p-5 sm:text-sm"
		style="left: {tooltipX}px; top: {tooltipY}px; transform: translateX(-50%) {verticalTransform};"
	>
		{activeTooltip}
	</div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="animate-in fade-in fixed inset-0 z-[1000] flex items-center justify-center p-2 duration-300 sm:p-6 lg:p-8"
	onclick={closePopup}
>
	<div class="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl transition-opacity"></div>

	<div
		class="rt-panel animate-in zoom-in-95 relative flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl transition-all duration-500 sm:max-h-[92dvh]"
		onclick={(e) => {
			e.stopPropagation();
			activeTooltip = '';
		}}
	>
		<!-- Mobile Header -->
		<div
			class="flex items-center justify-between border-b border-white/5 bg-slate-950/50 p-4 backdrop-blur-md sm:p-5 lg:hidden"
		>
			<div class="flex items-center gap-3">
				<div class="h-2 w-2 animate-pulse rounded-full bg-cyan-500"></div>
				<span class="text-xs font-black tracking-[0.2em] text-white uppercase">{card.code}</span>
			</div>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-transform active:scale-90"
				onclick={closePopup}
				aria-label="Close Modal"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="3"
					><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg
				>
			</button>
		</div>

		<!-- Desktop Close -->
		<button
			class="absolute top-5 right-5 z-50 hidden h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:bg-rose-500 hover:text-white lg:flex"
			onclick={closePopup}
			aria-label="Close Modal"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 transition-transform group-hover:scale-110 group-hover:rotate-90"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="3"
				><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg
			>
		</button>

		<div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto" onscroll={hideTooltip}>
			<div class="grid lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] lg:items-stretch">
				<!-- Image Section -->
				<div
					class="group relative flex items-center justify-center border-b border-white/5 bg-slate-950/40 p-5 sm:p-8 lg:border-r lg:border-b-0 lg:p-10 xl:p-12"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 opacity-50"
					></div>
					<div class="relative z-10 w-full max-w-[250px] sm:max-w-[340px] lg:max-w-[380px]">
						<picture>
							{#if modalImageSources.webpSrcset}
								<source
									type="image/webp"
									srcset={modalImageSources.webpSrcset}
									sizes="(min-width: 1024px) 380px, (min-width: 640px) 340px, 250px"
								/>
							{/if}
							<img
								src={modalImageSources.fallback}
								srcset={modalImageSources.fallbackSrcset}
								sizes="(min-width: 1024px) 380px, (min-width: 640px) 340px, 250px"
								alt={card.name_en}
								loading="eager"
								decoding="async"
								fetchpriority="high"
								draggable="false"
								class="pointer-events-none h-auto w-full rounded-xl border border-white/5 object-contain shadow-[0_30px_70px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-[1.01]"
							/>
						</picture>
					</div>
				</div>

				<!-- Info Section -->
				<div class="space-y-7 bg-slate-900/50 p-5 backdrop-blur-3xl sm:p-8 lg:p-10 xl:p-12">
					<div class="space-y-5">
						<div class="flex flex-wrap items-center gap-2.5">
							<span
								class="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase"
							>
								{card.code}
							</span>
							{#if card.set_name}
								<span
									class="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
								>
									{card.set_name}
								</span>
							{/if}
							<!-- {#if card.rarity}
                                <span class="rounded-lg border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] {rarityClass(card.rarity)}">
                                    {card.rarity}
                                </span>
                            {/if} -->
						</div>

						<div class="space-y-2">
							<h2
								class="text-2xl leading-tight font-black tracking-tight break-words text-white uppercase italic sm:text-3xl lg:text-[2.35rem]"
							>
								{card.name_en}
							</h2>
							{#if card.name_th && card.name_th !== card.name_en}
								<p
									class="text-sm leading-relaxed font-bold break-words text-slate-400 sm:text-base"
								>
									{card.name_th}
								</p>
							{/if}
						</div>

						<div
							class="rounded-2xl border border-white/10 bg-slate-950/45 p-2 shadow-inner shadow-black/20"
						>
							<div class="flex flex-wrap items-center gap-2">
								<div
									class="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/8 px-3 py-2"
								>
									<div class="flex shrink-0 items-center gap-1">
										{#each getTypeIcons(card.type) as typeIcon}
											<img
												src="/images/icons/{typeIcon.src}"
												class="h-5 w-5 object-contain"
												alt="{typeIcon.label} type"
											/>
										{/each}
									</div>
									<span class="text-[9px] font-black tracking-[0.18em] text-slate-500 uppercase"
										>Type</span
									>
									<span
										class="min-w-0 truncate text-xs font-black tracking-widest text-white uppercase"
										>{card.type || '-'}</span
									>
								</div>

								<div
									class="flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black tracking-widest uppercase {card.rarity
										? rarityClass(card.rarity)
										: 'border-white/10 bg-white/5 text-slate-300'}"
								>
									{#if getRarityIcon(card.rarity)}
										<img
											src={getRarityIcon(card.rarity) ?? ''}
											class="h-5 w-5 shrink-0 object-contain"
											alt="{card.rarity} rarity"
										/>
									{/if}
									<span class="text-[9px] opacity-70">Rarity</span>
									<span>{card.rarity || 'No Rarity'}</span>
								</div>

								<div
									class="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black tracking-widest text-white uppercase"
								>
									<span class="text-[9px] text-slate-500">Energy</span>
									{#if card.energy !== null}
										<span
											class="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-xs text-slate-950"
											>{card.energy}</span
										>
									{:else}
										<span class="text-slate-500">-</span>
									{/if}
								</div>

								{#if card.power !== null}
									<div
										class="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black tracking-widest text-white uppercase"
									>
										<span class="text-[9px] text-slate-500">Might</span>
										<img src="/images/icons/might.svg" class="h-5 w-auto" alt="Might" />
										<span>{card.power?.value?.label}</span>
									</div>
								{/if}
							</div>
						</div>

						{#if card.domains?.length > 0 || card.tags?.length > 0}
							<div class="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
								{#if card.domains?.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each card.domains as domain}
											<div
												class="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/70 px-3 py-2 text-[10px] font-black transition-colors hover:border-white/20"
											>
												<img
													src="/images/icons/{domainIconMap[domain] || 'rune_rainbow.svg'}"
													class="h-5 w-auto"
													alt={domain}
												/>
												<span class="tracking-widest text-white/80 uppercase">{domain}</span>
											</div>
										{/each}
									</div>
								{/if}
								{#if card.tags?.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each card.tags ?? [] as tag}
											<span
												class="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-1.5 text-[9px] font-black tracking-widest text-cyan-300/80 uppercase"
											>
												#{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<div class="space-y-8">
						{#if canEdit}
							<div class="flex items-center gap-3">
								<button
									class="rounded-xl px-5 py-2.5 text-[9px] font-black tracking-widest uppercase transition-all {isEditing
										? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
										: 'border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'}"
									onclick={() => (isEditing = !isEditing)}
								>
									{isEditing ? 'Cancel Edit' : 'Modify Core'}
								</button>
								{#if isEditing}
									<button
										class="rounded-xl bg-cyan-500 px-5 py-2.5 text-[9px] font-black tracking-widest text-slate-950 uppercase shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
										onclick={handleSave}
										disabled={isSaving}
									>
										{isSaving ? 'Processing...' : 'Sync Changes'}
									</button>
								{/if}
							</div>
						{/if}

						<div class="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<div class="text-[10px] font-black tracking-[0.22em] text-slate-500 uppercase">
										Community report
									</div>
									{#if reportNotice}
										<div class="mt-1 text-xs font-bold text-cyan-100">{reportNotice}</div>
									{:else}
										<div class="mt-1 text-xs font-semibold text-slate-500">
											แจ้งคำแปล รูป หรือข้อมูลการ์ดที่ผิด
										</div>
									{/if}
								</div>
								<button
									type="button"
									class="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-200/20 px-3 text-xs font-black tracking-widest text-amber-100 uppercase transition hover:bg-amber-200/10"
									onclick={() => (isReportOpen = !isReportOpen)}
								>
									{isReportOpen ? 'Close Report' : 'Report Issue'}
								</button>
							</div>
							{#if isReportOpen}
								<div class="mt-3 grid gap-2 border-t border-white/10 pt-3">
									<select
										bind:value={reportType}
										class="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-xs font-bold text-white focus:border-cyan-400/50 focus:outline-none"
									>
										<option value="translation">Translation</option>
										<option value="card_data">Card data</option>
										<option value="image">Image</option>
										<option value="rules_text">Rules text</option>
										<option value="other">Other</option>
									</select>
									<textarea
										bind:value={reportMessage}
										class="min-h-24 resize-y rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
										maxlength="2000"
										placeholder="บอกจุดที่ผิดหรือควรแก้..."
									></textarea>
									<button
										type="button"
										class="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-300 px-3 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200 disabled:opacity-45"
										disabled={reportMessage.trim().length < 4 || isReportSubmitting}
										onclick={submitReport}
									>
										{isReportSubmitting ? 'Sending...' : 'Submit Report'}
									</button>
								</div>
							{/if}
						</div>

						<div class="group/thai relative pl-5 sm:pl-7">
							<div
								class="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-violet-500 transition-shadow group-hover/thai:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
							></div>
							<h4
								class="mb-4 text-[10px] font-black tracking-[0.32em] text-cyan-500 uppercase italic opacity-70"
							>
								Localized Intel (TH)
							</h4>
							{#if isEditing && canEdit}
								<textarea
									bind:value={tempAbilityTh}
									class="h-40 w-full rounded-lg border border-white/10 bg-slate-950 p-5 text-sm leading-relaxed font-medium text-white transition-all focus:border-cyan-500/50 focus:outline-none"
								></textarea>
							{:else}
								<!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
								<div
									class="text-lg leading-relaxed font-black tracking-tight break-words text-white sm:text-xl"
									onmouseover={showTooltip}
									onmouseout={handleMouseOut}
									onfocusin={showTooltip}
									onfocusout={hideTooltip}
									onclick={toggleTooltip}
								>
									{@html parseAbility(formatTranslatedAbility(card.ability_th, card.ability_en))}
								</div>
							{/if}
						</div>

						<div class="group/en relative border-t border-white/5 pt-8">
							<h4
								class="mb-4 text-[10px] font-black tracking-[0.32em] text-slate-600 uppercase italic opacity-70"
							>
								Source Transmission (EN)
							</h4>
							{#if isEditing && canEdit}
								<textarea
									bind:value={tempAbilityEn}
									class="h-40 w-full rounded-lg border border-white/10 bg-slate-950 p-5 text-sm leading-relaxed font-medium text-slate-300 italic transition-all focus:border-cyan-500/50 focus:outline-none"
								></textarea>
							{:else}
								<!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
								<div
									class="text-sm leading-relaxed font-medium break-words text-slate-400 sm:text-base lg:text-lg"
									onmouseover={showTooltip}
									onmouseout={handleMouseOut}
									onfocusin={showTooltip}
									onfocusout={hideTooltip}
									onclick={toggleTooltip}
								>
									{@html parseAbility(card.ability_en)}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(2, 6, 23, 0.5);
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.05);
		border: 3px solid rgba(2, 6, 23, 1);
		border-radius: 100px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(6, 182, 212, 0.2);
	}
</style>
