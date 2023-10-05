<script lang="ts">
	import type { EntityWithAva } from '$lib/entities/entities';
	import Icon from '@iconify/svelte';
	import Ava from './Ava.svelte';

	export let item: EntityWithAva;
	export let isDraggable = true;
	export let icon = '';
	export let isAvaHighlighted = false;
</script>

<div
	class="group flex items-center space-x-2 bg-surface-700 hover:bg-slate-800/50 rounded-md p-1 {!isDraggable
		? 'cursor-pointer'
		: ''}"
>
	<div class="relative">
		<Ava width="w-8" label={item.name} src={item.avaUrl} />
		{#if isAvaHighlighted}
			<span class="absolute inset-0 border-green-400 border-[3px] rounded-full" />
		{/if}
	</div>
	<span class="{!icon ? 'grow' : ''} truncate pr-1">{item.id}: {item.name}</span>

	{#if icon}
		<span class="grow">
			<Icon {icon} />
		</span>
	{/if}
	{#if isDraggable}
		<span class="hidden group-hover:block"><Icon icon="ri:draggable" width="1.4rem" /></span>
	{/if}
</div>
