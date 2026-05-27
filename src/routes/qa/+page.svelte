<script lang="ts">
    import RuleDisclaimer from '$lib/components/RuleDisclaimer.svelte';
    import SiteMenu from '$lib/components/SiteMenu.svelte';
    import { spiritforgedFaq } from '$lib/data/spiritforgedFaq';

    interface QAItem { category: string; question: string; answer: string; source?: string; }
    
    const qaData: {
        game_title: string;
        data_type: string;
        qa_list: QAItem[];
    } = {
        "game_title": "Riftbound TCG",
        "data_type": "Rules and Mechanics QA",
        "qa_list": [
            ...spiritforgedFaq,
            {
                "category": "Keywords & Abilities",
                "question": "สกิล Soaring Scout ที่เขียนว่า DEATHKNELL: Channel 1 rune exhausted ทำงานอย่างไร",
                "answer": "เมื่อ Soaring Scout ตาย (DEATHKNELL) ผู้เล่นจะได้จั่วเปิดการ์ดรูน 1 ใบจากกองรูนขึ้นมาวางบนสนามทันที แต่รูนใบนั้นจะเข้ามาในสภาพนอนตะแคง (Exhausted) ยังไม่สามารถกดใช้แต้ม Energy ในเทิร์นนั้นทันทีได้"
            },
            {
                "category": "Keywords & Abilities",
                "question": "คีย์เวิร์ด Hidden (ซ่อนตัว) ของยูนิตทำงานอย่างไร และจะหลุดสถานะตอนไหน",
                "answer": "ยูนิตที่ติด Hidden จะไม่ตกเป็นเป้าหมายของการโจมตี เวทมนคร์ หรือสกิลจากฝั่งตรงข้าม และจะหลุดจากสถานะซ่อนตัวทันทีเมื่อยูนิตนั้นทำการโจมตี (Attack) หรือใช้สกิล (Activate an ability)"
            },
            {
                "category": "Card Mechanics",
                "question": "การ์ดเวทมนคร์ Consult the Past ที่มีคีย์เวิร์ด Hidden ต้องจ่ายค่าร่ายอย่างไรและวางไว้ตรงไหน",
                "answer": "ผู้เล่นสามารถจ่ายล่วงหน้าเพียง 1 Power Rune (โดยการ Recycle รูน 1 ใบ) เพื่อนำการ์ด Consult the Past ไปวางคว่ำหน้าซ่อนไว้ล่วงหน้าบนพื้นที่สนามรบ (Battlefield) ที่เลือก และตอนเปิดหงายใช้งาน (Trigger) จะร่ายได้ฟรี 0 รูน"
            },
            {
                "category": "Keywords & Abilities",
                "question": "การ์ดเวทมนคร์ที่มีแท็ก Reaction สามารถเปิดใช้งานตอนไหนได้บ้าง",
                "answer": "สามารถร่ายหรือเปิดหงายใช้งานเพื่อสวนกลับ ขัดจังหวะ หรือแทรก Chain สวนคู่แข่งได้ทุกเวลา แม้กระทั่งในเทิร์นของคู่แข่ง หรือระหว่างช่วงจังหวะร่ายเวทย์ก่อนตัดสินผลการต่อสู้ (Pre-Combat Spell Window)"
            },
            {
                "category": "Card Mechanics",
                "question": "เมื่อเปิดใช้เวทย์ Spirit Call เสก Spirit Token ออกมา โทเคนนั้นจะลงสนามรบที่ไหนและมีสภาพอย่างไร",
                "answer": "หากเสกมาจากผลของการ์ดที่หมอบ Hidden ไว้ โทเคนจะต้องลงมา ณ Battlefield เลนเดียวกันกับที่การ์ดนั้นคว่ำอยู่เท่านั้น และยูนิตโทเคนทั้งหมดจะลงสนามมาในสภาพนอนตะแคง (Exhausted) เสมอ"
            },
            {
                "category": "Rules & Movement",
                "question": "ยูนิตสามารถสั่ง Move (เคลื่อนที่) กระโดดข้ามเลนจาก Battlefield หนึ่งไปอีก Battlefield หนึ่งได้ไหม?",
                "answer": "ไม่ได้เด็ดขาด การเคลื่อนที่ปกติบนกระดานเป็นแนวตรงภายในเลนตัวเองเท่านั้น (เดินหน้าเข้า Battlefield หรือถอยกลับมาที่ Base) ไม่สามารถเดินเลี้ยวข้ามไปเลนข้างๆ ได้ เว้นแต่จะได้รับผลลัพธ์จากเวทมนคร์หรือคีย์เวิร์ดพิเศษระบุไว้ชัดเจน เช่น Teleport"
            },
            {
                "category": "Rules & Combat",
                "question": "สามารถใช้ Spirit Token ที่เพิ่งเสกออกมาเปิดทำ Showdown (ศึกตัดสินพื้นที่) ในเทิร์นนั้นเลยได้ไหม?",
                "answer": "ไม่ได้ เพราะยูนิตที่จะสั่ง Exhaust เพื่อเดินหน้าเปิดทำ Showdown ได้ต้องอยู่ในสภาพ Ready (ตั้งตรง) ที่สุดเท่านั้น แต่โทเคนเสกใหม่จะนอนตะแคงอยู่ (Exhausted) จึงต้องรอเฟส Awaken ในเทิร์นถัดไปก่อน แต่ในเทิร์นที่เสกนั้น มันสามารถร่วมคำนวณค่า Might เพื่อตั้งรับศึกได้"
            },
            {
                "category": "Card Mechanics",
                "question": "การ์ด Cull the Weak ที่สั่งให้ผู้เล่นแต่ละคนทำลายยูนิตตัวเอง 1 ตัว หากบอร์ดเราว่างเปล่าจะร่ายได้ไหม?",
                "answer": "ร่ายได้ปกติ เนื่องจากบอร์ดเราไม่มีตัวให้ทำลาย ระบบจะสั่งให้ทำตามเอฟเฟกต์ให้ได้มากที่สุด ผลคือเราไม่ต้องฆ่าอะไรเลย แต่ฝั่งตรงข้ามจำเป็นต้องเลือกฆ่ายูนิตของตัวเองทิ้ง 1 ตัวอยู่ดี"
            },
            {
                "category": "Card Mechanics",
                "question": "ถ้าเราเล่นเด็ค Viktor, Innovator แล้วสั่งเปิดหงายการ์ดเวทย์ที่หมอบ Hidden ไว้ในเทิร์นคู่แข่ง สกิลเสกทหารจะทำงานไหม?",
                "answer": "ทำงานและได้โทเคน 1 Might Recruit ทันที เพราะกฎเกมนับว่าการเปิดหงายการ์ด Hidden ขึ้นมาส่งผลในเทิร์นคู่แข่ง คือการทำแอ็กชัน 'Play a card' สำเร็จในเทิร์นคู่แข่งแล้ว (แต่ตอนคว่ำการ์ดในเทิร์นเราจะยังไม่ได้โทเคน)"
            },
            {
                "category": "Rules & Scoring",
                "question": "คะแนนโบนัสจากสถานะ Hold และ สกิลของ Ahri, Alluring จะทำงานและแจกแต้มให้ในจังหวะไหน?",
                "answer": "จะแจกแต้มให้ในช่วงเฟสเริ่มเทิร์นของคุณ (Start of Turn Phase) เท่านั้น โดยคำนวณแต้มคุมเลนต่อเนื่องสำเร็จ (Hold) ได้ 1 แต้ม และสกิลของ Ahri จะบวกโบนัสพิเศษเพิ่มให้อีก 1 แต้ม รวมเป็น 2 แต้มในเลนเดียวทันที"
            },
            {
                "category": "Keywords & Abilities",
                "question": "ยูนิตที่ติดสถานะ Stun (มึนงง) จะถูกจำกัดการทำอะไรบ้าง และจะหายตอนไหน?",
                "answer": "ยูนิตที่ติด Stun จะไม่สามารถสั่งโจมตี เคลื่อนที่ หรือกดใช้งานสกิลที่ต้องเปิดใช้งานได้ แต่ค่าพลัง Might ยังคงอยู่ตามปกติ และสถานะ Stun จะถูกถอดออกโดยอัตโนมัติเมื่อเข้าสู่เฟสเตรียมพร้อม (Awaken Phase) ในเทิร์นของเจ้าของยูนิตนั้น"
            },
            {
                "category": "Rules & Healing",
                "question": "ระบบจะทำการ Heal (ล้างดาเมจสะสม) ออกจากยูนิตบนบอร์ดตอนไหนบ้าง?",
                "answer": "เกิดขึ้นใน 2 จังหวะเวลาหลักคือ 1) สิ้นสุดศึกตัดสินพื้นที่ (At the end of any Combat Showdown) โดยจะฮีลยูนิตทุกตัวที่รอดชีวิตทั่วทั้งกระดาน และ 2) สิ้นสุดเทิร์นของผู้เล่นทุกคน (At the end of any Player's turn)"
            },
            {
                "category": "Card Mechanics",
                "question": "เมื่อ Glasc Mixologist ตายลง ยูนิตตัวใหม่ที่ชุบชีวิตขึ้นมาจะได้เข้าสู้ต่อในไฟต์เดิมไหม?",
                "answer": "ไม่ได้สู้ในไฟต์เดิมที่เพิ่งจบไป แต่เนื่องจากระบบตรวจพบว่ายังมีตัวบุกศัตรูเหลืออยู่และมีตัวเราลงมาใหม่ บอร์ดจะบังคับทำการ 'เปิดศึก Showdown รอบใหม่ซ้อนขึ้นมาทันที' ในเลนเดิม ทำให้ตัวที่ชุบลงมาได้สู้ต่อในไฟต์รอบสองทันที"
            },
            {
                "category": "Keywords & Abilities",
                "question": "คีย์เวิร์ด ACCELERATE (เร่งความเร็ว) บนการ์ดยูนิตทำอะไรได้บ้าง?",
                "answer": "ยอมให้ผู้เล่นจ่ายค่าร่ายเพิ่มเติมโดยการ Recycle รูนสีทอง (Order) 1 ใบตอนส่งยูนิตลงสนาม เพื่อแลกกับการให้ยูนิตตัวนั้นลงมาในสนามในสภาพ Ready (ตั้งตรง) ทันที ทำให้สั่งเดินหน้าหรือสั่งโจมตีได้เลยในเทิร์นเดียวโดยไม่ต้องรอ"
            },
            {
                "category": "Rules & Movement",
                "question": "การสั่ง Move Unit (เคลื่อนที่ยูนิต) ถอยกลับลงมาที่ Base มีค่าใช้จ่ายหรือไม่?",
                "answer": "ไม่มีค่าใช้จ่ายในแง่ของมานาหรือแต้มรูน (เดินฟรี) แต่ผู้เล่นต้องจ่ายด้วยสถานะ โดยการสั่ง Exhaust (แท็บนอนตะแคง) ยูนิตตัวที่ตั้งตรงใบนั้นเพื่อขยับตำแหน่งแทน"
            },
            {
                "category": "Rules & Resources",
                "question": "ในการจ่ายค่าร่าย Power Rune โดยวิธี Recycle เราจำเป็นต้องเลือกรูนที่ตั้งตรง (Ready) เท่านั้นใช่ไหม?",
                "answer": "ไม่จำเป็น สามารถนำรูนที่นอนตะแคง (Exhausted) อยู่มา Recycle ได้ และเป็นวิธีที่โปรนิยมทำ โดยการกด Exhaust รูนเพื่อเอา 1 Energy มาเก็บในระบบก่อน แล้วจับรูนใบเดิมนั้นส่งลงใต้กอง Recycle เพื่อเอา 1 Power ควบคู่กันในเทิร์นเดียว"
            }
        ,
            {
                "category": "Rules & Showdown",
                "question": "Showdown เกิดขึ้นเมื่อไหร่?",
                "answer": "Showdown เกิดเมื่อ battlefield กลายเป็นพื้นที่ที่มีการ contest กัน เช่นมี unit เคลื่อนเข้าไปยัง battlefield ที่ฝ่ายตรงข้ามควบคุม หรือมีสถานการณ์ที่ทำให้สองฝ่ายแย่งพื้นที่เดียวกัน แต่ถ้าเล่น unit ลง battlefield ที่เราควบคุมอยู่แล้วโดยไม่มีฝ่ายตรงข้ามเข้ามา contest จะไม่เริ่ม showdown ใหม่"
            },
            {
                "category": "Rules & Showdown",
                "question": "ถ้า showdown ใหม่ควรเกิดขึ้นระหว่างที่ showdown เดิมยังไม่จบ จะเกิดอะไรขึ้น?",
                "answer": "Showdown ใหม่นั้นจะถูก staged หรือรอคิวไว้ก่อน แล้วค่อยเกิดขึ้นหลัง showdown ปัจจุบันสรุปผลเสร็จแล้ว ทำให้เกมไม่ต้อง resolve combat หลายชุดซ้อนกันในเวลาเดียวกัน"
            },
            {
                "category": "Rules & Chain",
                "question": "Chain เกิดจากอะไรบ้าง?",
                "answer": "Chain เกิดเมื่อผู้เล่นร่าย spell, ใช้ activated ability หรือมี triggered ability ถูกสร้างขึ้น ฝ่ายตรงข้ามจึงมีโอกาสใช้ Reaction เพื่อตอบสนองก่อนสิ่งนั้น resolve แต่การเล่น unit เฉย ๆ ไม่ได้สร้าง reaction window เอง เว้นแต่ว่าการเล่น unit นั้นทำให้ ability บางอย่าง trigger"
            },
            {
                "category": "Rules & Timing",
                "question": "Action กับ Reaction ต่างกันยังไง?",
                "answer": "Reaction ใช้ได้เมื่อมี priority ทั้งในเทิร์นเราและเทิร์นคู่แข่ง รวมถึงตอบสนองสิ่งที่อยู่บน chain ได้ ส่วน Action ใช้ตอบ chain ไม่ได้ แต่เล่นได้ในเทิร์นเรา หรือระหว่าง showdown ตอนที่เรามี focus และไม่มีอะไรค้างอยู่บน chain"
            },
            {
                "category": "Rules & Timing",
                "question": "Spell หรือ ability ที่ไม่มีคำว่า Action หรือ Reaction เล่นตอนไหนได้?",
                "answer": "โดยทั่วไปเล่นได้เฉพาะในเทิร์นของเรา ตอนที่ไม่มี chain หรือ showdown กำลังดำเนินอยู่ จึงไม่สามารถใช้เป็นการตอบสนองแบบ Reaction และไม่สามารถแทรกระหว่าง showdown ได้ถ้าตัวการ์ดไม่ได้อนุญาตไว้"
            },
            {
                "category": "Rules & Movement",
                "question": "Spell ที่เขียนว่า Move a unit ย้าย unit จาก battlefield หนึ่งไปอีก battlefield ได้ไหม?",
                "answer": "ได้ ถ้าการ์ดสั่งให้ Move a unit เอฟเฟกต์นั้นสามารถข้ามข้อจำกัดการเคลื่อนที่ปกติได้ แม้ปกติ unit จะไม่สามารถย้ายจาก battlefield ไป battlefield อื่นเองได้ ยกเว้นมีความสามารถหรือเอฟเฟกต์ที่อนุญาต"
            },
            {
                "category": "Rules & Combat",
                "question": "เมื่อไหร่เราถือว่าเป็น attacker หรือ defender?",
                "answer": "เราเป็น attacker เมื่อ unit ของเราย้ายเข้าไป contest battlefield ที่คู่แข่งควบคุมอยู่ และเราเป็น defender เมื่อ unit ของคู่แข่งเข้ามา contest battlefield ที่เราควบคุมอยู่ การย้าย unit ของเราเข้า battlefield ว่างไม่ถือว่าเราเป็น attacker ทันที"
            },
            {
                "category": "Rules & Scoring",
                "question": "สามารถ score ในเทิร์นของคู่แข่งได้ไหม?",
                "answer": "ได้ ถ้าเอฟเฟกต์หรือสถานการณ์ทำให้เราควบคุมและ conquer battlefield ได้ในเทิร์นคู่แข่ง เราก็สามารถ score ในเทิร์นนั้นได้ตามปกติ เช่นการใช้การ์ดที่ย้าย unit เข้าไปพลิกผล battlefield ระหว่างเทิร์นคู่แข่ง"
            },
            {
                "category": "Rules & Scoring",
                "question": "แต้มสุดท้ายของเกมได้จากการ conquer ยังไง?",
                "answer": "ถ้าจะชนะด้วยแต้มสุดท้ายจากการ conquer battlefield ต้อง score battlefield อื่น ๆ ที่เกี่ยวข้องในเทิร์นนั้นมาก่อนแล้ว หากยังไม่ครบ เงื่อนไขแต้มสุดท้ายจาก conquer จะไม่ให้แต้มทันที และจะเปลี่ยนเป็นจั่วการ์ดแทนตามกฎแต้มสุดท้าย"
            },
            {
                "category": "Rules & Resources",
                "question": "Rune นับเป็น card สำหรับเอฟเฟกต์อย่าง Karma หรือไม่?",
                "answer": "ไม่นับ สำหรับข้อความกฎที่อ้างถึง card โดยทั่วไปหมายถึง Main Deck card ดังนั้นการ recycle rune จะไม่ถือว่าเป็นการ recycle card และจะไม่ trigger เอฟเฟกต์ที่สนใจ Main Deck card"
            },
            {
                "category": "Keywords & Abilities",
                "question": "Hidden เล่นได้กี่แบบ?",
                "answer": "การ์ดที่มี Hidden เล่นได้สองแบบ: เล่นจากมือแบบปกติโดยจ่าย cost เต็มตามชนิดและ timing ของการ์ด หรือ hide ไว้ที่ battlefield ที่เราควบคุมโดย recycle rune 1 ใบ แล้วค่อยเล่นจาก facedown ในเทิร์นถัดไปแบบ Reaction โดยไม่ต้องจ่าย cost"
            },
            {
                "category": "Keywords & Abilities",
                "question": "ถ้าเล่นการ์ด Hidden จาก facedown เป้าหมายเลือกได้จากที่ไหน?",
                "answer": "เมื่อเล่นการ์ดจาก Hidden การเลือกเป้าหมายหรือสิ่งที่การ์ดจะกระทบต้องจำกัดอยู่ที่ battlefield ที่การ์ดนั้นถูก hide ไว้ เช่น spell ที่ฆ่า unit จะเลือกได้เฉพาะ unit ใน battlefield นั้น ไม่ใช่สนามอื่น"
            },
            {
                "category": "Keywords & Abilities",
                "question": "ถ้าเราเสียการควบคุม battlefield ที่ซ่อนการ์ด Hidden ไว้ การ์ดนั้นจะเป็นอย่างไร?",
                "answer": "การ์ด Hidden ที่ซ่อนอยู่ใน battlefield นั้นจะถูกส่งไป trash เมื่อเราเสียการควบคุม battlefield นั้น จึงต้องระวังการ hide การ์ดในพื้นที่ที่อาจโดนยึดกลับง่าย"
            },
            {
                "category": "Rules & Triggers",
                "question": "ข้อความแบบ 'Do this:' หรือ reflexive trigger ทำงานยังไง?",
                "answer": "ข้อความลักษณะนี้มักสร้าง trigger ชุดใหม่หลังเอฟเฟกต์ก่อนหน้าสำเร็จ ตัวอย่างคือ spell ที่ resolve ก่อน แล้วค่อยสร้าง trigger ให้เลือก unit และ resolve แยกกันภายหลัง จึงไม่ได้เลือกทุกอย่างตั้งแต่ตอนร่าย spell เสมอไป"
            },
            {
                "category": "Rules & Tokens",
                "question": "Token ที่ไม่มี cost ถือว่ามี cost เท่าไหร่สำหรับการ์ดที่ตรวจ cost?",
                "answer": "สำหรับเอฟเฟกต์ที่ต้องดู cost ของ token ให้ถือว่า token มี cost เป็น 0 เพราะ token ไม่ได้ขาดข้อมูลแบบ NULL เพียงแต่ไม่มี cost ที่ต้องจ่ายจริง ทำให้การ์ดที่ฆ่าหรือเลือกตาม cost ต่ำสามารถกระทบ token ได้"
            },
            {
                "category": "Rules & Tokens",
                "question": "ถ้า token ถูก recycle จะไปที่ไหน?",
                "answer": "Token จะใช้ปลายทาง recycle ตามชนิดของมัน เช่น token ที่เป็น unit หรือ gear จะ recycle ไปยัง Main Deck ตามหลักเดียวกับการ์ดชนิดนั้น แม้ตัว token จะไม่ใช่ Main Deck card จริง ๆ ก็ตาม"
            },
            {
                "category": "Rules & Combat",
                "question": "ถ้าชนะ combat โดยคู่แข่งไม่เหลือ unit แม้ยังไม่ได้ตีจริง ถือว่าชนะ combat ไหม?",
                "answer": "ถือว่าชนะ combat ได้ ถ้าเป็น combat showdown และหลังขั้นตอนที่เกี่ยวข้องเหลือ unit ของเราเพียงฝ่ายเดียว ไม่จำเป็นว่าต้องมี combat damage เกิดขึ้นจริง หาก spell หรือ ability เอา unit ฝั่งตรงข้ามออกไปหมดก่อน ก็ยังนับว่าฝ่ายเราชนะ combat"
            },
            {
                "category": "Rules & Targeting",
                "question": "อะไรถือว่าเป็น target?",
                "answer": "โดยสรุป สิ่งนั้นมักเป็น target ถ้าเป็นวัตถุหรือผู้เล่นที่ทุกคนเห็นได้ใน public zone, ผู้เล่นคนเดียวเป็นคนเลือก และไม่ใช่สิ่งที่ถูกพูดถึงแค่ใน cost, trigger condition, restriction, replacement effect หรือคำสั่งที่ทุกคนต้องทำพร้อมกัน"
            },
            {
                "category": "Rules & Targeting",
                "question": "การ์ดอย่าง Cull the Weak ที่ให้ผู้เล่นแต่ละคนฆ่า unit ของตัวเอง target ไหม?",
                "answer": "ไม่ถือว่า target เพราะแต่ละผู้เล่นเป็นคนเลือก unit ของตัวเองตามคำสั่งร่วมกัน ไม่ใช่ผู้เล่นคนเดียวเลือกวัตถุสาธารณะเพื่อให้ spell หรือ ability กระทบโดยตรง"
            },
            {
                "category": "Rules & Multiplayer",
                "question": "ใน 2v2 คำว่า friendly unit หมายถึงอะไร?",
                "answer": "Friendly unit หมายถึง unit ของเราและ unit ของเพื่อนร่วมทีม ดังนั้นเอฟเฟกต์ที่อ้างถึง friendly unit สามารถเกี่ยวข้องกับ unit ของ ally ได้ด้วย แต่คำว่า your units โดยทั่วไปยังหมายถึง unit ที่เราควบคุมเอง ไม่ได้แชร์เป็นของทีมทั้งหมด"
            }
        ]
    };

    let searchTerm = $state("");
    let selectedCategory = $state("All");
    let categories = $derived(["All", ...new Set(qaData.qa_list.map((item) => item.category))]);
    let filteredQA = $derived(qaData.qa_list.filter((item: QAItem) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !query ||
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query);
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    }));

    function resetFilters() {
        searchTerm = "";
        selectedCategory = "All";
    }
