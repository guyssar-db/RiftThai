export interface Keyword {
    id: string;
    name_en: string;
    name_th: string;
    description_th: string;
    color: string;
}

export const keywords: Keyword[] = [
    { id: 'recycle', name_en: 'Recycle', name_th: 'รีไซเคิล', description_th: 'การนำการ์ดรูนหรือการ์ดจากมือ ตามที่มาของการ์ดนั้น ส่งกลับเข้าใต้กอง', color: '#107361' },
    { id: 'legion', name_en: 'Legion', name_th: 'กองทัพ', description_th: 'ความสามารถจะทำงานก็ต่อเมื่อคุณได้ทำการ \'เล่นการ์ดใบอื่น\' ไปแล้วอย่างน้อย 1 ใบในเทิร์นนี้ (คอมโบต่อเนื่อง)', color: '#107361' },
    { id: 'hidden', name_en: 'Hidden', name_th: 'ซ่อน', description_th: 'จ่ายค่าร่าย 1 Power (โดยการ Recycle รูน) เพื่อนำการ์ดไปวางคว่ำหน้าซ่อนไว้ใน Battlefield และสามารถเปิดหงายใช้งาน (Trigger) ได้ฟรีในภายหลัง', color: '#107361' },
    { id: 'accelerate', name_en: 'Accelerate', name_th: 'เร่งความเร็ว', description_th: 'ทางเลือกในการจ่ายค่าร่ายเพิ่มเติม (มักจะเป็น 1 Energy + Recycle 1 รูน) เพื่อให้ยูนิตลงสนามมาในสภาพ Ready (ตั้งตรง) พร้อมใช้งานทันทีโดยไม่ต้องรอเทิร์นถัดไป', color: '#107361' },
    { id: 'action', name_en: 'Action', name_th: 'แอ็คชัน', description_th: 'ประเภทของการ์ดหรือสกิลที่สามารถเล่นได้ในเฟสหลัก (Action Phase) ของเทิร์นเจ้าของการ์ด หรือเล่นในช่วงเปิดศึก (Showdown) ได้', color: '#107361' },
    { id: 'reaction', name_en: 'Reaction', name_th: 'รีแอ็คชัน', description_th: 'ประเภทของการ์ดความเร็วสูง (Instant) ที่สามารถร่ายสวนกลับหรือขัดจังหวะคู่แข่งได้ตลอดเวลา รวมถึงในเทิร์นของคู่แข่งและช่วงการต่อสู้', color: '#107361' },
    { id: 'ambush', name_en: 'Ambush', name_th: 'Ambush', description_th: 'ยูนิตที่มีคีย์เวิร์ดนี้สามารถร่ายลงสนามด้วยความเร็วระดับ Reaction (ร่ายแทรกได้) แต่ต้องลงใน Battlefield ที่เรามีทหารคุมอยู่แล้วเท่านั้น', color: '#107361' },
    { id: 'quickdraw', name_en: 'Quick-Draw', name_th: 'Quick-Draw', description_th: 'คล้ายกับ Ambush แต่ใช้สำหรับ \'การ์ดอุปกรณ์ (Gear)\' หรือเวทมนตร์ ให้สามารถร่ายติดตั้งหรือใช้งานด้วยความเร็ว Reaction ได้', color: '#107361' },
    { id: 'Repeat', name_en: 'Repeat', name_th: 'Repeat', description_th: 'คุณสามารถจ่ายค่าร่ายเพิ่มเติมเพื่อทำซ้ำผลของเวทมนตร์นี้', color: '#107361' },


    { id: 'hunt', name_en: 'Hunt', name_th: 'ล่า', description_th: 'กลไกพิเศษที่จะได้รับค่า XP สำหรับการ Level Up เมื่อการ์ดใบนี้ Conquer หรือ Hold', color: '#97B028' },
    { id: 'deflect', name_en: 'Deflect', name_th: 'เบี่ยงเบน', description_th: 'เกราะป้องกันเวทย์/สกิล: หากคู่แข่งต้องการเลือกการ์ดใบนี้ด้วยเวทมนตร์หรือความสามารถ คู่แข่งต้องจ่ายค่าร่าย Power เพิ่ม (Tax) มิฉะนั้นจะเลือกไม่ได้', color: '#97B028' },
    { id: 'deathknell', name_en: 'Deathknell', name_th: 'เสียงระฆังมรณะ', description_th: 'ความสามารถที่จะทำงานเมื่อยูนิตนี้ตายและถูกส่งลงสุสาน (Trash)', color: '#97B028' },
    { id: 'temporary', name_en: 'Temporary', name_th: 'ชั่วคราว', description_th: 'ยูนิตหรือการ์ดนี้จะถูกทำลายเมื่อจบเทิร์น หรือช่วงเริ่มต้น Beginning Phase ของผู้ควบคุม', color: '#97B028' },
    { id: 'level', name_en: 'Level', name_th: 'เลเวล', description_th: 'ระบบสะสมค่าประสบการณ์ (XP) ของแชมเปี้ยนในการ์ดเซ็ต Unleashed เมื่อเงื่อนไข XP ครบ จะอัปเกรดร่างและได้รับความสามารถใหม่', color: '#97B028' },
    { id: 'ganking', name_en: 'Ganking', name_th: 'แก๊งค์', description_th: 'ความสามารถพิเศษที่ทำให้ยูนิตเคลื่อนที่จาก Battlefield หนึ่งไปยังอีก Battlefield หนึ่งได้โดยตรง โดยไม่ต้องกลับ Base ก่อน', color: '#97B028' },
    { id: 'empowered', name_en: 'Empowered', name_th: 'Empowered', description_th: 'สถานะปลุกพลังของการ์ดใบนี้ ซึ่งจะช่วยมอบความสามารถพิเศษเพิ่มเติมเมื่อปลุกพลังแล้ว', color: '#97B028' },
    
    { id: 'mighty', name_en: 'Mighty', name_th: 'ทรงพลัง', description_th: 'สถานะที่บ่งบอกว่ายูนิตนั้นมีค่าพลังโจมตี (Might) ตั้งแต่มูลค่า 5 แต้มขึ้นไป', color: '#717171' },
    { id: 'vision', name_en: 'Vision', name_th: 'นิมิต', description_th: 'เมื่อยูนิตนี้ลงสนาม ให้ทำการ Predict 1 (ดูการ์ดใบบนสุดของกอง 1 ใบ เลือกได้ว่าจะ Recycle ส่งกลับเข้าใต้กอง หรือวางกลับไว้ที่เดิม)', color: '#717171' },
    { id: 'weaponmaster', name_en: 'Weaponmaster', name_th: 'Weaponmaster', description_th: 'ผู้ชำนาญอาวุธ: เมื่อคุณเล่นการ์ดใบนี้ สามารถ Equip การ์ดอุปกรณ์ 1 ใบของคุณมาสวมใส่ให้การ์ดใบนี้โดยจ่ายค่าร่ายน้อยลง [A] แม้จะสวมใส่อยู่กับการ์ดอื่นแล้วก็ตาม', color: '#717171' },
    { id: 'equip', name_en: 'Equip', name_th: 'Equip', description_th: 'การติดตั้งการ์ดประเภท Gear (อาวุธ/อุปกรณ์) เข้ากับยูนิตเพื่อเพิ่มค่าพลังหรือความสามารถ', color: '#717171' },
    { id: 'add', name_en: 'Add', name_th: 'Add', description_th: 'คำสั่งเพิ่มทรัพยากร (เช่น \'[Add] [A]\') หมายถึงการได้รับทรัพยากรนั้นทันทีโดยที่คู่แข่งไม่สามารถ Reaction สวนกลับได้', color: '#717171' },
    { id: 'empower', name_en: 'Empower', name_th: 'Empower', description_th: 'การจ่ายค่าพลังตามจำนวนที่ระบุเพื่อปลุกพลังการ์ด (สามารถทำได้เฉพาะเมื่อการ์ดใบนี้ยังไม่เข้าสู่สถานะ Empowered เท่านั้น)', color: '#717171' },
    { id: 'burn', name_en: 'Burn', name_th: 'Burn', description_th: 'คำสั่งเผากองการ์ด โดยการนำการ์ดใบบนสุดของ Main Deck ตามจำนวนที่ระบุ (เช่น Burn 1) ส่งลงสุสาน (Trash)', color: '#717171' },
    { id: 'flow', name_en: 'Flow', name_th: 'Flow', description_th: 'ความสามารถที่ยอมให้คุณจ่ายค่าร่าย Flow เพื่อร่ายการ์ดใบนี้จากในสุสาน (Trash) จากนั้นให้ Banish การ์ดใบนี้ออกนอกเกม', color: '#107361' },
    { id: 'banish', name_en: 'Banish', name_th: 'Banish (ออกจากเกม)', description_th: 'การนำการ์ดออกจากเกม ไม่ถือว่าอยู่ใน Trash และโดยปกติไม่สามารถนำกลับมาได้ เว้นแต่จะมีการ์ดที่ระบุไว้โดยเฉพาะ', color: '#107361' },
    { id: 'stun', name_en: 'Stun', name_th: 'Stun', description_th: 'ยูนิตที่ถูก Stun จะไม่สามารถสร้างความเสียหายจากการต่อสู้ (Combat Damage) ได้ในเทิร์นนี้', color: '#717171' },
    { id: 'buff', name_en: 'Buff', name_th: 'Buff', description_th: 'การมอบโทเคน/สถานะ Buff ให้กับการ์ดเพื่อเพิ่มพลัง หรือสละ Buff เพื่อเปิดใช้งานความสามารถพิเศษ', color: '#717171' },
    { id: 'predict', name_en: 'Predict', name_th: 'ทำนาย', description_th: 'ดูการ์ดจากใบบนสุดของ Main Deck ตามจำนวนที่กำหนด เลือก Recycle ใบที่ไม่ต้องการโดยส่งกลับเข้าใต้กอง และเรียงใบที่เหลือกลับไว้บนกอง', color: '#717171' },
    { id: 'backline', name_en: 'Backline', name_th: 'แนวหลัง', description_th: 'ยูนิตนี้จะได้รับความเสียหายจากการต่อสู้ (Combat Damage) เป็นลำดับสุดท้าย', color: '#CD2E6F' },
    { id: 'tank', name_en: 'Tank', name_th: 'แทงค์', description_th: 'ยูนิตนี้ต้องรับความเสียหายจากการต่อสู้ (Combat Damage) เป็นลำดับแรกสุดในเลนนั้นเสมอ', color: '#CD2E6F' },
    { id: 'shield', name_en: 'Shield', name_th: 'เกราะป้องกัน', description_th: 'ป้องกันความเสียหาย 1 ครั้งถัดไปที่จะเกิดขึ้นกับยูนิตนี้ (ไม่ว่าจะจากการต่อสู้หรือเวทมนตร์) แล้วเกราะจะสลายไป', color: '#CD2E6F' },
    { id: 'assault', name_en: 'Assault', name_th: 'บุกทะลวง', description_th: 'ยูนิตจะได้รับค่าพลังโจมตีเพิ่มขึ้น (+X Might) ขณะที่เป็นฝ่ายโจมตี (Attack) หรือเริ่มเปิด Showdown ในเทิร์นของคุณ', color: '#CD2E6F' }
];

