<script lang="ts">
    let { isOpen, close } = $props<{ isOpen: boolean, close: () => void }>();

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

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[2000] flex items-center justify-center p-4" onclick={close}>
    <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300"></div>
    
    <div 
        class="relative bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col scale-100" 
        onclick={(e) => e.stopPropagation()}
    >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div class="flex items-center gap-4">
                <div>
                    <h2 class="text-xl sm:text-2xl font-black text-white">ลำดับการเล่น (Turn Phases)</h2>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Riftbound Game Rules</p>
                </div>
            </div>
            <button class="w-10 h-10 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 rounded-xl flex items-center justify-center text-slate-400 transition-all" onclick={close}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-12">
            
            <!-- Timeline -->
            <div class="relative space-y-12">
                <!-- Vertical Line -->
                <div class="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-800 hidden sm:block"></div>

                {#each phases as phase}
                    <div class="relative sm:pl-20">
                        <!-- Step Number Circle -->
                        <div class="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-sky-500 z-10 hidden sm:flex">
                            {phase.id}
                        </div>

                        <div class="bg-slate-800/30 rounded-3xl p-6 border border-slate-800/50 hover:border-sky-500/30 transition-colors">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <span class="text-sky-500 font-black text-xs tracking-widest uppercase">Phase {phase.id}</span>
                                <h3 class="text-xl font-black text-white">{phase.name} <span class="text-slate-500 font-medium ml-2 text-lg">({phase.nameTh})</span></h3>
                            </div>

                            {#if phase.details}
                                <ul class="space-y-3">
                                    {#each phase.details as detail}
                                        <li class="flex items-start gap-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                                            <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></div>
                                            <span>{@html detail}</span>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}

                            {#if phase.id === 3}
                                <div class="mt-6 space-y-4">
                                    <p class="text-slate-400 text-sm italic">{phase.description}</p>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {#each phase.actions as action}
                                            <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                                <div class="text-sky-400 font-black text-xs uppercase mb-1">{action.label}</div>
                                                <div class="text-slate-300 text-xs">{action.desc}</div>
                                            </div>
                                        {/each}
                                    </div>
                                    <div class="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                                        <span class="text-amber-500">⚠️</span>
                                        <p class="text-amber-200/80 text-xs leading-relaxed"><b>REACTION WINDOW:</b> {phase.reactionWindow}</p>
                                    </div>
                                </div>
                            {/if}

                            <!-- Special Combat Timeline Connection -->
                            {#if phase.id === 3}
                                <div class="mt-8 pt-8 border-t border-slate-800">
                                    <div class="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                                        <div class="flex items-center gap-3 mb-6">
                                            <div class="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">Combat Timeline</div>
                                            <h4 class="text-white font-black">ขั้นตอนการประจันหน้า (Showdown)</h4>
                                        </div>
                                        
                                        <div class="space-y-4">
                                            {#each combatSteps as step}
                                                <div class="flex gap-4">
                                                    <div class="shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                        {step.step}
                                                    </div>
                                                    <div>
                                                        <div class="text-slate-200 text-xs font-bold">{step.title}</div>
                                                        <div class="text-slate-500 text-[10px] mt-0.5">{step.desc}</div>
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
            <div class="mt-8 pt-8 border-t border-slate-800">
                <div class="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">Chain Timeline</div>
                        <h4 class="text-white font-black">ขั้นตอนการทำงานของห่วงโซ่ (Chain Stack)</h4>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        <!-- Horizontal connector for desktop -->
                        <div class="absolute top-3 left-0 right-0 h-0.5 bg-slate-800 hidden md:block z-0"></div>
                        
                        {#each chainSteps as step}
                            <div class="relative z-10 flex flex-col items-center text-center">
                                <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-[10px] font-black text-amber-500 mb-4 ring-8 ring-slate-950">
                                    {step.step}
                                </div>
                                <div class="text-slate-200 text-xs font-bold mb-2">{step.title}</div>
                                <div class="text-slate-500 text-[10px] leading-relaxed max-w-[200px]">{step.desc}</div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Footer Note -->
            <div class="text-center pt-6">
                <p class="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">End of Turn Process • RiftThai Project</p>
            </div>
        </div>
    </div>
</div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
