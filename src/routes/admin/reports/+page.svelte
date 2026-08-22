<script lang="ts">
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import CardModal from '$lib/components/CardModal.svelte';
	import { getCardImageUrl } from '$lib/utils/cardImages';
	import type { Card } from '$lib/types/card';
	import type { CardReport, CardReportStatus } from '$lib/types/cardReport';

	let { data } = $props<{ data: { reports: CardReport[]; cards: Card[] } }>();
	let reports = $state<CardReport[]>([]);
	let statusFilter = $state<CardReportStatus | 'all'>('all');
	let updatingId = $state('');
	let errorMessage = $state('');
	let didHydrate = $state(false);
	let selectedPopupCard = $state<Card | null>(null);
	const statusLabels: Record<string, string> = {
		open: 'เปิดอยู่',
		reviewing: 'กำลังตรวจสอบ',
		resolved: 'แก้ไขแล้ว',
		dismissed: 'ยกเลิก'
	};
	const reportTypeLabels: Record<string, string> = {
		translation: 'คำแปล',
		card_data: 'ข้อมูลการ์ด',
		image: 'รูปภาพ',
		rules_text: 'ข้อความกติกา',
		other: 'อื่นๆ'
	};

	let filteredReports = $derived(
		statusFilter === 'all' ? reports : reports.filter((report) => report.status === statusFilter)
	);

	$effect(() => {
		if (didHydrate) return;
		reports = data.reports ?? [];
		didHydrate = true;
	});

	function findCardByCode(code: string): Card | undefined {
		return data.cards?.find((c: Card) => c.code === code);
	}

	async function updateReport(report: CardReport, status: CardReportStatus) {
		updatingId = report.id;
		errorMessage = '';
		try {
			const response = await fetch('/api/admin-reports', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reportId: report.id, status, adminNote: report.admin_note })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'อัปเดตรายงานไม่สำเร็จ');
			reports = reports.map((item) => (item.id === report.id ? payload.report : item));
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'อัปเดตรายงานไม่สำเร็จ';
		} finally {
			updatingId = '';
		}
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/85 backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a
				href="/"
				class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic"
			>
				Rift<span class="rt-brand-accent">Thai</span>
			</a>
			<SiteMenu />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline mb-6 rounded-xl p-5 sm:p-7">
			<p class="rt-kicker mb-3">ผู้ดูแลระบบ</p>
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">รายงานข้อมูลการ์ด</h1>
					<p class="rt-copy mt-3 max-w-2xl text-sm">
						ตรวจสอบรายงานคำแปล รูปภาพ และข้อมูลการ์ดจากผู้ใช้
					</p>
				</div>
				<select
					bind:value={statusFilter}
					class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-xs font-black tracking-widest text-white uppercase focus:border-cyan-300/50 focus:outline-none"
				>
					<option value="all">ทั้งหมด</option>
					<option value="open">เปิดอยู่</option>
					<option value="reviewing">กำลังตรวจสอบ</option>
					<option value="resolved">แก้ไขแล้ว</option>
					<option value="dismissed">ยกเลิก</option>
				</select>
			</div>
		</header>

		{#if errorMessage}
			<div
				class="mb-4 rounded-lg border border-rose-300/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-100"
			>
				{errorMessage}
			</div>
		{/if}

		<section class="grid gap-4">
			{#each filteredReports as report}
				{@const card = findCardByCode(report.card_code)}
				<article class="rt-panel rounded-xl p-4 sm:p-5">
					<div class="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div class="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
							{#if card}
								<button
									type="button"
									onclick={() => (selectedPopupCard = card)}
									class="group relative w-20 shrink-0 self-start overflow-hidden rounded-lg border border-white/10 bg-slate-950 transition hover:border-cyan-300/50 sm:w-24 {card.type ===
									'Battlefield'
										? 'aspect-[184/132]'
										: 'aspect-[132/184]'}"
								>
									{#if card.image_url}
										<img
											src={getCardImageUrl(card.image_url, 140, 'webp')}
											alt={card.name_en}
											class="h-full w-full {card.name_en === 'Baron Pit' || card.name_en === 'Brush'
												? 'object-contain'
												: 'object-cover'} transition duration-300 group-hover:scale-105"
										/>
									{:else}
										<div
											class="flex h-full items-center justify-center p-1 text-center text-[8px] font-black text-slate-400 uppercase"
										>
											{card.name_en}
										</div>
									{/if}
									<div
										class="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-black tracking-wider text-white uppercase opacity-0 transition group-hover:opacity-100"
									>
										ดู
									</div>
								</button>
							{/if}

							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-black tracking-widest text-cyan-100 uppercase"
									>
										{reportTypeLabels[report.report_type] ?? report.report_type}
									</span>
									<span
										class="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black tracking-widest text-slate-300 uppercase"
									>
										{statusLabels[report.status] ?? report.status}
									</span>
									<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
										{new Date(report.created_at).toLocaleString()}
									</span>
								</div>
								<h2
									class="mt-3 flex flex-wrap items-center gap-2 text-xl font-black text-white uppercase italic"
								>
									<span>{report.card_name}</span>
									{#if card}
										<button
											type="button"
											onclick={() => (selectedPopupCard = card)}
											class="flex cursor-pointer items-center gap-1 rounded border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-300 normal-case not-italic transition hover:bg-cyan-500/20"
										>
											ดูการ์ด
										</button>
									{/if}
								</h2>
								<p class="mt-1 text-xs font-black tracking-widest text-slate-500 uppercase">
									{report.card_code}
								</p>
								<p
									class="mt-4 text-sm leading-relaxed font-semibold whitespace-pre-wrap text-slate-300"
								>
									{report.message}
								</p>
								<p class="mt-3 text-xs font-bold text-slate-500">
									จาก: {report.app_users?.display_name ||
										report.app_users?.email?.split('@')[0] ||
										'ไม่ระบุชื่อ'}
								</p>
							</div>
						</div>

						<div class="grid min-w-48 shrink-0 gap-2">
							{#each ['open', 'reviewing', 'resolved', 'dismissed'] as nextStatus}
								<button
									type="button"
									class="rounded-lg border border-white/10 px-3 py-2 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white disabled:opacity-45 {report.status ===
									nextStatus
										? 'bg-cyan-300 text-slate-950 hover:bg-cyan-300 hover:text-slate-950'
										: ''}"
									disabled={updatingId === report.id}
									onclick={() => updateReport(report, nextStatus as CardReportStatus)}
								>
									{updatingId === report.id && report.status !== nextStatus
										? 'กำลังอัปเดต...'
										: statusLabels[nextStatus]}
								</button>
							{/each}
						</div>
					</div>
				</article>
			{:else}
				<section class="rt-panel rounded-xl p-8 text-center">
					<h2 class="text-2xl font-black text-white uppercase italic">ไม่พบรายงาน</h2>
					<p class="rt-copy mx-auto mt-3 max-w-lg text-sm">ไม่มีรายงานตรงกับตัวกรองนี้</p>
				</section>
			{/each}
		</section>
	</main>

	{#if selectedPopupCard}
		<CardModal
			card={selectedPopupCard}
			closePopup={() => (selectedPopupCard = null)}
			canEdit={false}
		/>
	{/if}
</div>
