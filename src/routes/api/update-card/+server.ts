import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

import { getAuthenticatedUser } from '$lib/server/auth';

export async function POST({ request, cookies }) {
    try {
        const user = await getAuthenticatedUser(cookies);
        if (!user) return json({ success: false, message: 'login required' }, { status: 401 });
        if (!user.isAdmin) return json({ success: false, message: 'admin required' }, { status: 403 });

        const { code, ability_en, ability_th } = await request.json();

        const filePath = path.join(process.cwd(), 'src/lib/data/riftbound_cards_all.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const cards = JSON.parse(fileContent);

        const cardIndex = cards.findIndex((c: any) => c.code === code);
        if (cardIndex === -1) {
            return json({ success: false, message: 'Card not found' }, { status: 404 });
        }
        
        const cardName = cards[cardIndex].name_en;

        // Update all cards with the same name
        cards.forEach((c: any) => {
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
