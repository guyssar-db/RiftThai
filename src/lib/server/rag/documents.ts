import { createHash } from 'node:crypto';

import cardsData from '$lib/data/riftbound_cards_all.json';
import { domainAnswers } from '$lib/data/domainAnswers';
import { keywords } from '$lib/data/keywords';
import { ruleAnswers } from '$lib/data/ruleAnswers';
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
