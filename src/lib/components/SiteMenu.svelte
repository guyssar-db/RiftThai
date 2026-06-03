<script lang="ts">
	import { onMount } from 'svelte';

	type MenuItem = {
		label: string;
		href: string;
		external?: boolean;
		active?: boolean;
		icon: 'domains' | 'qa' | 'deck' | 'donate' | 'official' | 'collection';
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

	let { active = '' } = $props<{ active?: 'domains' | 'qa' | 'deck' | 'donate' | 'collection' | '' }>();
	let isOpen = $state(false);
	let accountOpen = $state(false);
	let currentUser = $state<AuthSession['user']>(null);
	let authLoading = $state(true);

	let menuItems = $derived<MenuItem[]>([
		{ label: 'Domains', href: '/domains', active: active === 'domains', icon: 'domains' },
		{ label: 'Q&A', href: '/qa', active: active === 'qa', icon: 'qa' },
		{ label: 'Deck', href: '/deck', active: active === 'deck', icon: 'deck' },
		{ label: 'Collection', href: '/collection', active: active === 'collection', icon: 'collection' },
		{ label: 'Donate', href: '/donate', active: active === 'donate', icon: 'donate' },
		// { label: 'Chat', href: '/chat' },
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
		isOpen = false;
		window.dispatchEvent(new CustomEvent('riftthai-open-auth', { detail: { mode } }));
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		currentUser = null;
		isOpen = false;
		accountOpen = false;
		window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
	}
</script>

<div class="relative">
	<button
		class="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25 lg:hidden"
		type="button"
		aria-label="Open menu"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
	>
		{#if isOpen}
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
			>
				<path d="M6 18 18 6" />
				<path d="m6 6 12 12" />
			</svg>
		{:else}
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
			>
				<path d="M4 7h16" />
				<path d="M4 12h16" />
				<path d="M4 17h16" />
			</svg>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="rt-panel absolute top-14 right-0 z-[220] w-56 overflow-hidden rounded-xl p-2 lg:hidden"
		>
			{#each menuItems as item}
				<a
					href={item.href}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noreferrer' : undefined}
					class="flex min-h-12 items-center justify-between rounded-lg px-4 text-xs font-black tracking-widest uppercase transition {item.active
						? 'bg-amber-200 text-slate-950'
						: 'text-slate-300 hover:bg-white/5 hover:text-amber-100'}"
					onclick={() => (isOpen = false)}
				>
					{item.label}
					{#if item.external}
						<svg
							class="h-4 w-4 opacity-70"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M15 3h6v6" />
							<path d="M10 14 21 3" />
							<path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
						</svg>
					{/if}
				</a>
			{/each}
			<div class="mt-2 border-t border-white/10 pt-2">
				<button
					type="button"
					class="flex min-h-12 w-full items-center justify-between rounded-lg px-4 text-xs font-black tracking-widest text-cyan-200 uppercase transition hover:bg-white/5 hover:text-cyan-100"
					onclick={() => {
						isOpen = false;
						window.dispatchEvent(new CustomEvent('riftthai-open-guide'));
					}}
				>
					Guide / คู่มือ
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
					</span>
				</button>
				{#if authLoading}
					<div class="px-4 py-3 text-xs font-black tracking-widest text-slate-500 uppercase">
						Loading
					</div>
				{:else if currentUser}
					<button
						type="button"
						class="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-cyan-300/15 bg-cyan-300/8 px-4 text-xs font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/14 hover:text-white"
						aria-expanded={accountOpen}
						onclick={() => (accountOpen = !accountOpen)}
					>
						<span class="truncate">{currentUser.profileHandle}</span>
						<svg
							class="h-4 w-4 shrink-0 transition {accountOpen ? 'rotate-180' : ''}"
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
						<div class="mt-1 space-y-1 rounded-lg border border-white/10 bg-slate-950/70 p-1">
							<a
								href="/profile/{currentUser.profileSlug}"
								class="flex min-h-11 items-center rounded-md px-3 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
								onclick={() => {
									isOpen = false;
									accountOpen = false;
								}}
							>
								Profile
							</a>
							<a
								href="/setting"
								class="flex min-h-11 items-center rounded-md px-3 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
								onclick={() => {
									isOpen = false;
									accountOpen = false;
								}}
							>
								Setting
							</a>
							<button
								type="button"
								class="flex min-h-11 w-full items-center rounded-md px-3 text-left text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
								onclick={logout}
							>
								Logout
							</button>
						</div>
					{/if}
				{:else}
					<button
						type="button"
						class="flex min-h-12 w-full items-center rounded-lg px-4 text-xs font-black tracking-widest text-cyan-100 uppercase transition hover:bg-cyan-300/10"
						onclick={() => openAuth('login')}
					>
						Login
					</button>
					<button
						type="button"
						class="flex min-h-12 w-full items-center rounded-lg px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white"
						onclick={() => openAuth('register')}
					>
						Register
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
