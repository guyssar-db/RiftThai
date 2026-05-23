export interface Card {
	code: string;
	name_en: string;
	ability_en: string;
	name_th: string;
	ability_th: string;
	image_url: string;
	type: string;
	energy: number | null;
	power: {
		label: string;
		value: {
			id: number;
			label: string;
		};
	} | null;
	rarity: string;
	domains: string[];
	set_name: string;
	tags?: string[];
}
