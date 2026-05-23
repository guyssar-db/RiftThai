<script lang="ts">
	import cardsData from '$lib/data/riftbound_cards_all.json';
	import { domainAnswers, type DomainAnswer } from '$lib/data/domainAnswers';
	import { iconMappings, keywords } from '$lib/data/keywords';
	import { ruleAnswers, type RuleAnswer } from '$lib/data/ruleAnswers';
	import type { Card } from '$lib/types/card';

	type Message = {
		role: 'bot' | 'user';
		text: string;
	};

	type ScoredRule = {
		rule: RuleAnswer;
		score: number;
	};

	type ScoredDomain = {
		domain: DomainAnswer;
		score: number;
	};

	const cards = cardsData as Card[];
	const quickPrompts = ['Hidden คืออะไร', 'Fury ต่างจาก Body ยังไง', 'Reaction ใช้ตอนไหน', 'ค้นหา Ahri'];
	const stopWords = new Set([
		'คือ',
		'อะไร',
		'ยังไง',
		'อย่างไร',
		'ได้ไหม',
		'มั้ย',
		'ไหม',
		'การ',
		'ของ',
		'ที่',
		'ใน',
		'และ',
		'หรือ',
		'ถ้า',
		'can',
		'what',
		'when',
		'how',
		'does',
		'the',
		'a',
		'an',
		'is',
		'to',
		'of',
		'domain'
	]);

	let isOpen = $state(false);
	let input = $state('');
	let messages = $state<Message[]>([
		{
			role: 'bot',
			text: 'ถาม rule, keyword, domain หรือชื่อการ์ดได้ ระบบนี้ค้นจากข้อมูลในเว็บเท่านั้น'
		}
	]);

	function normalize(value: unknown) {
		return String(value ?? '')
			.normalize('NFKC')
			.toLowerCase()
			.replace(/[_\-/:()[\].,]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function escapeHtml(value: string) {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function parseAnswerText(text: string) {
		let processed = escapeHtml(text);
		const placeholders: Record<string, string> = {};
		let placeholderIndex = 0;

		function addPlaceholder(html: string) {
			const id = `___CHAT_PH_${placeholderIndex++}___`;
			placeholders[id] = html;
			return id;
		}

		processed = processed.replace(/\[c\]/gi, () =>
			addPlaceholder('<img src="/images/icons/rune_rainbow.svg" class="chat-inline-icon" title="Any Rune" alt="Any Rune" />')
		);

		processed = processed.replace(/:rb_energy_(\d+):/g, (_match, value) =>
			addPlaceholder(`<span class="chat-energy-circle" title="Energy: ${value}">${value}</span>`)
		);

		Object.entries(iconMappings).forEach(([token, value]) => {
			processed = processed.replaceAll(
				token,
				addPlaceholder(
					`<img src="/images/icons/${value.icon}" class="chat-inline-icon" title="${escapeHtml(value.hint)}" alt="${escapeHtml(token)}" />`
				)
			);
		});

		processed = processed.replace(/\[([^\]]+)\]/g, (_match, keywordText) => {
			const displayText = String(keywordText).trim();
			const keywordName = displayText.split(' ')[0];
			const keyword = keywords.find(
				(item) => normalize(item.name_en) === normalize(keywordName) || normalize(item.name_th) === normalize(keywordName)
			);
			const color = keyword?.color ?? '#107361';

			return addPlaceholder(
				`<span class="chat-keyword-badge" style="background-color: ${color};"><span>${escapeHtml(displayText)}</span></span>`
			);
		});

		Object.entries(placeholders).forEach(([id, html]) => {
			processed = processed.replaceAll(id, html);
		});

		return processed.replace(/\n/g, '<br />');
	}

	function getTokens(value: string) {
		return normalize(value)
			.split(' ')
			.filter((token) => token.length >= 2 && !stopWords.has(token));
	}

	function scoreText(text: string, tokens: string[]) {
		const normalized = normalize(text);
		return tokens.reduce((score, token) => {
			if (normalized === token) return score + 80;
			if (normalized.startsWith(token)) return score + 18;
			if (normalized.includes(token)) return score + 8;
			if (token.length >= 4 && normalized.includes(token.slice(0, -1))) return score + 3;
			return score;
		}, 0);
	}

	function scoreDomain(domain: DomainAnswer, query: string, tokens: string[]) {
		const normalizedQuery = normalize(query);
		const searchText = [
			domain.name,
			domain.colorName,
			domain.summary,
			domain.bestFor,
			domain.strengths.join(' '),
			domain.pros.join(' '),
			domain.cons.join(' '),
			domain.description.join(' '),
			...domain.aliases
		].join(' ');

		let score = 0;

		for (const alias of domain.aliases) {
			const normalizedAlias = normalize(alias);
			if (!normalizedAlias) continue;
			if (normalizedQuery === normalizedAlias) score += 120;
			if (normalizedQuery.includes(normalizedAlias)) score += 58;
			score += scoreText(normalizedAlias, tokens) * 3;
		}

		score += scoreText(domain.name, tokens) * 4;
		score += scoreText(domain.colorName, tokens) * 2;
		score += scoreText(domain.summary, tokens);
		score += scoreText(domain.bestFor, tokens);

		if (normalizedQuery.includes('domain') || normalizedQuery.includes('โดเมน')) score += 18;
		if (normalize(searchText).includes(normalizedQuery)) score += 25;

		return score;
	}

	function findDomains(query: string) {
		const tokens = getTokens(query);
		const normalizedQuery = normalize(query);
		if (tokens.length === 0 && !normalizedQuery.includes('domain') && !normalizedQuery.includes('โดเมน')) return [];

		return domainAnswers
			.map((domain): ScoredDomain => ({ domain, score: scoreDomain(domain, query, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score);
	}

	function isDomainIntent(query: string) {
		const normalizedQuery = normalize(query);
		if (!normalizedQuery) return false;

		if (normalizedQuery.includes('domain') || normalizedQuery.includes('โดเมน')) return true;

		return domainAnswers.some((domain) =>
			[domain.name, domain.colorName, ...domain.aliases].some((term) => {
				const normalizedTerm = normalize(term);
				return normalizedTerm ? normalizedQuery.includes(normalizedTerm) : false;
			})
		);
	}

	function scoreRule(rule: RuleAnswer, query: string, tokens: string[]) {
		const normalizedQuery = normalize(query);
		let score = 0;

		for (const key of rule.keys) {
			const normalizedKey = normalize(key);
			if (normalizedQuery === normalizedKey) score += 120;
			if (normalizedQuery.includes(normalizedKey)) score += 55;
			score += scoreText(normalizedKey, tokens) * 3;
		}

		score += scoreText(rule.title, tokens) * 2;
		score += scoreText(rule.text, tokens);

		return score;
	}

	function findRules(query: string) {
		const tokens = getTokens(query);
		if (tokens.length === 0) return [];

		return ruleAnswers
			.map((rule): ScoredRule => ({ rule, score: scoreRule(rule, query, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);
	}

	function findKeyword(query: string) {
		const tokens = getTokens(query);
		const normalizedQuery = normalize(query);

		return keywords
			.map((keyword) => {
				const score =
					scoreText(keyword.name_en, tokens) * 3 +
					scoreText(keyword.name_th, tokens) * 2 +
					scoreText(keyword.id, tokens) * 3 +
					scoreText(keyword.description_th, tokens) +
					(normalizedQuery.includes(normalize(keyword.name_en)) ? 40 : 0);

				return { keyword, score };
			})
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)[0]?.keyword;
	}

	function searchableCardText(card: Card) {
		return normalize(
			[
				card.name_en,
				card.name_th,
				card.code,
				card.type,
				card.rarity,
				card.set_name,
				card.ability_en,
				card.ability_th,
				...(card.domains ?? []),
				...(card.tags ?? [])
			].join(' ')
		);
	}

	function scoreCard(card: Card, queryTokens: string[]) {
		const name = normalize(`${card.name_en} ${card.name_th}`);
		const code = normalize(card.code);
		const allText = searchableCardText(card);

		return queryTokens.reduce((score, token) => {
			if (name === token || code === token) return score + 100;
			if (name.includes(token)) return score + 30;
			if (code.includes(token)) return score + 24;
			if (allText.includes(token)) return score + 5;
			return score;
		}, 0);
	}

	function findCards(query: string) {
		const tokens = getTokens(query);
		if (tokens.length === 0) return [];

		return cards
			.map((card) => ({ card, score: scoreCard(card, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3)
			.map(({ card }) => card);
	}

	function formatRules(results: ScoredRule[]) {
		if (results.length === 0) return '';

		const [best, ...related] = results;
		const relatedText = related.length
			? `\n\nคำตอบที่เกี่ยวข้อง:\n${related.map(({ rule }) => `- ${rule.title}: ${rule.text}`).join('\n')}`
			: '';

		return `${best.rule.title}: ${best.rule.text}${relatedText}`;
	}

	function formatDomains(results: ScoredDomain[], query: string) {
		if (results.length === 0) return '';

		const normalizedQuery = normalize(query);
		const isGenericDomainQuestion =
			normalizedQuery.includes('domain') ||
			normalizedQuery.includes('โดเมน') ||
			normalizedQuery === 'domain' ||
			normalizedQuery === 'โดเมน';

		if (isGenericDomainQuestion && results[0].score < 90) {
			return [
				'Domains ใน Riftbound มี 6 แบบ: Fury, Calm, Mind, Body, Chaos และ Order.',
				'',
				'สรุปเร็ว:',
				...domainAnswers.map((domain) => `${domain.iconToken} ${domain.name} (${domain.colorName}) - ${domain.summary}`),
				'',
				'ถ้าอยากเจาะลึก พิมพ์ชื่อ domain เช่น "Fury" หรือ "Calm"'
			].join('\n');
		}

		const [best, ...related] = results;
		const relatedText = related.length
			? `\n\nคำตอบที่เกี่ยวข้อง:\n${related
					.slice(0, 2)
					.map(
						({ domain }) =>
							`- ${domain.iconToken} ${domain.name}: ${domain.summary} | เหมาะกับ: ${domain.bestFor}`
					)
					.join('\n')}`
			: '';

		return [
			`${best.domain.iconToken} ${best.domain.name} (${best.domain.colorName}): ${best.domain.summary}`,
			`เหมาะกับ: ${best.domain.bestFor}`,
			`จุดเด่น: ${best.domain.strengths.join(', ')}`,
			`ข้อดี: ${best.domain.pros.join(' | ')}`,
			`ข้อเสีย: ${best.domain.cons.join(' | ')}`,
			'',
			...best.domain.description,
			relatedText,
			'',
			'หมายเหตุ: นี่เป็น offline helper จากข้อมูลในเว็บ ไม่ใช่ official ruling สุดท้าย'
		]
			.filter(Boolean)
			.join('\n');
	}

	function formatCards(matches: Card[]) {
		return matches
			.map((card, index) => {
				const domains = card.domains?.length ? ` | ${card.domains.join(', ')}` : '';
				const tags = card.tags?.length ? ` | #${card.tags.join(' #')}` : '';
				const ability = card.ability_th || card.ability_en || 'ไม่มี ability text';
				return `${index + 1}. ${card.name_en} (${card.code})\n${card.type} - ${card.rarity}${domains}${tags}\n${ability}`;
			})
			.join('\n\n');
	}

	function buildAnswer(query: string) {
		const domainIntent = isDomainIntent(query);
		const domains = findDomains(query);
		if (domainIntent) {
			if (domains.length > 0) {
				return formatDomains(domains, query);
			}

			return [
				'Domains ใน Riftbound มี 6 แบบ: Fury, Calm, Mind, Body, Chaos และ Order.',
				'',
				'สรุปเร็ว:',
				...domainAnswers.map((domain) => `${domain.iconToken} ${domain.name} (${domain.colorName}) - ${domain.summary}`),
				'',
				'ถ้าอยากเจาะลึก พิมพ์ชื่อ domain เช่น "Fury" หรือ "Calm"'
			].join('\n');
		}

		if (domains.length > 0) {
			return formatDomains(domains, query);
		}

		const rules = findRules(query);
		if (rules.length > 0 && rules[0].score >= 24) {
			return `${formatRules(rules)}\n\nหมายเหตุ: นี่เป็น offline helper จากข้อมูลสรุปในเว็บ ไม่ใช่ official ruling สุดท้าย`;
		}

		const keyword = findKeyword(query);
		if (keyword) {
			return `${keyword.name_en}: ${keyword.description_th}\n\nหมายเหตุ: ถ้าเป็นเคสซับซ้อน ให้เทียบกับข้อความบนการ์ดและกฎ official อีกครั้ง`;
		}

		const matches = findCards(query);
		if (matches.length > 0) {
			return `เจอการ์ดที่เกี่ยวข้อง:\n${formatCards(matches)}`;
		}

		return 'ยังหาไม่เจอในข้อมูล local ลองถามด้วยชื่อการ์ด, keyword, domain หรือคำอังกฤษสั้น ๆ เช่น Hidden, Reaction, Fury, Order';
	}

	function sendMessage(text = input) {
		const query = text.trim();
		if (!query) return;

		messages = [...messages, { role: 'user', text: query }, { role: 'bot', text: buildAnswer(query) }];
		input = '';
	}
</script>

<div class="fixed bottom-24 right-4 z-[900] font-sans md:bottom-5 md:right-5">
	{#if isOpen}
		<div class="mb-3 flex h-[min(560px,72dvh)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/70 backdrop-blur-2xl">
			<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
				<div>
					<div class="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Helper</div>
					<div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Offline search</div>
				</div>
				<button
					type="button"
					class="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/5"
					aria-label="Close chat"
					onclick={() => (isOpen = false)}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
						<path d="M6 18 18 6" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>

			<div class="border-b border-white/10 px-4 py-2 text-[11px] font-medium leading-relaxed text-slate-500">
				ตอบจาก rule summary, keyword, domain และ card data ในเว็บ
			</div>

			<div class="flex-1 space-y-3 overflow-y-auto p-3">
				{#each messages as message}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[86%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed {message.role === 'user' ? 'bg-cyan-400 text-slate-950' : 'border border-white/10 bg-white/7 text-slate-100'}">
							{#if message.role === 'bot'}
								{@html parseAnswerText(message.text)}
							{:else}
								{message.text}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="border-t border-white/10 p-3">
				<div class="mb-2 flex gap-2 overflow-x-auto pb-1">
					{#each quickPrompts as prompt}
						<button
							type="button"
							class="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300"
							onclick={() => sendMessage(prompt)}
						>
							{prompt}
						</button>
					{/each}
				</div>

				<form
					class="flex gap-2"
					onsubmit={(event) => {
						event.preventDefault();
						sendMessage();
					}}
				>
					<input
						bind:value={input}
						class="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
						placeholder="ถาม rule, keyword, domain, card..."
					/>
					<button
						type="submit"
						class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 transition active:scale-95"
						aria-label="Send"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
							<path d="m22 2-7 20-4-9-9-4Z" />
							<path d="M22 2 11 13" />
						</svg>
					</button>
				</form>
			</div>
		</div>
	{/if}

	<button
		type="button"
		class="ml-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-400 text-slate-950 shadow-2xl shadow-cyan-950/40 transition hover:scale-105 active:scale-95"
		aria-label="Open rule helper"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
	>
		{#if isOpen}
			<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
				<path d="M6 18 18 6" />
				<path d="m6 6 12 12" />
			</svg>
		{:else}
			<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
				<path d="M8 9h8" />
				<path d="M8 13h5" />
			</svg>
		{/if}
	</button>
</div>

<style>
	:global(.chat-inline-icon) {
		position: relative;
		top: -1px;
		display: inline-block;
		width: auto;
		height: 1.2em;
		margin: 0 2px;
		vertical-align: middle;
		filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.45));
	}

	:global(.chat-energy-circle) {
		position: relative;
		top: -1px;
		display: inline-flex;
		width: 1.25em;
		height: 1.25em;
		align-items: center;
		justify-content: center;
		margin: 0 2px;
		border-radius: 999px;
		background: white;
		color: black;
		font-size: 0.72em;
		font-weight: 900;
		vertical-align: middle;
	}

	:global(.chat-keyword-badge) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 1.7em;
		margin: 1px 3px;
		padding: 0.12em 0.65em;
		color: white;
		font-size: 0.75em;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
		vertical-align: middle;
		box-shadow: 1px 2px 0 rgba(0, 0, 0, 0.24);
		transform: skewX(-13deg);
	}

	:global(.chat-keyword-badge > span) {
		transform: skewX(13deg);
	}
</style>
