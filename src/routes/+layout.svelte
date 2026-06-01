<script lang="ts">
	import { page } from '$app/state';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import './layout.css';
	import FakeAiChat from '$lib/components/FakeAiChat.svelte';
	import PcSideNav from '$lib/components/PcSideNav.svelte';
	import UserGuide from '$lib/components/UserGuide.svelte';

	let { children } = $props();

	const siteUrl = 'https://riftthai.guyssar.com';
	const siteName = 'RiftThai';
	const defaultTitle = 'RiftThai - ฐานข้อมูลการ์ด Riftbound ภาษาไทย';
	const defaultDescription =
		'RiftThai ฐานข้อมูลการ์ด Riftbound ภาษาไทย ค้นหาการ์ด อ่านคำแปล คีย์เวิร์ด กฎ และคำอธิบาย Domain สำหรับผู้เล่นไทย';
	const logoPath = '/logo.png';
	const shareImage = `${siteUrl}${logoPath}`;

	const publicPages: Record<string, { title: string; description: string }> = {
		'/': {
			title: defaultTitle,
			description: defaultDescription
		},
		'/qa': {
			title: 'RiftThai Q&A - คำถามกฎ Riftbound ภาษาไทย',
			description:
				'รวมคำถามคำตอบกฎและกลไกของ Riftbound ภาษาไทย ช่วยอธิบายคีย์เวิร์ด การต่อสู้ การเคลื่อนที่ Token และสถานการณ์ที่พบบ่อย'
		},
		'/domains': {
			title: 'Riftbound Domains ภาษาไทย - RiftThai',
			description:
				'สรุป Domain ใน Riftbound ทั้ง Fury, Calm, Mind, Body, Chaos และ Order พร้อมจุดเด่น จุดอ่อน และแนวทางเล่นภาษาไทย'
		},
		'/privacy': {
			title: 'Privacy Policy - RiftThai',
			description:
				'นโยบายความเป็นส่วนตัวของ RiftThai สำหรับบัญชีผู้ใช้ แชต ระบบ AI และข้อมูลการใช้งาน'
		},
		'/terms': {
			title: 'Terms of Use - RiftThai',
			description:
				'ข้อกำหนดการใช้งาน RiftThai ฐานข้อมูลการ์ดและแหล่งข้อมูลชุมชนสำหรับ Riftbound ภาษาไทย'
		}
	};

	let pathname = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	let seo = $derived(publicPages[pathname] ?? publicPages['/']);
	let canonicalPath = $derived(publicPages[pathname] ? pathname : '/');
	let canonicalUrl = $derived(`${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`);
	let robots = $derived(publicPages[pathname] ? 'index, follow' : 'noindex, nofollow');
	let sideNavActive: 'cards' | 'domains' | 'qa' | 'deck' | 'donate' | '' = $derived(
		pathname === '/'
			? 'cards'
			: pathname.startsWith('/domains')
				? 'domains'
				: pathname.startsWith('/qa')
					? 'qa'
					: pathname.startsWith('/deck')
						? 'deck'
						: pathname.startsWith('/donate')
							? 'donate'
							: ''
	);
	let cookieChoice = $state<'accepted' | 'declined' | null>(null);
	let showCookieNotice = $derived(cookieChoice === null);
	let structuredData = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'WebSite',
					'@id': `${siteUrl}/#website`,
					name: siteName,
					url: `${siteUrl}/`,
					inLanguage: 'th-TH',
					description: defaultDescription,
					publisher: { '@id': `${siteUrl}/#organization` },
					potentialAction: {
						'@type': 'SearchAction',
						target: `${siteUrl}/?q={search_term_string}`,
						'query-input': 'required name=search_term_string'
					}
				},
				{
					'@type': 'Organization',
					'@id': `${siteUrl}/#organization`,
					name: siteName,
					url: `${siteUrl}/`,
					logo: shareImage
				},
				{
					'@type': 'WebPage',
					'@id': `${canonicalUrl}#webpage`,
					url: canonicalUrl,
					name: seo.title,
					description: seo.description,
					isPartOf: { '@id': `${siteUrl}/#website` },
					inLanguage: 'th-TH'
				}
			]
		})
	);

	onMount(() => {
		const savedChoice = localStorage.getItem('riftthai_cookie_choice');
		if (savedChoice === 'accepted' || savedChoice === 'declined') {
			cookieChoice = savedChoice;
		}
	});

	function setCookieChoice(choice: 'accepted' | 'declined') {
		cookieChoice = choice;
		localStorage.setItem('riftthai_cookie_choice', choice);
	}
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta
		name="keywords"
		content="RiftThai, Riftbound, Riftbound Thai, Riftbound ภาษาไทย, Riftbound แปลไทย, ฐานข้อมูลการ์ด Riftbound, การ์ดเกม, TCG, CCG"
	/>
	<meta name="robots" content={robots} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="icon" type="image/png" href={logoPath} />
	<link rel="apple-touch-icon" href={logoPath} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="th_TH" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:width" content="1254" />
	<meta property="og:image:height" content="1254" />
	<meta property="og:image:alt" content="RiftThai - Riftbound Thai card database" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={canonicalUrl} />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={shareImage} />
	<!-- prettier-ignore -->
	<script type="application/ld+json">
{structuredData}
	</script>
