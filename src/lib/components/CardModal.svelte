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

    const rarityColors: Record<string, string> = {
        'Common': 'text-slate-400',
        'Uncommon': 'text-sky-400',
        'Rare': 'text-purple-500',
        'Legendary': 'text-amber-500'
    };

    const mechanics: Record<string, string> = {
        'Ready': 'พร้อม: ยูนิตสามารถโจมตีหรือใช้สกิลได้ทันที (ตั้งตรง)',
        'Exhausted': 'เหนื่อย: ยูนิตไม่สามารถโจมตีหรือใช้สกิลได้ (นอนตะแคง)',
        'Exhaust': 'การสั่งให้นอนตะแคงเพื่อใช้งานความสามารถหรือเคลื่อนที่',
        'Buff': 'การเพิ่มค่าพลังหรือความสามารถให้ยูนิต',
        'Channel': 'เชื่อมต่อ: การจั่วเปิดการ์ดรูนใบใหม่จากกองรูน',
        'Recycle': 'รีไซเคิล: การนำการ์ดรูนที่ใช้แล้วหรือจากมือส่งกลับเข้าใต้กองรูนเพื่อรับแต้ม Power',
        'Conquer': 'ยึดครอง: ชนะการประจันหน้า (Showdown) และยึดพื้นที่สำเร็จ',
        'Hold': 'คุมพื้นที่: การควบคุมสนามรบต่อเนื่องเมื่อเข้าสู่เฟสเริ่มเทิร์น',
        'Banish': 'เนรเทศ: การ์ดที่โดนส่งมาโซนนี้จะหลุดออกนอกวงโคจรของระบบเกมโดยสิ้นเชิง มันจะไม่ได้อยู่บนสนาม ไม่ได้อยู่ในมือ ไม่ได้อยู่ในสุสาน และไม่สามารถใช้การ์ดชุบชีวิตทั่วไปดึงกลับมาใช้งานได้อีกเลย'

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
            const cleanP1 = p1.split(' ')[0];
            const kw = keywords.find(k => 
                k.name_en.toLowerCase() === cleanP1.toLowerCase() || 
                k.name_th.toLowerCase() === cleanP1.toLowerCase() ||
                cleanP1.toLowerCase().includes(k.name_en.toLowerCase())
            );
            const bgColor = kw ? kw.color : '#107361';
            const hint = kw ? kw.description_th : '';
            if (hint) {
                return addPH(`<span class="kw-inline-badge cursor-pointer outline-none" tabindex="0" data-tooltip="${hint}" style="background-color: ${bgColor}"><span>${p1}</span></span>`);
            }
            return addPH(`<span class="kw-inline-badge" style="background-color: ${bgColor}"><span>${p1}</span></span>`);
        });

        // Mechanics (Ready, Exhaust, etc.)
        const sortedMechanics = Object.entries(mechanics).sort((a, b) => b[0].length - a[0].length);
        sortedMechanics.forEach(([key, hint]) => {
            const regex = new RegExp(`\\b(${key})\\b`, 'gi');
            processed = processed.replace(regex, (match) => addPH(`<span class="text-amber-400 underline decoration-dotted cursor-pointer inline-block outline-none" tabindex="0" data-tooltip="${hint}">${match}</span>`));
        });

        // 2.5 Style text in parentheses as gray
        processed = processed.replace(/\(([^)]+)\)/g, (match, p1) => addPH(`<span class="text-slate-500 font-medium">(${p1})</span>`));

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
</script>

