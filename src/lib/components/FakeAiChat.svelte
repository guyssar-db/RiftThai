<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { Card } from '$lib/types/card';
	import { getAuthSession, invalidateAuthSession } from '$lib/utils/authSession';
	import {
		parseAnswerText,
		withAiDisclaimer,
		getCanonicalQuickAnswer,
		findCards,
		formatFocusedCardAnswer,
		formatCards,
		buildAnswer
	} from '$lib/utils/chatSearch';

	type Message = {
		role: 'bot' | 'user';
		text: string;
	};

	type RagChatResponse = {
		answer?: string;
		mode?: 'rag' | 'local' | 'setup_required';
		usage?: ChatUsage;
		sources?: Array<{
			source: string;
			title: string;
			source_type: string;
			similarity?: number;
		}>;
		error?: string;
	};

	type ChatUsage = {
		used: number;
		limit: number;
		isAdmin?: boolean;
	};

	type AuthSession = {
		user: {
			email: string;
			isAdmin: boolean;
			usage: ChatUsage;
		} | null;
		error?: string;
	};

	let pathname = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	let isHomePage = $derived(pathname === '/');

	let cachedLocalCards: Card[] | null = null;
	let isOpen = $state(false);
	let authModalOpen = $state(false);
	let input = $state('');
	let isSending = $state(false);
	let authLoading = $state(true);
	let loginEmail = $state('');
	let loginPassword = $state('');
	let confirmPassword = $state('');
	let loginDisplayName = $state('');
	let loginError = $state('');
	let authMode = $state<'login' | 'register'>('login');
	let registerSent = $state(false);
	let acceptedTerms = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let currentUser = $state<AuthSession['user']>(null);
	let messages = $state<Message[]>([
		{
			role: 'bot',
			text: withAiDisclaimer(
				'ถามกฎ, การ์ด, keyword, phase, Q&A หรือ domain มาได้เลย ผมจะตอบจากข้อมูลที่มีในเว็บและจะไม่เดาถ้าไม่มั่นใจ'
			)
		}
	]);

	onMount(() => {
		void loadSession();
		const openAuth = (event: Event) => {
			const detail = (event as CustomEvent<{ mode?: 'login' | 'register' }>).detail;
			authMode = detail?.mode === 'register' ? 'register' : 'login';
			loginError = '';
			registerSent = false;
			authModalOpen = true;
		};
		const syncAuth = () => void loadSession(true);
		window.addEventListener('riftthai-open-auth', openAuth);
		window.addEventListener('riftthai-auth-changed', syncAuth);
		return () => {
			window.removeEventListener('riftthai-open-auth', openAuth);
			window.removeEventListener('riftthai-auth-changed', syncAuth);
		};
	});

	async function loadSession(forceRefresh = false) {
		authLoading = true;
		try {
			const data = await getAuthSession<AuthSession>(forceRefresh);
			currentUser = data.user;
			if (!currentUser) isOpen = false;
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
		} catch (error) {
			loginError = error instanceof Error ? error.message : 'Auth failed';
		} finally {
			authLoading = false;
		}
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		invalidateAuthSession();
		currentUser = null;
		isOpen = false;
		authModalOpen = false;
		window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
	}

	async function getLocalCards() {
		if (cachedLocalCards) return cachedLocalCards;
		const module = await import('$lib/data/riftbound_cards_all.json');
		cachedLocalCards = module.default as Card[];
		return cachedLocalCards;
	}

	async function askRagApi(query: string) {
		const quickAnswer = getCanonicalQuickAnswer(query);
		if (quickAnswer) return quickAnswer;

		const cards = await getLocalCards();
		const localCardMatches = findCards(query, cards);
		const focusedCardAnswer = formatFocusedCardAnswer(query, localCardMatches);
		if (focusedCardAnswer) return focusedCardAnswer;

		if (localCardMatches.length > 0 && localCardMatches[0].score >= 60) {
			return `ผมเจอการ์ดในฐานข้อมูลเว็บ:\n${formatCards(localCardMatches)}`;
		}

		const response = await fetch('/api/rag/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ question: query })
		});
		const data = (await response.json()) as RagChatResponse;

		if (response.status === 401) {
			currentUser = null;
			throw new Error('กรุณา login ก่อนใช้แชท');
		}

		if (data.usage && currentUser) {
			currentUser = {
				...currentUser,
				usage: data.usage
			};
		}

		if (response.status === 429) {
			return await buildAnswer(query, cards);
		}

		if (!response.ok || data.mode === 'setup_required' || !data.answer) {
			throw new Error(data.error || 'RAG API is not ready');
		}

		const alreadyHasSources =
			data.answer.includes('อ้างอิง') || data.answer.includes('แหล่งข้อมูล');
		const sources =
			!alreadyHasSources && data.sources?.length
				? `\n\nแหล่งข้อมูล:\n${data.sources.map((source) => `- ${source.title}`).join('\n')}`
				: '';

		return `${data.answer}${sources}`;
	}

	async function sendMessage(text = input) {
		const query = text.trim();
		if (!query || isSending) return;
		if (!currentUser) {
			loginError = 'กรุณา login ก่อนใช้แชท';
			return;
		}

		input = '';
		isSending = true;
		messages = [
			...messages,
			{ role: 'user', text: query },
			{ role: 'bot', text: 'กำลังค้นข้อมูล...' }
		];

		try {
			const answer = await askRagApi(query);
			messages = [...messages.slice(0, -1), { role: 'bot', text: withAiDisclaimer(answer) }];
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			const cards = await getLocalCards();
			const fallbackAnswer = message || (await buildAnswer(query, cards));
			messages = [
				...messages.slice(0, -1),
				{ role: 'bot', text: withAiDisclaimer(fallbackAnswer) }
			];
		} finally {
			isSending = false;
		}
	}
