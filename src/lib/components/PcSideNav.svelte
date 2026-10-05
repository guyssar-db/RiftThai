<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getAuthSession, invalidateAuthSession } from '$lib/utils/authSession';
	import { desktopSidebarCollapsed } from '$lib/stores/sidebar';

	type MenuItem = {
		label: string;
		href: string;
		external?: boolean;
		active?: boolean;
		icon: 'cards' | 'domains' | 'qa' | 'deck' | 'donate' | 'official' | 'collection' | 'rules';
	};

	type AuthSession = {
		user: {
			id: string;
			email: string;
			displayName: string;
			profileHandle: string;
			profileSlug: string;
			isAdmin: boolean;
		} | null;
	};

	let { active = '' } = $props<{
		active?: 'cards' | 'domains' | 'qa' | 'deck' | 'donate' | 'collection' | 'rules' | '';
	}>();
	let currentUser = $state<AuthSession['user']>(null);
	let authLoading = $state(true);
	let accountOpen = $state(false);
	const sidebarStorageKey = 'riftthai_desktop_sidebar_collapsed';

	let menuItems = $derived<MenuItem[]>([
		{ label: 'การ์ด', href: '/', active: active === 'cards', icon: 'cards' },
		{ label: 'กติกา', href: '/rules', active: active === 'rules', icon: 'rules' },
		{ label: 'โดเมน', href: '/domains', active: active === 'domains', icon: 'domains' },
		{ label: 'เด็ค', href: '/deck', active: active === 'deck', icon: 'deck' },
		{
			label: 'การ์ดสะสม',
			href: '/collection',
			active: active === 'collection',
			icon: 'collection'
		},
		{ label: 'สนับสนุน', href: '/donate', active: active === 'donate', icon: 'donate' },
		{ label: 'เว็บไซต์ทางการ', href: 'https://riftbound.com', external: true, icon: 'official' }
	]);

	onMount(() => {
		const saved = window.localStorage.getItem(sidebarStorageKey);
		if (saved !== null) desktopSidebarCollapsed.set(saved === 'true');
		void loadSession();
		const syncAuth = () => void loadSession(true);
		window.addEventListener('riftthai-auth-changed', syncAuth);
		return () => window.removeEventListener('riftthai-auth-changed', syncAuth);
	});

	function toggleSidebar() {
		desktopSidebarCollapsed.update((collapsed) => {
			const next = !collapsed;
			window.localStorage.setItem(sidebarStorageKey, String(next));
			return next;
		});
		accountOpen = false;
	}

	async function loadSession(forceRefresh = false) {
		authLoading = true;
		try {
			const data = await getAuthSession<AuthSession>(forceRefresh);
			currentUser = data.user;
		} catch {
			currentUser = null;
		} finally {
			authLoading = false;
		}
	}

	function openAuth(mode: 'login' | 'register') {
		window.dispatchEvent(new CustomEvent('riftthai-open-auth', { detail: { mode } }));
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		invalidateAuthSession();
		currentUser = null;
		accountOpen = false;
		window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
		await goto('/');
	}
</script>

<aside
	class="rt-desktop-sidebar sticky top-0 z-[250] hidden h-dvh min-h-dvh flex-col border-r border-white/8 bg-slate-950/88 px-3 py-4 backdrop-blur-xl lg:flex"
	class:rt-sidebar-collapsed={$desktopSidebarCollapsed}
