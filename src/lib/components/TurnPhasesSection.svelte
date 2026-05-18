<script lang="ts">
    const phases = [
        {
            id: 1,
            name: 'AWAKEN PHASE',
            nameTh: 'เฟสเตรียมพร้อม',
            details: [
                'ถอดสถานะ <b>มึนงง (Stun)</b> ออกจากยูนิตของเราทั้งหมด',
                'เปลี่ยนการ์ดยูนิต และ รูน ทั้งหมดที่อยู่ในสภาพ <b>เหนื่อย (Exhausted)</b> กลับมาเป็น <b>พร้อม (Ready)</b>'
            ]
        },
        {
            id: 2,
            name: 'START OF TURN PHASE',
            nameTh: 'เฟสเริ่มเทิร์น',
            details: [
                'ตรวจสอบการ์ดเพื่อเก็บแต้ม <b>"Hold"</b> (สะสมแต้มต่อเทิร์น)',
                'ความสามารถประเภท <b>"At the start of your turn..."</b> ทำงาน'
            ]
        },
        {
            id: 3,
            name: 'ACTION PHASE',
            nameTh: 'เฟสหลัก (ทำแอ็คชัน)',
            description: 'ผู้เล่นสามารถเลือกทำสิ่งเหล่านี้ "กี่ครั้งก็ได้" และ "สลับลำดับกันได้" ตราบเท่าที่มีทรัพยากรเพียงพอ:',
            actions: [
                { label: 'Play a Card', desc: 'จ่าย Energy + รูน เพื่อลงยูนิตหรือร่ายเวทมนตร์' },
                { label: 'Set Hidden', desc: 'จ่าย 1 Power Rune เพื่อวางการ์ดคว่ำหน้า (ซ่อน)' },
                { label: 'Use Ability', desc: 'สั่ง Exhaust ยูนิตเพื่อใช้ความสามารถติดตัว' },
                { label: 'Move Unit', desc: 'สั่ง Exhaust ยูนิตเพื่อเคลื่อนที่ไปเลนอื่น' },
                { label: 'Initiate Showdown', desc: 'ประกาศเปิดศึกลานประจัญหน้า (Showdown)' }
            ],
            reactionWindow: 'ทุกครั้งที่มีการกระทำเกิดขึ้น ฝ่ายตรงข้ามสามารถเล่นการ์ด [Reaction] สวนกลับได้ (Chain Stack)'
        },
        {
            id: 4,
            name: 'END OF TURN PHASE',
            nameTh: 'เฟสจบเทิร์น',
            details: [
                'ผลลัพธ์ที่มีระยะเวลา <b>"this turn"</b> จะหมดผลลง',
                '<b>Global Heal:</b> ล้างความเสียหายออกจากยูนิตทุกตัวบนกระดานจนพลังชีวิตเต็ม',
                'ประกาศส่งเทิร์นให้ผู้เล่นฝั่งตรงข้าม'
            ]
        }
    ];

    const combatSteps = [
        { step: 1, title: 'Pre-Combat Spell Window', desc: 'ทั้งสองฝ่ายร่ายการ์ด Reaction/Action เพื่อบัฟหรือขัดจังหวะ' },
        { step: 2, title: 'Assign Damage', desc: 'คำนวณ Might และหักล้างพลังชีวิตยูนิต' },
        { step: 3, title: 'Cleanup & Deathknell', desc: 'ยูนิตที่ตายถูกส่งลงสุสาน และสกิล [Deathknell] ทำงาน' },
        { step: 4, title: 'Contested Check', desc: 'ตรวจสอบการยึดพื้นที่ (Conquer) หากสำเร็จได้ +1 แต้ม' },
        { step: 5, title: 'Global Heal', desc: 'ยูนิตที่รอดชีวิตทั้งหมดจะได้รับการฟื้นฟูพลังชีวิตจนเต็ม' }
    ];

    const chainSteps = [
        { step: 1, title: 'Open the Chain', desc: 'ผู้เล่นประกาศร่ายเวทมนตร์หรือใช้สกิล และวางเป็นลำดับที่ 1' },
        { step: 2, title: 'Reaction Window', desc: 'คู่ต่อสู้สามารถร่าย [Reaction] สวนได้ และเราก็สามารถร่ายสวนกลับไปได้อีก (ลำดับ 2, 3, 4...)' },
        { step: 3, title: 'Resolve the Chain', desc: 'เมื่อไม่มีใครร่ายต่อ ระบบจะเริ่มทำงานจาก "หลังสุดมาหน้าสุด" (3 -> 2 -> 1)' }
    ];
</script>

