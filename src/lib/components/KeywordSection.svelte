<script lang="ts">
	import { iconMappings, type Keyword } from '$lib/data/keywords';
	let { keywords } = $props<{ keywords: Keyword[] }>();
</script>

<div class="animate-in fade-in mx-auto max-w-7xl space-y-16 duration-1000">
	<div class="space-y-4 text-center">
		<p class="rt-kicker">พจนานุกรมกติกา</p>
		<h2 class="rt-heading text-4xl uppercase italic sm:text-6xl">
			คีย์เวิร์ด<span class="text-cyan-400">หลัก</span>
		</h2>
	</div>

	<div class="space-y-12">
		<div class="flex items-center gap-4">
			<div class="h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-transparent"></div>
			<h3 class="text-xl font-black tracking-widest text-white uppercase">ไอคอนและสัญลักษณ์</h3>
		</div>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each Object.entries(iconMappings) as [key, value]}
				<div
					class="rt-panel-quiet group relative flex items-center gap-4 overflow-hidden rounded-xl p-4 transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/10"
				>
					<div
						class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
					></div>
					<div
						class="z-10 flex h-12 w-12 items-center justify-center rounded-lg border border-white/5 bg-slate-950 p-2 shadow-2xl transition-all duration-300 group-hover:border-cyan-500/30"
					>
						<img
							src="/images/icons/{value.icon}"
							alt={value.hint}
							class="h-full w-full object-contain"
						/>
					</div>
					<div class="z-10 min-w-0">
						<div class="mb-0.5 truncate text-xs font-black tracking-tight text-white uppercase">
							{value.hint.split(' (')[0]}
						</div>
						<div
							class="truncate text-[0.6rem] font-black tracking-widest text-cyan-500/50 uppercase italic"
						>
							{key.replace(/:/g, '')}
						</div>
					</div>
				</div>
			{/each}

			<div
				class="rt-panel-quiet group relative flex items-center gap-4 overflow-hidden rounded-xl p-4 transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/10"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
				></div>
				<div
					class="z-10 flex h-12 w-12 items-center justify-center rounded-lg border border-white/5 bg-white shadow-2xl transition-all duration-300"
				>
					<div class="text-sm font-black text-slate-950">X</div>
				</div>
				<div class="z-10 min-w-0">
					<div class="mb-0.5 truncate text-xs font-black tracking-tight text-white uppercase">
						พลังงาน
					</div>
					<div
						class="truncate text-[0.6rem] font-black tracking-widest text-cyan-500/50 uppercase italic"
					>
						rb_energy_X
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-12">
		<div class="flex items-center gap-4">
			<div class="h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-transparent"></div>
			<h3 class="text-xl font-black tracking-widest text-white uppercase">คีย์เวิร์ดเฉพาะ</h3>
		</div>
		<div class="grid gap-6 md:grid-cols-2">
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
						<div class="text-[0.6rem] font-black tracking-[0.3em] text-slate-500 uppercase italic">
							{kw.name_th}
						</div>
					</div>
					<p class="pr-4 text-sm leading-relaxed font-medium text-slate-400 italic">
						{kw.description_th}
					</p>
				</div>
			{/each}
		</div>
	</div>
</div>
