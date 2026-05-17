import fs from 'node:fs/promises';
import path from 'node:path';

const CARDS_ALL_FILE = path.resolve('src/lib/data/riftbound_cards_all.json');

export const load = async () => {
	try {
		const content = await fs.readFile(CARDS_ALL_FILE, 'utf-8');
		const cards = JSON.parse(content);
		return { cards };
	} catch (error) {
		console.error('Error loading riftbound_cards_all.json:', error);
		return { cards: [] };
	}
};