export const iconMappings: Record<string, { icon: string, hint: string }> = {
    ':rb_exhaust:': { icon: 'exhaust.svg', hint: 'Exhaust (เหนื่อย)' },
    ':rb_might:': { icon: 'might.svg', hint: 'Might (พลังต่อสู้)' },
    ':rb_rune_fury:': { icon: 'rune_fury.svg', hint: 'Fury Rune (รูนแห่งความโกรธ)' },
    ':rb_rune_calm:': { icon: 'rune_calm.svg', hint: 'Calm Rune (รูนแห่งความสงบ)' },
    ':rb_rune_chaos:': { icon: 'rune_chaos.svg', hint: 'Chaos Rune (รูนแห่งความโกลาหล)' },
    ':rb_rune_mind:': { icon: 'rune_mind.svg', hint: 'Mind Rune (รูนแห่งจิตใจ)' },
    ':rb_rune_body:': { icon: 'rune_body.svg', hint: 'Body Rune (รูนแห่งร่างกาย)' },
    ':rb_rune_order:': { icon: 'rune_order.svg', hint: 'Order Rune (รูนแห่งระเบียบ)' },
    ':rb_rune_rainbow:': { icon: 'rune_rainbow.svg', hint: 'Any Rune (รูนใดก็ได้)' }
};
