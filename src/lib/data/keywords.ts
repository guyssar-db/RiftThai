export interface Keyword {
    id: string;
    name_en: string;
    name_th: string;
    description_th: string;
    color: string;
}

export const keywords: Keyword[] = [
    { id: 'legion', name_en: 'Legion', name_th: 'กองทัพ', description_th: 'ความสามารถจะทำงานก็ต่อเมื่อคุณได้ร่ายการ์ดใบอื่นไปแล้วในเทิร์นเดียวกันนั้น', color: '#107361' },
    { id: 'hidden', name_en: 'Hidden / Hide', name_th: 'ซ่อน', description_th: 'วางการ์ดคว่ำหน้าลงในหนึ่งสนามรบ และสามารถเปิดเล่นเป็น [Reaction] ได้ในภายหลังโดยไม่เสียค่าร่าย', color: '#107361' },
    { id: 'accelerate', name_en: 'Accelerate', name_th: 'เร่งความเร็ว', description_th: 'จ่ายค่าร่ายเพิ่มเติม เพื่อให้ยูนิตเข้าสู่สนามในสภาพ พร้อม (Ready) แทนที่จะเป็นสภาพเหนื่อย', color: '#107361' },
    { id: 'action', name_en: 'Action', name_th: 'แอ็คชัน', description_th: 'อนุญาตให้เล่นการ์ดหรือใช้ความสามารถในช่วง Showdown (การประจันหน้า) ได้ รวมถึงในเทิร์นของคู่ต่อสู้ด้วย', color: '#107361' },
    { id: 'reaction', name_en: 'Reaction', name_th: 'รีแอ็คชัน', description_th: 'จังหวะสูงสุด สามารถเล่นแทรกได้ทุกเมื่อ แม้ในขณะที่ความสามารถอื่นกำลังทำงานอยู่', color: '#107361' },
    { id: 'ambush', name_en: 'Ambush', name_th: 'Ambush', description_th: 'ซุ่มโจมตี', color: '#107361' },
    { id: 'quickdraw', name_en: 'Quick-Draw', name_th: 'Quick-Draw', description_th: 'จั่วเร็ว', color: '#107361' },

    { id: 'hunt', name_en: 'Hunt', name_th: 'ล่า', description_th: 'คุณจะได้รับแต้ม XP +X เมื่อยูนิตนี้ยึดครองหรือรักษาพื้นที่สนามรบได้', color: '#97B028' },
    { id: 'deflect', name_en: 'Deflect', name_th: 'เบี่ยงเบน', description_th: 'คู่ต่อสู้ต้องจ่ายค่าร่ายเพิ่มเติม X Power หากต้องการเลือกการ์ดใบนี้เป็นเป้าหมาย', color: '#97B028' },
    { id: 'deathknell', name_en: 'Deathknell', name_th: 'เสียงระฆังมรณะ', description_th: 'ความสามารถที่จะทำงานเมื่อยูนิตตาย (ถูกส่งลงสุสาน)', color: '#97B028' },
    { id: 'temporary', name_en: 'Temporary', name_th: 'ชั่วคราว', description_th: 'ยูนิตจะถูกทำลายทิ้งทันทีเมื่อเริ่มเทิร์นถัดไปของเจ้าของการ์ด', color: '#97B028' },
    { id: 'level', name_en: 'Level', name_th: 'เลเวล', description_th: 'ความสามารถจะทำงานต่อเมื่อแต้ม XP ของคุณถึงระดับ X หรือสูงกว่า', color: '#97B028' },
    { id: 'ganking', name_en: 'Ganking', name_th: 'แก๊งค์', description_th: 'อนุญาตให้ยูนิตเคลื่อนที่ข้ามสนามรบได้โดยตรง โดยไม่ต้องกลับไปที่ฐาน (Base) ก่อน', color: '#97B028' },

    { id: 'mighty', name_en: 'Mighty', name_th: 'ทรงพลัง', description_th: 'สถานะที่จะทำงานเมื่อยูนิตมีค่า Might ตั้งแต่ 5 ขึ้นไป', color: '#717171' },
    { id: 'vision', name_en: 'Vision', name_th: 'นิมิต', description_th: 'เมื่อเล่นยูนิตนี้ ให้ดูการ์ดใบบนสุดของกองการ์ดหลัก และเลือกได้ว่าจะรีไซเคิลหรือไม่', color: '#717171' },
    { id: 'weaponmaster', name_en: 'Weaponmaster', name_th: 'Weaponmaster', description_th: 'ผู้เชี่ยวชาญอาวุธ', color: '#717171' },
    { id: 'equip', name_en: 'Equip', name_th: 'Equip', description_th: 'สวมใส่', color: '#717171' },
    { id: 'add', name_en: 'Add', name_th: 'Add', description_th: 'เพิ่ม', color: '#717171' },
    { id: 'stun', name_en: 'Stun', name_th: 'Stun', description_th: 'สตัน', color: '#717171' },
    { id: 'buff', name_en: 'Buff', name_th: 'Buff', description_th: 'บัฟ', color: '#717171' },

    { id: 'backline', name_en: 'Backline', name_th: 'แนวหลัง', description_th: 'ยูนิตนี้จะได้รับความเสียหายเป็นลำดับสุดท้าย หลังจากยูนิตอื่นๆ ทั้งหมดในสนามรบถูกทำลายแล้ว', color: '#CD2E6F' },
    { id: 'tank', name_en: 'Tank', name_th: 'แทงค์', description_th: 'คู่ต่อสู้ต้องโจมตีและทำลายยูนิตที่มี Tank ในสนามรบนั้นให้หมดก่อน ถึงจะเลือกโจมตียูนิตอื่นได้', color: '#CD2E6F' },
    { id: 'shield', name_en: 'Shield', name_th: 'เกราะป้องกัน', description_th: 'ยูนิตจะได้รับ Might +X ในขณะที่เป็นผู้ป้องกัน', color: '#CD2E6F' },
    { id: 'assault', name_en: 'Assault', name_th: 'บุกทะลวง', description_th: 'ยูนิตจะได้รับ Might +X (ค่าพลัง) ในขณะที่เป็นผู้โจมตี', color: '#CD2E6F' },
    { id: 'predict', name_en: 'Predict', name_th: 'ทำนาย', description_th: 'ให้ดูการ์ดใบบนสุดและเลือกจัดเรียงไว้บนสุดหรือล่างสุดของกอง', color: '#CD2E6F' }
];

export const iconMappings: Record<string, { icon: string, hint: string }> = {
    ':rb_exhaust:': { icon: 'exhaust.svg', hint: 'Exhaust (เหนื่อย)' },
    ':rb_might:': { icon: 'might.svg', hint: 'Might (พลังต่อสู้)' },
    ':rb_rune_fury:': { icon: 'rune_fury.svg', hint: 'Fury Rune (รูนแห่งความโกรธ)' },
    ':rb_rune_calm:': { icon: 'rune_calm.svg', hint: 'Calm Rune (รูนแห่งความสงบ)' },
    ':rb_rune_chaos:': { icon: 'rune_chaos.svg', hint: 'Chaos Rune (รูนแห่งความโกลาหล)' },
    ':rb_rune_mind:': { icon: 'rune_mind.svg', hint: 'Mind Rune (รูนแห่งจิตใจ)' },
    ':rb_rune_body:': { icon: 'rune_body.svg', hint: 'Body Rune (รูนแห่งร่างกาย)' },
    ':rb_rune_rainbow:': { icon: 'rune_rainbow.svg', hint: 'Any Rune (รูนใดก็ได้)' }
};
