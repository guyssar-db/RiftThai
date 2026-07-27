<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getAuthSession } from '$lib/utils/authSession';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	type Message = {
		id: string;
		sender_role: 'user' | 'admin';
		body: string;
		created_at: string;
	};

	type AuthSession = {
		user: {
			id: string;
			email: string;
			displayName: string | null;
			profileHandle: string | null;
		} | null;
		error?: string;
	};

	let pathname = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	let isHomePage = $derived(pathname === '/');
	let isChatPage = $derived(pathname === '/chat');

	let isOpen = $state(false);
	let currentUser = $state<AuthSession['user']>(null);
	
	// Authentication modal state
	let authModalOpen = $state(false);
	let authMode = $state<'login' | 'register'>('login');
	let loginEmail = $state('');
	let loginPassword = $state('');
	let confirmPassword = $state('');
	let loginDisplayName = $state('');
	let loginError = $state('');
	let registerSent = $state(false);
	let acceptedTerms = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let authLoading = $state(true);

	// Chat support state
	let messages = $state<Message[]>([]);
	let body = $state('');
	let error = $state('');
	let loading = $state(false);
	let sending = $state(false);
	let pollInterval: number | null = null;

	onMount(() => {
		void loadSession();
		
		const syncAuth = () => void loadSession(true);
		
		const openAuthEvent = (event: Event) => {
			const detail = (event as CustomEvent<{ mode?: 'login' | 'register' }>).detail;
			authMode = detail?.mode === 'register' ? 'register' : 'login';
			loginError = '';
			registerSent = false;
			authModalOpen = true;
		};

		window.addEventListener('riftthai-auth-changed', syncAuth);
		window.addEventListener('riftthai-open-auth', openAuthEvent);

		return () => {
			window.removeEventListener('riftthai-auth-changed', syncAuth);
			window.removeEventListener('riftthai-open-auth', openAuthEvent);
			stopPolling();
		};
	});

	async function loadSession(forceRefresh = false) {
		authLoading = true;
		try {
			const data = await getAuthSession<AuthSession>(forceRefresh);
			currentUser = data.user;
			if (!currentUser) {
				isOpen = false;
				stopPolling();
			}
		} finally {
			authLoading = false;
		}
	}

	async function login() {
		loginError = '';
		if (authMode === 'register') {
			if (loginPassword !== confirmPassword) {
				loginError = 'Passwords do not match';
				return;
			}
			if (!acceptedTerms) {
				loginError = 'Please accept the Privacy Policy and Terms of Use';
				return;
			}
		}
		authLoading = true;
		try {
			const response = await fetch(
				authMode === 'login' ? '/api/auth/login' : '/api/auth/register',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						email: loginEmail,
						password: loginPassword,
						displayName: authMode === 'register' ? loginDisplayName : undefined
					})
				}
			);
			const data = (await response.json()) as AuthSession;
			if (!response.ok) throw new Error(data.error || 'Auth failed');
			if (authMode === 'register') {
				registerSent = true;
				loginPassword = '';
				confirmPassword = '';
				loginDisplayName = '';
				return;
			}
			if (!data.user) throw new Error(data.error || 'Login failed');
			currentUser = data.user;
			authModalOpen = false;
			window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
			loginPassword = '';
			confirmPassword = '';
			loginDisplayName = '';
		} catch (err) {
			loginError = err instanceof Error ? err.message : 'Auth failed';
		} finally {
			authLoading = false;
		}
	}

	// Fetch messages from support API
	async function fetchMessages() {
		error = '';
		const response = await fetch('/api/user-chat/messages');
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || 'Could not load messages');
		return data.messages ?? [];
	}

	async function loadMessages() {
		loading = true;
		try {
			messages = await fetchMessages();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not load messages';
		} finally {
			loading = false;
		}
	}

	async function refreshMessages() {
		if (loading || sending || (typeof document !== 'undefined' && document.hidden)) return;
		try {
			const nextMessages = await fetchMessages();
			if (nextMessages.length !== messages.length) messages = nextMessages;
		} catch {
			// Ignore background fail
		}
	}

	function startPolling() {
		stopPolling();
		void loadMessages();
		pollInterval = window.setInterval(() => {
			void refreshMessages();
		}, 5000);
	}

	function stopPolling() {
		if (pollInterval) {
			window.clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	// Toggle Open/Close chat
	function toggleChat() {
		isOpen = !isOpen;
		if (isOpen) {
			startPolling();
		} else {
			stopPolling();
		}
	}

	async function sendMessage() {
		const text = body.trim();
		if (!text || sending) return;

		body = '';
		sending = true;
		try {
			const response = await fetch('/api/user-chat/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body: text })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Could not send message');
			messages = [...messages, data.message];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not send message';
			body = text;
		} finally {
			sending = false;
		}
	}
</script>

<!-- Global authentication modal triggered by riftthai-open-auth events -->
<Modal bind:open={authModalOpen} title="Account" subtitle={authMode === 'login' ? 'Login to RiftThai account' : 'Create RiftThai account'}>
	<form
		class="space-y-3"
		onsubmit={(event) => {
			event.preventDefault();
			login();
		}}
	>
		<div class="grid grid-cols-2 rounded-lg border border-white/10 bg-slate-900 p-1">
			<button
				type="button"
				class="rounded-lg px-3 py-2 text-xs font-black tracking-widest uppercase {authMode ===
				'login'
					? 'bg-cyan-300 text-slate-950'
					: 'text-slate-500'} cursor-pointer"
				onclick={() => {
					authMode = 'login';
					loginError = '';
				}}
			>
				Login
			</button>
			<button
				type="button"
				class="rounded-lg px-3 py-2 text-xs font-black tracking-widest uppercase {authMode ===
				'register'
					? 'bg-cyan-300 text-slate-950'
					: 'text-slate-500'} cursor-pointer"
				onclick={() => {
					authMode = 'register';
					loginError = '';
				}}
			>
				Register
			</button>
		</div>
		{#if registerSent}
			<div
				class="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200"
			>
				Check your email and click the verification link before logging in.
			</div>
		{/if}
		{#if authMode === 'register'}
			<Input
				bind:value={loginDisplayName}
				autocomplete="name"
				placeholder="Display Name"
				required
			/>
		{/if}
		<Input
			bind:value={loginEmail}
			type="email"
			autocomplete="email"
			placeholder="Email"
			required
		/>
		<div class="relative">
			<Input
				bind:value={loginPassword}
				type={showPassword ? 'text' : 'password'}
				autocomplete={authMode === 'register' ? 'new-password' : 'current-password'}
				placeholder="Password"
				required
			/>
			<button
				type="button"
				class="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-cyan-200 cursor-pointer"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				title={showPassword ? 'Hide password' : 'Show password'}
				onclick={() => (showPassword = !showPassword)}
			>
				{#if showPassword}
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 3l18 18" />
						<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
						<path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 9 5 10 8a13.2 13.2 0 0 1-3.1 4.5" />
						<path d="M6.1 6.1A13.2 13.2 0 0 0 2 12c1 3 5 8 10 8a10.9 10.9 0 0 0 4.1-.8" />
					</svg>
				{:else}
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				{/if}
			</button>
		</div>
		{#if authMode === 'register'}
			<div class="relative">
				<Input
					bind:value={confirmPassword}
					type={showConfirmPassword ? 'text' : 'password'}
					autocomplete="new-password"
					placeholder="Confirm password"
					required
				/>
				<button
					type="button"
					class="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-cyan-200 cursor-pointer"
					aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
					title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
					onclick={() => (showConfirmPassword = !showConfirmPassword)}
				>
					{#if showConfirmPassword}
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 3l18 18" />
							<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
							<path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 9 5 10 8a13.2 13.2 0 0 1-3.1 4.5" />
							<path d="M6.1 6.1A13.2 13.2 0 0 0 2 12c1 3 5 8 10 8a10.9 10.9 0 0 0 4.1-.8" />
						</svg>
					{:else}
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					{/if}
				</button>
			</div>
		{/if}
		{#if loginError}
			<div
				class="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200"
			>
				{loginError}
			</div>
		{/if}
		<Button
			type="submit"
			class="h-11 w-full"
			disabled={authLoading ||
				(authMode === 'register' &&
					(!acceptedTerms || !loginPassword || loginPassword !== confirmPassword))}
		>
			{authMode === 'login' ? 'Login' : 'Create account'}
		</Button>
		{#if authMode === 'register'}
			<Checkbox bind:checked={acceptedTerms} required>
				ฉันอ่านและยอมรับ
				<a class="font-black text-cyan-300 transition hover:text-cyan-100" href="/privacy" target="_blank" rel="noopener noreferrer"
					>นโยบายความเป็นส่วนตัว</a
				>
				และ
				<a class="font-black text-cyan-300 transition hover:text-cyan-100" href="/terms" target="_blank" rel="noopener noreferrer"
					>ข้อกำหนดการใช้งาน</a
				>
			</Checkbox>
		{/if}
	</form>
</Modal>

{#if currentUser && !isChatPage}
	<div
		class="fixed z-[900] font-sans {isHomePage
			? 'right-4 bottom-24 md:right-5 md:bottom-5'
			: 'right-5 bottom-5'}"
	>
		{#if isOpen}
			<div
				class="rt-panel mb-3 flex h-[min(560px,72dvh)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200"
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-white/10 bg-slate-950/55 px-4 py-3">
					<div class="flex items-center gap-2">
						<div class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-300 text-slate-950">
							<svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
								<path d="M8 9h8" />
								<path d="M8 13h5" />
							</svg>
						</div>
						<div>
							<div class="text-xs font-black tracking-[0.22em] text-cyan-300 uppercase">Support</div>
							<div class="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
								Chat with admin
							</div>
						</div>
					</div>
					<button
						type="button"
						class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 cursor-pointer"
						aria-label="Close chat"
						onclick={toggleChat}
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
						>
							<path d="M6 18 18 6" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>

				<!-- Message List -->
				<div class="flex-1 space-y-3 overflow-y-auto bg-slate-950/35 p-3">
					{#if loading && messages.length === 0}
						<div class="py-8 text-center text-xs text-slate-500">Loading conversation...</div>
					{:else if error && messages.length === 0}
						<div class="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
							{error}
						</div>
					{:else if messages.length === 0}
						<div class="rounded-lg border border-white/5 bg-white/5 p-4 text-center">
							<p class="text-xs font-bold text-white">ต้องการความช่วยเหลือ?</p>
							<p class="mt-1 text-[11px] leading-relaxed text-slate-400">
								พิมพ์ข้อความเพื่อติดต่อผู้ดูแลระบบได้ที่นี่ คำตอบจากแอดมินจะปรากฏขึ้นโดยอัตโนมัติ
							</p>
						</div>
					{:else}
						{#each messages as message}
							<div class="flex {message.sender_role === 'user' ? 'justify-end' : 'justify-start'}">
								<div
									class="max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap {message.sender_role === 'user'
										? 'bg-cyan-300 text-slate-950'
										: 'border border-white/10 bg-slate-800 text-slate-100'}"
								>
									{message.body}
									<div class="mt-1 text-[9px] opacity-60">
										{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Input Form -->
				<div class="border-t border-white/10 bg-slate-950/60 p-3">
					<form
						class="flex gap-2"
						onsubmit={(event) => {
							event.preventDefault();
							sendMessage();
						}}
					>
						<input
							bind:value={body}
							class="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
							disabled={sending}
							placeholder="พิมพ์ข้อความคุยกับแอดมิน..."
						/>
						<button
							type="submit"
							class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-300 text-slate-950 transition active:scale-95 cursor-pointer"
							aria-label="Send"
							disabled={sending || !body.trim()}
						>
							<svg
								class="h-4.5 w-4.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="m22 2-7 20-4-9-9-4Z" />
								<path d="M22 2 11 13" />
							</svg>
						</button>
					</form>
				</div>
			</div>
		{/if}

		<!-- Floating bubble button -->
		<button
			type="button"
			class="ml-auto grid h-14 w-14 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300 text-slate-950 shadow-2xl shadow-cyan-950/40 transition hover:scale-105 active:scale-95 cursor-pointer"
			aria-label="Open support chat"
			aria-expanded={isOpen}
			onclick={toggleChat}
		>
			{#if isOpen}
				<svg
					class="h-6 w-6"
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
					class="h-6 w-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
					<path d="M8 9h8" />
					<path d="M8 13h5" />
				</svg>
			{/if}
		</button>
	</div>
{/if}