</svelte:head>
{#if !!$navigating}
	<div class="fixed inset-x-0 top-0 z-[1000] h-1 overflow-hidden bg-slate-950">
		<div class="h-full bg-cyan-300 animate-global-loading-bar"></div>
	</div>
	<div class="fixed inset-0 z-[990] grid place-items-center bg-black/80 p-4 backdrop-blur-sm animate-global-loading-fade">
		<div class="rt-panel w-full max-w-xs rounded-xl p-5 text-center shadow-2xl shadow-black/40">
			<div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
			<div class="mt-4 text-sm font-black uppercase tracking-widest text-white">Loading</div>
		</div>
	</div>
{/if}
<div
	class="min-h-dvh lg:grid lg:grid-cols-[5.75rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)]"
>
	<PcSideNav active={sideNavActive} />
	<div class="min-w-0">
		{@render children()}
	</div>
</div>
{#if showCookieNotice}
	<div
		class="fixed bottom-3 left-1/2 z-[940] w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 rounded-xl border border-cyan-300/20 bg-slate-950/95 p-3 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur sm:bottom-4"
	>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p class="text-xs leading-relaxed font-semibold text-slate-300">
				เราใช้คุกกี้ที่จำเป็นเพื่อให้ระบบบัญชีและการใช้งานเว็บทำงานได้ดีขึ้น อ่าน
				<a class="font-black text-cyan-300 transition hover:text-cyan-100" href="/privacy"
					>นโยบายความเป็นส่วนตัว</a
				>
				และ
				<a class="font-black text-cyan-300 transition hover:text-cyan-100" href="/terms"
					>ข้อกำหนดการใช้งาน</a
				>
			</p>
			<div class="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
				<button
					type="button"
					class="h-10 rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-200 uppercase transition hover:bg-white/10"
					onclick={() => setCookieChoice('declined')}
				>
					ยกเลิก
				</button>
				<button
					type="button"
					class="h-10 rounded-lg bg-cyan-300 px-4 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-cyan-200"
					onclick={() => setCookieChoice('accepted')}
				>
					ตกลง
				</button>
			</div>
		</div>
	</div>
{/if}
<FakeAiChat />
<UserGuide />

<style>
	@keyframes global-loading-bar {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes global-loading-fade {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	.animate-global-loading-bar {
		animation: global-loading-bar 1.3s infinite linear;
	}

	.animate-global-loading-fade {
		animation: global-loading-fade 0.16s ease-out both;
	}
</style>
