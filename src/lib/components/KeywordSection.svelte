<script lang="ts">
	import { iconMappings, type Keyword } from '$lib/data/keywords';
	let { keywords } = $props<{ keywords: Keyword[] }>();
</script>

<div class="mx-auto max-w-7xl space-y-16 animate-in fade-in duration-1000">
	<div class="text-center space-y-4">
		<p class="rt-kicker">Rules Lexicon</p>
		<h2 class="rt-heading text-4xl uppercase italic sm:text-6xl">Keywords <span class="text-cyan-400">Core</span></h2>
	</div>

	<div class="space-y-12">
		<div class="flex items-center gap-4">
			<div class="w-12 h-1 bg-gradient-to-r from-cyan-500 to-transparent rounded-full"></div>
			<h3 class="text-xl font-black text-white uppercase tracking-widest">Icons & Symbols</h3>
		</div>
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{#each Object.entries(iconMappings) as [key, value]}
				<div
					class="rt-panel-quiet group relative flex items-center gap-4 overflow-hidden rounded-xl p-4 transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/10"
				>
					<div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div class="z-10 flex h-12 w-12 items-center justify-center rounded-lg border border-white/5 bg-slate-950 p-2 shadow-2xl transition-all duration-300 group-hover:border-cyan-500/30">
						<img src="/images/icons/{value.icon}" alt={value.hint} class="w-full h-full object-contain" />
					</div>
					<div class="min-w-0 z-10">
						<div class="text-white font-black text-xs uppercase tracking-tight truncate mb-0.5">
							{value.hint.split(' (')[0]}
						</div>
						<div class="text-[0.6rem] font-black text-cyan-500/50 uppercase tracking-widest truncate italic">
							{key.replace(/:/g, '')}
						</div>
					</div>
				</div>
			{/each}
			
			<div class="rt-panel-quiet group relative flex items-center gap-4 overflow-hidden rounded-xl p-4 transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/10">
				<div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
				<div class="z-10 flex h-12 w-12 items-center justify-center rounded-lg border border-white/5 bg-white shadow-2xl transition-all duration-300">
					<div class="font-black text-slate-950 text-sm">X</div>
				</div>
				<div class="min-w-0 z-10">
					<div class="text-white font-black text-xs uppercase tracking-tight truncate mb-0.5">Energy</div>
					<div class="text-[0.6rem] font-black text-cyan-500/50 uppercase tracking-widest truncate italic">rb_energy_X</div>
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-12">
		<div class="flex items-center gap-4">
			<div class="w-12 h-1 bg-gradient-to-r from-violet-500 to-transparent rounded-full"></div>
			<h3 class="text-xl font-black text-white uppercase tracking-widest">Specialized Keywords</h3>
		</div>
		<div class="grid md:grid-cols-2 gap-6">
			{#each keywords as kw}
				<div
					class="rt-panel flex flex-col gap-6 rounded-xl p-6 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/10"
				>
					<div class="flex items-center justify-between gap-4">
						<span 
							class="kw-inline-badge shadow-none" 
							style="background-color: {kw.color}; border: none;"
						>
							<span>{kw.name_en}</span>
						</span>
						<div class="text-slate-500 font-black tracking-[0.3em] text-[0.6rem] uppercase italic">
							{kw.name_th}
						</div>
					</div>
					<p class="text-slate-400 text-sm font-medium leading-relaxed italic pr-4">
						{kw.description_th}
					</p>
				</div>
			{/each}
		</div>
	</div>
</div>
