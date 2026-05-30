import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import cardsData from '$lib/data/riftbound_cards_all.json';
import { domainAnswers } from '$lib/data/domainAnswers';
import { keywords } from '$lib/data/keywords';
import { ruleAnswers } from '$lib/data/ruleAnswers';
import { spiritforgedFaq } from '$lib/data/spiritforgedFaq';
import type { Card } from '$lib/types/card';

import { chunkText, estimateTokenCount, repairThaiMojibake } from './text';

export type RagDocument = {
	source: string;
	source_type: string;
	title: string;
	content: string;
	metadata: Record<string, unknown>;
};

export type RagChunk = RagDocument & {
	content_hash: string;
	chunk_index: number;
	chunk_content: string;
	token_count: number;
};

const cards = cardsData as Card[];

export function buildRagDocuments(): RagDocument[] {
	return [
		riftboundOverviewDocument(),
		...coreRuleDocuments(),
		...localKnowledgeDocuments(),
		...keywords.map((keyword) => ({
			source: `keyword:${keyword.id}`,
			source_type: 'keyword',
			title: `Keyword: ${keyword.name_en}`,
			content: repairThaiMojibake(
				[
					`Keyword: ${keyword.name_en}`,
					`Thai: ${keyword.name_th}`,
					`ID: ${keyword.id}`,
					`Description: ${keyword.description_th}`
				].join('\n')
			),
			metadata: {
				id: keyword.id,
				name_en: keyword.name_en,
				name_th: repairThaiMojibake(keyword.name_th)
			}
		})),
		...ruleAnswers.map((rule) => ({
			source: `rule:${slugify(rule.title)}`,
			source_type: 'rule',
			title: rule.title,
			content: repairThaiMojibake(
				[`Rule: ${rule.title}`, `Keys: ${rule.keys.join(', ')}`, `Answer: ${rule.text}`].join('\n')
			),
			metadata: {
				keys: rule.keys.map(repairThaiMojibake)
			}
		})),
		...spiritforgedFaq.map((item, index) => ({
			source: `faq:spiritforged:${index + 1}`,
			source_type: 'faq',
			title: `Spiritforged FAQ: ${item.question}`,
			content: repairThaiMojibake(
				[
					`Category: ${item.category}`,
					`Question: ${item.question}`,
					`Answer: ${item.answer}`,
					item.source ? `Source: ${item.source}` : ''
				]
					.filter(Boolean)
					.join('\n')
			),
			metadata: {
				category: repairThaiMojibake(item.category),
				source_url: item.source
			}
		})),
		...domainAnswers.map((domain) => ({
			source: `domain:${domain.name.toLowerCase()}`,
			source_type: 'domain',
			title: `Domain: ${domain.name}`,
			content: repairThaiMojibake(
				[
					`Domain: ${domain.name}`,
					`Color: ${domain.colorName}`,
					`Aliases: ${domain.aliases.join(', ')}`,
					`Summary: ${domain.summary}`,
					`Best for: ${domain.bestFor}`,
					`Strengths: ${domain.strengths.join(', ')}`,
					`Pros: ${domain.pros.join(' | ')}`,
					`Cons: ${domain.cons.join(' | ')}`,
					...domain.description
				].join('\n')
			),
			metadata: {
				name: domain.name,
				colorName: domain.colorName,
				aliases: domain.aliases.map(repairThaiMojibake)
			}
		})),
		...cards.map(cardToDocument)
	];
}

function riftboundOverviewDocument(): RagDocument {
	return {
		source: 'riftbound:overview',
		source_type: 'overview',
		title: 'Riftbound Overview and Domains',
		content: repairThaiMojibake(
			[
				'Riftbound คือเกมการ์ดสะสมแบบ Trading Card Game (TCG) ในจักรวาล League of Legends',
				'ผู้เล่นสร้างเด็คจาก Legend, Champion, Unit, Spell, Gear, Battlefield และ Rune แล้วแข่งเพื่อยึดครอง battlefield ทำแต้ม และใช้พลังจาก rune/domain เพื่อเล่นการ์ด',
				'Domain คือกลุ่มพลังหรือสีหลักของ Riftbound คล้าย color/faction ใน TCG อื่น ใช้บอกตัวตนของการ์ด แนวทางการเล่น และทรัพยากรที่เกี่ยวข้อง',
				'Domain หลักที่ใช้ใน Riftbound ได้แก่ Fury, Calm, Mind, Body, Chaos และ Order',
				'คำถามภาษาไทยที่เกี่ยวกับ domain อาจใช้คำว่า โดเมน, สี, rune, รูน, สายเด็ค, faction, red, green, blue, orange, purple หรือ yellow',
				'Fury คือสายบุกเร็วและ tempo',
				'Calm คือสายรับ reaction และยืน battlefield',
				'Mind คือสายวางแผน Hidden trick และ card advantage',
				'Body คือสาย ramp buff และยูนิตใหญ่',
				'Chaos คือสาย discard trash disruption และแผนพลิกแพลง',
				'Order คือสาย token sacrifice Deathknell และ value จากการตาย'
			].join('\n')
		),
		metadata: {
			topic: 'riftbound basics',
			domains: ['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order']
		}
	};
}

