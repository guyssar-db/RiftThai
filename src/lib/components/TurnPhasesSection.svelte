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
        { title: 'Contested Check', desc: 'เช็คการยึดพื้นที่หากยึดสำเร็จจะเรียกว่า Conquer และจะได้รับ +1 แต้ม หรือ เริ่มศึกรอบใหม่หากมีตัวใหม่ปรากฏ' }
    ];

    const speeds = [
        {
            name: 'Normal Speed',
            nameTh: 'ความเร็วปกติ',
            badgeColor: '#475569',
            border: 'border-slate-800/60',
            desc: 'ใช้ได้ในเทิร์นตัวเองเท่านั้น (เปิด Chain ได้อย่างเดียว)',
            sampleImage: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a7a34129e64f0296bf2da166c2b06ed156d568db-744x1039.png',
            rules: [
                'ห้ามใช้ในจังหวะ Showdown',
                'ห้ามใช้ร่ายต่อท้าย Chain อื่น'
            ]
        },
        {
            name: 'Action Speed',
            nameTh: 'ความเร็วแอ็กชัน',
            badgeColor: '#107361',
            border: 'border-slate-800/60',
            desc: 'ใช้ได้ทั้งในเทิร์นตัวเอง และในช่วง Showdown',
            sampleImage: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/81d1c47459606f7b627778cce9b5f0e44d80f7fa-744x1039.png',
            rules: [
                'ห้ามใช้ร่ายต่อท้าย Chain อื่น',
                'ต้องรอให้ Chain ว่าง (Empty) ถึงจะเริ่มใช้ได้'
            ]
        },
        {
            name: 'Reaction Speed',
            nameTh: 'ความเร็วรีแอ็กชัน',
            badgeColor: '#107361',
            border: 'border-slate-800/60',
            desc: 'ใช้ได้ทุกเวลา (เทิร์นเรา, เทิร์นคู่แข่ง, Showdown)',
            sampleImage: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4d9cc1c13b75933e509e642213f13359350cd3f9-744x1039.png',
            rules: [
                'ใช้ร่ายต่อท้าย (Chain) ได้ทุกสถานการณ์',
                'ใช้ขัดขวางหรือตอบโต้ Action/Reaction อื่นได้'
            ]
        }
    ];
</script>

