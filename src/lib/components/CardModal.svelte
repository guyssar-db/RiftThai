<script lang="ts">
    import { keywords, iconMappings } from '$lib/data/keywords';
interface Card {
    code: string;
    name_en: string;
    ability_en: string;
    name_th: string;
    ability_th: string;
    image_url: string;
    type: string;
    energy: number | null;
    power: {
        label: string;
        value: {
            id: number;
            label: string;
        };
    } | null;
    rarity: string;
    domains: string[];
    set_name: string;
    tags: string[];
}
    let { card, closePopup, canEdit } = $props<{ card: Card, closePopup: () => void, canEdit: boolean }>();

    let isEditing = $state(false);
    let tempAbilityEn = $state(card.ability_en);
    let tempAbilityTh = $state(card.ability_th);
    let isSaving = $state(false);

    async function handleSave() {
        isSaving = true;
        const response = await fetch('/api/update-card', {
            method: 'POST',
            body: JSON.stringify({
                code: card.code,
                ability_en: tempAbilityEn,
                ability_th: tempAbilityTh
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (result.success) {
            card.ability_en = tempAbilityEn;
            card.ability_th = tempAbilityTh;
            isEditing = false;
            alert('Saved successfully!');
        } else {
            alert('Failed to save: ' + result.message);
        }
        isSaving = false;
    }



    const domainIconMap: Record<string, string> = {
        'Fury': 'rune_fury.svg',
        'Calm': 'rune_calm.svg',
        'Chaos': 'rune_chaos.svg',
        'Mind': 'rune_mind.svg',
        'Body': 'rune_body.svg',
        'Order': '8bb1b193a8e1adc26ca28e1a21da8d1e2f5d2f72-64x64.png'
    };

    const mechanics: Record<string, string> = {
        'Ready': 'Ready: ยูนิตสามารถโจมตีหรือใช้สกิลได้ทันที (ตั้งตรง)',
        'Exhausted': 'Exhausted: ยูนิตไม่สามารถโจมตีหรือใช้สกิลได้ (นอนตะแคง)',
        'Exhaust': 'Exhaust: การสั่งให้นอนตะแคงเพื่อใช้งานความสามารถหรือเคลื่อนที่',
        'Buff': 'Buff: การเพิ่มค่าพลังหรือความสามารถให้ยูนิต',
        'Channel': 'Channel: การจั่วเปิดการ์ดรูนใบใหม่จากกองรูน',
        'Recycle': 'Recycle: การนำการ์ดรูนที่ใช้แล้วหรือจากมือส่งกลับเข้าใต้กองรูนเพื่อรับแต้ม Power',
        'Conquer': 'Conquer: ชนะการประจันหน้า (Showdown) และยึดพื้นที่สำเร็จ',
        'Hold': 'Hold: การควบคุมสนามรบต่อเนื่องจนถึง BEGINNING PHASE',
        'Banish': 'Banish: การ์ดที่โดนส่งมาโซนนี้จะหลุดออกนอกวงโคจรของระบบเกมโดยสิ้นเชิง มันจะไม่ได้อยู่บนสนาม ไม่ได้อยู่ในมือ ไม่ได้อยู่ในสุสาน และไม่สามารถใช้การ์ดชุบชีวิตทั่วไปดึงกลับมาใช้งานได้อีกเลย'

    };

    function parseAbility(text: string) {
        if (!text) return "";
        let processed = text;
        const placeholders: Record<string, string> = {};
        let phCount = 0;

        function addPH(html: string) {
            const id = `___PH${phCount++}___`;
            placeholders[id] = html;
            return id;
        }

        // 1. Convert Thai keywords to English for standard processing
        const keywordReplacements: Record<string, string> = {
            '\\[แอ็คชัน\\]': '[Action]',
            '\\[รีแอ็คชัน\\]': '[Reaction]',
            '\\[เร่งความเร็ว\\]': '[Accelerate]',
            '\\[ซ่อน\\]': '[Hidden]',
            '\\[กองทัพ\\]': '[Legion]',
            '\\[แทงค์\\]': '[Tank]',
            '\\[แนวหลัง\\]': '[Backline]',
            '\\[ทรงพลัง\\]': '[Mighty]',
            '\\[เสียงระฆังมรณะ\\]': '[Deathknell]',
            '\\[เชื่อมต่อ\\]': '[Channel]',
            '\\[รีไซเคิล\\]': '[Recycle]',
            '\\[นิมิต\\]': '[Vision]',
            '\\[ทำนาย\\]': '[Predict]',
            '\\[แก๊งค์\\]': '[Ganking]',
            '\\[ชั่วคราว\\]': '[Temporary]'
        };

        Object.entries(keywordReplacements).forEach(([th, en]) => {
            processed = processed.replace(new RegExp(th, 'g'), en);
        });

        processed = processed.replace(/\[บุกทะลวง\s*(\d+)?\]/g, (m, p1) => p1 ? `[Assault ${p1}]` : '[Assault]');
        processed = processed.replace(/\[เกราะป้องกัน\s*(\d+)?\]/g, (m, p1) => p1 ? `[Shield ${p1}]` : '[Shield]');
        processed = processed.replace(/\[เบี่ยงเบน\s*(\d+)?\]/g, (m, p1) => p1 ? `[Deflect ${p1}]` : '[Deflect]');
        processed = processed.replace(/\[ล่า\s*(\d+)?\]/g, (m, p1) => p1 ? `[Hunt ${p1}]` : '[Hunt]');
        processed = processed.replace(/\[เลเวล\s*(\d+)?\]/g, (m, p1) => p1 ? `[Level ${p1}]` : '[Level]');

        // 2. Identify and hide tokens into placeholders to prevent nested replacements
        
        // Rainbow Rune [c]
        processed = processed.replace(/\[c\]/gi, () => addPH(`<img src="/images/icons/rune_rainbow.svg" class="inline-icon" title="Any Rune" alt="Any Rune" />`));

        // Energy Icons
        processed = processed.replace(/:rb_energy_(\d+):/g, (match, p1) => addPH(`<span class="icon-energy-circle" title="Energy: ${p1}">${p1}</span>`));

        // Other Icons from mappings
        Object.entries(iconMappings).forEach(([key, value]) => {
            processed = processed.replace(new RegExp(key, 'g'), () => addPH(`<img src="/images/icons/${value.icon}" class="inline-icon" title="${value.hint}" alt="${key}" />`));
        });

        // Keywords [Badge]
        processed = processed.replace(/\[([^\]]+)\]/g, (match, p1) => {
            const trimmedP1 = p1.trim();
            const hasArrow = trimmedP1.endsWith('>');
            const displayP1 = hasArrow ? trimmedP1.slice(0, -1).trim() : p1;
            
            const cleanP1 = displayP1.split(' ')[0];
            const kw = keywords.find(k => 
                k.name_en.toLowerCase() === cleanP1.toLowerCase() || 
                k.name_th.toLowerCase() === cleanP1.toLowerCase() ||
                cleanP1.toLowerCase().includes(k.name_en.toLowerCase())
            );
            const bgColor = kw ? kw.color : '#107361';
            const hint = kw ? kw.description_th : '';
            const className = hasArrow ? 'kw-inline-badge kw-arrow cursor-pointer outline-none' : 'kw-inline-badge cursor-pointer outline-none';
            
            if (hint) {
                return addPH(`<span class="${className}" tabindex="0" data-tooltip="${hint}" style="background-color: ${bgColor}; border: none; shadow: none;"><span>${displayP1}</span></span>`);
            }
            return addPH(`<span class="${hasArrow ? 'kw-inline-badge kw-arrow' : 'kw-inline-badge'}" style="background-color: ${bgColor}; border: none; shadow: none;"><span>${displayP1}</span></span>`);
        });

        // Mechanics (Ready, Exhaust, etc.)
        const sortedMechanics = Object.entries(mechanics).sort((a, b) => b[0].length - a[0].length);
        sortedMechanics.forEach(([key, hint]) => {
            const regex = new RegExp(`\\b(${key})\\b`, 'gi');
            processed = processed.replace(regex, (match) => addPH(`<span class="text-cyan-400 underline decoration-cyan-400/30 decoration-dotted underline-offset-4 cursor-pointer inline-block outline-none font-bold" tabindex="0" data-tooltip="${hint}">${match}</span>`));
        });

        // 2.5 Style text in parentheses as gray
        processed = processed.replace(/\(([^)]+)\)/g, (match, p1) => addPH(`<span class="text-slate-500 font-medium italic">(${p1})</span>`));

        // 3. Restore all placeholders back to HTML (in reverse order to handle nesting)
        const entries = Object.entries(placeholders);
        for (let i = entries.length - 1; i >= 0; i--) {
            const [id, html] = entries[i];
            processed = processed.replace(id, html);
        }

        return processed.replace(/\\n/g, '<br />').replace(/\n/g, '<br />');
    }

    let activeTooltip = $state("");
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    let tooltipTransform = $state("translate(-50%, -100%)");

    function showTooltip(e: Event) {
        const target = e.target as HTMLElement;
        const trigger = target.closest('[data-tooltip]') as HTMLElement;
        if (trigger) {
            activeTooltip = trigger.getAttribute('data-tooltip') || "";
            const rect = trigger.getBoundingClientRect();
            tooltipX = rect.left + rect.width / 2;
            
            if (rect.top < 100) {
                tooltipY = rect.bottom + 8;
                tooltipTransform = "translate(-50%, 0)";
            } else {
                tooltipY = rect.top - 8;
                tooltipTransform = "translate(-50%, -100%)";
            }
        }
    }

    function handleMouseOut(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const trigger = target.closest('[data-tooltip]') as HTMLElement;
        const related = e.relatedTarget as Node;
        if (trigger && related && trigger.contains(related)) {
            return;
        }
        activeTooltip = "";
    }

    function hideTooltip() {
        activeTooltip = "";
    }

    function toggleTooltip(e: Event) {
        const target = e.target as HTMLElement;
        const trigger = target.closest('[data-tooltip]') as HTMLElement;
        if (trigger) {
            e.stopPropagation(); // Prevent modal background click
            const hint = trigger.getAttribute('data-tooltip') || "";
            if (activeTooltip === hint) {
                activeTooltip = "";
            } else {
                showTooltip(e);
            }
        } else {
            activeTooltip = "";
        }
    }
</script>

{#if activeTooltip}
    <div 
        class="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl text-white text-xs sm:text-sm p-4 sm:p-5 rounded-2xl border border-white/10 shadow-2xl whitespace-normal leading-relaxed text-center font-medium font-sans max-w-[280px] sm:max-w-[320px] pointer-events-none animate-in fade-in zoom-in duration-200"
        style="left: {tooltipX}px; top: {tooltipY}px; transform: {tooltipTransform};"
    >
        {activeTooltip}
    </div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300" onclick={closePopup}>
    <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl transition-opacity"></div>
    
    <div 
        class="relative bg-slate-900 w-full max-w-5xl max-h-full sm:max-h-[90dvh] rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-500 scale-100 animate-in zoom-in-95 duration-500" 
        onclick={(e) => { e.stopPropagation(); activeTooltip = ""; }}
    >
        <!-- Mobile Header -->
        <div class="lg:hidden flex items-center justify-between p-6 bg-slate-950/50 border-b border-white/5 backdrop-blur-md">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                <span class="text-white font-black tracking-[0.2em] text-xs uppercase">{card.code}</span>
            </div>
            <button class="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform" onclick={closePopup} aria-label="Close Modal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <!-- Desktop Close -->
        <button 
            class="hidden lg:flex absolute top-10 right-10 bg-white/5 hover:bg-rose-500 hover:text-white text-slate-400 w-14 h-14 rounded-[1.5rem] items-center justify-center transition-all duration-500 z-50 group border border-white/5 backdrop-blur-xl" 
            onclick={closePopup}
            aria-label="Close Modal"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-transform group-hover:rotate-90 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="overflow-y-auto custom-scrollbar h-full" onscroll={hideTooltip}>
            <div class="grid lg:grid-cols-2 items-stretch h-full">
                <!-- Image Section -->
                <div class="p-10 sm:p-16 lg:p-20 bg-slate-950/40 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative group">
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 opacity-50"></div>
                    <div class="relative z-10 w-full max-w-[400px]">
                        <div class="absolute -inset-10 bg-cyan-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <img 
                            src={card.image_url} 
                            alt={card.name_en} 
                            class="w-full h-auto rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-white/5 object-contain transition-transform duration-700 group-hover:scale-[1.02] group-hover:-rotate-1" 
                        />
                    </div>
                </div>
                
                <!-- Info Section -->
                <div class="p-10 sm:p-16 lg:p-20 space-y-12 bg-slate-900/50 backdrop-blur-3xl">
                    <div class="space-y-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                                <span class="text-cyan-400 font-black text-xs tracking-[0.2em]">{card.code}</span>
                            </div>
                            <div class="h-px w-8 bg-white/10"></div>
                            <span class="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">{card.set_name}</span>
                        </div>
                        
                        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight uppercase italic">{card.name_en}</h2>
                        
                        <div class="flex flex-wrap gap-3 items-center pt-4">
                            <span class="text-white font-black uppercase text-[10px] tracking-[0.2em] bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl shadow-xl">{card.type}</span>
                            
                            {#if card.energy !== null}
                                <div class="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
                                    <span class="w-6 h-6 rounded-full bg-white text-slate-950 flex items-center justify-center text-xs font-black">
                                        {card.energy}
                                    </span>
                                    <span class="text-slate-400 font-black text-[10px] uppercase tracking-widest">Energy</span>
                                </div>
                            {/if}
                            {#if card.power !== null}
                                <div class="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
                                    <img src="/images/icons/might.svg" class="h-5 w-auto" alt="Might" /> 
                                    <span class="font-black text-white uppercase text-xs tracking-widest">{card.power?.value?.label}</span>
                                </div>
                            {/if}
                        </div>
                        
                        {#if card.domains?.length > 0 || card.tags?.length > 0}
                            <div class="flex flex-wrap gap-2 pt-4">
                                {#each card.domains as domain}
                                    <div class="bg-slate-950/80 px-4 py-2 rounded-2xl flex items-center gap-3 text-[10px] font-black border border-white/5 hover:border-white/20 transition-colors cursor-default">
                                        <img src="/images/icons/{domainIconMap[domain] || 'rune_rainbow.svg'}" class="h-5 w-auto" alt={domain} />
                                        <span class="uppercase tracking-widest text-white/80">{domain}</span>
                                    </div>
                                {/each}
                                {#each card.tags as tag}
                                    <div class="bg-white/5 px-4 py-2 rounded-2xl flex items-center gap-2 text-[9px] font-black border border-white/5 hover:border-cyan-500/30 transition-all cursor-default">
                                        <span class="uppercase tracking-widest text-cyan-500/70">#{tag}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="space-y-10">
                        {#if canEdit}
                            <div class="flex items-center gap-3">
                                <button 
                                    class="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all {isEditing ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}"
                                    onclick={() => isEditing = !isEditing}
                                >
                                    {isEditing ? 'Cancel Edit' : 'Modify Core'}
                                </button>
                                {#if isEditing}
                                    <button class="bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all" onclick={handleSave} disabled={isSaving}>
                                        {isSaving ? 'Processing...' : 'Sync Changes'}
                                    </button>
                                {/if}
                            </div>
                        {/if}

                        <div class="relative pl-8 group/thai">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-violet-500 rounded-full group-hover/thai:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-shadow"></div>
                            <h4 class="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 italic opacity-70">Localized Intel (TH)</h4>
                            {#if isEditing && canEdit}
                                <textarea bind:value={tempAbilityTh} class="w-full h-40 bg-slate-950 border border-white/10 p-6 rounded-[2rem] text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all font-medium leading-relaxed"></textarea>
{:else}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="text-xl sm:text-2xl font-black leading-relaxed text-white tracking-tight italic"
                                     onmouseover={showTooltip} onmouseout={handleMouseOut} onfocusin={showTooltip} onfocusout={hideTooltip}
                                     onclick={toggleTooltip}>
                                    {@html parseAbility(card.ability_th)}
                                </div>
                            {/if}
                        </div>

                        <div class="pt-10 border-t border-white/5 relative group/en">
                            <h4 class="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-6 italic opacity-70">Source Transmission (EN)</h4>
                            {#if isEditing && canEdit}
                                <textarea bind:value={tempAbilityEn} class="w-full h-40 bg-slate-950 border border-white/10 p-6 rounded-[2rem] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/50 transition-all font-medium leading-relaxed italic"></textarea>
                            {:else}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="text-base sm:text-lg text-slate-400 leading-relaxed italic font-medium pr-10"
                                     onmouseover={showTooltip} onmouseout={handleMouseOut} onfocusin={showTooltip} onfocusout={hideTooltip}
                                     onclick={toggleTooltip}>
                                    {@html parseAbility(card.ability_en)}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(2, 6, 23, 0.5);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.05);
        border: 3px solid rgba(2, 6, 23, 1);
        border-radius: 100px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.2);
    }
</style>