<div class="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Intro -->
    <div class="text-center max-w-2xl mx-auto space-y-4">
        <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">ลำดับการเล่น</h2>
        <p class="text-slate-500 text-sm sm:text-base font-medium">ทำความเข้าใจขั้นตอนต่างๆ ใน 1 เทิร์นของเกม Riftbound เพื่อวางแผนกลยุทธ์ให้แม่นยำ</p>
    </div>

    <!-- Timeline -->
    <div class="relative space-y-12 max-w-4xl mx-auto">
        <!-- Vertical Line -->
        <div class="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-800 hidden sm:block"></div>

        {#each phases as phase}
            <div class="relative sm:pl-20">
                <!-- Step Number Circle -->
                <div class="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-sky-500 z-10 hidden sm:flex">
                    {phase.id}
                </div>

                <div class="bg-slate-900/40 rounded-3xl p-6 sm:p-8 border border-slate-800 transition-all hover:border-sky-500/20">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <span class="text-sky-500 font-black text-xs tracking-widest uppercase">Phase {phase.id}</span>
                        <h3 class="text-xl sm:text-2xl font-black text-white">{phase.name} <span class="text-slate-500 font-medium ml-2 text-lg sm:text-xl">({phase.nameTh})</span></h3>
                    </div>

                    {#if phase.details}
                        <ul class="space-y-4">
                            {#each phase.details as detail}
                                <li class="flex items-start gap-4 text-slate-300 text-sm sm:text-lg leading-relaxed">
                                    <div class="mt-2.5 w-2 h-2 rounded-full bg-sky-500 shrink-0 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                                    <span>{@html detail}</span>
                                </li>
                            {/each}
                        </ul>
                    {/if}

                    {#if phase.id === 3}
                        <div class="mt-8 space-y-6">
                            <p class="text-slate-400 text-sm sm:text-base italic bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">{phase.description}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {#each phase.actions as action}
                                    <div class="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 hover:border-sky-500/20 transition-all">
                                        <div class="text-sky-400 font-black text-xs uppercase mb-1 tracking-wider">{action.label}</div>
                                        <div class="text-slate-300 text-xs sm:text-sm">{action.desc}</div>
                                    </div>
                                {/each}
                            </div>
                            <div class="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-4">
                                <span class="text-xl">⚠️</span>
                                <div class="space-y-1">
                                    <div class="text-amber-500 font-black text-xs uppercase tracking-widest">Reaction Window</div>
                                    <p class="text-amber-200/70 text-sm leading-relaxed">{phase.reactionWindow}</p>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Special Combat Timeline Connection -->
                    {#if phase.id === 3}
                        <div class="mt-10 pt-10 border-t border-slate-800">
                            <div class="bg-slate-950/80 rounded-3xl p-6 sm:p-8 border border-slate-800/50">
                                <div class="flex items-center gap-4 mb-8">
                                    <div class="px-4 py-1.5 bg-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/10">Combat Timeline</div>
                                    <h4 class="text-white text-lg font-black">ขั้นตอนการประจันหน้า (Showdown)</h4>
                                </div>
                                
                                <div class="grid gap-6">
                                    {#each combatSteps as step}
                                        <div class="flex gap-5 group">
                                            <div class="shrink-0 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-slate-500 group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                                                {step.step}
                                            </div>
                                            <div>
                                                <div class="text-slate-200 font-bold group-hover:text-white transition-colors">{step.title}</div>
                                                <div class="text-slate-500 text-sm mt-1">{step.desc}</div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <!-- Chain Timeline Section -->
    <div class="max-w-4xl mx-auto pt-8">
        <div class="bg-slate-900/40 rounded-[2.5rem] p-8 sm:p-12 border border-slate-800">
            <div class="flex flex-col items-center text-center space-y-4 mb-12">
                <div class="px-5 py-2 bg-amber-500/20 text-amber-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-amber-500/10">Chain Timeline</div>
                <h4 class="text-white text-2xl sm:text-3xl font-black">ขั้นตอนการทำงานของห่วงโซ่ (Chain Stack)</h4>
                <p class="text-slate-500 text-sm max-w-xl">เมื่อมีการร่ายการ์ดหรือใช้ความสามารถสวนกัน ระบบจะใช้ระบบห่วงโซ่เพื่อตัดสินลำดับการทำงาน</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <!-- Horizontal connector for desktop -->
                <div class="absolute top-4 left-0 right-0 h-0.5 bg-slate-800 hidden md:block z-0"></div>
                
                {#each chainSteps as step}
                    <div class="relative z-10 flex flex-col items-center text-center group">
                        <div class="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-sm font-black text-amber-500 mb-6 ring-8 ring-slate-950 group-hover:border-amber-500/50 transition-all">
                            {step.step}
                        </div>
                        <div class="text-slate-100 font-bold mb-3 group-hover:text-amber-400 transition-colors">{step.title}</div>
                        <div class="text-slate-500 text-sm leading-relaxed">{step.desc}</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    @keyframes in {
        from { opacity: 0; transform: translateY(1rem); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-in {
        animation: in 0.7s ease-out fill-mode-both;
    }
</style>