</script>

<Modal bind:open={authModalOpen} title="Account" subtitle={authMode === 'login' ? 'Login to use RAG chat' : 'Create RiftThai account'}>
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
					registerSent = false;
					confirmPassword = '';
					loginDisplayName = '';
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
					registerSent = false;
					loginDisplayName = '';
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

<div
	class="fixed z-[900] font-sans {isHomePage
		? 'right-4 bottom-24 md:right-5 md:bottom-5'
		: 'right-5 bottom-5'}"
>
	{#if isOpen}
		<div
			class="rt-panel mb-3 flex h-[min(560px,72dvh)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl"
		>
			<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
				<div>
					<div class="text-xs font-black tracking-[0.22em] text-cyan-300 uppercase">RAG Chat</div>
					<div class="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
						{currentUser
							? currentUser.isAdmin
								? 'Admin access'
								: `${currentUser.usage.used}/${currentUser.usage.limit} today`
							: 'Login required'}
					</div>
				</div>
				<button
					type="button"
					class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5"
					aria-label="Close chat"
					onclick={() => (isOpen = false)}
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

			<div
				class="border-b border-white/10 px-4 py-2 text-[11px] leading-relaxed font-medium text-slate-500"
			>
				ตอบจาก card data, keywords, phases, Q&A, domains และ rule summary ในเว็บ
			</div>
			<div
				class="border-b border-amber-300/15 bg-amber-300/[0.07] px-4 py-2 text-[11px] leading-relaxed font-bold text-amber-100"
			>
				AI อาจตอบคลาดเคลื่อนได้ ควรตรวจสอบ Official Rules ที่ https://riftbound.com/
				ก่อนใช้อ้างอิงจริง
			</div>

			{#if authLoading}
				<div class="flex flex-1 items-center justify-center px-4 text-sm font-bold text-slate-500">
					Loading...
				</div>
			{:else if !currentUser}
				<div
					class="flex flex-1 items-center justify-center px-4 text-center text-sm leading-relaxed font-bold text-slate-500"
				>
					Session ended. Use Login from the navigation to continue.
				</div>
			{:else}
				<div class="flex-1 space-y-3 overflow-y-auto p-3">
					{#each messages as message}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap {message.role ===
								'user'
									? 'bg-cyan-300 text-slate-950'
									: 'border border-white/10 bg-white/7 text-slate-100'}"
							>
								{#if message.role === 'bot'}
									{@html parseAnswerText(message.text)}
								{:else}
									{message.text}
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<div class="border-t border-white/10 p-3">
					<form
						class="flex gap-2"
						onsubmit={(event) => {
							event.preventDefault();
							sendMessage();
						}}
					>
						<input
							bind:value={input}
							class="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
							disabled={isSending}
							placeholder="ถามการ์ด กฎ keyword phase..."
						/>
						<button
							type="submit"
							class="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-cyan-300 text-slate-950 transition active:scale-95"
							aria-label="Send"
							disabled={isSending}
						>
							<svg
								class="h-5 w-5"
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
			{/if}
		</div>
	{/if}

	{#if currentUser}
		<button
			type="button"
			class="ml-auto grid h-14 w-14 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300 text-slate-950 shadow-2xl shadow-cyan-950/40 transition hover:scale-105 active:scale-95"
			aria-label="Open rule helper"
			aria-expanded={isOpen}
			onclick={() => (isOpen = !isOpen)}
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
	{/if}
</div>

<style>
	:global(.chat-inline-icon) {
		position: relative;
		top: -1px;
		display: inline-block;
		width: auto;
		height: 1.2em;
		margin: 0 2px;
		vertical-align: middle;
		filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.45));
	}

	:global(.chat-energy-circle) {
		position: relative;
		top: -1px;
		display: inline-flex;
		width: 1.25em;
		height: 1.25em;
		align-items: center;
		justify-content: center;
		margin: 0 2px;
		border-radius: 999px;
		background: white;
		color: black;
		font-size: 0.72em;
		font-weight: 900;
		vertical-align: middle;
	}

	:global(.chat-domain-name) {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		font-weight: 800;
		vertical-align: middle;
	}

	:global(.chat-keyword-badge) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 1.7em;
		margin: 1px 3px;
		padding: 0.12em 0.65em;
		color: white;
		font-size: 0.75em;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
		vertical-align: middle;
		box-shadow: 1px 2px 0 rgba(0, 0, 0, 0.24);
		transform: skewX(-13deg);
	}

	:global(.chat-keyword-badge > span) {
		transform: skewX(13deg);
	}
</style>
