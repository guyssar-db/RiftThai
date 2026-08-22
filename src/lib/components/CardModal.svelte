<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { keywords, iconMappings } from '$lib/data/keywords';
	import { getRarityIcon } from '$lib/data/rarityIcons';
	import { getTypeIcons } from '$lib/data/typeIcons';
	import type { Card } from '$lib/types/card';
	import { getCardImageSources } from '$lib/utils/cardImages';
	let {
		card,
		closePopup,
		canEdit = false,
		showAutoSkill = false,
		onAutoSkill = undefined
	} = $props<{
		card: Card;
		closePopup: () => void;
		canEdit?: boolean;
		showAutoSkill?: boolean;
		onAutoSkill?: () => void;
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
	let activeLang = $state<'th' | 'en'>('th');
	let modalElement: HTMLDivElement | null = null;
	let previouslyFocusedElement: HTMLElement | null = null;
	let previousBodyOverflow = '';

	function getFocusableElements() {
		if (!modalElement) return [];

		return Array.from(
			modalElement.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => element.getClientRects().length > 0);
	}

	function handleModalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			closePopup();
			return;
		}

		if (event.key !== 'Tab') return;

		const focusableElements = getFocusableElements();
		if (focusableElements.length === 0) {
			event.preventDefault();
			modalElement?.focus();
			return;
		}

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (event.shiftKey && document.activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		} else if (!event.shiftKey && document.activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	}

	onMount(() => {
		previouslyFocusedElement = document.activeElement as HTMLElement | null;
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		void tick().then(() => {
			const focusableElements = getFocusableElements();
			(focusableElements[0] ?? modalElement)?.focus();
		});

		return () => {
			document.body.style.overflow = previousBodyOverflow;
			previouslyFocusedElement?.focus();
		};
	});

	$effect(() => {
		tempAbilityEn = card.ability_en;
		tempAbilityTh = card.ability_th;
		activeLang = 'th';
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
			alert('บันทึกสำเร็จ');
		} else {
			alert('บันทึกไม่สำเร็จ: ' + result.message);
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
			if (!response.ok) throw new Error(payload.error || 'ส่งรายงานไม่สำเร็จ');
			reportNotice = 'ส่งรายงานแล้ว ขอบคุณครับ';
			reportMessage = '';
			isReportOpen = false;
		} catch (error) {
			reportNotice = error instanceof Error ? error.message : 'ส่งรายงานไม่สำเร็จ';
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
			'Banish: การนำการ์ดออกจากเกม ไม่ถือว่าอยู่ใน Trash และโดยปกติไม่สามารถนำกลับมาได้ เว้นแต่จะมีการ์ดที่ระบุไว้โดยเฉพาะ'
	};

	function escapeHtml(str: string) {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function parseAbility(text: string) {
		if (!text) return '';
		let processed = escapeHtml(text);
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

		// Normalize keyword arrows
		processed = processed.replace(
			/\[(?:\&gt;|\>){1,2}\]\s*\[([^\]]+)\]\s*\[(?:\&gt;|\>){1,2}\]/gi,
			'[>>$1>]'
		);
		processed = processed.replace(
			/\[([^\]]+)\]\s*\[(?:\&gt;|\>){1,2}\]\s*\[(?:\&gt;|\>){1,2}\]/gi,
			'[>>$1>]'
		);
		processed = processed.replace(/\[(?:\&gt;|\>){2}\]\s*\[([^\]]+)\]/gi, '[>>$1]');
		processed = processed.replace(/\[([^\]]+)\]\s*\[(?:\&gt;|\>)\]/gi, '[$1>]');
		processed = processed.replace(/\[(?:\&gt;|\>)\]\s*\[([^\]]+)\]/gi, '[>>$1]');

		// Standalone arrow markers (when not attached to a keyword)
		processed = processed.replace(/\[(?:\&gt;|\>){2}\]/gi, () =>
			addPH('<span class="kw-arrow-standalone" title="Action Trigger">»</span>')
		);
		processed = processed.replace(/\[(?:\&gt;|\>)\]/gi, () =>
			addPH('<span class="kw-arrow-standalone" title="Trigger">›</span>')
		);

		// Rainbow Rune [a]
		processed = processed.replace(/\[a\]/gi, () =>
			addPH(
				`<img src="/images/icons/rune_rainbow.svg" class="inline-icon" title="Any Rune" alt="Any Rune" />`
			)
		);

		// Might [s]
		processed = processed.replace(/\[s\]/gi, () =>
			addPH(`<img src="/images/icons/might.svg" class="inline-icon" title="Might" alt="Might" />`)
		);

		// Exhaust [T]
		processed = processed.replace(/\[t\]/gi, () =>
			addPH(
				`<img src="/images/icons/exhaust.svg" class="inline-icon" title="Exhaust" alt="Exhaust" />`
			)
		);

		// Green Calm Rune [g]
		processed = processed.replace(/\[g\]/gi, () =>
			addPH(
				`<img src="/images/icons/icon_calm.avif" class="inline-icon" title="Calm" alt="Calm" />`
			)
		);

		// Red Fury Rune [r]
		processed = processed.replace(/\[r\]/gi, () =>
			addPH(
				`<img src="/images/icons/icon_fury.avif" class="inline-icon" title="Fury" alt="Fury" />`
			)
		);

		// Orange Body Rune [o]
		processed = processed.replace(/\[o\]/gi, () =>
			addPH(
				`<img src="/images/icons/icon_body.avif" class="inline-icon" title="Body" alt="Body" />`
			)
		);

		// Blue Mind Rune [b]
		processed = processed.replace(/\[b\]/gi, () =>
			addPH(
				`<img src="/images/icons/icon_mind.avif" class="inline-icon" title="Mind" alt="Mind" />`
			)
		);

		// Pink Chaos Rune [p]
		processed = processed.replace(/\[p\]/gi, () =>
			addPH(
				`<img src="/images/icons/icon_chaos.avif" class="inline-icon" title="Chaos" alt="Chaos" />`
			)
		);

		// Card Domain [c]
		processed = processed.replace(/\[c\]/gi, () => {
			if (!card.domains || card.domains.length === 0) return '';
			return card.domains
				.map((d: string) => {
					const lowerD = d.toLowerCase();
					const iconFile = lowerD === 'colorless' ? 'rune.avif' : `icon_${lowerD}.avif`;
					return addPH(
						`<img src="/images/icons/${iconFile}" class="inline-icon" title="${d}" alt="${d}" />`
					);
				})
				.join('');
		});

		// Generic energy cost / number circle [number]
		processed = processed.replace(/\[(\d+)\]/g, (match, p1) =>
			addPH(`<span class="icon-energy-circle" title="Energy: ${p1}">${p1}</span>`)
		);

		// Energy Icons
		processed = processed.replace(/:rb_energy_(\d+):/g, (match, p1) =>
			addPH(`<span class="icon-energy-circle" title="Energy: ${p1}">${p1}</span>`)
		);

		// Other Icons from mappings
		Object.entries(iconMappings).forEach(([key, value]) => {
			processed = processed.replace(new RegExp(key, 'g'), () =>
				addPH(
					`<img src="/images/icons/${value.icon}" class="inline-icon" title="${escapeHtml(value.hint)}" alt="${escapeHtml(key)}" />`
				)
			);
		});

		// Keep keyword costs inside the same keyword background dynamically for all keywords except "Add"
		const costKeywordNames = keywords
			.filter((k) => k.id !== 'add')
			.flatMap((k) => [k.name_en, k.name_th]);
		const escapedNames = [...new Set(costKeywordNames)]
			.filter(Boolean)
			.map((name) => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
		const costKeywordRegex = new RegExp(
			`\\[(${escapedNames.join('|')})\\]((?:\\s*___PH\\d+___)+)`,
			'gi'
		);

		processed = processed.replace(costKeywordRegex, (_match, keyword, costs) => {
			const kw = keywords.find(
				(k) =>
					k.name_en.toLowerCase() === keyword.toLowerCase() ||
					k.name_th.toLowerCase() === keyword.toLowerCase()
			);
			const bgColor = kw ? kw.color : '#107361';
			const hint = kw ? kw.description_th : '';
			const textColor = bgColor === '#97B028' ? 'color: #020617;' : '';
			return addPH(
				`<span class="kw-inline-badge kw-cost-badge cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300" tabindex="0" data-tooltip="${escapeHtml(hint)}" style="background-color: ${bgColor}; ${textColor} border: none; shadow: none;"><span>${escapeHtml(keyword)}</span>${costs}</span>`
			);
		});

		// Keywords [Badge]
		processed = processed.replace(/\[([^\]]+)\]/g, (match, p1) => {
			let trimmedP1 = p1.trim();
			const hasLeftArrow = trimmedP1.startsWith('>>') || trimmedP1.startsWith('>');
			if (hasLeftArrow) {
				trimmedP1 = trimmedP1.replace(/^>+/, '').trim();
			}
			const hasRightArrow = trimmedP1.endsWith('>');
			const displayP1 = hasRightArrow ? trimmedP1.slice(0, -1).trim() : trimmedP1;

			const cleanP1 = displayP1.split(' ')[0];
			const kw = keywords.find(
				(k) =>
					k.name_en.toLowerCase() === cleanP1.toLowerCase() ||
					k.name_th.toLowerCase() === cleanP1.toLowerCase() ||
					cleanP1.toLowerCase().includes(k.name_en.toLowerCase())
			);
			const bgColor = kw ? kw.color : '#107361';
			const hint = kw ? kw.description_th : '';
			const textColor = bgColor === '#97B028' ? 'color: #020617;' : '';

			let arrowClass = 'kw-inline-badge';
			if (hasLeftArrow && hasRightArrow) {
				arrowClass = 'kw-inline-badge kw-arrow-double';
			} else if (hasRightArrow) {
				arrowClass = 'kw-inline-badge kw-arrow-right';
			} else if (hasLeftArrow) {
				arrowClass = 'kw-inline-badge kw-arrow-left';
			}
			const className = `${arrowClass} cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300`;

			if (hint) {
				return addPH(
					`<span class="${className}" tabindex="0" data-tooltip="${escapeHtml(hint)}" style="background-color: ${bgColor}; ${textColor} border: none; shadow: none;"><span>${escapeHtml(displayP1)}</span></span>`
				);
			}
			return addPH(
				`<span class="${arrowClass}" style="background-color: ${bgColor}; ${textColor} border: none; shadow: none;"><span>${escapeHtml(displayP1)}</span></span>`
			);
		});

		// Mechanics (Ready, Exhaust, etc.)
		const sortedMechanics = Object.entries(mechanics).sort((a, b) => b[0].length - a[0].length);
		sortedMechanics.forEach(([key, hint]) => {
			const regex = new RegExp(`\\b(${key})\\b`, 'gi');
			processed = processed.replace(regex, (match) =>
				addPH(
					`<span class="text-cyan-400 underline decoration-cyan-400/30 decoration-dotted underline-offset-4 cursor-pointer inline-block font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300" tabindex="0" data-tooltip="${escapeHtml(hint)}">${escapeHtml(match)}</span>`
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

	function formatTranslatedAbility(text: string, _sourceText?: string) {
		if (!text) return '';
		let formatted = text.replace(/\\n/g, '\n');
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

<svelte:window onkeydown={handleModalKeydown} />

{#if activeTooltip}
	<div
		class="animate-in fade-in zoom-in pointer-events-none fixed z-[9999] max-w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-slate-900/96 p-3.5 text-center font-sans text-xs leading-relaxed font-medium
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
	class="animate-in fade-in fixed inset-0 z-[1000] flex items-center justify-center p-2 duration-200 sm:p-5 lg:p-8"
	onclick={closePopup}
>
	<div class="absolute inset-0 bg-slate-950/88 backdrop-blur-xl transition-opacity"></div>

	<div
		bind:this={modalElement}
		role="dialog"
		aria-modal="true"
		aria-labelledby="card-modal-title"
		tabindex="-1"
		class="rt-panel animate-in zoom-in-95 relative flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl transition-all duration-300 sm:max-h-[92dvh]"
		onclick={(e) => {
			e.stopPropagation();
			activeTooltip = '';
		}}
	>
		<!-- Mobile Header -->
		<div
			class="flex items-center justify-between border-b border-white/8 bg-slate-950/55 p-3 lg:hidden"
		>
			<div class="flex items-center gap-3">
				<div class="h-1.5 w-1.5 rounded-full bg-cyan-300"></div>
				<span class="font-display text-xs font-semibold tracking-[0.12em] text-slate-200"
					>{card.code}</span
				>
			</div>
			<button
				class="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-300 transition hover:bg-white/[0.07] hover:text-white active:scale-95"
				onclick={closePopup}
				aria-label="ปิดรายละเอียดการ์ด"
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
			class="absolute top-5 right-5 z-50 hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950/55 text-slate-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white lg:flex"
			onclick={closePopup}
			aria-label="ปิดรายละเอียดการ์ด"
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
			<div class="grid lg:grid-cols-[minmax(290px,0.82fr)_minmax(0,1.18fr)] lg:items-stretch">
				<!-- Image Section -->
				<div
					class="group relative flex items-center justify-center border-b border-white/8 bg-slate-950/35 p-5 sm:p-7 lg:border-r lg:border-b-0 lg:p-9"
				>
					<div
						class="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(118,223,205,0.06),transparent_55%)]"
					></div>
					<div class="relative z-10 w-full max-w-[250px] sm:max-w-[340px] lg:max-w-[380px]">
						<img
							src={modalImageSources.fallback}
							srcset={modalImageSources.fallbackSrcset}
							sizes="(min-width: 1024px) 380px, (min-width: 640px) 340px, 250px"
							alt={card.name_en}
							loading="eager"
							decoding="async"
							fetchpriority="high"
							draggable="false"
							class="pointer-events-none h-auto w-full rounded-xl border border-white/8 object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-[1.01]"
						/>
					</div>
				</div>

				<!-- Info Section -->
				<div class="space-y-7 bg-slate-900/35 p-5 sm:p-7 lg:p-9 lg:pr-16">
					<div class="space-y-5">
						<div class="flex flex-wrap items-center gap-2.5">
							<span
								class="rounded-lg border border-cyan-300/18 bg-cyan-300/[0.07] px-3 py-1.5 font-display text-[10px] font-semibold tracking-[0.12em] text-cyan-200"
							>
								{card.code}
							</span>
							{#if card.set_name}
								<span
									class="rounded-lg border border-white/8 bg-white/[0.025] px-3 py-1.5 font-display text-[10px] font-semibold tracking-[0.08em] text-slate-400"
								>
									{card.set_name}
								</span>
							{/if}
						</div>

						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 space-y-2">
								<h2
									id="card-modal-title"
									class="font-display text-2xl leading-tight font-bold tracking-[-0.035em] break-words text-white sm:text-3xl lg:text-[2.35rem]"
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
							<button
								type="button"
								class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-md transition duration-200 select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25 {isReportOpen
									? 'border-amber-400 bg-amber-400/15 text-amber-300 shadow-amber-500/10'
									: 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500 hover:text-white'}"
								onclick={() => (isReportOpen = !isReportOpen)}
								title="รายงานปัญหา"
								aria-label="รายงานปัญหาของ {card.name_en}"
							>
								i
							</button>
						</div>

						<div class="rounded-xl border border-white/8 bg-slate-950/35 p-2">
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
									<span
										class="min-w-0 truncate text-xs font-black tracking-wider text-white uppercase"
										>{card.type || '-'}</span
									>
								</div>

								<div
									class="flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold tracking-wide uppercase {card.rarity
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
									<span class="font-bold">{card.rarity || 'ไม่ระบุความหายาก'}</span>
								</div>

								{#if card.domains?.length > 0}
									{#each card.domains as domain}
										<div
											class="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2"
										>
											<img
												src="/images/icons/{domainIconMap[domain] || 'rune_rainbow.svg'}"
												class="h-5 w-5 object-contain"
												alt={domain}
											/>
											<span class="text-xs font-black tracking-wider text-white uppercase"
												>{domain}</span
											>
										</div>
									{/each}
								{/if}

								{#if card.energy !== null}
									<div
										class="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold tracking-wide text-white uppercase"
									>
										<span class="text-[11px] text-slate-500">Energy</span>
										<span
											class="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-xs font-bold text-slate-950"
											>{card.energy}</span
										>
									</div>
								{/if}

								{#if card.power !== null}
									<div
										class="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold tracking-wide text-white uppercase"
									>
										<span class="text-[11px] text-slate-500">Might</span>
										<img src="/images/icons/might.svg" class="h-5 w-auto" alt="Might" />
										<span class="font-bold">{card.power?.value?.label}</span>
									</div>
								{/if}
							</div>
						</div>

						{#if card.tags?.length > 0}
							<div class="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
								<div class="flex flex-wrap gap-2">
									{#each card.tags ?? [] as tag}
										<span
											class="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-1.5 text-[11px] font-bold tracking-wide text-cyan-300/80 uppercase"
										>
											#{tag}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<div class="space-y-8">
						{#if canEdit}
							<div class="flex items-center gap-3">
								<button
									class="rounded-xl px-5 py-2.5 text-[11px] font-bold tracking-wide uppercase transition-all {isEditing
										? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
										: 'border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'}"
									onclick={() => (isEditing = !isEditing)}
								>
									{isEditing ? 'ยกเลิกการแก้ไข' : 'แก้ไขข้อมูลหลัก'}
								</button>
								{#if isEditing}
									<button
										class="rounded-xl bg-cyan-500 px-5 py-2.5 text-[11px] font-bold tracking-wide text-slate-950 uppercase shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
										onclick={handleSave}
										disabled={isSaving}
									>
										{isSaving ? 'กำลังดำเนินการ...' : 'บันทึกการแก้ไข'}
									</button>
								{/if}
							</div>
						{/if}
						{#if showAutoSkill && onAutoSkill}
							<div
								class="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-3 shadow-lg shadow-cyan-500/5"
							>
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div class="text-xs font-bold text-cyan-400">
											Play Assistant (ระบบจำลองเอฟเฟกต์)
										</div>
										<div class="mt-1 text-xs font-semibold text-slate-400">
											เปิดใช้งานและประมวลผลเอฟเฟกต์ตามคำอธิบายของการ์ดใบนี้บนสนามจำลอง
										</div>
									</div>
									<button
										type="button"
										class="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-400 px-4 text-xs font-black tracking-widest text-slate-950 uppercase shadow-md shadow-cyan-500/10 transition hover:bg-cyan-300"
										onclick={onAutoSkill}
									>
										🪄 ใช้สกิล
									</button>
								</div>
							</div>
						{/if}
						{#if isReportOpen}
							<div class="mt-3 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4">
								<div class="mb-1.5 text-xs font-black tracking-widest text-amber-400 uppercase">
									รายงานปัญหา
								</div>
								{#if reportNotice}
									<div
										class="mb-3 rounded border border-cyan-400/20 bg-cyan-950/30 p-2 text-xs font-bold text-cyan-100"
									>
										{reportNotice}
									</div>
								{:else}
									<div class="mb-3 text-[11px] font-semibold text-slate-500">
										แจ้งคำแปล รูป หรือข้อมูลการ์ดที่ผิดพลาดในระบบ
									</div>
								{/if}
								<div class="grid gap-3">
									<select
										bind:value={reportType}
										class="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-xs font-bold text-white focus:border-cyan-400/50 focus:outline-none"
									>
										<option value="translation">คำแปลภาษาไทย</option>
										<option value="card_data">ข้อมูลและค่าสถานะการ์ด</option>
										<option value="image">รูปภาพการ์ด</option>
										<option value="rules_text">ข้อความกติกาการ์ด</option>
										<option value="other">อื่นๆ</option>
									</select>
									<textarea
										bind:value={reportMessage}
										class="min-h-24 resize-y rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
										maxlength="2000"
										placeholder="อธิบายจุดที่ต้องการเสนอแนะหรือแก้ไข..."
									></textarea>
									<button
										type="button"
										class="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-300 px-3 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200 disabled:opacity-45"
										disabled={reportMessage.trim().length < 4 || isReportSubmitting}
										onclick={submitReport}
									>
										{isReportSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
									</button>
								</div>
							</div>
						{/if}

						<div class="border-b border-white/5 pb-4">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold tracking-wide text-slate-500">
									{activeLang === 'th' ? 'คำแปลภาษาไทย' : 'ข้อความการ์ดภาษาอังกฤษ'}
								</span>
								<div
									class="flex rounded-lg border border-white/10 bg-slate-950/60 p-0.5 shadow-inner"
								>
									<button
										type="button"
										class="cursor-pointer rounded-md px-3.5 py-1 text-xs font-black transition-all duration-200 {activeLang ===
										'th'
											? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
											: 'text-slate-400 hover:text-white'}"
										onclick={() => (activeLang = 'th')}
									>
										TH
									</button>
									<button
										type="button"
										class="cursor-pointer rounded-md px-3.5 py-1 text-xs font-black transition-all duration-200 {activeLang ===
										'en'
											? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
											: 'text-slate-400 hover:text-white'}"
										onclick={() => (activeLang = 'en')}
									>
										EN
									</button>
								</div>
							</div>
						</div>

						{#if activeLang === 'th'}
							<div class="group/thai relative pl-5 sm:pl-7">
								<div class="absolute top-0 bottom-0 left-0 w-0.5 rounded-full bg-cyan-300/70"></div>
								{#if isEditing && canEdit}
									<textarea
										bind:value={tempAbilityTh}
										class="h-40 w-full rounded-lg border border-white/10 bg-slate-950 p-5 text-sm leading-relaxed font-medium text-white transition-all focus:border-cyan-500/50 focus:outline-none"
									></textarea>
								{:else}
									<!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
									<div
										class="text-lg leading-relaxed font-semibold tracking-tight break-words text-slate-100 sm:text-xl"
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
						{:else}
							<div class="group/en relative pl-5 sm:pl-7">
								<div
									class="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-gradient-to-b from-slate-500 to-slate-700 transition-shadow"
								></div>
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
						{/if}
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
