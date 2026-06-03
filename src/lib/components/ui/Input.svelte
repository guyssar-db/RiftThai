<script lang="ts">
	interface Props {
		value?: string;
		type?: string;
		placeholder?: string;
		required?: boolean;
		class?: string;
		[key: string]: any;
	}

	let {
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		required = false,
		class: className = '',
		...restProps
	}: Props = $props();
</script>

<input
	bind:value
	{type}
	{placeholder}
	{required}
	class="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/60 transition {className}"
	{...restProps}
/>
