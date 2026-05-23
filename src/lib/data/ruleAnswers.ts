export type RuleAnswer = {
	keys: string[];
	title: string;
	text: string;
};

export const ruleAnswers: RuleAnswer[] = [
	{
		keys: ['golden rule', 'silver rule', 'cannot', "can't", 'can not', 'ห้าม', 'ทำไม่ได้'],
		title: 'Golden Rule / Silver Rule',
		text: 'ถ้าข้อความบนการ์ดขัดกับกฎพื้นฐาน ให้ทำตามข้อความบนการ์ด แต่ถ้ามีเอฟเฟกต์หนึ่งบอกว่าทำได้ และอีกเอฟเฟกต์บอกว่าทำไม่ได้ ให้ยึดฝั่งที่บอกว่า "ทำไม่ได้" ก่อน'
	},
	{
		keys: ['deck', 'deckbuilding', 'deck construction', 'สร้างเด็ค', 'จัดเด็ค'],
		title: 'Deck Construction',
		text: 'เด็คหนึ่งชุดมี Champion Legend 1 ใบ, Battlefield 3 ใบ, Main Deck 40 ใบ และ Rune Deck 12 ใบ โดย Rune Deck ใช้เป็นทรัพยากรสำหรับจ่ายค่าเล่นการ์ด'
	},
	{
		keys: ['zone', 'zones', 'public', 'private', 'hidden information', 'hand', 'trash', 'โซน', 'มือ', 'สุสาน'],
		title: 'Zones And Information',
		text: 'ข้อมูลในสนาม, trash และการ์ดที่เปิดเผยเป็น public information ส่วนมือ, main deck, rune deck และการ์ด facedown เป็น hidden/private information ผู้เล่นต้องไม่ดูข้อมูล hidden เว้นแต่กฎหรือการ์ดอนุญาต'
	},
	{
		keys: ['rune', 'runes', 'energy', 'power', 'recycle', 'rune deck', 'รูน', 'พลังงาน'],
		title: 'Runes, Energy, Power',
		text: 'Rune ใช้เป็น resource หลัก การ exhaust rune ให้ Energy และการ recycle rune ใช้จ่าย Power หรือค่าเพิ่มเติมบางอย่างได้ Rune ไม่ถือเป็น Main Deck card สำหรับเอฟเฟกต์ที่ถามหา card ทั่วไป'
	},
	{
		keys: ['priority', 'focus', 'pass', 'window', 'จังหวะ', 'สิทธิ์'],
		title: 'Priority And Focus',
		text: 'Priority คือสิทธิ์ในการทำ action หรือ reaction ในช่วงเวลาที่เกมเปิดให้ตอบสนอง ส่วน focus ใช้ระบุผู้เล่นที่กำลังมีสิทธิ์ตัดสินใจหลักใน showdown หรือช่วง action ถ้าผู้เล่นทั้งสองผ่าน priority โดยไม่มีอะไรเพิ่ม สิ่งบน chain จะ resolve หรือเกมจะไปขั้นถัดไป'
	},
	{
		keys: ['chain', 'stack', 'resolve', 'ตอบสนอง', 'สแต็ก'],
		title: 'Chain',
		text: 'Chain เกิดเมื่อผู้เล่นร่าย spell, ใช้ activated ability หรือมี triggered ability ถูกสร้างขึ้น ผู้เล่นสามารถตอบด้วย Reaction ได้ตาม priority แล้วสิ่งบน chain จะ resolve จากรายการล่าสุดย้อนกลับไปก่อนหน้า'
	},
	{
		keys: ['turn', 'phase', 'start', 'awaken', 'draw', 'action phase', 'end', 'เทิร์น', 'เฟส'],
		title: 'Turn Structure',
		text: 'เทิร์นแบ่งเป็นช่วงหลัก เช่น start/score, awaken, draw, action และ end รายละเอียดอย่าง Hold scoring, การ ready/exhaust และเอฟเฟกต์ end of turn จะอ้างอิง phase เหล่านี้'
	},
	{
		keys: ['play card', 'play a card', 'cost', 'pay', 'เล่นการ์ด', 'จ่ายค่า'],
		title: 'Playing Cards',
		text: 'การเล่นการ์ดต้องทำตาม timing, จ่าย cost, เลือก mode/target ตามที่การ์ดกำหนด แล้ววาง spell หรือ ability บน chain ถ้าเป็น unit/gear/battlefield ให้เข้าสู่ zone ตามชนิดของการ์ดหลังเล่นสำเร็จ'
	},
	{
		keys: ['action', 'timing'],
		title: 'Action',
		text: 'Action ใช้ตอบ chain ไม่ได้ แต่เล่นได้ในเทิร์นของคุณ หรือระหว่าง showdown ตอนที่คุณมี focus และไม่มีอะไรค้างอยู่บน chain'
	},
	{
		keys: ['reaction', 'instant', 'ตอบ', 'สวน'],
		title: 'Reaction',
		text: 'Reaction ใช้ได้เมื่อคุณมี priority ทั้งในเทิร์นตัวเองและเทิร์นคู่แข่ง รวมถึงตอบสิ่งที่อยู่บน chain ได้ การ์ดที่ไม่มี Reaction โดยทั่วไปใช้สวน chain ไม่ได้'
	},
	{
		keys: ['showdown', 'combat', 'battlefield', 'ต่อสู้', 'สู้', 'แย่งสนาม'],
		title: 'Showdown',
		text: 'Showdown เกิดเมื่อ battlefield ถูก contest โดยมี unit ของมากกว่าหนึ่งฝ่ายมาแย่งพื้นที่กัน ถ้า showdown ใหม่เกิดระหว่างที่อันเดิมยังไม่จบ จะรอ resolve หลังอันปัจจุบันจบก่อน'
	},
	{
		keys: ['attacker', 'defender', 'attack', 'defend', 'ฝ่ายบุก', 'ฝ่ายรับ'],
		title: 'Attacker And Defender',
		text: 'ผู้เล่นเป็น attacker เมื่อ unit ของเขา move เข้าไป contest battlefield ที่คู่แข่งคุมอยู่ และเป็น defender เมื่อคู่แข่ง move เข้ามา contest battlefield ที่เขาคุมอยู่ การเข้า battlefield ว่างไม่ทำให้เป็น attacker ทันที'
	},
	{
		keys: ['move', 'movement', 'recall', 'base', 'ย้าย', 'เคลื่อน', 'กลับฐาน'],
		title: 'Movement And Recall',
		text: 'การ move ปกติเป็นการขยับใน lane ของตัวเอง เช่น จาก base ไป battlefield หรือย้อนกลับตามกฎ movement แต่ spell/ability ที่สั่ง Move a unit สามารถข้ามข้อจำกัดปกติได้ตามข้อความการ์ด'
	},
	{
		keys: ['damage', 'might', 'combat damage', 'kill', 'heal', 'ดาเมจ', 'พลัง', 'ตาย', 'ฮีล'],
		title: 'Damage, Might, Kill, Heal',
		text: 'Might ใช้คำนวณ combat damage ใน showdown ถ้า unit สะสม damage ถึงหรือเกิน Might จะถูก kill และไป trash ตามกฎ การ heal คือการลบ damage ที่สะสมออกจาก unit ตาม timing หรือเอฟเฟกต์ที่กำหนด'
	},
	{
		keys: ['buff', 'debuff', '+1', '-1', 'บัฟ'],
		title: 'Buffs',
		text: 'Buff เป็นตัวปรับค่าหรือความสามารถที่ผูกกับ unit ตามระยะเวลาที่เอฟเฟกต์กำหนด บาง buff อยู่ชั่วคราวจนจบเทิร์น บางอย่างคงอยู่จนกว่าจะถูกลบหรือ unit ออกจากสนาม'
	},
	{
		keys: ['score', 'conquer', 'hold', 'point', 'แต้ม', 'คะแนน', 'ยึด'],
		title: 'Scoring, Conquer, Hold',
		text: 'Conquer คือได้แต้มเมื่อยึด battlefield ที่ยังไม่ได้ score ในเทิร์นนั้น ส่วน Hold คือได้แต้มตอนเริ่มเทิร์นถ้าคุณคุม battlefield อยู่ แต้มสุดท้ายจาก conquer ต้อง score battlefield อื่นในเทิร์นนั้นครบก่อน ไม่งั้นจะจั่วแทน'
	},
	{
		keys: ['token', 'tokens', 'cost 0', 'โทเคน'],
		title: 'Tokens',
		text: 'Token เป็นวัตถุที่สร้างจากเอฟเฟกต์ ไม่ใช่ Main Deck card จริง ๆ ถ้าเอฟเฟกต์ต้องดู cost ของ token ให้ถือว่า cost เป็น 0 และถ้า token ออกจาก zone ที่ควรอยู่ มักจะหายไปหรือใช้ปลายทางตามชนิดของมัน'
	},
	{
		keys: ['target', 'choose', 'เลือกเป้าหมาย', 'เป้าหมาย'],
		title: 'Targeting',
		text: 'โดยทั่วไป target คือวัตถุหรือผู้เล่นใน public zone ที่ผู้เล่นคนเดียวเลือกให้ spell/ability กระทบโดยตรง คำสั่งที่ให้ผู้เล่นแต่ละคนเลือกของตัวเองพร้อมกันมักไม่ถือว่าเป็น target'
	},
	{
		keys: ['hidden', 'facedown', 'ซ่อน'],
		title: 'Hidden',
		text: 'Hidden เล่นได้สองแบบ: เล่นจากมือโดยจ่าย cost ปกติ หรือ recycle rune 1 ใบเพื่อซ่อนไว้ที่ battlefield ที่คุณคุม แล้วเล่นจาก facedown ในเทิร์นถัดไปแบบ Reaction โดยไม่จ่าย cost ถ้าเสียการคุม battlefield นั้น การ์ด Hidden ที่ซ่อนอยู่จะไป trash'
	},
	{
		keys: ['ambush'],
		title: 'Ambush',
		text: 'Ambush ให้ unit เล่นได้ด้วย timing แบบ Reaction ตามเงื่อนไขของการ์ด โดยมักต้องเล่นลง battlefield ที่คุณมี unit หรือควบคุมอยู่แล้ว'
	},
	{
		keys: ['quick draw', 'quick-draw', 'quickdraw'],
		title: 'Quick-Draw',
		text: 'Quick-Draw คล้าย Ambush แต่ใช้กับ gear หรือ spell ที่สามารถเล่นด้วยความเร็ว Reaction ตามเงื่อนไขของการ์ด'
	},
	{
		keys: ['tank'],
		title: 'Tank',
		text: 'Tank ทำให้ unit นั้นรับ combat damage ก่อน unit อื่นใน battlefield เดียวกัน หากมีหลายตัวที่ต้องรับก่อน ให้ทำตามลำดับและกฎ damage assignment'
	},
	{
		keys: ['backline'],
		title: 'Backline',
		text: 'Backline ทำให้ unit นั้นรับ combat damage หลัง unit อื่น ๆ ใน battlefield เดียวกัน จึงช่วยปกป้อง unit สำคัญจาก damage ลำดับแรก'
	},
	{
		keys: ['shield'],
		title: 'Shield',
		text: 'Shield ป้องกัน damage ครั้งถัดไปตามจำนวนที่ระบุ เมื่อป้องกันแล้ว shield ที่ใช้จะหมดไปตามกฎของเอฟเฟกต์นั้น'
	},
	{
		keys: ['stun'],
		title: 'Stun',
		text: 'Unit ที่ติด Stun ไม่สามารถ attack, move หรือใช้ activated ability ที่ต้อง exhaust ได้ตามปกติ สถานะนี้จะหายตาม timing ที่กฎหรือเอฟเฟกต์กำหนด'
	},
	{
		keys: ['predict'],
		title: 'Predict',
		text: 'Predict ให้ดูการ์ดบนสุดของ main deck ตามจำนวนที่ระบุ แล้วเลือกว่าจะ recycle หรือจัดเรียงกลับตามข้อความกฎ/การ์ด'
	},
	{
		keys: ['channel'],
		title: 'Channel',
		text: 'Channel เป็นเอฟเฟกต์ที่นำ rune จาก rune deck หรือแหล่งที่กำหนดเข้าสู่สนามตามสถานะที่ระบุ เช่น ready หรือ exhausted ขึ้นกับข้อความการ์ด'
	},
	{
		keys: ['deathknell', 'death knell'],
		title: 'Deathknell',
		text: 'Deathknell คือความสามารถที่ trigger เมื่อ unit นั้นตายและถูกส่งไป trash หากมีหลาย trigger พร้อมกัน ให้จัดการตามกฎ priority/trigger ordering'
	},
	{
		keys: ['temporary'],
		title: 'Temporary',
		text: 'Temporary หมายถึงวัตถุหรือเอฟเฟกต์ที่อยู่ชั่วคราวตามเวลาที่กำหนด โดยมักถูกลบหรือทำลายตอนจบเทิร์น'
	},
	{
		keys: ['2v2', 'multiplayer', 'friendly', 'ally', 'ทีม'],
		title: '2v2 And Friendly Units',
		text: 'ใน 2v2 คำว่า friendly unit หมายถึง unit ของคุณและ unit ของเพื่อนร่วมทีม แต่คำว่า your units โดยทั่วไปหมายถึง unit ที่คุณควบคุมเอง'
	}
];
