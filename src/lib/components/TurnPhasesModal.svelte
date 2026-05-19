<script lang="ts">
    let { isOpen, close } = $props<{ isOpen: boolean, close: () => void }>();

    const phases = [
        {
            id: 1,
            name: 'AWAKEN PHASE',
            nameTh: 'เฟสเตรียมพร้อม',
            color: 'text-sky-500',
            bg: 'bg-sky-500',
            details: [
                'ถอดสถานะ <b>มึนงง (Stun)</b>',
                'เปลี่ยนการ์ดที่ <b>เหนื่อย (Exhausted)</b> ทั้งหมดกลับมาเป็น <b>พร้อม (Ready)</b>'
            ]
        },
        {
            id: 2,
            name: 'BEGINNING PHASE',
            nameTh: 'เฟสเริ่มต้น',
            color: 'text-indigo-500',
            bg: 'bg-indigo-500',
            details: [
                'ตรวจสอบแต้ม <b>Hold</b>: 1 แต้มต่อ Battlefield ที่คุมได้',
                'ความสามารถ <b>"Start of turn"</b> ทั้งหมดทำงาน'
            ]
        },
        {
            id: 3,
            name: 'CHANNEL PHASE',
            nameTh: 'เฟสรูน',
            color: 'text-amber-500',
            bg: 'bg-amber-500',
            details: [
                'นำ <b>รูน 2 ใบ</b> จาก Rune Deck เข้าสู่สนาม (หงายหน้า)',
                'ผู้เล่นคนที่สองในเทิร์นแรก Channel รูนเพิ่มเป็น 3 ใบ'
            ]
        },
        {
            id: 4,
            name: 'DRAW PHASE',
            nameTh: 'เฟสจั่วการ์ด',
            color: 'text-violet-500',
            bg: 'bg-violet-500',
            details: [
                'จั่วการ์ด 1 ใบจาก <b>Main Deck</b> ขึ้นมือ'
            ]
        },
        {
            id: 5,
            name: 'ACTION PHASE',
            nameTh: 'เฟสหลัก (ทำแอ็คชัน)',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500',
            description: 'ทำกี่ครั้งก็ได้ สลับลำดับได้',
            actions: [
                { label: 'Play Card', desc: 'ลงยูนิต/ร่ายเวท' },
                { label: 'Set Hidden', desc: 'วางคว่ำหน้า' },
                { label: 'Use Ability', desc: 'ใช้สกิลยูนิต' },
                { label: 'Move Unit', desc: 'ย้ายเลน' }
            ]
        },
        {
            id: 6,
            name: 'END OF TURN',
            nameTh: 'เฟสจบเทิร์น',
            color: 'text-rose-500',
            bg: 'bg-rose-500',
            details: [
                'ผลลัพธ์ <b>"this turn"</b> ทั้งหมดหมดผลลง',
                '<b>Global Heal:</b> ฟื้นฟู HP เต็มทั้งสนาม',
                'ส่งเทิร์นให้คู่แข่ง'
            ]
        }
    ];

    const combatSteps = [
        { title: 'Pre-Combat', desc: 'Reaction Window' },
        { title: 'Assign Damage', desc: 'คำนวณ Might' },
        { title: 'Cleanup', desc: 'ยูนิตตาย/Deathknell' },
        { title: 'Contested Check', desc: 'เช็คการยึดพื้นที่' }
    ];
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[2000] flex items-center justify-center p-4" onclick={close}>
    <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300"></div>
    
    <div 
        class="relative bg-slate-900 w-full max-w-4xl max-h-[90dvh] rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col scale-100" 
        onclick={(e) => e.stopPropagation()}
    >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-slate-950">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m19.07 4.93-14.14 14.14"/></svg>
                </div>
                <div>
                    <h2 class="text-xl font-black text-white">Turn Flowchart</h2>
                    <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest">ลำดับขั้นตอนการเล่นอย่างละเอียด</p>
                </div>
            </div>
            <button class="w-10 h-10 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 rounded-xl flex items-center justify-center text-slate-400 transition-all" onclick={close}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto custom-scrollbar p-6 sm:p-10">
            <div class="flex flex-col items-center space-y-6">
                
                <!-- Phases 1-4 Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {#each phases.slice(0, 4) as phase}
                        <div class="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4">
                            <div class="{phase.color} font-black text-[9px] tracking-widest mb-1">PHASE {phase.id}</div>
                            <h3 class="text-sm font-black text-white mb-2">{phase.name}</h3>
                            <ul class="space-y-1">
                                {#each phase.details as detail}
                                    <li class="flex items-start gap-2 text-slate-400 text-[10px]">
                                        <div class="mt-1 w-1 h-1 rounded-full {phase.bg} shrink-0"></div>
                                        <span>{@html detail}</span>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                </div>


                <!-- Arrow -->
                <div class="text-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m7 13 5 5 5-5"/><path d="M12 6v12"/></svg>
                </div>

                <!-- Phase 5 HUB -->
                <div class="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_40px_rgba(16,185,129,0.05)]">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="md:w-1/2">
                            <div class="text-emerald-500 font-black text-[10px] tracking-widest mb-1">PHASE 5</div>
                            <h3 class="text-2xl font-black text-white mb-2">{phases[4].name}</h3>
                            <p class="text-slate-400 text-xs italic mb-4">{phases[4].description}</p>
                            <div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[10px] text-amber-200/70 leading-relaxed">
                                <b>REACTION:</b> คู่แข่งสวนกลับได้เสมอเมื่อมีการทำแอ็กชัน
                            </div>
                        </div>
                        <div class="md:w-1/2 grid grid-cols-2 gap-2">
                            {#each phases[4].actions as action}
                                <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                                    <div class="text-emerald-400 font-black text-[9px] uppercase mb-1">{action.label}</div>
                                    <div class="text-slate-400 text-[9px] leading-tight">{action.desc}</div>
                                </div>
                            {/each}
                            <div class="col-span-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-between">
                                <span class="text-red-500 font-black text-[10px] uppercase">Initiate Showdown</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Combat Steps -->
                    <div class="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {#each combatSteps as step, i}
                            <div class="text-center">
                                <div class="text-red-500 font-black text-[10px] mb-1">{i + 1}. {step.title}</div>
                                <div class="text-slate-500 text-[9px] leading-tight px-1">{step.desc}</div>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Arrow -->
                <div class="text-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m7 13 5 5 5-5"/><path d="M12 6v12"/></svg>
                </div>

                <!-- Phase 6 -->
                <div class="w-full max-w-md bg-slate-800/30 border border-rose-500/20 rounded-3xl p-6">
                    <div class="text-rose-500 font-black text-[10px] tracking-widest mb-1">PHASE 6</div>
                    <h3 class="text-lg font-black text-white mb-3">{phases[5].name}</h3>
                    <ul class="space-y-2">
                        {#each phases[5].details as detail}
                            <li class="flex items-start gap-2 text-slate-300 text-sm">
                                <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                                <span>{@html detail}</span>
                            </li>
                        {/each}
                    </ul>
                </div>

                <!-- Footer -->
                <div class="pt-4 text-center">
                    <p class="text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">Official Game Flow • RiftThai</p>
                </div>
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
