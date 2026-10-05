<script lang="ts">
	import { onMount } from 'svelte';

	let {
		src,
		srcset = undefined,
		sizes = undefined,
		alt = '',
		loading = 'lazy',
		decoding = 'async',
		fetchpriority = 'auto',
		class: className = '',
		onLoaded,
		onFailed
	} = $props<{
		src: string;
		srcset?: string;
		sizes?: string;
		alt?: string;
		loading?: 'eager' | 'lazy';
		decoding?: 'async' | 'sync' | 'auto';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
		onLoaded?: () => void;
		onFailed?: () => void;
	}>();

	let imageElement: HTMLImageElement | null = null;

	onMount(() => {
		if (!imageElement) return;

		const handleLoad = () => onLoaded?.();
		const handleError = () => onFailed?.();
		imageElement.addEventListener('load', handleLoad);
		imageElement.addEventListener('error', handleError);

		if (imageElement.complete) {
			if (imageElement.naturalWidth > 0) handleLoad();
			else handleError();
		}

		return () => {
			imageElement?.removeEventListener('load', handleLoad);
			imageElement?.removeEventListener('error', handleError);
		};
	});
</script>

<img
	bind:this={imageElement}
	{src}
	{srcset}
	{sizes}
	{alt}
	{loading}
	{decoding}
	{fetchpriority}
	class={className}
/>
