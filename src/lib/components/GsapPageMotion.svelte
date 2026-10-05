<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { reduceMotion } from '$lib/utils/motion';

	let observer: MutationObserver | null = null;

	function motionAllowed() {
		return browser && !reduceMotion();
	}

	function animateCards() {
		if (!motionAllowed()) return;
		const cards = Array.from(
			document.querySelectorAll<HTMLElement>('.home-redesign .card-grid > *')
		);
		if (!cards.length) return;
		gsap.killTweensOf(cards);
		gsap.fromTo(
			cards,
			{ autoAlpha: 0, y: 22, scale: 0.97 },
			{
				autoAlpha: 1,
				y: 0,
				scale: 1,
				duration: 0.48,
				stagger: 0.028,
				ease: 'power3.out',
				clearProps: 'opacity,transform'
			}
		);
	}

	function animateHero(root: HTMLElement) {
		const hero = root.querySelector<HTMLElement>('.catalog-hero');
		if (!hero) return;

		const copy = hero.querySelector<HTMLElement>('.catalog-copy');
		const stats = Array.from(hero.querySelectorAll<HTMLElement>('.catalog-stats > div'));
		gsap.killTweensOf([hero, ...(copy ? [copy] : []), ...stats]);

		const timeline = gsap.timeline();
		timeline.fromTo(
			hero,
			{ autoAlpha: 0, y: 18, scale: 0.985 },
			{ autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: 'power3.out' }
		);
		if (copy) {
			timeline.fromTo(
				copy,
				{ autoAlpha: 0, x: -18 },
				{ autoAlpha: 1, x: 0, duration: 0.42, ease: 'power2.out', clearProps: 'opacity,transform' },
				'-=0.34'
			);
		}
		if (stats.length) {
			timeline.fromTo(
				stats,
				{ autoAlpha: 0, y: 12 },
				{
					autoAlpha: 1,
					y: 0,
					duration: 0.34,
					stagger: 0.07,
					ease: 'back.out(1.5)',
					clearProps: 'opacity,transform'
				},
				'-=0.28'
			);
		}
	}

	function animatePage() {
		if (!motionAllowed()) return;
		const root = document.querySelector<HTMLElement>('.rt-page-shell');
		if (!root) return;

		const parts = Array.from(
			root.querySelectorAll<HTMLElement>(
				':scope > nav, :scope > main > header, :scope > main > section, :scope > main > article, .home-redesign .home-filters'
			)
		);
		if (parts.length) {
			gsap.killTweensOf(parts);
			gsap.fromTo(
				parts,
				{ autoAlpha: 0, y: 16 },
				{
					autoAlpha: 1,
					y: 0,
					duration: 0.52,
					stagger: 0.075,
					ease: 'power3.out',
					clearProps: 'opacity,transform'
				}
			);
		}
		animateHero(root);
		animateCards();

		const grid = document.querySelector('.home-redesign .card-grid');
		if (grid && !observer) {
			observer = new MutationObserver(() => requestAnimationFrame(animateCards));
			observer.observe(grid, { childList: true });
		}
	}

	onMount(() => {
		const stopMotion = () => {
			if (!reduceMotion()) return;
			const elements = document.querySelectorAll('.home-redesign .card-grid > *, .catalog-hero, .catalog-copy, .catalog-stats > div, .home-filters');
			gsap.killTweensOf(elements);
			gsap.set(elements, { clearProps: 'transform,opacity,visibility' });
		};
		window.addEventListener('riftthai-motion-change', stopMotion);
		const run = () => requestAnimationFrame(animatePage);
		run();
		afterNavigate(run);
		return () => {
			window.removeEventListener('riftthai-motion-change', stopMotion);
			observer?.disconnect();
			observer = null;
			gsap.killTweensOf('*');
		};
	});
</script>
