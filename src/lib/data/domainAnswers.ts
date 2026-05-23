export type DomainAnswer = {
	name: string;
	colorName: string;
	iconToken: string;
	aliases: string[];
	summary: string;
	bestFor: string;
	strengths: string[];
	pros: string[];
	cons: string[];
	description: string[];
};

export const domainAnswers: DomainAnswer[] = [
	{
		name: 'Fury',
		colorName: 'Red',
		iconToken: ':rb_rune_fury:',
		aliases: ['fury', 'red', 'red domain', 'rune fury', 'roar', 'โกธร', 'แดง'],
		summary: 'Aggro / tempo domain ที่ชอบบุกเร็ว กดดัน board ตั้งแต่ต้นเกม และปิดเกมด้วย damage ตรง ๆ',
		bestFor: 'คนที่ชอบเล่นเร็ว กดดันคู่ต่อสู้ และจบเกมด้วยจังหวะรุกต่อเนื่อง',
		strengths: ['Aggression', 'Conquer', 'Damage', 'Accelerate', 'Assault'],
		pros: [
			'เปิดเกมได้ไวและบังคับให้คู่ต่อสู้ตอบสนองทันที',
			'มีเครื่องมือช่วยชนะ battlefield ผ่าน damage, Assault และ Accelerate',
			'ลงโทษคู่ต่อสู้ที่ตั้งตัวช้า'
		],
		cons: [
			'ถ้าเกมยืดอาจเสีย value เพราะใช้ทรัพยากรเร็ว',
			'บางแผนต้องแลก discard หรือ resource เพื่อเร่ง tempo',
			'เด็คที่รับมือ damage ได้ดีอาจทำให้ pressure ไม่พอ'
		],
		description: [
			'Fury คือ domain สายบุกและ tempo จุดเด่นคือการกดดัน battlefield ให้ได้เปรียบเร็วที่สุดด้วยยูนิตที่โจมตีหนัก และ keyword ที่ช่วยเร่งเกมอย่าง Assault หรือ Accelerate.',
			'ถ้าคุณอยากได้เกมที่ตรงไปตรงมาและบังคับให้คู่ต่อสู้ตั้งรับตลอดเวลา Fury เป็นตัวเลือกที่ค่อนข้างชัด'
		]
	},
	{
		name: 'Calm',
		colorName: 'Green',
		iconToken: ':rb_rune_calm:',
		aliases: ['calm', 'green', 'green domain', 'rune calm', 'สงบ', 'เขียว'],
		summary: 'Defensive / reaction domain ที่เน้นยืนพื้นที่ ป้องกันจังหวะสำคัญ และเล่นเกมยาว',
		bestFor: 'คนที่ชอบรับมือคู่ต่อสู้ อ่านจังหวะ และชนะด้วยการยืนพื้นให้ได้นานกว่า',
		strengths: ['Defense', 'Hold', 'Moving', 'Reaction', 'Tricks'],
		pros: [
			'ป้องกันยูนิตสำคัญและรักษาพื้นที่บน battlefield ได้ดี',
			'มี Reaction และ trick ที่ทำให้ combat คำนวณยาก',
			'เหมาะกับเกมยืดและการคุมจังหวะเล็ก ๆ'
		],
		cons: [
			'ดาเมจตรงและ removal หนัก ๆ ไม่ได้เด่นเท่า domain อื่น',
			'ต้องอ่านจังหวะให้แม่น ถ้าใช้ Reaction ผิดจุดจะเสีย value',
			'อาจปิดเกมช้าถ้าไม่มี threat ที่ชัดพอ'
		],
		description: [
			'Calm เป็น domain ที่รับและตอบโต้เก่ง จุดเด่นอยู่ที่การรักษา board ให้อยู่ในสภาพที่ตัวเองได้เปรียบ ทั้งการป้องกัน การย้ายตำแหน่ง และการใช้ Reaction เพื่อชิงจังหวะกลับมา.',
			'ถ้าคุณชอบเล่นแบบคุมเกมและชอบตัดสินใจจากสถานการณ์บน board Calm มักจะตอบโจทย์'
		]
	},
	{
		name: 'Mind',
		colorName: 'Blue',
		iconToken: ':rb_rune_mind:',
		aliases: ['mind', 'blue', 'blue domain', 'rune mind', 'น้ำเงิน', 'ฟ้า', 'blue rune'],
		summary: 'Control / setup domain ที่เก่งเรื่องวางแผนล่วงหน้า Hidden, trick และการสร้าง card advantage',
		bestFor: 'คนที่ชอบคอมโบ วางแผนล่วงหน้า และชนะด้วยความได้เปรียบสะสม',
		strengths: ['Plan Ahead', 'Hidden', 'Gear', 'Tricks', 'Draw'],
		pros: [
			'สร้าง card advantage และเล่นเกมยาวได้แข็ง',
			'Hidden และ trick ทำให้คู่ต่อสู้เดายาก',
			'มีเครื่องมือ setup หลายแบบสำหรับ turn สำคัญ'
		],
		cons: [
			'ต้องใช้เวลา setup พอสมควร',
			'เล่นผิดลำดับหรือซ้อนแผนพลาดจะเสีย tempo มาก',
			'ถ้าโดนกดเร็วเกินไป payoff อาจยังไม่ทันมา'
		],
		description: [
			'Mind คือ domain ของการวางแผนและควบคุมข้อมูล มักเกี่ยวกับ Hidden, Gear, trick และการเตรียมจังหวะไว้ล่วงหน้าเพื่อสร้างความได้เปรียบใน turn ถัด ๆ ไป.',
			'ถ้าคุณชอบอ่านเกมและเล่นแบบไม่รีบ Mind จะเป็น domain ที่มีพื้นที่ให้คิดเยอะที่สุด'
		]
	},
	{
		name: 'Body',
		colorName: 'Orange',
		iconToken: ':rb_rune_body:',
		aliases: ['body', 'orange', 'orange domain', 'rune body', 'ส้ม', 'orange rune'],
		summary: 'Ramp / buff domain ที่เน้นทำยูนิตให้ใหญ่ขึ้นและชนะด้วย stat สู้ตรง ๆ',
		bestFor: 'คนที่ชอบลง threat ใหญ่ เร่งทรัพยากร และชนด้วย power สูง',
		strengths: ['Ramp', 'Buffs', 'Win Fights', 'Ready', 'High Might'],
		pros: [
			'เร่งพัฒนา board ได้เร็วจาก ramp หรือ threat ใหญ่',
			'ชนะการต่อสู้ด้วย Might และ buff ที่ชัดเจน',
			'เล่นตรงและอ่านง่าย'
		],
		cons: [
			'ถ้า ramp ไม่ติดจะโดนแย่งจังหวะง่าย',
			'แผนอาจดูตรงไปตรงมามากกว่า trick/control domain',
			'ต้องระวัง bounce, kill หรือ stun ใส่ตัวที่ลงทุนไว้หนัก ๆ'
		],
		description: [
			'Body เป็น domain ของพลังดิบและการโตของตัวบน board จุดเด่นคือ ramp, buff และการลง threat ที่ใหญ่พอจะชนะไฟต์ด้วย stat ล้วน ๆ.',
			'มันเหมาะกับคนที่อยากเห็นผลลัพธ์ชัด ๆ จากการเล่นของตัวเอง: ลงของใหญ่ แลกให้คุ้ม แล้วปิดเกมด้วยแรงกดดันตรงหน้า'
		]
	},
	{
		name: 'Chaos',
		colorName: 'Purple',
		iconToken: ':rb_rune_chaos:',
		aliases: ['chaos', 'purple', 'purple domain', 'rune chaos', 'ม่วง', 'purples', 'กวน'],
		summary: 'Discard / trash / disruption domain ที่เล่นแปลก เปลี่ยนลำดับเกม และทำให้แผนคู่ต่อสู้พัง',
		bestFor: 'คนที่ชอบบีบ resource, บิดจังหวะ, และเล่นเกมที่คาดเดายาก',
		strengths: ['Discard', 'Trash', 'Selection', 'Hidden', 'Disruption'],
		pros: [
			'รบกวนแผนคู่ต่อสู้ได้หลายทาง',
			'ใช้ trash และ discard ให้เป็น value engine ได้',
			'เล่นด้วย effect ที่อ่านยากและคาดเดายาก'
		],
		cons: [
			'ต้องเข้าใจ timing และ resource management มากกว่าพื้นฐาน',
			'บางแผนมีความเสี่ยงสูง ถ้าจังหวะผิดอาจเสีย tempo ทั้งก้อน',
			'ผลลัพธ์อาจไม่สเถียรเท่าแผนที่เล่นตรง ๆ'
		],
		description: [
			'Chaos คือ domain ของความไม่แน่นอนและการปั่นจังหวะเกม มันชอบ discard, trash, บิด resource และทำให้การเล่นของอีกฝั่งไม่เดินตามแผน.',
			'ถ้าคุณชอบเล่นแบบ disrupt และดึงเกมออกนอกกรอบ Chaos เป็น domain ที่มีบุคลิกชัดมาก'
		]
	},
	{
		name: 'Order',
		colorName: 'Yellow',
		iconToken: ':rb_rune_order:',
		aliases: ['order', 'yellow', 'yellow domain', 'rune order', 'เหลือง', 'ทอง'],
		summary: 'Tokens / sacrifice / Deathknell domain ที่เล่นกับ value จากการตายและผลกระทบแบบสมมาตร',
		bestFor: 'คนที่ชอบสร้าง board กว้าง คุมโต๊ะ และแปลงการตายเป็น value',
		strengths: ['Tokens', 'Kill', 'Deathknell', 'Sacrifice', 'Symmetrical Effects'],
		pros: [
			'สร้าง board กว้างและกดดันหลายจุดพร้อมกันได้ดี',
			'แปลงการตายของยูนิตให้กลายเป็น value ได้',
			'มี effect แบบสมมาตรที่ถ้าเรียงถูกจะคุ้มมาก'
		],
		cons: [
			'ต้องมีชิ้น synergy ครบ ไม่งั้น token อย่างเดียวอาจยังไม่พอ',
			'แพ้ทางการล้าง board หรือการหยุด payoff ก่อน sacrifice',
			'ถ้าวางลำดับผิด board presence อาจหายไปเอง'
		],
		description: [
			'Order เป็น domain ที่เน้นโครงสร้าง board และการแปลงการเสียสละเป็นมูลค่า จุดเด่นคือ token, sacrifice, Deathknell และ kill effect ที่ทำให้การตายไม่ใช่แค่การเสียของ.',
			'มันเหมาะกับคนที่ชอบคุมโต๊ะด้วยระบบของตัวเองมากกว่าการลงตัวใหญ่ตัวเดียว'
		]
	}
];
