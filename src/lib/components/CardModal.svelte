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
    }

    let { card, closePopup } = $props<{ card: Card, closePopup: () => void }>();

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

    function parseAbility(text: string) {
        if (!text) return "";
        let processed = text;

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

        processed = processed.replace(/\[c\]/gi, `<img src="/images/icons/rune_rainbow.svg" class="inline-icon" title="Any Rune" alt="[c]" />`);
        processed = processed.replace(/:rb_energy_(\d+):/g, (match, p1) => {
            return `<span class="icon-energy-circle" title="Energy: ${p1}">${p1}</span>`;
        });

        Object.entries(iconMappings).forEach(([key, value]) => {
            const regex = new RegExp(key, 'g');
            processed = processed.replace(regex, `<img src="/images/icons/${value.icon}" class="inline-icon" title="${value.hint}" alt="${key}" />`);
        });

        processed = processed.replace(/\[([^\]]+)\]/g, (match, p1) => {
            const kw = keywords.find(k => 
                k.name_en.toLowerCase() === p1.toLowerCase() || 
                k.name_th.toLowerCase() === p1.toLowerCase() ||
                p1.toLowerCase().includes(k.name_en.toLowerCase())
            );
            const bgColor = kw ? kw.color : '#107361';
            return `<span class="kw-inline-badge" style="background-color: ${bgColor}"><span>${p1}</span></span>`;
        });

        return processed;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 lg:p-8" onclick={closePopup}>
    <div class="absolute inset-0 bg-slate-950/95 backdrop-blur-xl transition-opacity duration-300"></div>
    
    <div 
        class="relative bg-slate-900 w-full max-w-5xl max-h-full sm:max-h-[95vh] rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 scale-100" 
        onclick={(e) => e.stopPropagation()}
    >
        <div class="lg:hidden flex items-center justify-between p-6 bg-slate-900 border-b border-slate-800">
            <div class="flex items-center gap-3">
                <span class="text-sky-500 font-black tracking-widest text-sm">{card.code}</span>
            </div>
            <button class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white" onclick={closePopup}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <button 
            class="hidden lg:flex absolute top-8 right-8 bg-slate-800/50 hover:bg-red-500 text-white w-12 h-12 rounded-2xl items-center justify-center transition-all duration-300 z-50 group border border-slate-700 backdrop-blur-md" 
            onclick={closePopup}
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="overflow-y-auto custom-scrollbar">
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
                        
                        <h2 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">{card.name_en}</h2>
                        
                        <div class="flex flex-wrap gap-2 sm:gap-4 items-center pt-2">
                            <span class="text-slate-100 font-black uppercase text-[0.65rem] sm:text-[0.7rem] tracking-[0.15em] border border-slate-700 bg-slate-950 px-4 py-2 rounded-xl">{card.type}</span>
                            <span class="font-black uppercase text-[0.65rem] sm:text-[0.7rem] px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 {rarityColors[card.rarity] || 'text-slate-300'}">{card.rarity}</span>
                            
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
                        
                        {#if card.domains?.length > 0}
                            <div class="flex flex-wrap gap-2 mt-4">
                                {#each card.domains as domain}
                                    <div class="bg-slate-950 px-4 py-2 rounded-2xl flex items-center gap-2.5 text-xs font-black border border-slate-800">
                                        <img src="/images/icons/{domainIconMap[domain] || 'rune_rainbow.svg'}" class="h-4.5 w-auto" alt={domain} />
                                        <span class="uppercase tracking-widest text-white">{domain}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="space-y-6 pt-2">
                        <div class="relative pl-6">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-full"></div>
                            <h4 class="text-sky-500 text-[0.6rem] font-black uppercase tracking-[0.3em] mb-4">ความสามารถ (Thai)</h4>
                            <div class="text-lg sm:text-2xl font-bold leading-[1.6] text-white">
                                {@html parseAbility(card.ability_th)}
                            </div>
                        </div>

                        <div class="pt-8 border-t border-slate-800">
                            <h4 class="text-slate-600 text-[0.6rem] font-black uppercase tracking-[0.3em] mb-4">Original Ability (EN)</h4>
                            <div class="text-base sm:text-lg text-slate-400 leading-relaxed italic font-medium">
                                {@html parseAbility(card.ability_en)}
                            </div>
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