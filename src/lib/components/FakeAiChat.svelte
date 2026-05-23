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

	type ScoredCard = {
		card: Card;
		score: number;
	};

	type ScoredKeyword = {
		keyword: (typeof keywords)[number];
		score: number;
	};

	type QAAnswer = {
		category: string;
		question: string;
		answer: string;
	};

	type PhaseAnswer = {
		title: string;
		aliases: string[];
		text: string;
	};

	type ScoredQA = {
		item: QAAnswer;
		score: number;
	};

	type ScoredPhase = {
		phase: PhaseAnswer;
		score: number;
	};

	const cards = cardsData as Card[];
	const qaAnswers: QAAnswer[] = [
		{
			category: 'Keywords & Abilities',
			question: 'สกิล Soaring Scout ที่เขียนว่า DEATHKNELL: Channel 1 rune exhausted ทำงานอย่างไร?',
			answer:
				'เมื่อ Soaring Scout ตาย Deathknell จะทำให้ Channel rune 1 ใบเข้ามาในสนามแบบ exhausted จึงยังใช้ Energy จากรูนนั้นในเทิร์นนั้นทันทีไม่ได้'
		},
		{
			category: 'Card Mechanics',
			question: 'Consult the Past ที่มี Hidden ต้องจ่ายและวางไว้ตรงไหน?',
			answer:
				'ตามข้อมูล Q&A ในเว็บ การ์ด Hidden สามารถจ่ายล่วงหน้าโดย recycle rune 1 ใบเพื่อวางคว่ำไว้ที่ battlefield ที่เลือก แล้วค่อยเปิดใช้จาก facedown ภายหลัง'
		},
		{
			category: 'Keywords & Abilities',
			question: 'Reaction ใช้ตอนไหนได้บ้าง?',
			answer:
				'Reaction ใช้เพื่อสวนกลับหรือขัดจังหวะได้เมื่อมี priority รวมถึงในเทิร์นคู่แข่งและช่วงต่อสู้ ตามข้อมูลในเว็บใช้ตอบสิ่งที่อยู่บน chain ได้'
		},
		{
			category: 'Rules & Combat',
			question: 'Spirit Token ที่เพิ่งเสกออกมาเปิด Showdown ในเทิร์นนั้นได้ไหม?',
			answer:
				'ไม่ได้ ถ้า token เข้ามาแบบ exhausted จะยังสั่ง exhaust เพื่อเปิด Showdown ไม่ได้ ต้องรอให้พร้อมก่อน แต่ยังนับ Might เพื่อร่วมตั้งรับได้'
		},
		{
			category: 'Card Mechanics',
			question: 'Cull the Weak ร่ายได้ไหมถ้าบอร์ดเราว่าง?',
			answer:
				'ร่ายได้ ตามข้อมูล Q&A ระบบจะทำตามเอฟเฟกต์ให้ได้มากที่สุด เราไม่มี unit ให้ทำลายก็ไม่ต้องทำลายอะไร ส่วนอีกฝ่ายยังต้องเลือกทำลาย unit ของตัวเองถ้ามี'
		},
		{
			category: 'Rules & Scoring',
			question: 'Hold และ Ahri, Alluring ได้แต้มตอนไหน?',
			answer:
				'ข้อมูลในเว็บระบุว่า Hold scoring และสกิลที่เกี่ยวข้องเกิดช่วงเริ่มเทิร์นของคุณ ถ้าคุม battlefield อยู่จะได้แต้มตามเงื่อนไขของกฎหรือการ์ด'
		},
		{
			category: 'Keywords & Abilities',
			question: 'Stun จำกัดอะไร และหายตอนไหน?',
			answer:
				'ยูนิตที่ติด Stun จะไม่สามารถโจมตี เคลื่อนที่ หรือใช้ activated ability ที่ต้อง exhaust ได้ตามปกติ และจะหายตาม timing ที่กฎหรือเอฟเฟกต์กำหนด'
		},
		{
			category: 'Rules & Healing',
			question: 'Heal ล้างดาเมจสะสมตอนไหน?',
			answer:
				'ข้อมูลในเว็บสรุปว่า damage ที่สะสมบน unit จะถูกล้างตามช่วง cleanup/จบ combat หรือ end of turn ตาม timing ที่กฎและเอฟเฟกต์ระบุ'
		},
		{
			category: 'Rules & Movement',
			question: 'Move unit ข้ามจาก battlefield หนึ่งไปอีก battlefield ได้ไหม?',
			answer:
				'การ move ปกติไม่ได้ข้าม battlefield เอง แต่ถ้าการ์ดหรือ ability สั่ง Move a unit ก็สามารถข้ามข้อจำกัดปกติได้ตามข้อความการ์ด'
		},
		{
			category: 'Rules & Timing',
			question: 'Action กับ Reaction ต่างกันยังไง?',
			answer:
				'Action ใช้ตอบ chain ไม่ได้และต้องเล่นตอนที่ timing เปิดให้ทำ action ส่วน Reaction ใช้ตอนมี priority และใช้ตอบสิ่งที่อยู่บน chain ได้'
		},
		{
			category: 'Rules & Showdown',
			question: 'Showdown เกิดขึ้นเมื่อไหร่?',
			answer:
				'ข้อมูลในเว็บสรุปว่า Showdown เกี่ยวกับการ contest battlefield และในกฎล่าสุด Showdown จะถูก staged ระหว่าง cleanup หลัง battlefield ได้รับสถานะ Contested'
		},
		{
			category: 'Rules & Chain',
			question: 'Chain เกิดจากอะไร?',
			answer:
				'Chain เกิดจากการเล่น spell, activated ability หรือ triggered ability ที่ต้องเข้าลำดับการ resolve ผู้เล่นจึงมีจังหวะใช้ Reaction ตาม priority'
		},
		{
			category: 'Rules & Resources',
			question: 'Recycle rune ที่ exhausted ได้ไหม?',
			answer:
				'ข้อมูล Q&A ในเว็บระบุว่าสามารถ recycle rune ที่ exhausted อยู่ได้ ไม่จำเป็นต้องเลือกรูนที่ ready เท่านั้น'
		},
		{
			category: 'Rules & Targeting',
			question: 'อะไรถือว่าเป็น target?',
			answer:
				'โดยสรุป target มักเป็น object หรือผู้เล่นใน public zone ที่ถูกผู้เล่นคนเดียวเลือกให้ spell หรือ ability กระทบโดยตรง การให้ผู้เล่นแต่ละคนเลือกของตัวเองมักไม่ถือว่า target'
		},
		{
			category: 'Rules & Tokens',
			question: 'Token ที่ไม่มี cost ถือว่า cost เท่าไหร่?',
			answer: 'สำหรับเอฟเฟกต์ที่ต้องดู cost ของ token ข้อมูลในเว็บสรุปให้ถือว่า token มี cost เป็น 0'
		},
		{
			category: 'Rules & Multiplayer',
			question: 'ใน 2v2 friendly unit หมายถึงอะไร?',
			answer:
				'Friendly unit หมายถึง unit ของคุณและ unit ของเพื่อนร่วมทีม แต่คำว่า your units โดยทั่วไปหมายถึง unit ที่คุณควบคุมเอง'
		}
	];

	const phaseAnswers: PhaseAnswer[] = [
		{
			title: 'Awaken Phase',
			aliases: ['awaken', 'ready', 'เฟสเตรียมพร้อม', 'ตั้งตรง', 'stun หาย'],
			text: 'Awaken Phase คือช่วงเตรียมพร้อม: ถอด Stun และทำให้การ์ดที่ exhausted อยู่ เช่น units, runes, champions และ gear กลับมา ready'
		},
		{
			title: 'Beginning Phase',
			aliases: ['beginning', 'start', 'start of turn', 'เฟสเริ่มต้น', 'hold'],
			text: 'Beginning Phase คือช่วงเริ่มเทิร์น ใช้ตรวจ Hold scoring และให้ความสามารถประเภท start of turn ทำงาน'
		},
		{
			title: 'Channel Phase',
			aliases: ['channel', 'rune', 'เฟสรูน', 'รูน'],
			text: 'Channel Phase คือช่วงนำ rune จาก Rune Deck เข้าสู่สนาม โดยข้อมูลในเว็บระบุว่าปกติ channel 2 ใบ และผู้เล่นคนที่สองในเทิร์นแรกได้เพิ่มเป็น 3 ใบ'
		},
		{
			title: 'Draw Phase',
			aliases: ['draw', 'เฟสจั่ว', 'จั่ว'],
			text: 'Draw Phase คือช่วงจั่วการ์ด 1 ใบจาก Main Deck ขึ้นมือ'
		},
		{
			title: 'Action Phase',
			aliases: ['action phase', 'เฟสหลัก', 'play card', 'set hidden', 'use ability', 'move unit'],
			text: 'Action Phase คือเฟสหลัก ผู้เล่นสามารถ play card, set hidden, use ability และ move unit ได้ตามทรัพยากรและ timing ที่อนุญาต'
		},
		{
			title: 'End Of Turn',
			aliases: ['end', 'end of turn', 'เฟสจบเทิร์น', 'จบเทิร์น', 'global heal'],
			text: 'End of Turn คือช่วงจบเทิร์น ผลแบบ this turn หมดลง มีการล้าง damage ตามข้อมูล flow ในเว็บ และส่งเทิร์นให้ผู้เล่นถัดไป'
		},
		{
			title: 'Combat Timeline',
			aliases: ['combat', 'showdown', 'assign damage', 'deathknell', 'contested check', 'ต่อสู้'],
			text: 'Combat timeline ในเว็บเรียงเป็น Pre-Combat Window, Assign Damage, Combat Cleanup & Deathknell, Contested Check และ Global Heal'
		},
		{
			title: 'Card Speeds',
			aliases: ['normal speed', 'action speed', 'reaction speed', 'speed', 'ความเร็ว'],
			text: 'ข้อมูลหน้า phases แบ่งความเร็วเป็น Normal Speed, Action Speed และ Reaction Speed โดย Reaction ใช้ตอบ chain ได้ ส่วน Action ต้องรอ chain ว่าง'
		}
	];
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

	const noAnswerText =
		'ข้อนี้ผมยังตอบให้มั่นใจไม่ได้จากข้อมูลที่มีในเว็บ เลยไม่อยากเดาให้ผิด ถ้าเป็นเคสเฉพาะการ์ด ให้ลองเช็กข้อความบนการ์ดหรือ official rules เพิ่มอีกชั้น';

	let isOpen = $state(false);
	let input = $state('');
	let messages = $state<Message[]>([
		{
			role: 'bot',
			text: 'ถามกฎ, การ์ด, keyword, phase, Q&A หรือ domain มาได้เลย ผมจะตอบจากข้อมูลที่มีในเว็บและจะไม่เดาถ้าไม่มั่นใจ'
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

	function isGenericDomainIntent(query: string) {
		const normalizedQuery = normalize(query);
		return normalizedQuery.includes('domain') || normalizedQuery.includes('โดเมน');
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

	function scoreQA(item: QAAnswer, query: string, tokens: string[]) {
		const normalizedQuery = normalize(query);
		let score = scoreText(item.question, tokens) * 3 + scoreText(item.answer, tokens) + scoreText(item.category, tokens);

		if (normalize(item.question).includes(normalizedQuery)) score += 35;
		if (normalize(item.answer).includes(normalizedQuery)) score += 18;

		return score;
	}

	function findQA(query: string): ScoredQA[] {
		const tokens = getTokens(query);
		if (tokens.length === 0) return [];

		return qaAnswers
			.map((item): ScoredQA => ({ item, score: scoreQA(item, query, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);
	}

	function scorePhase(phase: PhaseAnswer, query: string, tokens: string[]) {
		const normalizedQuery = normalize(query);
		let score = scoreText(phase.title, tokens) * 3 + scoreText(phase.text, tokens);

		for (const alias of phase.aliases) {
			const normalizedAlias = normalize(alias);
			if (normalizedQuery === normalizedAlias) score += 120;
			if (normalizedQuery.includes(normalizedAlias)) score += 58;
			score += scoreText(alias, tokens) * 3;
		}

		if (normalizedQuery.includes('phase') || normalizedQuery.includes('เฟส')) score += 16;

		return score;
	}

	function findPhases(query: string): ScoredPhase[] {
		const tokens = getTokens(query);
		const normalizedQuery = normalize(query);
		if (tokens.length === 0 && !normalizedQuery.includes('phase') && !normalizedQuery.includes('เฟส')) return [];

		return phaseAnswers
			.map((phase): ScoredPhase => ({ phase, score: scorePhase(phase, query, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);
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

	function findKeyword(query: string): ScoredKeyword | undefined {
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
			.sort((a, b) => b.score - a.score)[0];
	}

	function isDirectKeywordQuestion(query: string, result: ScoredKeyword | undefined) {
		if (!result) return false;

		const normalizedQuery = normalize(query);
		const allKeywordMatches = keywords.filter((keyword) =>
			[keyword.name_en, keyword.name_th, keyword.id].some((term) => {
				const normalizedTerm = normalize(term);
				return normalizedTerm ? normalizedQuery.includes(normalizedTerm) : false;
			})
		);

		if (allKeywordMatches.length !== 1) return false;

		const keywordTerms = [result.keyword.name_en, result.keyword.name_th, result.keyword.id].map(normalize);
		const hasKeyword = keywordTerms.some((term) => term && normalizedQuery.includes(term));
		const isShortQuestion = getTokens(query).length <= 3;

		return hasKeyword && (isShortQuestion || normalizedQuery.includes('คือ') || normalizedQuery.includes('keyword'));
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

	function findCards(query: string): ScoredCard[] {
		const tokens = getTokens(query);
		if (tokens.length === 0) return [];

		return cards
			.map((card) => ({ card, score: scoreCard(card, tokens) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);
	}

	function formatRules(results: ScoredRule[]) {
		if (results.length === 0) return '';

		const [best, ...related] = results;
		const relatedText = related.length
			? `\n\nเรื่องที่อาจเกี่ยวข้อง:\n${related.map(({ rule }) => `- ${rule.title}: ${rule.text}`).join('\n')}`
			: '';

		return `ถ้าถามเรื่อง ${best.rule.title} คำตอบคือ: ${best.rule.text}${relatedText}`;
	}

	function formatQA(results: ScoredQA[]) {
		const [best, ...related] = results;
		const relatedText = related.length
			? `\n\nคำถามใกล้เคียงใน Q&A:\n${related.map(({ item }) => `- ${item.question}`).join('\n')}`
			: '';

		return `เจอคำตอบจาก Q&A ในเว็บ:\n${best.item.question}\n\n${best.item.answer}${relatedText}`;
	}

	function formatPhases(results: ScoredPhase[]) {
		const [best, ...related] = results;
		const relatedText = related.length
			? `\n\nหัวข้อ phase ที่เกี่ยวข้อง:\n${related.map(({ phase }) => `- ${phase.title}: ${phase.text}`).join('\n')}`
			: '';

		return `${best.phase.title}: ${best.phase.text}${relatedText}`;
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
				'ใน Riftbound มี domain หลัก 6 แบบ: Fury, Calm, Mind, Body, Chaos และ Order.',
				'',
				'สรุปแบบเร็ว ๆ คือ:',
				...domainAnswers.map((domain) => `${domain.iconToken} ${domain.name} (${domain.colorName}) - ${domain.summary}`)
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
			`${best.domain.iconToken} ${best.domain.name} เป็น domain สี ${best.domain.colorName}. ${best.domain.summary}`,
			`โดยรวมเหมาะกับ ${best.domain.bestFor}`,
			`จุดเด่นหลักคือ ${best.domain.strengths.join(', ')}`,
			`ข้อดี: ${best.domain.pros.join(' | ')}`,
			`จุดที่ต้องระวัง: ${best.domain.cons.join(' | ')}`,
			'',
			...best.domain.description,
			relatedText,
			'',
			'หมายเหตุ: ผมตอบจากข้อมูลสรุปในเว็บ ถ้าเป็นเคสแข่งหรือ ruling ละเอียดควรเช็ก official rules อีกครั้ง'
		]
			.filter(Boolean)
			.join('\n');
	}

	function formatCards(matches: ScoredCard[]) {
		return matches
			.map(({ card }, index) => {
				const domains = card.domains?.length ? ` | ${card.domains.join(', ')}` : '';
				const tags = card.tags?.length ? ` | #${card.tags.join(' #')}` : '';
				const ability = card.ability_th || card.ability_en || 'ไม่มี ability text';
				return `${index + 1}. ${card.name_en} (${card.code})\n${card.type} - ${card.rarity}${domains}${tags}\n${ability}`;
			})
			.join('\n\n');
	}

	function buildAnswer(query: string) {
		const matches = findCards(query);
		if (matches.length > 0 && matches[0].score >= 60) {
			return `ผมเจอการ์ดที่น่าจะเกี่ยวข้องกับคำถามนี้:\n${formatCards(matches)}`;
		}

		const keyword = findKeyword(query);
		if (isDirectKeywordQuestion(query, keyword) && keyword && keyword.score >= 45) {
			return `${keyword.keyword.name_en} คือ ${keyword.keyword.description_th}\n\nถ้าเป็นเคสซับซ้อน ให้เทียบกับข้อความบนการ์ดและ official rules อีกครั้ง`;
		}

		const qa = findQA(query);
		if (qa.length > 0 && qa[0].score >= 45) {
			return formatQA(qa);
		}

		const phases = findPhases(query);
		if (phases.length > 0 && phases[0].score >= 45) {
			return formatPhases(phases);
		}

		const rules = findRules(query);
		if (rules.length > 0 && rules[0].score >= 55) {
			return `${formatRules(rules)}\n\nหมายเหตุ: ผมตอบจากข้อมูลสรุปในเว็บ ถ้าเป็นเคสแข่งหรือ ruling ละเอียดควรเช็ก official rules อีกครั้ง`;
		}

		if (keyword && keyword.score >= 55) {
			return `${keyword.keyword.name_en} คือ ${keyword.keyword.description_th}\n\nถ้าเป็นเคสซับซ้อน ให้เทียบกับข้อความบนการ์ดและ official rules อีกครั้ง`;
		}

		const domainIntent = isDomainIntent(query);
		const domains = findDomains(query);
		if (domainIntent) {
			if (domains.length > 0 && (isGenericDomainIntent(query) || domains[0].score >= 55)) {
				return formatDomains(domains, query);
			}

			if (isGenericDomainIntent(query)) {
				return [
					'ใน Riftbound มี domain หลัก 6 แบบ: Fury, Calm, Mind, Body, Chaos และ Order.',
					'',
					'สรุปแบบเร็ว ๆ คือ:',
					...domainAnswers.map((domain) => `${domain.iconToken} ${domain.name} (${domain.colorName}) - ${domain.summary}`)
				].join('\n');
			}
		}

		if (matches.length > 0 && matches[0].score >= 30) {
			return `ผมเจอการ์ดที่อาจเกี่ยวข้องกับคำถามนี้:\n${formatCards(matches)}`;
		}

		return noAnswerText;
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
					<div class="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Rules Chat</div>
					<div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Local answer helper</div>
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
				ตอบจาก card data, keywords, phases, Q&A, domains และ rule summary ในเว็บ
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
						placeholder="ถามการ์ด กฎ keyword phase..."
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
