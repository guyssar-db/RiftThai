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

	let didHydrate = $state(false);
	$effect(() => {
		if (didHydrate) return;
		users = data.users ?? [];
		decks = data.decks ?? [];
		didHydrate = true;
	});

	// RAG System health check state
	let ragHealth = $state<any>(null);
	let ragLoading = $state(false);

	// Ban/Unban processing state
	let processingUserId = $state('');

	// Deck hiding processing state
	let processingDeckId = $state('');

	async function searchUsers() {
		usersLoading = true;
		try {
			const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userQuery)}`);
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'Failed to search users');
			users = resData.users ?? [];
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Search failed', 'error');
		} finally {
			usersLoading = false;
		}
	}

	async function searchDecks() {
		decksLoading = true;
		try {
			const res = await fetch(`/api/admin/decks?q=${encodeURIComponent(deckQuery)}`);
			const resData = await res.json();
			if (!res.ok) throw new Error(resData.error || 'Failed to search decks');
			decks = resData.decks ?? [];
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Search failed', 'error');
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
			users = users.map(u => u.id === targetUser.id ? { ...u, banned: !targetUser.banned } : u);
			showToast(action === 'ban' ? 'แบนผู้ใช้สำเร็จและตัดการเชื่อมต่อแล้ว' : 'ปลดแบนผู้ใช้สำเร็จ', 'success');
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Action failed', 'error');
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
			if (!res.ok) throw new Error(resData.error || 'Failed to update deck');
			
			// Update local list
			decks = decks.map(d => d.id === targetDeck.id ? { ...d, hidden: nextHidden } : d);
			showToast(nextHidden ? 'ซ่อนเด็คสำเร็จ' : 'ยกเลิกซ่อนเด็คสำเร็จ', 'success');
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Action failed', 'error');
		} finally {
			processingDeckId = '';
		}
	}

	async function fetchRagHealth() {
		ragLoading = true;
		try {
			const res = await fetch('/api/rag/health');
			ragHealth = await res.json();
		} catch (err) {
			console.error('RAG health check failed:', err);
		} finally {
			ragLoading = false;
		}
	}

	onMount(() => {
		fetchRagHealth();
	});
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>

	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/85 backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a
				href="/"
				class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic"
			>
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline mb-6 rounded-xl p-5 sm:p-7">
			<p class="rt-kicker mb-3">Admin Portal</p>
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">Dashboard</h1>
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
					<span class="text-[10px] font-black uppercase tracking-widest text-slate-500">ผู้ใช้ทั้งหมด</span>
					<h2 class="mt-2 text-3xl font-black text-white italic">{data.stats.usersCount}+</h2>
				</div>
				<button 
					type="button"
					onclick={() => activeTab = 'users'}
					class="mt-4 text-left text-xs font-black uppercase tracking-widest text-cyan-300 transition hover:text-cyan-200"
				>
					จัดการผู้ใช้ &rarr;
				</button>
			</article>

			<article class="rt-panel flex flex-col justify-between rounded-xl p-4 sm:p-5">
				<div>
					<span class="text-[10px] font-black uppercase tracking-widest text-slate-500">เด็คออนไลน์</span>
					<h2 class="mt-2 text-3xl font-black text-white italic">{data.stats.decksCount}+</h2>
				</div>
				<button 
					type="button"
					onclick={() => activeTab = 'decks'}
					class="mt-4 text-left text-xs font-black uppercase tracking-widest text-cyan-300 transition hover:text-cyan-200"
				>
					จัดการเด็ค &rarr;
				</button>
			</article>

			<a 
				href="/admin/reports" 
				class="rt-panel flex flex-col justify-between rounded-xl p-4 sm:p-5 transition hover:border-cyan-300/20"
			>
				<div>
					<span class="text-[10px] font-black uppercase tracking-widest text-slate-500">รายงานค้างคา (Reports)</span>
					<h2 class="mt-2 text-3xl font-black text-white italic {data.stats.openReportsCount > 0 ? 'text-amber-300' : ''}">
						{data.stats.openReportsCount}
					</h2>
				</div>
				<span class="mt-4 text-xs font-black uppercase tracking-widest text-cyan-300">
					เปิดหน้าตรวจสอบ &rarr;
				</span>
			</a>

			<a 
				href="/admin/chat" 
				class="rt-panel flex flex-col justify-between rounded-xl p-4 sm:p-5 transition hover:border-cyan-300/20"
			>
				<div>
					<span class="text-[10px] font-black uppercase tracking-widest text-slate-500">แชตยังไม่ได้อ่าน (Inbox)</span>
					<h2 class="mt-2 text-3xl font-black text-white italic {data.stats.unreadConversationsCount > 0 ? 'text-cyan-300' : ''}">
						{data.stats.unreadConversationsCount}
					</h2>
				</div>
				<span class="mt-4 text-xs font-black uppercase tracking-widest text-cyan-300">
					เปิด Inbox แชต &rarr;
				</span>
			</a>
		</section>

		<!-- Tabs navigation -->
		<div class="mb-6 flex gap-2 border-b border-white/10 pb-px">
			<button
				type="button"
				onclick={() => activeTab = 'users'}
				class="border-b-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all {activeTab === 'users' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-500 hover:text-slate-200'}"
			>
				จัดการผู้ใช้ (Users)
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'decks'}
				class="border-b-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all {activeTab === 'decks' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-500 hover:text-slate-200'}"
			>
				จัดการเด็ค (Decks)
			</button>
			<button
				type="button"
				onclick={() => activeTab = 'system'}
				class="border-b-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all {activeTab === 'system' ? 'border-cyan-300 text-white' : 'border-transparent text-slate-500 hover:text-slate-200'}"
			>
				ข้อมูลระบบ (System Health)
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
						class="min-h-11 rounded-lg bg-cyan-300 px-6 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
					>
						{usersLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
					</button>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-xs font-bold text-slate-300">
						<thead>
							<tr class="border-b border-white/10 text-slate-500 uppercase tracking-wider">
								<th class="py-3 px-4">Display Name / Email</th>
								<th class="py-3 px-4">Role</th>
								<th class="py-3 px-4">Status</th>
								<th class="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each users as user (user.id)}
								<tr class="hover:bg-white/2">
									<td class="py-4 px-4">
										<div class="text-sm font-black text-white">
											{user.display_name || 'No Name'}
											{#if user.profile_number}
												<span class="text-xs text-slate-500">#{user.profile_number}</span>
											{/if}
										</div>
										<div class="mt-1 text-[10px] text-slate-400 font-semibold">{user.email}</div>
										<div class="mt-1 text-[9px] text-slate-500">สมัครเมื่อ {new Date(user.created_at).toLocaleDateString()}</div>
									</td>
									<td class="py-4 px-4 uppercase tracking-wider text-[10px]">
										<span class="rounded px-2 py-0.5 border {user.role === 'admin' ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : 'border-slate-700 bg-slate-800 text-slate-400'}">
											{user.role}
										</span>
									</td>
									<td class="py-4 px-4 uppercase tracking-wider text-[10px]">
										{#if user.banned}
											<span class="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-rose-300">Banned</span>
										{:else}
											<span class="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">Active</span>
										{/if}
									</td>
									<td class="py-4 px-4 text-right">
										<button
											type="button"
											onclick={() => toggleBan(user)}
											disabled={processingUserId === user.id || user.role === 'admin'}
											class="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition disabled:opacity-50
											{user.banned 
												? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' 
												: 'border-rose-300/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20'}"
										>
											{processingUserId === user.id ? 'กำลังดำเนินการ...' : user.banned ? 'ปลดแบน' : 'แบนผู้ใช้'}
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
						class="min-h-11 rounded-lg bg-cyan-300 px-6 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
					>
						{decksLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
					</button>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-xs font-bold text-slate-300">
						<thead>
							<tr class="border-b border-white/10 text-slate-500 uppercase tracking-wider">
								<th class="py-3 px-4">Deck Name</th>
								<th class="py-3 px-4">Creator</th>
								<th class="py-3 px-4">Visibility</th>
								<th class="py-3 px-4">Status</th>
								<th class="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each decks as deck (deck.id)}
								<tr class="hover:bg-white/2">
									<td class="py-4 px-4">
										<a 
											href="/deck/{deck.id}" 
											target="_blank"
											class="text-sm font-black text-white hover:text-cyan-300 hover:underline"
										>
											{deck.name || 'Unnamed Deck'}
										</a>
										<div class="mt-1 text-[10px] text-slate-500">สร้างเมื่อ {new Date(deck.created_at).toLocaleDateString()}</div>
									</td>
									<td class="py-4 px-4 font-semibold">
										{#if deck.app_users}
											<div class="text-white font-black">{deck.app_users.display_name || 'No Display Name'}</div>
											<div class="text-[10px] text-slate-500 mt-0.5">{deck.app_users.email}</div>
										{:else}
											<span class="text-slate-500">Anonymous</span>
										{/if}
									</td>
									<td class="py-4 px-4 uppercase tracking-wider text-[10px]">
										<span class="rounded px-2 py-0.5 border {deck.visibility === 'public' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-slate-700 bg-slate-800 text-slate-400'}">
											{deck.visibility}
										</span>
									</td>
									<td class="py-4 px-4 uppercase tracking-wider text-[10px]">
										{#if deck.hidden}
											<span class="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-rose-300">Hidden by Admin</span>
										{:else}
											<span class="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">Visible</span>
										{/if}
									</td>
									<td class="py-4 px-4 text-right">
										<button
											type="button"
											onclick={() => toggleDeckHidden(deck)}
											disabled={processingDeckId === deck.id}
											class="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition disabled:opacity-50
											{deck.hidden 
												? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' 
												: 'border-rose-300/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20'}"
										>
											{processingDeckId === deck.id ? 'กำลังดำเนินการ...' : deck.hidden ? 'ยกเลิกซ่อน' : 'ซ่อนเด็ค'}
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
					<h3 class="text-lg font-black text-white uppercase italic mb-4">RAG / AI Health Check</h3>
					
					{#if ragLoading}
						<div class="py-8 text-center">
							<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
							<p class="mt-4 text-xs text-slate-400">กำลังตรวจสอบข้อมูลระบบ...</p>
						</div>
					{:else if ragHealth}
						<div class="space-y-4 text-sm font-semibold">
							<div class="flex justify-between border-b border-white/5 pb-2">
								<span class="text-slate-400">Gemini API Connection</span>
								<span class={ragHealth.geminiConfigured ? 'text-emerald-300' : 'text-rose-300'}>
									{ragHealth.geminiConfigured ? 'Connected & Configured' : 'Offline'}
								</span>
							</div>
							<div class="flex justify-between border-b border-white/5 pb-2">
								<span class="text-slate-400">Supabase API Connection</span>
								<span class={ragHealth.supabaseConfigured && !ragHealth.supabaseError ? 'text-emerald-300' : 'text-rose-300'}>
									{ragHealth.supabaseConfigured && !ragHealth.supabaseError ? 'Connected & Configured' : 'Error'}
								</span>
							</div>
							<div class="flex justify-between border-b border-white/5 pb-2">
								<span class="text-slate-400">RAG Chunk Count (database)</span>
								<span class="text-white font-black">{ragHealth.chunkCount ?? 0} chunks</span>
							</div>
							<div class="flex justify-between border-b border-white/5 pb-2">
								<span class="text-slate-400">Gemini LLM Model</span>
								<span class="text-white font-black">{ragHealth.geminiModel}</span>
							</div>
							<div class="flex justify-between border-b border-white/5 pb-2">
								<span class="text-slate-400">Daily Chat Limit / User</span>
								<span class="text-white font-black">{ragHealth.dailyChatLimit} messages</span>
							</div>
							<div class="flex justify-between border-b border-white/5 pb-2">
								<span class="text-slate-400">Current Usage Date</span>
								<span class="text-white font-black">{ragHealth.currentUsageDate}</span>
							</div>
							{#if ragHealth.supabaseError}
								<div class="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
									<strong>Database Error:</strong> {ragHealth.supabaseError}
								</div>
							{/if}
						</div>
					{:else}
						<p class="text-xs text-slate-500">ไม่มีข้อมูลระบบ</p>
					{/if}
				</article>

				<article class="rt-panel rounded-xl p-5 sm:p-6">
					<h3 class="text-lg font-black text-white uppercase italic mb-4">Quick Links & Utilities</h3>
					<div class="grid gap-3">
						<a 
							href="/admin/reports" 
							class="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/20 p-4 transition hover:bg-white/5 hover:border-cyan-300/30"
						>
							<div>
								<h4 class="text-sm font-black text-white">ตรวจสอบ Card Reports</h4>
								<p class="text-xs text-slate-400 mt-1">ดูรายงานแปลผิดพลาด, ภาพไม่ขึ้น, หรือปัญหาอื่นๆ</p>
							</div>
							<span class="text-cyan-300 font-bold">&rarr;</span>
						</a>

						<a 
							href="/admin/chat" 
							class="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/20 p-4 transition hover:bg-white/5 hover:border-cyan-300/30"
						>
							<div>
								<h4 class="text-sm font-black text-white">กล่องข้อความผู้ใช้ (Inbox)</h4>
								<p class="text-xs text-slate-400 mt-1">ตอบกลับความช่วยเหลือ และติดต่อสื่อสารกับผู้เล่น</p>
							</div>
							<span class="text-cyan-300 font-bold">&rarr;</span>
						</a>
					</div>
				</article>
			</section>
		{/if}
	</main>
</div>

{#if toast}
	<Toast
		show={true}
		message={toast.message}
		type={toast.type}
		onclose={() => toast = null}
	/>
{/if}
