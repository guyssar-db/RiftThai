<script lang="ts">
    let { 
        searchTerm = $bindable(), 
        selectedSet = $bindable(), 
        selectedType = $bindable(), 
        sets, 
        types,
        resultsCount
    } = $props<{
        searchTerm: string,
        selectedSet: string,
        selectedType: string,
        sets: string[],
        types: string[],
        resultsCount: number
    }>();
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between px-2">
        <div class="flex items-center gap-3">
            <div class="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
            <h2 class="text-sm font-black text-white uppercase tracking-[0.3em]">Search</h2>
        </div>
        <div class="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-cyan-400 tracking-widest uppercase">
            {resultsCount} Card
        </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 p-2 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
        <div class="relative flex-grow group">
            <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
                type="text" 
                placeholder="ค้นหาชื่อการ์ด, รหัส หรือ ความสามารถ..." 
                class="w-full bg-slate-950/50 border border-white/5 text-white pl-16 pr-6 py-5 rounded-3xl focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all placeholder:text-slate-600 font-medium"
                bind:value={searchTerm} 
            />
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="relative min-w-[180px]">
                <select 
                    class="w-full appearance-none bg-slate-950/50 border border-white/5 text-white px-6 py-5 rounded-3xl focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer font-black text-xs uppercase tracking-widest"
                    bind:value={selectedSet}
                >
                    <option value="All">All Sets</option>
                    {#each sets.filter((s: string) => s !== 'All') as set}
                        <option value={set}>{set}</option>
                    {/each}
                </select>
                <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>

            <div class="relative min-w-[180px]">
                <select 
                    class="w-full appearance-none bg-slate-950/50 border border-white/5 text-white px-6 py-5 rounded-3xl focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer font-black text-xs uppercase tracking-widest"
                    bind:value={selectedType}
                >
                    <option value="All">All Types</option>
                    {#each types.filter((t: string) => t !== 'All') as type}
                        <option value={type}>{type}</option>
                    {/each}
                </select>
                <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>
        </div>
    </div>
</div>