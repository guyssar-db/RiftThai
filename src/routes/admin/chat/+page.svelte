<script lang="ts">
	type Conversation = {
		id: string;
		user_id: string;
		last_message_at: string | null;
		hasUnread: boolean;
		app_users?: {
			email: string;
		};
	};

	type Message = {
		id: string;
		sender_role: 'user' | 'admin';
		body: string;
		created_at: string;
	};

	let conversations = $state<Conversation[]>([]);
	let selectedId = $state('');
	let messages = $state<Message[]>([]);
	let body = $state('');
	let error = $state('');
	let loading = $state(true);
	let conversationsLoading = $state(false);
	let { data } = $props();
	let selectedConversation = $derived(conversations.find((conversation) => conversation.id === selectedId));

	$effect(() => {
		void loadConversations();
		const timer = setInterval(() => {
			void refreshConversations();
			if (selectedId) void refreshSelectedMessages();
		}, 5000);
		return () => clearInterval(timer);
	});

	async function loadConversations() {
		loading = true;
		await refreshConversations(true);
		loading = false;
	}

	async function refreshConversations(selectFirst = false) {
		if (conversationsLoading) return;
		conversationsLoading = true;
		error = '';
		try {
			const response = await fetch('/api/admin-chat/conversations');
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Could not load conversations');
			conversations = data.conversations ?? [];
			if (selectFirst && !selectedId && conversations[0]) await selectConversation(conversations[0].id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not load conversations';
		} finally {
			conversationsLoading = false;
		}
	}

	async function selectConversation(id: string) {
		selectedId = id;
		const response = await fetch(`/api/admin-chat/conversations/${id}`);
		const data = await response.json();
		if (!response.ok) {
			error = data.error || 'Could not load conversation';
			return;
		}
		messages = data.messages ?? [];
		conversations = conversations.map((conversation) =>
			conversation.id === id ? { ...conversation, hasUnread: false } : conversation
		);
	}

	async function refreshSelectedMessages() {
		if (!selectedId) return;
		const response = await fetch(`/api/admin-chat/conversations/${selectedId}`);
		const data = await response.json();
		if (!response.ok) return;
		const nextMessages = data.messages ?? [];
		if (nextMessages.length !== messages.length) messages = nextMessages;
	}

	async function send() {
		const text = body.trim();
		if (!text || !selectedId) return;
		body = '';
		const response = await fetch(`/api/admin-chat/conversations/${selectedId}/messages`, {
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
		const now = data.message.created_at;
		conversations = conversations
			.map((conversation) =>
				conversation.id === selectedId
					? { ...conversation, last_message_at: now, hasUnread: false }
					: conversation
			)
			.sort((a, b) => new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime());
	}
</script>

<div class="rt-page-shell px-4 py-6 text-slate-100 sm:py-8">
	<div class="mesh-gradient"></div>
	<div class="rt-panel mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl overflow-hidden rounded-xl md:min-h-[82dvh] md:grid-cols-[340px_1fr]">
		<aside class="border-b border-white/10 bg-slate-950/40 md:border-b-0 md:border-r">
			<div class="border-b border-white/10 px-4 py-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Admin</p>
						<h1 class="mt-1 text-xl font-black">Inbox</h1>
						<p class="mt-1 truncate text-xs font-medium text-slate-500">{data.user.email}</p>
					</div>
					<a href="/" class="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-300 transition hover:bg-white/5">Back</a>
				</div>
			</div>
			<div class="max-h-[34dvh] divide-y divide-white/10 overflow-y-auto md:max-h-none">
				{#if loading}
					<p class="p-4 text-sm text-slate-500">Loading...</p>
				{:else if error}
					<p class="p-4 text-sm text-red-200">{error}</p>
				{:else if conversations.length === 0}
					<p class="p-4 text-sm text-slate-500">No conversations.</p>
				{:else}
					{#each conversations as conversation}
						<button
							type="button"
							class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5 {selectedId === conversation.id ? 'bg-cyan-300/10' : ''}"
							onclick={() => selectConversation(conversation.id)}
						>
							<span class="h-2.5 w-2.5 shrink-0 rounded-full {conversation.hasUnread ? 'bg-cyan-300 shadow-[0_0_12px_rgba(45,212,191,0.7)]' : 'bg-slate-700'}"></span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-bold">{conversation.app_users?.email ?? conversation.user_id}</span>
								<span class="text-xs text-slate-500">{conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString() : 'No messages'}</span>
							</span>
						</button>
					{/each}
				{/if}
			</div>
		</aside>

		<section class="flex min-h-[62dvh] flex-col bg-slate-950/25 md:min-h-[70dvh]">
			<div class="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-slate-950/35 px-4 py-3">
				<div class="min-w-0">
					<p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Conversation</p>
					<p class="mt-1 truncate text-sm font-bold text-white">
						{selectedConversation?.app_users?.email ?? (selectedId ? selectedId : 'No conversation selected')}
					</p>
				</div>
				{#if selectedConversation?.hasUnread}
					<span class="rounded-lg bg-cyan-300 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">New</span>
				{/if}
			</div>
			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if !selectedId}
					<div class="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
						Select a conversation from the inbox to read and reply.
					</div>
				{:else}
					{#each messages as message}
						<div class="flex {message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}">
							<div class="max-w-[82%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-lg {message.sender_role === 'admin' ? 'bg-cyan-300 text-slate-950 shadow-cyan-950/20' : 'border border-white/10 bg-slate-800 text-slate-100 shadow-black/20'}">
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
				<input
					bind:value={body}
					disabled={!selectedId}
					class="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white focus:border-cyan-400/60 focus:outline-none disabled:opacity-50"
					placeholder="Reply..."
				/>
				<button class="rounded-lg bg-cyan-300 px-4 text-sm font-black uppercase tracking-widest text-slate-950 transition active:scale-95 disabled:opacity-50" disabled={!selectedId}>Send</button>
			</form>
		</section>
	</div>
</div>
