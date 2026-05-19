<script lang="ts">
    const phases = [
        {
            id: 1,
            name: 'AWAKEN PHASE',
            nameTh: 'เฟสเตรียมพร้อม',
            color: 'text-sky-500',
            bg: 'bg-sky-500',
            border: 'border-sky-500/20',
            hoverBorder: 'hover:border-sky-500/50',
            details: [
                'ถอดสถานะ <b>มึนงง (Stun)</b>',
                'เปลี่ยนการ์ดที่ <b>เหนื่อย (Exhausted)</b> ทั้งหมด (Units, Runes, Champions, Gear) กลับมาเป็น <b>พร้อม (Ready)</b>'
            ]
        },
        {
            id: 2,
            name: 'BEGINNING PHASE',
            nameTh: 'เฟสเริ่มต้น',
            color: 'text-indigo-500',
            bg: 'bg-indigo-500',
            border: 'border-indigo-500/20',
            hoverBorder: 'hover:border-indigo-500/50',
            details: [
                'ตรวจสอบแต้ม <b>Hold</b>: ได้รับ 1 แต้มต่อ 1 Battlefield ที่เราคุมได้',
                'ความสามารถ <b>"At the start of your turn..."</b> ทั้งหมดทำงาน'
            ]
        },
        {
            id: 3,
            name: 'CHANNEL PHASE',
            nameTh: 'เฟสรูน',
            color: 'text-amber-500',
            bg: 'bg-amber-500',
            border: 'border-amber-500/20',
            hoverBorder: 'hover:border-amber-500/50',
            details: [
                'นำ <b>รูน 2 ใบ</b> จาก Rune Deck เข้าสู่สนาม (ในสภาพหงายหน้า)',
                '<i>พิเศษ:</i> หากคุณเป็นผู้เล่นคนที่สองในเทิร์นแรก ให้ Channel รูนเพิ่มเป็น 3 ใบ'
            ]
        },
        {
            id: 4,
            name: 'DRAW PHASE',
            nameTh: 'เฟสจั่วการ์ด',
            color: 'text-violet-500',
            bg: 'bg-violet-500',
            border: 'border-violet-500/20',
            hoverBorder: 'hover:border-violet-500/50',
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
            border: 'border-emerald-500',
            hoverBorder: 'hover:border-emerald-500',
            description: 'ผู้เล่นสามารถเลือกทำสิ่งเหล่านี้ "กี่ครั้งก็ได้" และ "สลับลำดับกันได้" ตราบเท่าที่มีทรัพยากรเพียงพอ:',
            actions: [
                { label: 'Play Card', desc: 'จ่าย Energy + รูน ลงยูนิต/ร่ายเวท' },
                { label: 'Set Hidden', desc: 'จ่าย 1 Power Rune วางการ์ดคว่ำหน้า' },
                { label: 'Use Ability', desc: 'สั่ง Exhaust ยูนิตเพื่อใช้ความสามารถ' },
                { label: 'Move Unit', desc: 'สั่ง Exhaust ยูนิตเพื่อเดินหน้าในเลน' }
            ]
        },
        {
            id: 6,
            name: 'END OF TURN',
            nameTh: 'เฟสจบเทิร์น',
            color: 'text-rose-500',
            bg: 'bg-rose-500',
            border: 'border-rose-500/20',
            hoverBorder: 'hover:border-rose-500/50',
            details: [
                'ผลลัพธ์ <b>"this turn"</b> ทั้งหมดหมดผลลง',
                '<b>Global Heal:</b> ฟื้นฟูพลังชีวิตยูนิตทุกตัวบนกระดานจนเต็ม',
                'ประกาศส่งเทิร์นให้ผู้เล่นฝั่งตรงข้าม'
            ]
        }
    ];

    const combatSteps = [
        { title: 'Pre-Combat Window', desc: 'ร่าย Reaction/Action สวนกันรอบสุดท้าย' },
        { title: 'Assign Damage', desc: 'คำนวณ Might และหักล้างพลังชีวิตยูนิต' },
        { title: 'Cleanup & Deathknell', desc: 'ยูนิตตายลงสุสาน และสกิล [Deathknell] ทำงาน' },
        { title: 'Contested Check', desc: 'เช็คการยึดพื้นที่ (+1 แต้ม) หรือเริ่มศึกรอบใหม่หากมีตัวใหม่ปรากฏ' }
    ];