<div class="space-y-24 py-12 animate-in fade-in duration-1000">
    <!-- Header -->
    <div class="text-center space-y-4">
        <h2 class="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase italic">Tactical <span class="text-emerald-500">Flow</span></h2>
        <p class="text-slate-500 font-bold tracking-[0.3em] uppercase text-xs">Standard Engagement Sequence Protocol</p>
    </div>

    <!-- Flowchart Container -->
    <div class="max-w-6xl mx-auto px-6">
        <div class="flex flex-col items-center space-y-12">
            
            <!-- Phases 1-4 (Fast Flow) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {#each phases.slice(0, 4) as phase}
                    <div class="bg-white/5 border border-white/5 rounded-[2rem] p-8 hover:bg-white/10 transition-all duration-500 group relative overflow-hidden">
                        <div class="absolute -top-12 -right-12 w-24 h-24 {phase.bg} opacity-5 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>
                        <div class="{phase.color} font-black text-xs tracking-[0.3em] mb-2 uppercase italic">Phase 0{phase.id}</div>
                        <h3 class="text-xl sm:text-2xl font-black text-white mb-6 tracking-tight uppercase">{phase.name}</h3>
                        <ul class="space-y-4">
                            {#each phase.details as detail}
                                <li class="flex items-start gap-3 text-slate-400 text-sm sm:text-base leading-relaxed italic">
                                    <div class="mt-2 w-1.5 h-1.5 rounded-full {phase.bg} shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
                                    <span>{@html detail}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </div>


            <!-- Animated Connector -->
            <div class="flex flex-col items-center -my-6 z-20">
                <div class="w-px h-12 bg-gradient-to-b from-transparent via-emerald-500 to-transparent animate-pulse"></div>
                <div class="text-emerald-500 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m7 13 5 5 5-5"/><path d="M12 6v12"/></svg>
                </div>
            </div>

            <!-- Phase 5: Action HUB -->
            <div class="w-full relative">
                <div class="absolute -inset-4 bg-emerald-500/5 rounded-[4rem] blur-3xl -z-0"></div>
                
                <div class="glass-panel border-emerald-500/20 rounded-[3rem] p-10 relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                    <div class="flex flex-col lg:flex-row gap-12">
                        <!-- Main HUB Info -->
                        <div class="lg:w-1/2 space-y-8">
                            <div>
                                <div class="text-emerald-500 font-black text-xs tracking-[0.4em] mb-2 uppercase italic">Phase 05 — Critical Engagement</div>
                                <h3 class="text-5xl font-black text-white tracking-tighter uppercase italic">{phases[4].name}</h3>
                            </div>
                            <p class="text-slate-400 text-base italic font-medium leading-relaxed max-w-md">{phases[4].description}</p>
                            
                            <div class="items-center bg-amber-500/5 border border-amber-500/10 p-6 rounded-[2rem] flex gap-4 backdrop-blur-xl">
                                <span class="text-amber-500 text-2xl font-black">!</span>
                                <div class="text-sm leading-relaxed text-amber-200/60 font-medium italic">
                                    คู่แข่งสามารถประกาศร่าย [Reaction] เพื่อขัดจังหวะได้ทุกครั้งที่คุณทำการ Action ใดๆ บนสนามรบ
                                </div>
                            </div>
                        </div>

                        <!-- Actions Grid -->
                        <div class="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {#each phases[4].actions as action}
                                <div class="bg-slate-950/50 border border-white/5 p-6 rounded-[2rem] hover:border-emerald-500/40 transition-all duration-500 group/item relative overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                                    <div class="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] mb-2">{action.label}</div>
                                    <div class="text-slate-400 text-sm leading-relaxed italic">{action.desc}</div>
                                </div>
                            {/each}
                            
                            <!-- Showdown Trigger -->
                            <div class="sm:col-span-2 bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem] flex items-center justify-between group/sd cursor-pointer hover:bg-rose-500/20 hover:border-rose-500/40 transition-all duration-500 shadow-xl shadow-rose-500/5">
                                <div class="space-y-1">
                                    <div class="text-rose-200/40 text-md font-bold uppercase tracking-tight italic">ประกาศเปิดศึกตัดสินพื้นที่ในเลนทันที</div>
                                </div>
                                <div class="text-rose-500 group-hover:scale-125 transition-transform duration-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Combat Steps (Sub-Flow) -->
                    <div class="mt-12 pt-12 border-t border-white/5">
                        <div class="text-center mb-10">
                            <span class="text-xs font-black text-slate-500 uppercase tracking-[0.4em] italic">Combat Execution Timeline</span>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {#each combatSteps as step, i}
                                <div class="relative flex flex-col items-center text-center group/step">
                                    <div class="w-12 h-12 rounded-2xl bg-slate-950 border border-rose-500/20 flex items-center justify-center text-sm font-black text-rose-500 mb-4 group-hover:scale-110 group-hover:border-rose-500/50 transition-all duration-500 shadow-2xl">
                                        {i + 1}
                                    </div>
                                    <div class="text-slate-200 text-sm font-black uppercase tracking-tight mb-1 italic">{step.title}</div>
                                    <div class="text-slate-500 text-xs px-2 leading-relaxed italic">{step.desc}</div>
                                    
                                    {#if i < 3}
                                        <div class="absolute top-6 -right-3 text-white/5 hidden md:block group-hover:text-rose-500/20 transition-colors duration-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                        <div class="mt-10 text-center">
                            <div class="inline-flex items-center gap-3 px-6 py-2 bg-slate-950/80 border border-white/5 rounded-full text-xs text-slate-500 font-bold italic tracking-wider">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Global Heal (Step 5) เกิดขึ้นหลังจากทุกการตัดสินผลการต่อสู้</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Animated Connector -->
            <div class="flex flex-col items-center -my-6 z-10">
                <div class="w-px h-12 bg-gradient-to-b from-transparent via-rose-500 to-transparent animate-pulse"></div>
                <div class="text-rose-500 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m7 13 5 5 5-5"/><path d="M12 6v12"/></svg>
                </div>
            </div>

            <!-- Phase 6: End -->
            <div class="w-full max-w-lg group">
                <div class="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden transition-all duration-700 hover:bg-white/10 hover:border-rose-500/30">
                    <div class="text-rose-500 font-black text-xs tracking-[0.4em] mb-2 uppercase italic">Phase 06 — Termination</div>
                    <h3 class="text-4xl font-black text-white mb-6 tracking-tighter uppercase italic">{phases[5].name}</h3>
                    <ul class="space-y-4">
                        {#each phases[5].details as detail}
                            <li class="flex items-start gap-4 text-slate-400 text-base italic font-medium">
                                <div class="mt-2 w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.4)]"></div>
                                <span>{@html detail}</span>
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>

            <!-- Loop Back Arrow -->
            <div class="pt-12 flex flex-col items-center opacity-10 group cursor-default">
                <div class="text-slate-400 mb-4 font-black text-xs uppercase tracking-[0.5em] group-hover:text-white transition-colors">Awaiting Next Sequence</div>
                <div class="w-48 h-20 border-2 border-slate-800 border-t-0 rounded-b-[4rem] relative group-hover:border-cyan-500 transition-colors duration-1000">
                    <div class="absolute -right-2 -top-2 text-slate-800 group-hover:text-cyan-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="m7 11 5-5 5 5"/></svg>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- Card Speeds Section -->
    <div class="max-w-6xl mx-auto px-6 pt-24 border-t border-white/5">
        <div class="text-center mb-24 space-y-2">
            <h3 class="text-4xl font-black text-white italic uppercase tracking-tighter">Engagement <span class="text-cyan-500">Velocities</span></h3>
            <p class="text-slate-500 font-bold tracking-[0.3em] uppercase text-[10px]">Neural Processing Speeds & Timing Logic</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {#each speeds as speed}
                <div class="flex flex-col gap-10 group">
                    <!-- Sample Card -->
                    <div class="relative w-full aspect-[744/1039] max-w-[280px] mx-auto perspective-1000">
                        <div class="absolute -inset-4 bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
                        <div class="w-full h-full bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-2 group-hover:border-cyan-500/30">
                            <img src={speed.sampleImage} alt={speed.name} class="w-full h-full object-cover" />
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                        </div>
                        <!-- Float Tag -->
                        <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-2 rounded-full border border-white/10 shadow-2xl z-20 whitespace-nowrap">
                            <span class="text-[10px] font-black uppercase tracking-widest text-cyan-400">Sample Card</span>
                        </div>
                    </div>

                    <!-- Info Panel -->
                    <div class="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 hover:bg-white/10 transition-all duration-700 relative overflow-hidden flex-grow">
                        <div class="absolute -bottom-12 -right-12 w-32 h-32 opacity-5 rounded-full blur-3xl group-hover:opacity-20 transition-opacity" style="background-color: {speed.badgeColor};"></div>
                        <div class="flex flex-col gap-6 mb-8">
                            <span 
                                class="kw-inline-badge shadow-none scale-125 origin-left w-fit" 
                                style="background-color: {speed.badgeColor}; border: none;"
                            >
                                <span>{speed.name}</span>
                            </span>
                        </div>
                        <p class="text-slate-400 text-xs leading-relaxed mb-8 italic font-medium">
                            {speed.desc}
                        </p>
                        <ul class="space-y-4">
                            {#each speed.rules as rule}
                                <li class="flex items-start gap-3 text-slate-500 text-[10px] italic leading-relaxed">
                                    <div class="mt-1.5 w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-500 transition-colors"></div>
                                    <span class="text-xs">{rule}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Chain Stack Section -->
    <div class="max-w-5xl mx-auto pt-24">
        <div class="glass-panel border-white/10 rounded-[4rem] p-16 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
            <div class="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-64 h-64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>

            <div class="flex flex-col items-center text-center space-y-6 mb-20 relative z-10">
                <div class="px-6 py-2 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] border border-amber-500/20">Advanced engagement Protocol</div>
                <h4 class="text-white text-5xl font-black tracking-tighter uppercase italic">Neural <span class="text-amber-500">Chain</span> Stack</h4>
                <p class="text-slate-400 text-sm max-w-md font-medium italic leading-relaxed">เมื่อมีการร่ายเวทหรือใช้สกิลสวนกัน ระบบจะประมวลผลจากจุดศูนย์กลางความขัดแย้งย้อนกลับมา <b>"หลังสุดย้อนกลับมาหน้าสุด"</b> (LIFO Logic)</p>
            </div>
            
            <div class="flex flex-col lg:flex-row items-center justify-center gap-12 relative mb-20 z-10">
                <!-- Connector Line -->
                <div class="absolute h-px bg-gradient-to-r from-transparent via-white/10 to-transparent left-20 right-20 top-8 hidden lg:block -z-10"></div>

                <div class="flex flex-col items-center gap-4 group cursor-default">
                    <div class="w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-white/10 flex items-center justify-center text-amber-500 font-black text-xl group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-700 italic">1</div>
                    <div class="space-y-1 text-center">
                        <div class="text-white text-xs font-black uppercase tracking-widest italic">Initialize</div>
                        <div class="text-slate-500 text-[9px] max-w-[120px] font-medium leading-relaxed italic">ผู้เล่นประกาศร่ายการ์ดใบแรกเปิดลำดับ</div>
                    </div>
                </div>

                <div class="text-white/5 hidden lg:block animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </div>

                <div class="flex flex-col items-center gap-4 group cursor-default">
                    <div class="w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-white/10 flex items-center justify-center text-amber-500 font-black text-xl group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-700 italic">2</div>
                    <div class="space-y-1 text-center">
                        <div class="text-white text-xs font-black uppercase tracking-widest italic">Interference</div>
                        <div class="text-slate-500 text-[9px] max-w-[120px] font-medium leading-relaxed italic">คู่แข่งร่าย [Reaction] สวนกลับได้ไม่จำกัด</div>
                    </div>
                </div>

                <div class="text-white/5 hidden lg:block animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </div>

                <div class="flex flex-col items-center gap-4 group cursor-default">
                    <div class="w-16 h-16 rounded-[1.5rem] bg-amber-500 border border-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-700 italic">3</div>
                    <div class="space-y-1 text-center">
                        <div class="text-amber-500 text-xs font-black uppercase tracking-widest italic">Resolution</div>
                        <div class="text-slate-500 text-[9px] max-w-[120px] font-medium leading-relaxed italic">ประมวลผลจากใบสุดท้ายย้อนกลับมา</div>
                    </div>
                </div>
            </div>

            <!-- Additional Rules Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div class="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500">
                    <div class="text-white font-black text-sm mb-4 flex items-center gap-3 italic tracking-tight">
                        <div class=" border-l-3 border-l-amber-500 p-2"> ต้องจ่าย Energy และทรัพยากรที่จำเป็นทันทีที่ประกาศร่าย (ประกาศเข้า Stack) โดยไม่คำนึงว่าผลลัพธ์สุดท้ายจะโดนยกเลิกหรือไม่</div>
                    </div>
                </div>
                <div class="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500">
                    <div class="text-white font-black text-sm mb-4 flex items-center gap-3 italic tracking-tight">
                        <div class="border-l-3 border-l-rose-500 p-2"> หากเป้าหมายของการ์ด (ยูนิต/พื้นที่) หายไปหรือถูกทำลายก่อนที่ลำดับความสามารถจะประมวลผล การ์ดใบนั้นจะทำให้เป้าหมายเป็นโมฆะทันที</div>
                    </div>
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
    .perspective-1000 {
        perspective: 1000px;
    }
</style>
