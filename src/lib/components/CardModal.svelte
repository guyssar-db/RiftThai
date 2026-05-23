<script lang="ts">
    import { keywords, iconMappings } from '$lib/data/keywords';
    import { getRarityIcon } from '$lib/data/rarityIcons';
    import { getTypeIcons } from '$lib/data/typeIcons';
    import type { Card } from '$lib/types/card';
    import { getCardImageSources } from '$lib/utils/cardImages';
    let { card, closePopup, canEdit } = $props<{ card: Card, closePopup: () => void, canEdit: boolean }>();

    let isEditing = $state(false);
    let tempAbilityEn = $state('');
    let tempAbilityTh = $state('');
    let isSaving = $state(false);
    let modalImageSources = $derived(getCardImageSources(card.image_url, [360, 480, 640, 744]));

    $effect(() => {
        tempAbilityEn = card.ability_en;
        tempAbilityTh = card.ability_th;
    });

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

    const rarityStyles: Record<string, string> = {
        'Common': 'border-slate-500/30 bg-slate-500/10 text-slate-200',
        'Uncommon': 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        'Rare': 'border-sky-400/30 bg-sky-400/10 text-sky-200',
        'Epic': 'border-violet-400/30 bg-violet-400/10 text-violet-200',
        'Legendary': 'border-amber-400/30 bg-amber-400/10 text-amber-200',
        'Champion': 'border-rose-400/30 bg-rose-400/10 text-rose-200'
    };

    function rarityClass(rarity: string) {
        return rarityStyles[rarity] ?? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
    }

    const mechanics: Record<string, string> = {
        'Ready': 'Ready: ยูนิตสามารถโจมตีหรือใช้สกิลได้ทันที (ตั้งตรง)',
        'Exhausted': 'Exhausted: ยูนิตไม่สามารถโจมตีหรือใช้สกิลได้ (นอนตะแคง)',
        'Exhaust': 'Exhaust: การสั่งให้นอนตะแคงเพื่อใช้งานความสามารถหรือเคลื่อนที่',
        'Buff': 'Buff: การเพิ่มค่าพลังหรือความสามารถให้ยูนิต',
        'Channel': 'Channel: การจั่วเปิดการ์ดรูนใบใหม่จากกองรูน',
        'Recycle': 'Recycle: การนำการ์ดรูนหรือจากมือส่งกลับเข้าใต้กอง',
        'Conquer': 'Conquer: ชนะการประจันหน้า (Showdown) และยึดพื้นที่สำเร็จ',
        'Hold': 'Hold: การควบคุมสนามรบต่อเนื่องจนถึง BEGINNING PHASE',
        'Banish': 'Banish: การ์ดที่โดนส่งมาโซนนี้จะหลุดออกนอกวงโคจรของระบบเกมโดยสิ้นเชิง มันจะไม่ได้อยู่บนสนาม ไม่ได้อยู่ในมือ ไม่ได้อยู่ในกองทิ้ง และไม่สามารถใช้การ์ดชุบชีวิตทั่วไปดึงกลับมาใช้งานได้อีกเลย'

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

        // Keep keyword costs inside the same keyword background.
        processed = processed.replace(/\[(Repeat|Equip)\]((?:\s*___PH\d+___)+)/gi, (_match, keyword, costs) => {
            const kw = keywords.find(k => k.name_en.toLowerCase() === keyword.toLowerCase());
            const bgColor = kw ? kw.color : '#107361';
            const hint = kw ? kw.description_th : '';
            return addPH(`<span class="kw-inline-badge kw-cost-badge cursor-pointer outline-none" tabindex="0" data-tooltip="${hint}" style="background-color: ${bgColor}; border: none; shadow: none;"><span>${keyword}</span>${costs}</span>`);
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

    function formatTranslatedAbility(text: string, sourceText: string) {
        if (!text) return '';

        let formatted = text.replace(/\\n/g, '\n');
        const sourceHasStructuredLines = /\\n|\n/.test(sourceText || '');

        if (sourceHasStructuredLines) {
            formatted = formatted
                .replace(/\s+(\[(?:Action|Reaction|Repeat|Equip|Hidden|Accelerate|Deathknell|Level|Tank|Assault|Shield|Deflect|Hunt|Ganking|Temporary|Vision|Predict|Quick-Draw|Weaponmaster)\b[^\]]*\])/g, '\n$1')
                .replace(/(\[(?:Action|Reaction|Repeat|Equip|Hidden|Accelerate|Deathknell|Level|Tank|Assault|Shield|Deflect|Hunt|Ganking|Temporary|Vision|Predict|Quick-Draw|Weaponmaster)\b[^\]]*\](?:\s*:rb_[a-z0-9_]+:)*\s*\([^)]*\))\s+(?=\S)/g, '$1\n')
                .replace(/([.)])\s+(?=\[)/g, '$1\n');
        }

        return formatted.replace(/\n{3,}/g, '\n\n').trim();
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
<div class="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-6 lg:p-8 animate-in fade-in duration-300" onclick={closePopup}>
    <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl transition-opacity"></div>
    
    <div 
        class="relative flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-500 animate-in zoom-in-95 sm:max-h-[92dvh] sm:rounded-[2rem] lg:rounded-[2.5rem]" 
        onclick={(e) => { e.stopPropagation(); activeTooltip = ""; }}
    >
        <!-- Mobile Header -->
        <div class="flex items-center justify-between border-b border-white/5 bg-slate-950/50 p-4 backdrop-blur-md sm:p-5 lg:hidden">
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

        <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto" onscroll={hideTooltip}>
            <div class="grid lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] lg:items-stretch">
                <!-- Image Section -->
                <div class="group relative flex items-center justify-center border-b border-white/5 bg-slate-950/40 p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-10 xl:p-12">
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 opacity-50"></div>
                    <div class="relative z-10 w-full max-w-[250px] sm:max-w-[340px] lg:max-w-[380px]">
                        <div class="absolute -inset-10 bg-cyan-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <picture>
                            {#if modalImageSources.webpSrcset}
                                <source
                                    type="image/webp"
                                    srcset={modalImageSources.webpSrcset}
                                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 340px, 250px"
                                />
                            {/if}
                            <img
                                src={modalImageSources.fallback}
                                srcset={modalImageSources.fallbackSrcset}
                                sizes="(min-width: 1024px) 380px, (min-width: 640px) 340px, 250px"
                                alt={card.name_en}
                                loading="eager"
                                decoding="async"
                                fetchpriority="high"
                                draggable="false"
                                class="pointer-events-none h-auto w-full rounded-2xl border border-white/5 object-contain shadow-[0_30px_70px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.02] sm:rounded-3xl lg:group-hover:-rotate-1"
                            />
                        </picture>
                    </div>
                </div>
                
                <!-- Info Section -->
                <div class="space-y-7 bg-slate-900/50 p-5 backdrop-blur-3xl sm:p-8 lg:p-10 xl:p-12">
                    <div class="space-y-5">
                        <div class="flex flex-wrap items-center gap-2.5">
                            <span class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                                {card.code}
                            </span>
                            {#if card.set_name}
                                <span class="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    {card.set_name}
                                </span>
                            {/if}
                            <!-- {#if card.rarity}
                                <span class="rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] {rarityClass(card.rarity)}">
                                    {card.rarity}
                                </span>
                            {/if} -->
                        </div>

                        <div class="space-y-2">
                            <h2 class="break-words text-2xl font-black uppercase italic leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.35rem]">{card.name_en}</h2>
                            {#if card.name_th && card.name_th !== card.name_en}
                                <p class="break-words text-sm font-bold leading-relaxed text-slate-400 sm:text-base">{card.name_th}</p>
                            {/if}
                        </div>

                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div class="min-h-[82px] rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Type</div>
                                <div class="flex min-w-0 items-center gap-3 text-sm font-black uppercase tracking-wide text-white">
                                    <div class="flex shrink-0 items-center gap-1.5">
                                        {#each getTypeIcons(card.type) as typeIcon}
                                            <img src="/images/icons/{typeIcon.src}" class="h-7 w-7 object-contain" alt="{typeIcon.label} type" />
                                        {/each}
                                    </div>
                                    <span class="min-w-0 break-words leading-snug">{card.type || '-'}</span>
                                </div>
                            </div>
                            <div class="min-h-[82px] rounded-2xl border p-4 {card.rarity ? rarityClass(card.rarity) : 'border-white/10 bg-slate-950/50 text-white'}">
                                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.22em] opacity-60">Rarity</div>
                                <div class="flex min-w-0 items-center gap-3 text-sm font-black uppercase tracking-wide">
                                    {#if getRarityIcon(card.rarity)}
                                        <img src={getRarityIcon(card.rarity) ?? ''} class="h-7 w-7 shrink-0 object-contain" alt="{card.rarity} rarity" />
                                    {/if}
                                    <span class="min-w-0 break-words leading-snug">{card.rarity || '-'}</span>
                                </div>
                            </div>
                            <div class="min-h-[82px] rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Energy</div>
                                <div class="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
                                    {#if card.energy !== null}
                                        <span class="grid h-7 w-7 place-items-center rounded-full bg-white text-sm text-slate-950">{card.energy}</span>
                                    {:else}
                                        <span>-</span>
                                    {/if}
                                </div>
                            </div>
                            {#if card.power !== null}
                                <div class="min-h-[82px] rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                                    <div class="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Might</div>
                                    <div class="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
                                        <img src="/images/icons/might.svg" class="h-6 w-auto" alt="Might" />
                                        <span>{card.power?.value?.label}</span>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        {#if card.domains?.length > 0 || card.tags?.length > 0}
                            <div class="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                {#if card.domains?.length > 0}
                                    <div class="flex flex-wrap gap-2">
                                        {#each card.domains as domain}
                                            <div class="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/70 px-3 py-2 text-[10px] font-black transition-colors hover:border-white/20">
                                                <img src="/images/icons/{domainIconMap[domain] || 'rune_rainbow.svg'}" class="h-5 w-auto" alt={domain} />
                                                <span class="uppercase tracking-widest text-white/80">{domain}</span>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                {#if card.tags?.length > 0}
                                    <div class="flex flex-wrap gap-2">
                                        {#each card.tags ?? [] as tag}
                                            <span class="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-cyan-300/80">
                                                #{tag}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <div class="space-y-8">
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

                        <div class="relative pl-5 group/thai sm:pl-7">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-violet-500 rounded-full group-hover/thai:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-shadow"></div>
                            <h4 class="mb-4 text-[10px] font-black uppercase italic tracking-[0.32em] text-cyan-500 opacity-70">Localized Intel (TH)</h4>
                            {#if isEditing && canEdit}
                                <textarea bind:value={tempAbilityTh} class="w-full h-40 bg-slate-950 border border-white/10 p-6 rounded-[2rem] text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all font-medium leading-relaxed"></textarea>
{:else}
                                <!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
                                <div class="break-words text-lg font-black leading-relaxed tracking-tight text-white sm:text-xl"
                                     onmouseover={showTooltip} onmouseout={handleMouseOut} onfocusin={showTooltip} onfocusout={hideTooltip}
                                     onclick={toggleTooltip}>
                                    {@html parseAbility(formatTranslatedAbility(card.ability_th, card.ability_en))}
                                </div>
                            {/if}
                        </div>

                        <div class="relative border-t border-white/5 pt-8 group/en">
                            <h4 class="mb-4 text-[10px] font-black uppercase italic tracking-[0.32em] text-slate-600 opacity-70">Source Transmission (EN)</h4>
                            {#if isEditing && canEdit}
                                <textarea bind:value={tempAbilityEn} class="w-full h-40 bg-slate-950 border border-white/10 p-6 rounded-[2rem] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/50 transition-all font-medium leading-relaxed italic"></textarea>
                            {:else}
                                <!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
                                <div class="break-words text-sm font-medium leading-relaxed text-slate-400 sm:text-base lg:text-lg"
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