>
	<a
		href="/"
		class="rt-sidebar-brand hidden h-12 items-center rounded-xl border border-white/8 bg-white/[0.025] px-3 text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.04] lg:flex"
		aria-label="RiftThai home"
	>
		<span class="font-display text-sm font-bold tracking-[0.08em]"
			>RIFT<span class="rt-brand-accent">THAI</span></span
		>
	</a>
	<button
		type="button"
		class="rt-sidebar-toggle mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.05] hover:text-cyan-100 lg:justify-start lg:px-3"
		aria-label={$desktopSidebarCollapsed ? 'ขยายเมนูด้านซ้าย' : 'พับเมนูด้านซ้าย'}
		title={$desktopSidebarCollapsed ? 'ขยายเมนู' : 'พับเมนู'}
		aria-pressed={$desktopSidebarCollapsed}
		onclick={toggleSidebar}
	>
		<svg
			class="h-5 w-5 transition-transform duration-300 {$desktopSidebarCollapsed ? 'rotate-180' : ''}"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="m15 18-6-6 6-6" />
			<path d="M9 12h10" />
		</svg>
		<span class="rt-sidebar-label hidden text-[10px] font-black tracking-widest uppercase lg:block">พับเมนู</span>
	</button>

	<nav class="flex flex-1 flex-col gap-1.5 pt-5" aria-label="Desktop navigation">
		{#each menuItems as item}
			<a
				href={item.href}
				target={item.external ? '_blank' : undefined}
				rel={item.external ? 'noreferrer' : undefined}
				aria-label={item.label}
				title={item.label}
				class="group relative flex h-12 w-full items-center justify-center rounded-xl text-[11px] font-black tracking-widest uppercase transition lg:justify-start lg:gap-3 lg:px-3 {item.active
					? 'border border-cyan-300/18 bg-cyan-300/[0.08] text-cyan-100'
					: 'border border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.035] hover:text-white'} {item.external
					? 'border border-white/8 bg-white/[0.025] text-slate-200 hover:bg-white/[0.05]'
					: ''}"
			>
				{#if item.active}
					<span class="absolute -left-1 h-5 w-0.5 rounded-full bg-cyan-300 lg:-left-3"></span>
				{/if}
				<span
					class="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition {item.active
						? 'bg-cyan-300/12 text-cyan-200'
						: 'bg-white/[0.035] text-slate-400 group-hover:text-slate-100'}"
				>
					{#if item.icon === 'cards'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect width="7" height="7" x="3" y="3" rx="1" />
							<rect width="7" height="7" x="14" y="3" rx="1" />
							<rect width="7" height="7" x="14" y="14" rx="1" />
							<rect width="7" height="7" x="3" y="14" rx="1" />
						</svg>
					{:else if item.icon === 'rules'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
							<path d="M6 6h10" />
							<path d="M6 10h10" />
						</svg>
					{:else if item.icon === 'domains'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 2v20" />
							<path d="m4.9 4.9 14.2 14.2" />
							<path d="M2 12h20" />
							<path d="m19.1 4.9-14.2 14.2" />
						</svg>
					{:else if item.icon === 'qa'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M9.1 9a3 3 0 1 1 5.8 1c-.6 1.4-2.4 1.8-2.8 3.4" />
							<path d="M12 17h.01" />
							<circle cx="12" cy="12" r="9" />
						</svg>
					{:else if item.icon === 'deck'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="5" y="3" width="14" height="18" rx="2" />
							<path d="M9 7h6" />
							<path d="M9 11h6" />
							<path d="M9 15h4" />
						</svg>
					{:else if item.icon === 'donate'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M12 21s-7-4.4-9.2-8.6C1 8.9 3.2 5 7 5c2 0 3.4 1 5 2.8C13.6 6 15 5 17 5c3.8 0 6 3.9 4.2 7.4C19 16.6 12 21 12 21Z"
							/>
						</svg>
					{:else if item.icon === 'collection'}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M16 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
							<path d="M22 8h-2v8h2" />
							<path d="M6 8h6" />
							<path d="M6 12h6" />
						</svg>
					{:else}
						<svg
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M15 3h6v6" />
							<path d="M10 14 21 3" />
							<path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
						</svg>
					{/if}
				</span>
				<span class="rt-sidebar-label hidden truncate lg:block">{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-auto space-y-2 border-t border-white/10 pt-3 pb-20">
		{#if authLoading}
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/15 border-t-cyan-300"
			></div>
		{:else if currentUser}
			<button
				type="button"
				class="group flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/8 text-[11px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14 hover:text-white lg:justify-start lg:gap-3 lg:px-3"
				aria-label="โปรไฟล์"
				title="โปรไฟล์"
				aria-expanded={accountOpen}
				onclick={() => {
					if ($desktopSidebarCollapsed) {
						desktopSidebarCollapsed.set(false);
						window.localStorage.setItem(sidebarStorageKey, 'false');
					}
					accountOpen = !accountOpen;
				}}
			>
				<span
					class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200"
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="8" r="4" />
						<path d="M4 21a8 8 0 0 1 16 0" />
					</svg>
				</span>
				<span class="rt-sidebar-label hidden min-w-0 truncate lg:block">{currentUser.profileHandle}</span>
				<svg
					class="rt-sidebar-account-chevron hidden h-4 w-4 shrink-0 transition lg:block {accountOpen
						? 'rotate-180'
						: ''}"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
			{#if accountOpen}
				<div class="space-y-1 rounded-xl border border-white/10 bg-slate-950/70 p-1.5">
					{#if currentUser.isAdmin}
						<a
							href="/admin"
							class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-cyan-300 uppercase transition hover:bg-white/8 hover:text-cyan-100 lg:justify-start lg:px-3"
							aria-label="Admin Panel"
							title="Admin Panel"
						>
							<span class="rt-sidebar-label">Admin Panel</span>
						</a>
					{/if}
					<a
						href="/profile/{currentUser.profileSlug}"
						class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white lg:justify-start lg:px-3"
						aria-label="โปรไฟล์"
						title="โปรไฟล์"
					>
							<span class="rt-sidebar-label">โปรไฟล์</span>
					</a>
					<a
						href="/setting"
						class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white lg:justify-start lg:px-3"
						aria-label="Setting"
						title="Setting"
					>
						<span class="rt-sidebar-label">Setting</span>
					</a>
					<button
						type="button"
						class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white lg:justify-start lg:px-3"
						onclick={logout}
						aria-label="Logout"
						title="Logout"
					>
						<span class="rt-sidebar-label">Logout</span>
					</button>
				</div>
			{/if}
		{:else}
			<button
				type="button"
				class="flex h-12 w-full items-center justify-center rounded-xl bg-cyan-300 text-[11px] font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200 lg:justify-start lg:gap-3 lg:px-3"
				onclick={() => openAuth('login')}
				aria-label="เข้าสู่ระบบ"
				title="เข้าสู่ระบบ"
			>
				<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-950/15">
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
						<path d="m10 17 5-5-5-5" />
						<path d="M15 12H3" />
					</svg>
				</span>
				<span class="rt-sidebar-label hidden lg:block">เข้าสู่ระบบ</span>
			</button>
			<button
				type="button"
				class="flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 text-[11px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/10 lg:justify-start lg:gap-3 lg:px-3"
				onclick={() => openAuth('register')}
				aria-label="สมัครสมาชิก"
				title="สมัครสมาชิก"
			>
				<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10">
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M19 8v6" />
						<path d="M22 11h-6" />
					</svg>
				</span>
				<span class="rt-sidebar-label hidden lg:block">สมัครสมาชิก</span>
			</button>
		{/if}
	</div>
</aside>
