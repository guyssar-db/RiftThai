<script lang="ts">
	import { onMount } from 'svelte';

	type MenuItem = {
		label: string;
		href: string;
		external?: boolean;
		active?: boolean;
		icon: 'cards' | 'domains' | 'qa' | 'deck' | 'donate' | 'official' | 'collection';
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

	let { active = '' } = $props<{ active?: 'cards' | 'domains' | 'qa' | 'deck' | 'donate' | 'collection' | '' }>();
	let currentUser = $state<AuthSession['user']>(null);
	let authLoading = $state(true);
	let accountOpen = $state(false);

	let menuItems = $derived<MenuItem[]>([
		{ label: 'Cards', href: '/', active: active === 'cards', icon: 'cards' },
		{ label: 'Domains', href: '/domains', active: active === 'domains', icon: 'domains' },
		{ label: 'Q&A', href: '/qa', active: active === 'qa', icon: 'qa' },
		{ label: 'Deck', href: '/deck', active: active === 'deck', icon: 'deck' },
		{ label: 'Collection', href: '/collection', active: active === 'collection', icon: 'collection' },
		{ label: 'Donate', href: '/donate', active: active === 'donate', icon: 'donate' },
		{ label: 'Official', href: 'https://riftbound.com', external: true, icon: 'official' }
	]);

	onMount(() => {
		void loadSession();
		const syncAuth = () => void loadSession();
		window.addEventListener('riftthai-auth-changed', syncAuth);
		return () => window.removeEventListener('riftthai-auth-changed', syncAuth);
	});

	async function loadSession() {
		authLoading = true;
		try {
			const response = await fetch('/api/auth/session');
			const data = (await response.json()) as AuthSession;
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
		currentUser = null;
		accountOpen = false;
		window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
	}
</script>

<aside
	class="sticky top-0 z-[170] hidden h-dvh min-h-dvh flex-col border-r border-cyan-300/10 bg-slate-950/82 px-2 py-24 shadow-2xl shadow-black/25 backdrop-blur-xl lg:flex xl:px-3"
>
	<nav class="flex flex-1 flex-col gap-2" aria-label="Desktop navigation">
		{#each menuItems as item}
			<a
				href={item.href}
				target={item.external ? '_blank' : undefined}
				rel={item.external ? 'noreferrer' : undefined}
				aria-label={item.label}
				title={item.label}
				class="group relative flex h-14 w-full items-center justify-center rounded-xl text-[11px] font-black tracking-widest uppercase transition xl:justify-start xl:gap-3 xl:px-3 {item.active
					? 'bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(83,234,253,0.2)]'
					: 'text-slate-400 hover:bg-white/8 hover:text-white'} {item.external
					? 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
					: ''}"
			>
				{#if item.active}
					<span class="absolute -left-2 h-8 w-1 rounded-full bg-cyan-200 xl:-left-3"></span>
				{/if}
				<span
					class="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition {item.active
						? 'bg-slate-950/15'
						: 'bg-white/5 text-cyan-200 group-hover:bg-cyan-300/10'}"
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
							<path d="M12 21s-7-4.4-9.2-8.6C1 8.9 3.2 5 7 5c2 0 3.4 1 5 2.8C13.6 6 15 5 17 5c3.8 0 6 3.9 4.2 7.4C19 16.6 12 21 12 21Z" />
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
				<span class="hidden truncate xl:block">{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-auto space-y-2 border-t border-white/10 pt-3">
		{#if authLoading}
			<div
				class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/15 border-t-cyan-300"
			></div>
		{:else if currentUser}
			<button
				type="button"
				class="group flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/8 text-[11px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14 hover:text-white xl:justify-start xl:gap-3 xl:px-3"
				aria-label="Profile"
				title="Profile"
				aria-expanded={accountOpen}
				onclick={() => (accountOpen = !accountOpen)}
			>
				<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
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
				<span class="hidden min-w-0 truncate xl:block">{currentUser.profileHandle}</span>
				<svg
					class="hidden h-4 w-4 shrink-0 transition xl:block {accountOpen ? 'rotate-180' : ''}"
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
							class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-cyan-300 uppercase transition hover:bg-white/8 hover:text-cyan-100 xl:justify-start xl:px-3"
							aria-label="Admin Panel"
							title="Admin Panel"
						>
							Admin Panel
						</a>
					{/if}
					<a
						href="/profile/{currentUser.profileSlug}"
						class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white xl:justify-start xl:px-3"
						aria-label="Profile"
						title="Profile"
					>
						<span class="hidden xl:block">Profile</span>
						<span class="xl:hidden">Profile</span>
					</a>
					<a
						href="/setting"
						class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white xl:justify-start xl:px-3"
						aria-label="Setting"
						title="Setting"
					>
						Setting
					</a>
					<button
						type="button"
						class="flex h-11 w-full items-center justify-center rounded-lg text-[10px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white xl:justify-start xl:px-3"
						onclick={logout}
						aria-label="Logout"
						title="Logout"
					>
						Logout
					</button>
				</div>
			{/if}
		{:else}
			<button
				type="button"
				class="flex h-12 w-full items-center justify-center rounded-xl bg-cyan-300 text-[11px] font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200 xl:justify-start xl:gap-3 xl:px-3"
				onclick={() => openAuth('login')}
				aria-label="Login"
				title="Login"
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
				<span class="hidden xl:block">Login</span>
			</button>
			<button
				type="button"
				class="flex h-12 w-full items-center justify-center rounded-xl border border-cyan-300/20 text-[11px] font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/10 xl:justify-start xl:gap-3 xl:px-3"
				onclick={() => openAuth('register')}
				aria-label="Register"
				title="Register"
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
				<span class="hidden xl:block">Register</span>
			</button>
		{/if}
	</div>
</aside>
