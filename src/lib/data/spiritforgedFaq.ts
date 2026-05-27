export type FaqItem = {
	category: string;
	question: string;
	answer: string;
	source?: string;
};

export const spiritforgedFaqSource =
	'https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-spiritforged-faq/';

export const spiritforgedFaq: FaqItem[] = [
	{
		category: 'Spiritforged FAQ - Errata',
		question:
			'การ์ด Origins ที่สั่งให้เล่นการ์ดจาก deck เช่น Promising Future และ Blind Fury ถูก errata ให้ banish ก่อนเล่น แล้วการ์ด Spiritforged ที่ทำงานคล้ายกันจะโดน errata แบบเดียวกันไหม?',
		answer:
			'ใช่ หลักคือให้มี zone ชั่วคราวสำหรับการ์ดระหว่างรอเล่น และมีที่ให้การ์ดกลับไปถ้าเล่นไม่ได้ โดยส่วนใหญ่เล่นเหมือนเดิม แต่แก้เพื่อปิด corner case การ์ดที่เกี่ยวข้องคือ RekSai, Swarm Queen, Void Burrower, Void Rush และ Reinforce',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Errata',
		question: 'ระบบ reflexive trigger จาก Origins FAQ ใช้กับการ์ด Spiritforged ด้วยไหม?',
		answer:
			'ใช้ ถ้อยคำแบบ "do this:" จะสร้าง chain item ใหม่สำหรับสิ่งที่ต้องเปิดโอกาสให้ผู้เล่น react หรือควรเกิดช้ากว่าส่วนแรกของ spell หรือ ability การ์ดที่เกี่ยวข้องคือ Arise! และ Rell, Magnetic',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'Blood Rush ควรมีคำว่า "this turn" ไหม?',
		answer:
			'ควรมี เป็นข้อความที่ตกหล่น จึง errata ให้ผลของ Blood Rush อยู่เฉพาะเทิร์นนั้น',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question:
			'friendly unit ตัวแรกใน Deathgrip เป็น cost หรือ target ต้อง kill ตอนไหน และถ้า kill ไม่ได้จะเกิดอะไรขึ้น?',
		answer:
			'เป็น target ไม่ใช่ cost เลือกพร้อมกับ friendly unit อีกตัว แล้ว kill ตอน spell resolve ถ้า kill ไม่ได้ไม่ว่าด้วยเหตุผลใด จะไม่ให้ Might แก่ unit อีกตัว แต่ยังจั่ว 1 ใบ',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'auto-attach ability ของ Edge of Night ทำงานไหม?',
		answer:
			'ต้องแก้ wording เพื่อให้ ability ยังหา unit ที่เลือกไว้เจอ เพราะ gear ที่ไม่มีคนถือที่ battlefield จะถูก recall ทำให้การ์ดไม่อยู่ "here" ตอน ability resolve แต่เจตนาเดิมคือให้ทำงานเหมือนที่ผู้เล่นคาดไว้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'play effect ของ Janna, Savior ใช้ heal unit ฝั่งเราได้ไหมถ้าไม่มี enemy unit อยู่?',
		answer:
			'ได้ หลัง errata จะใช้ "up to one enemy unit" เพื่อให้ ability ขึ้น chain ได้แม้ไม่มี enemy unit ให้เลือก',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'Jax, Unmatched ทำงานอย่างไร?',
		answer:
			'Jax ให้ Equipment ในมือมี Quick-Draw เพื่อให้เล่นเป็น Reaction ได้ และ errata เพิ่ม reminder ให้ชัดว่าเมื่อเล่น Equipment นั้น ให้ attach กับ unit ที่เราควบคุม',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'Kato the Arm ให้ Might และ keywords กับตัวเองได้ไหม?',
		answer:
			'ไม่ได้ แม้คำว่า friendly unit จะรวมตัวเองตามกฎ แต่ไม่ใช่เจตนาของการ์ด จึง errata เป็น "another friendly unit"',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question:
			'Kato the Arm ให้ keywords ที่ได้รับระหว่างเล่นไหม แล้ว Might bonus จาก Equipment หรือแหล่งอื่นนับไหม?',
		answer:
			'นับตามสภาพปัจจุบันตอน ability resolve unit ที่เลือกจะได้ keywords ปัจจุบันของ Kato และได้ Might เพิ่มตาม Might ปัจจุบันของ Kato หลังจาก resolve แล้ว การเปลี่ยนแปลงของ Kato ภายหลังไม่ย้อนกลับไปเปลี่ยนผลนี้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question:
			'ถ้าคู่แข่งมี Tianna Crownguard เรายัง conquer หรือ hold battlefield ได้ไหม ได้ conquer หรือ hold triggers ไหม แล้วกรณีจั่วแทนแต้มที่ 8 จาก conquer เป็นอย่างไร?',
		answer:
			'Tianna สนใจเฉพาะการ gain points ไม่ได้ห้ามกระบวนการ conquer หรือ hold เรายัง conquer และ hold ได้ ยังได้ triggers และถ้า conquer แล้วแต้มสุดท้ายยังให้ point ไม่ได้เพราะเงื่อนไขแต้มสุดท้าย ก็ยังจั่วการ์ดแทนได้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'Forgotten Monument ทำงานเหมือน Tianna Crownguard ไหม และจะได้ errata แบบเดียวกันไหม?',
		answer:
			'ไม่เหมือน Forgotten Monument ห้ามกระบวนการ scoring ที่ battlefield นั้นโดยตรง ทำให้ไม่มี conquer triggers, hold triggers และไม่ได้แต้มจากการ score ที่นั่น แต่ point พิเศษจากแหล่งอื่นยังไม่ได้รับผลกระทบ และยังสามารถ gain control หลัง showdown ได้ เพียงแต่ conquer ที่นั่นไม่ได้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'Yone, Blademaster trigger เมื่อไร ถ้า conquer battlefield แล้ว battlefield นั้นยังถือว่า open อยู่ไหม?',
		answer:
			'Yone ถูกปรับให้ดูสถานะ control ของ battlefield ทันที "ก่อน" conquer ถ้า battlefield ก่อน conquer เป็น uncontrolled ก็ trigger ได้ ทำให้ทำงานใน noncombat showdown ที่ Yone conquer และในสถานการณ์ surprise defense ได้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Rules',
		question: 'win หรือ lose combat หมายถึงอะไร?',
		answer:
			'หลัง combat damage ถ้าทั้งสองฝ่ายไม่มี unit เหลือ หรือทั้งสองฝ่ายยังมี unit เหลือ ถือว่า tie ถ้ามี unit เหลือฝ่ายเดียว ฝ่ายนั้นชนะ combat และอีกฝ่ายแพ้ combat',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question: 'ถ้า Draven, Audacious ชนะตอน attack และ conquer ได้ ความสามารถเกิดก่อนหรือหลัง score/conquer effects?',
		answer:
			'ความสามารถของ Draven trigger และ resolve ก่อนแต้มปกติจากการ score battlefield และก่อน conquer effects ดังนั้นถ้าอยู่ที่ 6 แต้มแล้ว conquer ด้วย Draven จะได้แต้มจาก Draven ก่อน จากนั้นระบบเห็นว่าเป็นแต้มที่ 7 แล้วถ้ายัง score battlefield อื่นไม่ครบ จะจั่วแทนแต้มจาก conquer',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Tokens',
		question: 'Pickpocket kill Gold token ได้ไหม?',
		answer:
			'ได้ token ที่ไม่มี cost ให้ถือว่า cost เป็น 0 สำหรับทุกกรณี ไม่ใช่ค่า NULL ที่เอาไปเปรียบเทียบไม่ได้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Tokens',
		question: 'Rumble, Hotheaded เลือก Mech token เพื่อ recycle ได้ไหม ถ้าได้แล้วไปไหน?',
		answer:
			'ได้ token จะ inherit recycle destination ตาม type ของมัน เช่น unit หรือ gear token จะ recycle ไปยัง Main Deck เหมือนการ์ด type นั้น จากนั้น token จะหายไปเมื่อออกจาก board แต่ยังนับเป็น unit ที่ recycle แล้วเพื่อให้ Rumble ตรวจ Might ได้',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question:
			'Svellsongur copy text ที่ unit ได้จากแหล่งอื่นไหม เช่น Assault จาก Cleave หรือ text จาก Equipment ใบอื่น?',
		answer:
			'ไม่ copy เฉพาะ text ที่พิมพ์อยู่บน unit เท่านั้น ไม่ copy text ที่ unit ได้เพิ่มจากแหล่งอื่น และการใส่ Svellsongur หลายใบไม่ได้ทำให้ copy ความสามารถจาก Equipment อื่นซ้อนเพิ่ม',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Cards',
		question:
			'ถ้า attach Svellsongur ให้ Aphelios, Exalted เขาจะมี copy ที่สองของ ability ทัน trigger ไหม และต้องเลือก option ต่างกันไหม?',
		answer:
			'มีทันและ trigger ได้ restriction เรื่อง option ที่ยังไม่ถูกเลือกในเทิร์นนั้นแยกกันตามแต่ละ instance ของ ability จึงเลือก option เดียวกันให้ทั้งสอง instance ได้ แต่ต้อง track ว่าแต่ละ copy เลือกอะไรไปแล้ว',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Might',
		question:
			'การ์ดลด Might รุ่นใหม่จะไม่เขียน "to a minimum of 1" แล้ว Origins card อย่าง Stupefy จะได้รับ errata ไหม?',
		answer:
			'ไม่ เป็นการเปลี่ยนแนวทางออกแบบตั้งแต่ Spiritforged แต่ Origins cards ยังทำงานเหมือนเดิม',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Might',
		question: 'Might ของ unit ลงไปถึง 0 หรือติดลบได้ใช่ไหม?',
		answer:
			'ใช่ ทำได้อยู่แล้วแต่เกิดยากขึ้นกับสถานการณ์ Spiritforged ทำให้สถานการณ์นี้พบง่ายขึ้น จึงมี clarification เพิ่มเรื่อง unit ที่ Might เป็น 0 หรือติดลบ',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Might',
		question: 'unit ที่มี Might 0 หรือติดลบตายเองไหม?',
		answer:
			'ไม่ตายเอง อยู่บน board ได้ แต่ถ้าได้รับ damage อย่างน้อย 1 จะตาย เพราะ 0 damage ไม่ใช่ damage จำนวนที่ถูกต้องสำหรับการ kill',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Might',
		question: 'unit ที่มี Might ติดลบทำให้ total Might ใน combat ติดลบไหม?',
		answer:
			'ไม่ สำหรับการทำ damage ให้ถือว่า Might ติดลบเป็น 0 แต่ค่าจริงยังใช้ตอนเพิ่มกลับ เช่น -3 Might ต้องได้ +4 ถึงจะกลับเป็น 1 Might',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Costs',
		question: 'Ezreal, Prodigy ลด cost อะไรได้บ้าง ลด Repeat, Accelerate, Equip ได้ไหม?',
		answer:
			'Ezreal ลด optional additional costs ได้ โดยทั่วไปจะมีคำว่า additional cost และ may ตัวอย่างหลักคือ Repeat และ Accelerate รวมถึงบางเคสเฉพาะอย่าง Blast Corps Cadet แต่ไม่ลด Equip เพราะ Equip เป็น activation cost ของ ability ไม่ใช่ optional additional cost',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Costs',
		question: 'Deflect costs เป็น optional ไหม และ Ezreal, Prodigy ลดได้ไหม?',
		answer:
			'ไม่ Deflect เป็น mandatory additional cost หากจะ finalize spell หรือ ability ที่ choose เป้าหมายมี Deflect ต้องจ่าย cost นั้น Ezreal จึงไม่ลด Deflect',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Rules',
		question: 'ถ้าใช้ Hostile Takeover ยึด unit ตัวเดียวของคู่แข่งใน battlefield จะเกิด showdown ไหม และเป็น combat ไหม?',
		answer:
			'จะเกิด noncombat showdown ไม่ใช่ combat ใช้กับสถานการณ์ที่เรามี unit อยู่ใน battlefield ที่คู่แข่งยัง control อยู่ แต่คู่แข่งไม่มี unit เหลือที่นั่น ช่วงเวลาละเอียดให้ถือว่าคู่แข่งเสีย control ใน cleanup เดียวกับที่เริ่ม showdown',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Costs',
		question:
			'Repeat ทำซ้ำส่วนไหนของ spell ถ้า Temporal Portal ให้ Find Your Center มี Repeat แล้วจ่ายตอน cost reduction ยังอยู่ reduction คิดกี่ครั้ง และ spell สุดท้าย cost 2 หรือ 4?',
		answer:
			'Repeat ทำซ้ำ instructions ของ spell ตอน resolve ไม่ได้ทำซ้ำ cost reduction ค่า Repeat cost ของ Find Your Center ไม่ถูกลด เพราะการถามหา cost ของการ์ดจะดู printed cost ผลคือ cost reduction ใช้ครั้งเดียว และ final spell cost เป็น 4',
		source: spiritforgedFaqSource
	},
	{
		category: 'Spiritforged FAQ - Keywords',
		question: 'reminder text ของ Weaponmaster เขียนว่า "You may" แต่ Core Rules อ่านเหมือนบังคับ ต้องใช้แบบไหน?',
		answer:
			'Weaponmaster ตั้งใจให้ optional เสมอ reminder text ถูกต้องกว่า ผู้เล่นเลือกได้ว่าจะใช้ play ability นี้หรือไม่ และกฎจะถูกปรับถ้อยคำในอนาคต',
		source: spiritforgedFaqSource
	}
];
