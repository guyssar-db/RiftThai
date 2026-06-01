<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		getActiveStoredDeck,
		normalizeDeckCollection,
		readDeckCollectionFromStorage,
		writeDeckCollectionToStorage
	} from '$lib/utils/deck';

	onMount(() => {
		const collection = normalizeDeckCollection(readDeckCollectionFromStorage(localStorage));
		const activeDeck = getActiveStoredDeck(collection);
		writeDeckCollectionToStorage(localStorage, collection);
		goto(`/deck/${activeDeck.id}/edit`, { replaceState: true });
	});
</script>

<div class="rt-page-shell grid min-h-dvh place-items-center p-4 text-slate-100">
	<div class="mesh-gradient"></div>
	<div class="rt-panel w-full max-w-xs rounded-xl p-5 text-center">
		<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
		<div class="mt-4 text-sm font-black uppercase tracking-widest text-white">Opening Deck</div>
	</div>
</div>