{#if activeTooltip}
    <div 
        class="fixed z-[9999] bg-slate-800 text-white sm:text-xs p-3 rounded-xl border border-slate-700 shadow-2xl whitespace-normal leading-relaxed text-center font-medium font-sans normal-case tracking-normal not-italic pointer-events-none"
        style="left: {tooltipX}px; top: {tooltipY}px; transform: {tooltipTransform}; max-width: 220px; font-size: 11px;"
    >
        {activeTooltip}
    </div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 lg:p-8" onclick={closePopup}>
    <div class="absolute inset-0 bg-slate-950/95 backdrop-blur-xl transition-opacity duration-300"></div>
    
    <div 
        class="relative bg-slate-900 w-full max-w-5xl max-h-full sm:max-h-[95dvh] rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 scale-100" 
        onclick={(e) => e.stopPropagation()}
    >
        <div class="lg:hidden flex items-center justify-between p-6 bg-slate-900 border-b border-slate-800">
            <div class="flex items-center gap-3">
                <span class="text-sky-500 font-black tracking-widest text-sm">{card.code}</span>
            </div>
            <button class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white" onclick={closePopup} aria-label="Close Modal">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <button 
            class="hidden lg:flex absolute top-8 right-8 bg-slate-800/50 hover:bg-red-500 text-white w-12 h-12 rounded-2xl items-center justify-center transition-all duration-300 z-50 group border border-slate-700 backdrop-blur-md" 
            onclick={closePopup}
            aria-label="Close Modal"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="overflow-y-auto custom-scrollbar" onscroll={hideTooltip}>
            <div class="grid md:grid-cols-2 items-start">
                <div class="p-8 sm:p-10 bg-slate-950/30 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 lg:h-full">
                    <div class="relative group flex justify-center w-full px-2">
                        <img 
                            src={card.image_url} 
                            alt={card.name_en} 
                            class="w-auto h-auto max-h-[350px] sm:max-h-[450px] lg:max-h-[600px] rounded-2xl shadow-2xl border border-white/5 object-contain" 
                        />
                        <div class="absolute -inset-4 bg-sky-500/10 blur-3xl -z-10 opacity-30"></div>
                    </div>
                </div>
                
                <div class="p-8 sm:p-12 space-y-10">
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 mb-2">
                            <span class="text-sky-500 font-black text-lg tracking-[0.2em]">{card.code}</span>
                            <div class="h-4 w-[1px] bg-slate-800"></div>
                            <span class="text-slate-500 font-bold text-sm tracking-tight">{card.set_name}</span>
                        </div>
                        
                        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.1]">{card.name_en}</h2>
                        
                        <div class="flex flex-wrap gap-2 sm:gap-4 items-center pt-2">
                            <span class="text-slate-100 font-black uppercase text-[0.65rem] sm:text-[0.7rem] tracking-[0.15em] border border-slate-700 bg-slate-950 px-4 py-2 rounded-xl">{card.type}</span>
                            <!-- <span class="font-black uppercase text-[0.65rem] sm:text-[0.7rem] px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 {rarityColors[card.rarity] || 'text-slate-300'}">{card.rarity}</span> -->
                            
                            {#if card.energy !== null}
                                <div class="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700">
                                    <span class="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-black">{card.energy}</span> 
                                </div>
                            {/if}
                            {#if card.power !== null}
                                <div class="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-slate-800">
                                    <img src="/images/icons/might.svg" class="h-4 w-auto" alt="P" /> 
                                    <span class="font-black text-white uppercase text-[0.65rem] tracking-widest">Might: {card.power?.value?.label}</span>
                                </div>
                            {/if}
                        </div>
                        
                        {#if card.domains?.length > 0 || card.tags?.length > 0}
                            <div class="flex flex-wrap gap-2 mt-4">
                                {#each card.domains as domain}
                                    <div class="bg-slate-950 px-4 py-2 rounded-2xl flex items-center gap-2.5 text-xs font-black border border-slate-800">
                                        <img src="/images/icons/{domainIconMap[domain] || 'rune_rainbow.svg'}" class="h-4.5 w-auto" alt={domain} />
                                        <span class="uppercase tracking-widest text-white">{domain}</span>
                                    </div>
                                {/each}
                                {#each card.tags as tag}
                                    <div class="bg-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2.5 text-xs font-black border border-slate-700">
                                        <span class="uppercase tracking-widest text-sky-400">#{tag}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="space-y-6 pt-2">
                        {#if canEdit}
                            <div class="flex items-center gap-4 mb-4">
                                <button 
                                    class="px-4 py-2 text-[10px] font-black uppercase rounded-lg {isEditing ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}"
                                    onclick={() => isEditing = !isEditing}
                                >
                                    {isEditing ? '🔒 Lock Editing' : '✏️ Unlock Edit'}
                                </button>
                                {#if isEditing}
                                    <button class="bg-sky-500 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase" onclick={handleSave} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : '💾 Save'}
                                    </button>
                                {/if}
                            </div>
                        {/if}

                        <div class="relative pl-6">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-full"></div>
                            <h4 class="text-sky-500 text-[0.6rem] font-black uppercase tracking-[0.3em] mb-4">ความสามารถ (Thai)</h4>
                            {#if isEditing && canEdit}
                                <textarea bind:value={tempAbilityTh} class="w-full h-32 bg-slate-800 p-4 rounded-xl text-white text-sm"></textarea>
                            {:else}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="text-lg sm:text-xl font-bold leading-[1.6] text-white"
                                     onmouseover={showTooltip} onmouseout={handleMouseOut} onfocusin={showTooltip} onfocusout={hideTooltip}>
                                    {@html parseAbility(card.ability_th)}
                                </div>
                            {/if}
                        </div>

                        <div class="pt-8 border-t border-slate-800">
                            <h4 class="text-slate-600 text-[0.6rem] font-black uppercase tracking-[0.3em] mb-4">Original Ability (EN)</h4>
                            {#if isEditing && canEdit}
                                <textarea bind:value={tempAbilityEn} class="w-full h-32 bg-slate-800 p-4 rounded-xl text-slate-300 text-sm"></textarea>
                            {:else}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="text-base sm:text-lg text-slate-400 leading-relaxed italic font-medium"
                                     onmouseover={showTooltip} onmouseout={handleMouseOut} onfocusin={showTooltip} onfocusout={hideTooltip}>
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