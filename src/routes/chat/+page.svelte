<script lang="ts">
	type Message = {
		id: string;
		sender_role: 'user' | 'admin';
		body: string;
		created_at: string;
	};

	let messages = $state<Message[]>([]);
	let body = $state('');
	let error = $state('');
	let loading = $state(true);
	let { data } = $props();
	let quickTopics = ['Account verification issue', 'RAG answer looks wrong', 'Card data correction', 'Other support request'];

	$effect(() => {
		void loadMessages();
		const timer = setInterval(() => {
			void refreshMessages();
		}, 5000);
		return () => clearInterval(timer);
	});

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
		if (loading) return;
		try {
			const nextMessages = await fetchMessages();
			if (nextMessages.length !== messages.length) messages = nextMessages;
		} catch {
			// Keep the current conversation visible if a background refresh fails.
		}
	}

	async function send() {
		const text = body.trim();
		if (!text) return;
		body = '';
		const response = await fetch('/api/user-chat/messages', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ body: text })
		});
		const data = await response.json();
		if (!response.ok) {
			error = data.error || 'Could not send message';
			body = text;
			return;
		}
		messages = [...messages, data.message];
	}

	function chooseTopic(topic: string) {
		body = topic;
	}
</script>

<div class="rt-page-shell px-4 py-6 text-slate-100 sm:py-8">
	<div class="mesh-gradient"></div>
	<div class="rt-panel mx-auto flex min-h-[calc(100dvh-3rem)] max-w-4xl flex-col overflow-hidden rounded-xl sm:min-h-[82dvh]">
		<header class="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/55 px-4 py-4 sm:px-5">
			<div class="flex min-w-0 items-center gap-3">
				<div class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-cyan-300 text-slate-950">
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
						<path d="M8 9h8" />
						<path d="M8 13h5" />
					</svg>
				</div>
				<div class="min-w-0">
					<p class="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Support</p>
				<h1 class="mt-1 truncate text-xl font-black">Chat with admin</h1>
					<p class="mt-1 truncate text-xs font-medium text-slate-500">{data.user.email}</p>
				</div>
			</div>
			<a href="/" class="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5">Back</a>
		</header>

		<div class="flex-1 space-y-3 overflow-y-auto bg-slate-950/35 p-4">
			{#if loading}
				<p class="text-sm text-slate-500">Loading...</p>
			{:else if error}
				<p class="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
			{:else if messages.length === 0}
				<div class="rounded-lg border border-white/10 bg-white/5 p-4">
					<p class="text-sm font-bold text-white">Start a support conversation</p>
					<p class="mt-1 text-sm leading-relaxed text-slate-400">Choose a topic or write your own message. Admin replies will appear here automatically.</p>
					<div class="mt-4 flex flex-wrap gap-2">
						{#each quickTopics as topic}
							<button
								type="button"
							class="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
								onclick={() => chooseTopic(topic)}
							>
								{topic}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				{#each messages as message}
					<div class="flex {message.sender_role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[82%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-lg {message.sender_role === 'user' ? 'bg-cyan-300 text-slate-950 shadow-cyan-950/20' : 'border border-white/10 bg-slate-800 text-slate-100 shadow-black/20'}">
							<div class="whitespace-pre-wrap">{message.body}</div>
							<div class="mt-1 text-[10px] opacity-60">{new Date(message.created_at).toLocaleString()}</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<form
			class="flex gap-2 border-t border-white/10 bg-slate-950/60 p-3 sm:p-4"
			onsubmit={(event) => {
				event.preventDefault();
				send();
			}}
		>
			<textarea
				bind:value={body}
				rows="1"
				class="min-h-12 min-w-0 flex-1 resize-none rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white focus:border-cyan-400/60 focus:outline-none"
				placeholder="Message admin..."
			></textarea>
			<button class="rounded-lg bg-cyan-300 px-4 text-sm font-black uppercase tracking-widest text-slate-950 transition active:scale-95">Send</button>
		</form>
	</div>
</div>
