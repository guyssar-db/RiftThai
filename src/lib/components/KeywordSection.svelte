<script lang="ts">
	import { iconMappings, type Keyword } from '$lib/data/keywords';
	let { keywords } = $props<{ keywords: Keyword[] }>();
</script>

<div class="max-w-6xl mx-auto space-y-16">
	<div class="text-center space-y-4">
		<h2 class="text-4xl sm:text-6xl font-black text-white tracking-tight">Keywords Guide</h2>
		<p class="text-slate-400 text-lg font-medium">คำศัพท์และความสามารถพิเศษต่างๆ ในเกม Riftbound</p>
	</div>

	<div class="space-y-8">
		<h3 class="text-2xl font-black text-white flex items-center gap-4">
			<span class="w-8 h-1 bg-sky-500 rounded-full"></span>
			Icons & Tokens
		</h3>
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
			{#each Object.entries(iconMappings) as [key, value]}
				<div
					class="flex items-center gap-3 bg-slate-900/40 border border-slate-800/50 p-3 rounded-xl hover:border-slate-700 transition-colors group"
				>
					<div class="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center p-1.5 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
						<img src="/images/icons/{value.icon}" alt={value.hint} class="w-full h-full object-contain" />
					</div>
					<div class="min-w-0">
						<div class="text-white font-bold text-sm truncate">
							{value.hint.split(' (')[0]}
						</div>
						<div class="text-[0.6rem] font-black text-slate-500 uppercase tracking-wider truncate">
							{key.replace(/:/g, '')}
						</div>
					</div>
				</div>
			{/each}
			
			<div class="flex items-center gap-3 bg-slate-900/40 border border-slate-800/50 p-3 rounded-xl hover:border-slate-700 transition-colors group">
				<div class="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center p-1.5 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
					<div class="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-black text-[10px]">X</div>
				</div>
				<div class="min-w-0">
					<div class="text-white font-bold text-sm truncate">Energy</div>
					<div class="text-[0.6rem] font-black text-slate-500 uppercase tracking-wider truncate">rb_energy_X</div>
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-8">
		<h3 class="text-2xl font-black text-white flex items-center gap-4">
			<span class="w-8 h-1 bg-sky-500 rounded-full"></span>
			Special Keywords
		</h3>
		<div class="grid md:grid-cols-2 gap-4">
			{#each keywords as kw}
				<div
					class="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl hover:border-sky-500/20 transition-all duration-300 flex flex-col gap-3 group"
				>
					<div class="flex items-center justify-between gap-4">
						<div
							class="px-4 py-1.5 rounded-lg font-black text-xs tracking-widest uppercase shadow-md text-white"
							style="background-color: {kw.color}"
						>
							{kw.name_en}
						</div>
						<div class="text-slate-500 font-black tracking-widest text-[0.7rem] uppercase">
							{kw.name_th}
						</div>
					</div>
					<p class="text-slate-200 text-sm font-medium leading-relaxed">
						{kw.description_th}
					</p>
				</div>
			{/each}
		</div>
	</div>
</div>