<script lang="ts">
	import { page } from '$app/state';
	import { navigating } from '$app/stores';
	import './layout.css';
	import FakeAiChat from '$lib/components/FakeAiChat.svelte';

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
			description: 'นโยบายความเป็นส่วนตัวของ RiftThai สำหรับบัญชีผู้ใช้ แชต ระบบ AI และข้อมูลการใช้งาน'
		},
		'/terms': {
			title: 'Terms of Use - RiftThai',
			description: 'ข้อกำหนดการใช้งาน RiftThai ฐานข้อมูลการ์ดและแหล่งข้อมูลชุมชนสำหรับ Riftbound ภาษาไทย'
		}
	};

	let pathname = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	let seo = $derived(publicPages[pathname] ?? publicPages['/']);
	let canonicalPath = $derived(publicPages[pathname] ? pathname : '/');
	let canonicalUrl = $derived(`${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`);
	let robots = $derived(publicPages[pathname] ? 'index, follow' : 'noindex, nofollow');
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
	<script type="application/ld+json">{structuredData}</script>
</svelte:head>
{#if !!$navigating}
	<div class="fixed inset-x-0 top-0 z-[1000] h-1 overflow-hidden bg-slate-950">
		<div class="h-full bg-cyan-300 animate-global-loading-bar"></div>
	</div>
	<div class="pointer-events-none fixed left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-lg border border-cyan-300/20 bg-slate-950/92 px-4 py-2 shadow-2xl shadow-black/35 backdrop-blur animate-global-loading-toast">
		<div class="flex items-center gap-3">
			<div class="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300"></div>
			<span class="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">Loading</span>
		</div>
	</div>
{/if}
{@render children()}
<FakeAiChat />

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

	@keyframes global-loading-toast {
		0% {
			opacity: 0;
			transform: translate(-50%, -0.5rem);
		}
		100% {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.animate-global-loading-bar {
		animation: global-loading-bar 1.3s infinite linear;
	}

	.animate-global-loading-toast {
		animation: global-loading-toast 0.16s ease-out both;
	}
</style>