function coreRuleDocuments(): RagDocument[] {
	const filePath = join(process.cwd(), 'core_rules.md');
	if (!existsSync(filePath)) return [];

	const content = readFileSync(filePath, 'utf-8').trim();
	if (!content) return [];

	return [
		{
			source: 'core_rules:summary',
			source_type: 'core_rules',
			title: 'Riftbound Core Rules Summary',
			content,
			metadata: {
				file: 'core_rules.md',
				source_url:
					'https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/572377fcaa704a05f72eb42c104079d3b3bcf740.pdf'
			}
		}
	];
}

function localKnowledgeDocuments(): RagDocument[] {
	const knowledgeFiles = [
		{
			file: 'docs/domains.md',
			source: 'doc:domains',
			source_type: 'domain_guide',
			title: 'Riftbound Domain Guide'
		},
		{
			file: 'docs/spiritforged-faq-qa.md',
			source: 'doc:spiritforged-faq-qa',
			source_type: 'faq',
			title: 'Spiritforged FAQ Notes'
		},
		{
			file: 'qa.md',
			source: 'doc:qa',
			source_type: 'qa',
			title: 'Riftbound Rules and Mechanics QA'
		},
		{
			file: 'keyword.md',
			source: 'doc:keyword-notes',
			source_type: 'keyword',
			title: 'Riftbound Keyword Notes'
		},
		{
			file: 'Turn Phases Flowchart.md',
			source: 'doc:turn-phases-flowchart',
			source_type: 'rule',
			title: 'Riftbound Turn Phases Flowchart'
		}
	];

	return knowledgeFiles.flatMap(({ file, source, source_type, title }) => {
		const filePath = join(process.cwd(), file);
		if (!existsSync(filePath)) return [];

		const content = readFileSync(filePath, 'utf-8').trim();
		if (!content) return [];

		return [
			{
				source,
				source_type,
				title,
				content: repairThaiMojibake(content),
				metadata: {
					file,
					filename: basename(file)
				}
			}
		];
	});
}

export function buildRagChunks() {
	return buildRagDocuments().flatMap((document) => {
		const content_hash = hashContent(document.source, document.content);
		return chunkText(document.content).map(
			(chunk, chunk_index): RagChunk => ({
				...document,
				content_hash,
				chunk_index,
				chunk_content: chunk,
				token_count: estimateTokenCount(chunk)
			})
		);
	});
}

function cardToDocument(card: Card): RagDocument {
	const title = `${card.name_en}${card.name_th ? ` / ${repairThaiMojibake(card.name_th)}` : ''}`;
	const content = repairThaiMojibake(
		[
			`Card: ${card.name_en}`,
			card.name_th ? `Thai name: ${card.name_th}` : '',
			`Code: ${card.code}`,
			`Type: ${card.type}`,
			`Rarity: ${card.rarity}`,
			card.set_name ? `Set: ${card.set_name}` : '',
			card.energy !== null && card.energy !== undefined ? `Energy: ${card.energy}` : '',
			card.power ? `Power: ${card.power.label}` : '',
			card.domains?.length ? `Domains: ${card.domains.join(', ')}` : '',
			card.tags?.length ? `Tags: ${card.tags.join(', ')}` : '',
			card.ability_en ? `English ability: ${card.ability_en}` : '',
			card.ability_th ? `Thai ability: ${card.ability_th}` : ''
		]
			.filter(Boolean)
			.join('\n')
	);

	return {
		source: `card:${card.code}`,
		source_type: 'card',
		title,
		content,
		metadata: {
			code: card.code,
			name_en: card.name_en,
			name_th: repairThaiMojibake(card.name_th),
			type: card.type,
			rarity: card.rarity,
			set_name: card.set_name,
			domains: card.domains,
			tags: card.tags ?? [],
			image_url: card.image_url
		}
	};
}

function hashContent(source: string, content: string) {
	return createHash('sha256').update(`${source}\n${content}`).digest('hex');
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}
