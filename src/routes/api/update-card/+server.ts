import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

import { getAuthenticatedUser } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

type CardRecord = {
	code?: unknown;
	name_en?: unknown;
	ability_en?: unknown;
	ability_th?: unknown;
};

export async function POST({ request, cookies, getClientAddress }) {
	try {
		const user = await getAuthenticatedUser(cookies);
		if (!user) return json({ success: false, message: 'login required' }, { status: 401 });
		if (!user.isAdmin) return json({ success: false, message: 'admin required' }, { status: 403 });

		const rateLimit = checkRateLimit(`update-card:${clientKey(getClientAddress())}:${user.id}`, {
			windowMs: 60_000,
			max: 20
		});
		if (rateLimit.limited) {
			return json(
				{ success: false, message: 'too many update requests. please try again later' },
				{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
			);
		}

		const { code, ability_en, ability_th } = await request.json();
		if (
			typeof code !== 'string' ||
			typeof ability_en !== 'string' ||
			typeof ability_th !== 'string' ||
			code.length > 80 ||
			ability_en.length > 5_000 ||
			ability_th.length > 5_000
		) {
			return json({ success: false, message: 'Invalid card update payload' }, { status: 400 });
		}

		const filePath = path.join(process.cwd(), 'src/lib/data/riftbound_cards_all.json');
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const cards = JSON.parse(fileContent) as CardRecord[];

		const cardIndex = cards.findIndex((c) => c.code === code);
		if (cardIndex === -1) {
			return json({ success: false, message: 'Card not found' }, { status: 404 });
		}

		const cardName = cards[cardIndex].name_en;
		if (typeof cardName !== 'string') {
			return json({ success: false, message: 'Invalid card data' }, { status: 500 });
		}

		// Update all cards with the same name
		cards.forEach((c) => {
			if (c.name_en === cardName) {
				c.ability_en = ability_en;
				c.ability_th = ability_th;
			}
		});

		fs.writeFileSync(filePath, JSON.stringify(cards, null, 4));

		return json({ success: true });
	} catch (error) {
		console.error('Update error:', error);
		return json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}