</script>

<div class="rt-page-shell font-sans text-slate-100">
    <div class="mesh-gradient"></div>
    <div class="rt-container py-4 sm:py-8">
        <div class="mb-8 flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3">
                <a
                    href="/"
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/25 sm:w-auto sm:px-4"
                    aria-label="Back to gallery"
                >
                    <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    <span class="hidden text-xs font-black uppercase tracking-widest sm:ml-2 sm:block">Back</span>
                </a>

                <a href="/" class="min-w-0 shrink-0 text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl">
                    Rift<span class="text-cyan-400">Thai</span>
                </a>
            </div>
            <SiteMenu active="qa" />
        </div>

        <div class="mx-auto mb-10 max-w-5xl space-y-4 text-center">
            <p class="rt-kicker">Rules Q&A</p>
            <h1 class="rt-heading text-3xl sm:text-5xl">{qaData.game_title}</h1>
            <p class="rt-copy mx-auto max-w-2xl text-sm">{qaData.data_type}</p>
            
            <div class="relative max-w-lg mx-auto mt-8">
                <input 
                    type="text" 
                    placeholder="ค้นหาคำถามหรือคำตอบ..." 
                    bind:value={searchTerm}
                    class="w-full rounded-lg border border-white/10 bg-slate-950/70 p-4 text-white transition-all placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/10"
                />
            </div>

            <div class="rt-panel mx-auto mt-4 max-w-3xl rounded-xl p-2">
                <div class="flex flex-col gap-2 sm:hidden">
                    <select
                        bind:value={selectedCategory}
                        class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white focus:border-cyan-300 focus:outline-none"
                    >
                        {#each categories as category}
                            <option value={category}>{category === "All" ? "All Categories" : category}</option>
                        {/each}
                    </select>

                    {#if searchTerm || selectedCategory !== "All"}
                        <button
                            type="button"
                            class="rounded-lg border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 transition active:bg-slate-800"
                            onclick={resetFilters}
                        >
                            Reset
                        </button>
                    {/if}
                </div>

                <div class="hidden flex-wrap items-center justify-center gap-2 sm:flex">
                    {#each categories as category}
                        <button
                            type="button"
                            class="rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition {selectedCategory === category ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/10 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-cyan-300'}"
                            onclick={() => (selectedCategory = category)}
                        >
                            {category === "All" ? "All" : category}
                        </button>
                    {/each}

                    {#if searchTerm || selectedCategory !== "All"}
                        <button
                            type="button"
                            class="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:text-white"
                            onclick={resetFilters}
                        >
                            Reset
                        </button>
                    {/if}
                </div>
            </div>

            <div class="text-xs font-black uppercase tracking-widest text-slate-600">
                {filteredQA.length} / {qaData.qa_list.length} Questions
            </div>

            <RuleDisclaimer compact class="mx-auto max-w-3xl text-left" />
        </div>

        <div class="mx-auto max-w-5xl space-y-4">
            {#each filteredQA as item}
                <div class="rt-panel rounded-xl p-5 transition-all hover:border-cyan-300/25 sm:p-6">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="rounded-lg border border-white/10 bg-slate-950 px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest text-cyan-300">
                            {item.category}
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-3">{item.question}</h3>
                    <p class="rounded-lg border border-white/10 bg-slate-950/60 p-4 font-medium leading-relaxed text-slate-300">
                        {item.answer}
                    </p>
                    {#if item.source}
                        <a
                            class="mt-3 inline-flex text-xs font-black uppercase tracking-widest text-cyan-300 transition hover:text-cyan-100"
                            href={item.source}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Official Source
                        </a>
                    {/if}
                </div>
            {:else}
                <div class="text-center py-20 text-slate-600">ไม่พบคำถามที่ค้นหา</div>
            {/each}
        </div>
    </div>
</div>