</script>

<div class="space-y-12 py-8 animate-in fade-in duration-1000">
    <!-- Header -->
    <div class="text-center space-y-4">
        <h2 class="text-4xl font-black text-white tracking-tight italic">GAMEPLAY FLOW</h2>
        <p class="text-slate-500 font-medium">ลำดับขั้นตอนการเล่น Riftbound อย่างเป็นทางการ</p>
    </div>

    <!-- Flowchart Container -->
    <div class="max-w-5xl mx-auto px-4">
        <div class="flex flex-col items-center space-y-8">
            
            <!-- Phases 1-4 (Fast Flow) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {#each phases.slice(0, 4) as phase}
                    <div class="bg-slate-900 border {phase.border} rounded-2xl p-5 {phase.hoverBorder} transition-all group">
                        <div class="{phase.color} font-black text-[10px] tracking-widest mb-1">PHASE {phase.id}</div>
                        <h3 class="text-sm font-black text-white mb-3">{phase.name}</h3>
                        <ul class="space-y-2">
                            {#each phase.details as detail}
                                <li class="flex items-start gap-2 text-slate-400 text-[11px] leading-tight">
                                    <div class="mt-1.5 w-1 h-1 rounded-full {phase.bg} shrink-0"></div>
                                    <span>{@html detail}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </div>


            <!-- Arrow Down -->
            <div class="flex flex-col items-center -my-4 z-10">
                <div class="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-emerald-500"></div>
                <div class="text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m7 13 5 5 5-5"/><path d="M12 6v12"/></svg>
                </div>
            </div>

            <!-- Phase 5: Action HUB -->
            <div class="w-full max-w-4xl relative">
                <div class="absolute -inset-4 border-2 border-emerald-500/10 border-dashed rounded-[3rem] -z-0"></div>
                
                <div class="bg-slate-900 border-2 border-emerald-500 rounded-[2.5rem] p-8 relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <div class="flex flex-col md:flex-row gap-8">
                        <!-- Main HUB Info -->
                        <div class="md:w-1/2 space-y-4">
                            <div class="text-emerald-500 font-black text-xs tracking-widest">PHASE 5</div>
                            <h3 class="text-3xl font-black text-white">{phases[4].name}</h3>
                            <p class="text-slate-400 text-sm italic">{phases[4].description}</p>
                            
                            <div class="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                                <span class="text-amber-500">⚠️</span>
                                <div class="text-[11px] leading-relaxed text-amber-200/70">
                                    <b>REACTION WINDOW:</b> คู่แข่งสามารถประกาศร่าย [Reaction] เพื่อขัดจังหวะได้ทุกครั้งที่คุณทำแอ็กชัน
                                </div>
                            </div>
                        </div>

                        <!-- Actions Grid -->
                        <div class="md:w-1/2 grid grid-cols-2 gap-3">
                            {#each phases[4].actions as action}
                                <div class="bg-slate-950 border border-emerald-500/20 p-4 rounded-2xl hover:border-emerald-500/50 transition-colors group/item">
                                    <div class="text-emerald-400 font-black text-[10px] uppercase mb-1">{action.label}</div>
                                    <div class="text-slate-400 text-[10px] leading-tight">{action.desc}</div>
                                </div>
                            {/each}
                            
                            <!-- Showdown Trigger -->
                            <div class="col-span-2 bg-red-500/10 border-2 border-red-500/20 p-4 rounded-2xl flex items-center justify-between group/sd cursor-pointer hover:border-red-500/50 transition-all">
                                <div>
                                    <div class="text-red-500 font-black text-xs uppercase">Initiate Showdown</div>
                                    <div class="text-red-200/50 text-[10px]">ประกาศเปิดศึกตัดสินพื้นที่ในเลน</div>
                                </div>
                                <div class="text-red-500 animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Combat Steps (Sub-Flow) -->
                    <div class="mt-8 pt-8 border-t border-slate-800">
                        <div class="text-center mb-6">
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Combat Timeline</span>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {#each combatSteps as step, i}
                                <div class="relative flex flex-col items-center text-center">
                                    <div class="w-8 h-8 rounded-full bg-slate-950 border border-red-500/30 flex items-center justify-center text-[10px] font-black text-red-500 mb-2">
                                        {i + 1}
                                    </div>
                                    <div class="text-slate-200 text-[10px] font-bold">{step.title}</div>
                                    <div class="text-slate-500 text-[9px] px-2">{step.desc}</div>
                                    
                                    {#if i < 3}
                                        <div class="absolute top-4 -right-2 text-slate-800 hidden md:block">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                        <div class="mt-6 text-center">
                            <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[9px] text-slate-500 font-bold italic">
                                <span>Global Heal (Step 5) เกิดขึ้นหลังจบทุกลานประจัญหน้า</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Arrow Down -->
            <div class="flex flex-col items-center -my-4 z-10">
                <div class="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-rose-500"></div>
                <div class="text-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m7 13 5 5 5-5"/><path d="M12 6v12"/></svg>
                </div>
            </div>

            <!-- Phase 6: End -->
            <div class="w-full max-w-sm group">
                <div class="bg-slate-900 border-2 border-rose-500/20 rounded-3xl p-6 relative overflow-hidden transition-all hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                    <div class="text-rose-500 font-black text-xs tracking-widest mb-1">PHASE 6</div>
                    <h3 class="text-xl font-black text-white mb-4">{phases[5].name}</h3>
                    <ul class="space-y-2">
                        {#each phases[5].details as detail}
                            <li class="flex items-start gap-2 text-slate-400 text-sm">
                                <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                                <span>{@html detail}</span>
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>

            <!-- Loop Back Arrow -->
            <div class="pt-8 flex flex-col items-center opacity-30">
                <div class="text-slate-500 mb-2 font-black text-[10px] uppercase tracking-widest">Next Player's Turn</div>
                <div class="w-32 h-16 border-2 border-slate-800 border-t-0 rounded-b-[2rem] relative">
                    <div class="absolute -right-1.5 -top-2 text-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m7 11 5-5 5 5"/></svg>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- Chain Stack Section -->
    <div class="max-w-4xl mx-auto pt-16">
        <div class="bg-slate-900/40 rounded-[3rem] p-10 border border-slate-800">
            <div class="flex flex-col items-center text-center space-y-4 mb-12">
                <div class="px-4 py-1.5 bg-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Advanced Rule</div>
                <h4 class="text-white text-2xl font-black">CHAIN STACK (ห่วงโซ่)</h4>
                <p class="text-slate-500 text-xs max-w-md">เมื่อมีการร่ายเวทหรือใช้สกิลสวนกัน ระบบจะทำงานจาก <b>"หลังสุดย้อนกลับมาหน้าสุด"</b> (LIFO)</p>
            </div>
            
            <div class="flex flex-col md:flex-row items-center justify-center gap-6 relative">
                <!-- Connector Line -->
                <div class="absolute h-0.5 bg-slate-800 left-20 right-20 top-6 hidden md:block -z-10"></div>

                <div class="flex flex-col items-center gap-3 group">
                    <div class="w-12 h-12 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-amber-500 font-black group-hover:border-amber-500/50 transition-all">1</div>
                    <div class="text-white text-[10px] font-bold">Open the Chain</div>
                    <div class="text-slate-500 text-[9px] max-w-[100px] text-center">ผู้เล่นประกาศร่ายการ์ดใบแรก</div>
                </div>

                <div class="text-slate-800 hidden md:block">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </div>

                <div class="flex flex-col items-center gap-3 group">
                    <div class="w-12 h-12 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-amber-500 font-black group-hover:border-amber-500/50 transition-all">2</div>
                    <div class="text-white text-[10px] font-bold">Reaction Window</div>
                    <div class="text-slate-500 text-[9px] max-w-[100px] text-center">คู่แข่งร่าย [Reaction] สวนกลับได้เรื่อยๆ</div>
                </div>

                <div class="text-slate-800 hidden md:block">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </div>

                <div class="flex flex-col items-center gap-3 group">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500 border-2 border-amber-400 flex items-center justify-center text-slate-950 font-black">3</div>
                    <div class="text-amber-500 text-[10px] font-bold">Resolve the Chain</div>
                    <div class="text-slate-500 text-[9px] max-w-[100px] text-center">เริ่มทำงานจาก "ใบสุดท้าย" ย้อนกลับมา</div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    @keyframes in {
        from { opacity: 0; transform: translateY(2rem); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-in {
        animation: in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
</style>
