import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
	hasUnlimitedDeckCopies,
	isBattlefieldCard,
	isMainDeckCard,
	isRuneCard,
	maxMainDeckCards,
	maxRuneCards,
	maxSideboardCards,
	validateDeck
} from '../src/lib/utils/deck.ts';
import type { Card } from '../src/lib/types/card.ts';

const cards = JSON.parse(readFileSync('src/lib/data/cards.json', 'utf8')) as Card[];
const spiderling = cards.find((card) => card.name_en === 'Spiderling');
const normalMainCard = cards.find((card) => isMainDeckCard(card) && card.name_en !== 'Spiderling');
const rune = cards.find(isRuneCard);
const battlefield = cards.find(isBattlefieldCard);
const bannedCard = cards.find((card) => card.name_en === 'Called Shot');

assert.ok(spiderling, 'Spiderling must exist in the card database');
assert.ok(normalMainCard, 'A normal main-deck card must exist');
assert.ok(rune, 'A rune card must exist');
assert.ok(battlefield, 'A battlefield card must exist');
assert.ok(bannedCard, 'A currently banned card must exist');

const deckWith = (
	entries: { code: string; quantity: number }[],
	sideboardEntries: { code: string; quantity: number }[] = []
) => ({ championCode: '', entries, sideboardEntries });

test('official constructed counts remain synchronized', () => {
	assert.equal(maxMainDeckCards, 39);
	assert.equal(maxRuneCards, 12);
	assert.equal(maxSideboardCards, 10);
});

test('Spiderling bypasses the normal copy limit but not total deck validation', () => {
	assert.equal(hasUnlimitedDeckCopies(spiderling), true);
	const validation = validateDeck(cards, deckWith([{ code: spiderling.code, quantity: 39 }]));
	assert.equal(
		validation.issues.some((issue) => issue.id.startsWith('copy-main-Spiderling')),
		false
	);
	assert.equal(
		validation.issues.some((issue) => issue.id === 'main-count'),
		false
	);
});

test('normal cards still use the three-copy limit across deck zones', () => {
	const validation = validateDeck(
		cards,
		deckWith(
			[{ code: normalMainCard.code, quantity: 3 }],
			[{ code: normalMainCard.code, quantity: 1 }]
		)
	);
	assert.equal(
		validation.issues.some((issue) => issue.id === `copy-main-${normalMainCard.name_en}`),
		true
	);
});

test('sideboard rejects the eleventh card', () => {
	const validation = validateDeck(
		cards,
		deckWith([], [{ code: normalMainCard.code, quantity: maxSideboardCards + 1 }])
	);
	assert.equal(
		validation.issues.some((issue) => issue.id === 'sideboard-count'),
		true
	);
});

test('twelve runes satisfy the rune count and duplicate battlefields are rejected', () => {
	const validation = validateDeck(
		cards,
		deckWith([
			{ code: rune.code, quantity: 12 },
			{ code: battlefield.code, quantity: 3 }
		])
	);
	assert.equal(
		validation.issues.some((issue) => issue.id === 'rune-count'),
		false
	);
	assert.equal(
		validation.issues.some((issue) => issue.id === `copy-field-${battlefield.name_en}`),
		true
	);
});

test('the current Standard ban list is enforced', () => {
	const validation = validateDeck(cards, deckWith([{ code: bannedCard.code, quantity: 1 }]));
	assert.equal(
		validation.issues.some((issue) => issue.id === `banned-${bannedCard.name_en}`),
		true
	);
});
