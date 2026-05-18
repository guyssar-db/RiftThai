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

<div class="space-y-8">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">Card Gallery</h1>
            <p class="text-slate-400 font-medium">ค้นหาและดูรายละเอียดการ์ด Riftbound ทั้งหมด</p>
        </div>
        <p class="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-slate-400 text-xs font-bold w-fit">
            {resultsCount} Cards Found
        </p>
    </div>

    <div class="flex flex-col md:flex-row gap-3">
        <div class="relative w-full group">
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
                type="text" 
                placeholder="ค้นหาชื่อการ์ด, รหัส หรือ ความสามารถ..." 
                class="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-600"
                bind:value={searchTerm} 
            />
        </div>
        <select 
            class="bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer font-bold text-sm h-full min-w-[140px]"
            bind:value={selectedSet}
        >
            <option value="All">All Sets</option>
            {#each sets.filter((s: string) => s !== 'All') as set}
                <option value={set}>{set}</option>
            {/each}
        </select>
        <select 
            class="bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer font-bold text-sm h-full min-w-[140px]"
            bind:value={selectedType}
        >
            <option value="All">All Types</option>
            {#each types.filter((t: string) => t !== 'All') as type}
                <option value={type}>{type}</option>
            {/each}
        </select>
    </div>
</div>