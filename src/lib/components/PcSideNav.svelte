<script lang="ts">
	import { onMount } from 'svelte';

	type MenuItem = {
		label: string;
		href: string;
		external?: boolean;
		active?: boolean;
		icon: 'cards' | 'domains' | 'qa' | 'deck' | 'official';
	};

	type AuthSession = {
		user: {
			email: string;
			isAdmin: boolean;
		} | null;
	};

	let { active = '' } = $props<{ active?: 'cards' | 'domains' | 'qa' | 'deck' | '' }>();
	let currentUser = $state<AuthSession['user']>(null);
	let authLoading = $state(true);

	let menuItems = $derived<MenuItem[]>([
		{ label: 'Cards', href: '/', active: active === 'cards', icon: 'cards' },
		{ label: 'Domains', href: '/domains', active: active === 'domains', icon: 'domains' },
		{ label: 'Q&A', href: '/qa', active: active === 'qa', icon: 'qa' },
		{ label: 'Deck', href: '/deck', active: active === 'deck', icon: 'deck' },
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
			<div class="hidden truncate px-2 text-[10px] font-bold text-slate-500 xl:block">
				{currentUser.email}
			</div>
			<button
				type="button"
				class="flex h-12 w-full items-center justify-center rounded-xl border border-white/10 text-[11px] font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/8 hover:text-white xl:justify-start xl:gap-3 xl:px-3"
				onclick={logout}
				aria-label="Logout"
				title="Logout"
			>
				<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-cyan-200">
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<path d="m16 17 5-5-5-5" />
						<path d="M21 12H9" />
					</svg>
				</span>
				<span class="hidden xl:block">Logout</span>
			</button>
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
