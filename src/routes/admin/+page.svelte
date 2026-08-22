<script lang="ts">
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { onMount } from 'svelte';

	interface User {
		id: string;
		email: string;
		display_name: string | null;
		profile_slug: string | null;
		profile_number: string | null;
		role: 'user' | 'admin';
		banned: boolean;
		created_at: string;
	}

	interface Deck {
		id: string;
		name: string;
		champion_code: string;
		visibility: 'private' | 'unlisted' | 'public';
		hidden: boolean;
		created_at: string;
		app_users: {
			id: string;
			email: string;
			display_name: string | null;
		} | null;
	}

	let { data } = $props<{
		data: {
			user: any;
			stats: {
				usersCount: number;
				decksCount: number;
				openReportsCount: number;
				unreadConversationsCount: number;
			};
			users: User[];
			decks: Deck[];
		};
	}>();

	let activeTab = $state<'users' | 'decks' | 'system'>('users');

	// Toast message state
	let toast = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
	function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
		toast = null;
		window.setTimeout(() => {
			toast = { message, type };
		}, 0);
	}

	// Users state & search
	let users = $state<User[]>([]);
	let userQuery = $state('');
	let usersLoading = $state(false);

	// Decks state & search
	let decks = $state<Deck[]>([]);
	let deckQuery = $state('');
	let decksLoading = $state(false);
	const visibilityLabels = { private: 'ส่วนตัว', unlisted: 'ไม่แสดงในรายการ', public: 'สาธารณะ' };

	let didHydrate = $state(false);
	$effect(() => {
		if (didHydrate) return;
		users = data.users ?? [];
		decks = data.decks ?? [];
		didHydrate = true;
	});

	// Ban/Unban processing state
	let processingUserId = $state('');

	// Deck hiding processing state
	let processingDeckId = $state('');

	async function searchUsers() {
		usersLoading = true;
		try {
			const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userQuery)}`);
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'ค้นหาผู้ใช้ไม่สำเร็จ');
			users = resData.users ?? [];
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'ค้นหาไม่สำเร็จ', 'error');
		} finally {
			usersLoading = false;
		}
	}

	async function searchDecks() {
		decksLoading = true;
		try {
			const res = await fetch(`/api/admin/decks?q=${encodeURIComponent(deckQuery)}`);
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'ค้นหาเด็คไม่สำเร็จ');
			decks = resData.decks ?? [];
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'ค้นหาไม่สำเร็จ', 'error');
		} finally {
			decksLoading = false;
		}
	}

	async function toggleBan(targetUser: User) {
		processingUserId = targetUser.id;
		const action = targetUser.banned ? 'unban' : 'ban';
		try {
			const res = await fetch('/api/admin/ban', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: targetUser.id, action })
			});
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || `Failed to ${action} user`);

			// Update local list
			users = users.map((u) => (u.id === targetUser.id ? { ...u, banned: !targetUser.banned } : u));
			showToast(
				action === 'ban' ? 'แบนผู้ใช้สำเร็จและตัดการเชื่อมต่อแล้ว' : 'ปลดแบนผู้ใช้สำเร็จ',
				'success'
			);
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ', 'error');
		} finally {
			processingUserId = '';
		}
	}

	async function toggleDeckHidden(targetDeck: Deck) {
		processingDeckId = targetDeck.id;
		const nextHidden = !targetDeck.hidden;
		try {
			const res = await fetch('/api/decks', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deckId: targetDeck.id, hidden: nextHidden })
			});
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'อัปเดตเด็คไม่สำเร็จ');

			// Update local list
			decks = decks.map((d) => (d.id === targetDeck.id ? { ...d, hidden: nextHidden } : d));
			showToast(nextHidden ? 'ซ่อนเด็คสำเร็จ' : 'ยกเลิกซ่อนเด็คสำเร็จ', 'success');
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ', 'error');
		} finally {
			processingDeckId = '';
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
			<p class="rt-kicker mb-3">ระบบผู้ดูแล</p>
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">แดชบอร์ด</h1>
					<p class="rt-copy mt-3 max-w-2xl text-sm leading-relaxed">
						ยินดีต้อนรับผู้ดูแลระบบ จัดการผู้ใช้ รายงาน และระบบฐานข้อมูลหลักของ RiftThai
					</p>
				</div>
			</div>
		</header>

		<!-- Statistics Grid -->
		<section class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
			<article class="rt-panel flex flex-col justify-between rounded-xl p-4 sm:p-5">
				<div>
					<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase"
						>ผู้ใช้ทั้งหมด</span
					>
					<h2 class="mt-2 text-3xl font-black text-white italic">{data.stats.usersCount}+</h2>
				</div>
				<button
					type="button"
					onclick={() => (activeTab = 'users')}
					class="mt-4 text-left text-xs font-black tracking-widest text-cyan-300 uppercase transition hover:text-cyan-200"
				>
					จัดการผู้ใช้ &rarr;
				</button>
			</article>

			<article class="rt-panel flex flex-col justify-between rounded-xl p-4 sm:p-5">
				<div>
					<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase"
						>เด็คออนไลน์</span
					>
					<h2 class="mt-2 text-3xl font-black text-white italic">{data.stats.decksCount}+</h2>
				</div>
				<button
					type="button"
					onclick={() => (activeTab = 'decks')}
					class="mt-4 text-left text-xs font-black tracking-widest text-cyan-300 uppercase transition hover:text-cyan-200"
				>
					จัดการเด็ค &rarr;
				</button>
			</article>

			<a
				href="/admin/reports"
				class="rt-panel flex flex-col justify-between rounded-xl p-4 transition hover:border-cyan-300/20 sm:p-5"
			>
				<div>
					<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase"
						>รายงานที่รอตรวจ</span
					>
					<h2
						class="mt-2 text-3xl font-black text-white italic {data.stats.openReportsCount > 0
							? 'text-amber-300'
							: ''}"
					>
						{data.stats.openReportsCount}
					</h2>
				</div>
				<span class="mt-4 text-xs font-black tracking-widest text-cyan-300 uppercase">
					เปิดหน้าตรวจสอบ &rarr;
				</span>
			</a>

			<a
				href="/admin/chat"
				class="rt-panel flex flex-col justify-between rounded-xl p-4 transition hover:border-cyan-300/20 sm:p-5"
			>
				<div>
					<span class="text-[10px] font-black tracking-widest text-slate-500 uppercase"
						>แชตที่ยังไม่ได้อ่าน</span
					>
					<h2
						class="mt-2 text-3xl font-black text-white italic {data.stats.unreadConversationsCount >
						0
							? 'text-cyan-300'
							: ''}"
					>
						{data.stats.unreadConversationsCount}
					</h2>
				</div>
				<span class="mt-4 text-xs font-black tracking-widest text-cyan-300 uppercase">
					เปิดกล่องข้อความ &rarr;
				</span>
			</a>
		</section>

		<!-- Tabs navigation -->
		<div class="mb-6 flex gap-2 border-b border-white/10 pb-px">
			<button
				type="button"
				onclick={() => (activeTab = 'users')}
				class="border-b-2 px-4 py-2.5 text-xs font-black tracking-widest uppercase transition-all {activeTab ===
				'users'
					? 'border-cyan-300 text-white'
					: 'border-transparent text-slate-500 hover:text-slate-200'}"
			>
				จัดการผู้ใช้
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'decks')}
				class="border-b-2 px-4 py-2.5 text-xs font-black tracking-widest uppercase transition-all {activeTab ===
				'decks'
					? 'border-cyan-300 text-white'
					: 'border-transparent text-slate-500 hover:text-slate-200'}"
			>
				จัดการเด็ค
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'system')}
				class="border-b-2 px-4 py-2.5 text-xs font-black tracking-widest uppercase transition-all {activeTab ===
				'system'
					? 'border-cyan-300 text-white'
					: 'border-transparent text-slate-500 hover:text-slate-200'}"
			>
				สถานะระบบ
			</button>
		</div>

		<!-- Tab Panels -->
		{#if activeTab === 'users'}
			<section class="rt-panel rounded-xl p-4 sm:p-6">
				<div class="mb-6 flex gap-2">
					<input
						type="text"
						bind:value={userQuery}
						placeholder="ค้นหาผู้ใช้ด้วย Email, Display Name หรือ Profile Slug..."
						class="min-h-11 flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
						onkeydown={(e) => e.key === 'Enter' && searchUsers()}
					/>
					<button
						type="button"
						onclick={searchUsers}
						disabled={usersLoading}
						class="min-h-11 rounded-lg bg-cyan-300 px-6 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200 disabled:opacity-50"
					>
						{usersLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
					</button>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-xs font-bold text-slate-300">
						<thead>
							<tr class="border-b border-white/10 tracking-wider text-slate-500 uppercase">
								<th class="px-4 py-3">ชื่อที่แสดง / อีเมล</th>
								<th class="px-4 py-3">สิทธิ์</th>
								<th class="px-4 py-3">สถานะ</th>
								<th class="px-4 py-3 text-right">คำสั่ง</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each users as user (user.id)}
								<tr class="hover:bg-white/2">
									<td class="px-4 py-4">
										<div class="text-sm font-black text-white">
											{user.display_name || 'ไม่ระบุชื่อ'}
											{#if user.profile_number}
												<span class="text-xs text-slate-500">#{user.profile_number}</span>
											{/if}
										</div>
										<div class="mt-1 text-[10px] font-semibold text-slate-400">{user.email}</div>
										<div class="mt-1 text-[9px] text-slate-500">
											สมัครเมื่อ {new Date(user.created_at).toLocaleDateString()}
										</div>
									</td>
									<td class="px-4 py-4 text-[10px] tracking-wider uppercase">
										<span
											class="rounded border px-2 py-0.5 {user.role === 'admin'
												? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200'
												: 'border-slate-700 bg-slate-800 text-slate-400'}"
										>
											{user.role}
										</span>
									</td>
									<td class="px-4 py-4 text-[10px] tracking-wider uppercase">
										{#if user.banned}
											<span
												class="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-300"
												>ถูกแบน</span
											>
										{:else}
											<span
												class="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
												>ใช้งานอยู่</span
											>
										{/if}
									</td>
									<td class="px-4 py-4 text-right">
										<button
											type="button"
											onclick={() => toggleBan(user)}
											disabled={processingUserId === user.id || user.role === 'admin'}
											class="rounded-lg border px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition disabled:opacity-50
											{user.banned
												? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
												: 'border-rose-300/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20'}"
										>
											{processingUserId === user.id
												? 'กำลังดำเนินการ...'
												: user.banned
													? 'ปลดแบน'
													: 'แบนผู้ใช้'}
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="4" class="py-8 text-center text-slate-500">ไม่พบข้อมูลผู้ใช้</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{:else if activeTab === 'decks'}
			<section class="rt-panel rounded-xl p-4 sm:p-6">
				<div class="mb-6 flex gap-2">
					<input
						type="text"
						bind:value={deckQuery}
						placeholder="ค้นหาเด็คตามชื่อเด็ค..."
						class="min-h-11 flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
						onkeydown={(e) => e.key === 'Enter' && searchDecks()}
					/>
					<button
						type="button"
						onclick={searchDecks}
						disabled={decksLoading}
						class="min-h-11 rounded-lg bg-cyan-300 px-6 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200 disabled:opacity-50"
					>
						{decksLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
					</button>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-xs font-bold text-slate-300">
						<thead>
							<tr class="border-b border-white/10 tracking-wider text-slate-500 uppercase">
								<th class="px-4 py-3">ชื่อเด็ค</th>
								<th class="px-4 py-3">ผู้สร้าง</th>
								<th class="px-4 py-3">การมองเห็น</th>
								<th class="px-4 py-3">สถานะ</th>
								<th class="px-4 py-3 text-right">คำสั่ง</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each decks as deck (deck.id)}
								<tr class="hover:bg-white/2">
									<td class="px-4 py-4">
										<a
											href="/deck/{deck.id}"
											target="_blank"
											class="text-sm font-black text-white hover:text-cyan-300 hover:underline"
										>
											{deck.name || 'เด็คไม่มีชื่อ'}
										</a>
										<div class="mt-1 text-[10px] text-slate-500">
											สร้างเมื่อ {new Date(deck.created_at).toLocaleDateString()}
										</div>
									</td>
									<td class="px-4 py-4 font-semibold">
										{#if deck.app_users}
											<div class="font-black text-white">
												{deck.app_users.display_name || 'ไม่ระบุชื่อ'}
											</div>
											<div class="mt-0.5 text-[10px] text-slate-500">{deck.app_users.email}</div>
										{:else}
											<span class="text-slate-500">ไม่ระบุชื่อ</span>
										{/if}
									</td>
									<td class="px-4 py-4 text-[10px] tracking-wider uppercase">
										<span
											class="rounded border px-2 py-0.5 {deck.visibility === 'public'
												? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
												: 'border-slate-700 bg-slate-800 text-slate-400'}"
										>
											{visibilityLabels[deck.visibility]}
										</span>
									</td>
									<td class="px-4 py-4 text-[10px] tracking-wider uppercase">
										{#if deck.hidden}
											<span
												class="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-300"
												>ผู้ดูแลซ่อน</span
											>
										{:else}
											<span
												class="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
												>มองเห็นได้</span
											>
										{/if}
									</td>
									<td class="px-4 py-4 text-right">
										<button
											type="button"
											onclick={() => toggleDeckHidden(deck)}
											disabled={processingDeckId === deck.id}
											class="rounded-lg border px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition disabled:opacity-50
											{deck.hidden
												? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
												: 'border-rose-300/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20'}"
										>
											{processingDeckId === deck.id
												? 'กำลังดำเนินการ...'
												: deck.hidden
													? 'ยกเลิกซ่อน'
													: 'ซ่อนเด็ค'}
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" class="py-8 text-center text-slate-500">ไม่พบข้อมูลเด็ค</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{:else if activeTab === 'system'}
			<section class="grid gap-6 lg:grid-cols-2">
				<article class="rt-panel rounded-xl p-5 sm:p-6">
					<h3 class="mb-4 text-lg font-black text-white uppercase italic">สถานะระบบ AI</h3>

					<div class="space-y-4 text-sm font-semibold">
						<div class="flex justify-between border-b border-white/5 pb-2">
							<span class="text-slate-400">สถานะ Gemini API</span>
							<span class={data.aiConfig?.geminiConfigured ? 'text-emerald-300' : 'text-rose-300'}>
								{data.aiConfig?.geminiConfigured ? 'เชื่อมต่อและตั้งค่าแล้ว' : 'ออฟไลน์'}
							</span>
						</div>
						<div class="flex justify-between border-b border-white/5 pb-2">
							<span class="text-slate-400">โมเดล Gemini LLM</span>
							<span class="font-black text-white">{data.aiConfig?.geminiModel || 'N/A'}</span>
						</div>
						<div class="flex justify-between border-b border-white/5 pb-2">
							<span class="text-slate-400">ระบบวิเคราะห์เด็คด้วย AI</span>
							<span class={data.aiConfig?.geminiConfigured ? 'text-emerald-300' : 'text-rose-300'}>
								{data.aiConfig?.geminiConfigured ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม'}
							</span>
						</div>
					</div>
				</article>

				<article class="rt-panel rounded-xl p-5 sm:p-6">
					<h3 class="mb-4 text-lg font-black text-white uppercase italic">ทางลัดและเครื่องมือ</h3>
					<div class="grid gap-3">
						<a
							href="/admin/reports"
							class="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/20 p-4 transition hover:border-cyan-300/30 hover:bg-white/5"
						>
							<div>
								<h4 class="text-sm font-black text-white">ตรวจสอบ Card Reports</h4>
								<p class="mt-1 text-xs text-slate-400">
									ดูรายงานแปลผิดพลาด, ภาพไม่ขึ้น, หรือปัญหาอื่นๆ
								</p>
							</div>
							<span class="font-bold text-cyan-300">&rarr;</span>
						</a>

						<a
							href="/admin/chat"
							class="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/20 p-4 transition hover:border-cyan-300/30 hover:bg-white/5"
						>
							<div>
								<h4 class="text-sm font-black text-white">กล่องข้อความผู้ใช้ (Inbox)</h4>
								<p class="mt-1 text-xs text-slate-400">
									ตอบกลับความช่วยเหลือ และติดต่อสื่อสารกับผู้เล่น
								</p>
							</div>
							<span class="font-bold text-cyan-300">&rarr;</span>
						</a>
					</div>
				</article>
			</section>
		{/if}
	</main>
</div>

{#if toast}
	<Toast show={true} message={toast.message} type={toast.type} onclose={() => (toast = null)} />
{/if}
