<script lang="ts">
	import './layout.css';
	import FakeAiChat from '$lib/components/FakeAiChat.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>RiftThai - Riftbound Thai Translation & Card Database</title>
	<link rel="icon" href={favicon} />
</svelte:head>
{@render children()}
<FakeAiChat />
