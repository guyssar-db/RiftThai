<script lang="ts">
	import { page } from '$app/state';
	import HomeLegacy from '$lib/components/home/HomeLegacy.svelte';
	import HomeRedesign from '$lib/components/home/HomeRedesign.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#if page.url.searchParams.get('design') === 'legacy'}
	<HomeLegacy {data} />
{:else}
	<HomeRedesign {data} />
{/if}
