<script lang="ts">
    interface QAItem { category: string; question: string; answer: string; }
    
    const qaData: {
        game_title: string;
        data_type: string;
        qa_list: QAItem[];
    } = {
        "game_title": "Riftbound TCG",
        "data_type": "Rules and Mechanics QA",
        "qa_list": [
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
        ]
    };

    let searchTerm = $state("");
    let filteredQA = $derived(qaData.qa_list.filter((item: QAItem) => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ));
</script>

<div class="min-h-dvh bg-slate-950 text-slate-100 font-sans p-4 sm:p-8">
    <div class="max-w-4xl mx-auto">
        <a href="/" class="inline-block text-sky-500 hover:text-sky-400 font-bold mb-8 transition-colors">← กลับหน้าหลัก</a>
        
        <div class="mb-12 text-center space-y-4">
            <h1 class="text-3xl sm:text-4xl font-black text-white">{qaData.game_title}</h1>
            <p class="text-slate-500 font-medium">{qaData.data_type}</p>
            
            <div class="relative max-w-lg mx-auto mt-8">
                <input 
                    type="text" 
                    placeholder="ค้นหาคำถามหรือคำตอบ..." 
                    bind:value={searchTerm}
                    class="w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl focus:outline-none focus:border-sky-500 transition-all"
                />
            </div>
        </div>

        <div class="space-y-6">
            {#each filteredQA as item}
                <div class="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-[0.6rem] font-black uppercase tracking-widest bg-slate-950 text-sky-500 px-3 py-1 rounded-lg border border-slate-800">
                            {item.category}
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-3">{item.question}</h3>
                    <p class="text-slate-300 leading-relaxed font-medium bg-slate-950 p-4 rounded-xl border border-slate-900/50">
                        {item.answer}
                    </p>
                </div>
            {:else}
                <div class="text-center py-20 text-slate-600">ไม่พบคำถามที่ค้นหา</div>
            {/each}
        </div>
    </div>
</div>
