<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let status = $state($page.url.searchParams.get('status'));
	let message = $state($page.url.searchParams.get('message'));
	let isVerifying = $state(false);

	onMount(async () => {
		const token = $page.url.searchParams.get('token');
		if (!token || status) return;

		isVerifying = true;
		try {
			const response = await fetch('/api/auth/verify-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Verification failed');
			status = 'success';
		} catch (error) {
			status = 'error';
			message = error instanceof Error ? error.message : 'Verification failed';
		} finally {
			isVerifying = false;
		}
	});
</script>

<div class="rt-page-shell px-4 py-16 text-slate-100">
	<div class="mesh-gradient"></div>
	<div class="rt-panel mx-auto max-w-md rounded-xl p-6">
		<p class="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">RiftThai</p>
		<h1 class="mt-3 text-2xl font-black">
			{#if isVerifying}
				Verifying email
			{:else}
				{status === 'success' ? 'Email verified' : 'Verification failed'}
			{/if}
		</h1>
		<p class="mt-3 text-sm leading-relaxed text-slate-400">
			{isVerifying
				? 'Please wait while we verify your account.'
				: status === 'success'
				? 'Your account is ready. You can return to the chat and log in.'
				: message || 'The verification link is invalid or expired.'}
		</p>
		<a
			href="/"
			class="mt-5 inline-flex h-11 items-center rounded-lg bg-cyan-300 px-4 text-sm font-black uppercase tracking-widest text-slate-950"
		>
			Back
		</a>
	</div>
</div>
