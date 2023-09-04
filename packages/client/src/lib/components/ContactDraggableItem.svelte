<script lang="ts">
	import type { EntityWithAva } from '$lib/entities/entities';
	import Icon from '@iconify/svelte';
	import Ava from './Ava.svelte';

	export let item: EntityWithAva;
</script>

<div class="group flex items-center space-x-2 bg-surface-700 hover:bg-slate-800/50 rounded-md p-1">
	<div>
		<Ava width="w-8" label={item.name} src={item.avaUrl} />
	</div>
	<span class="grow truncate pr-1">{item.id}: {item.name}</span>
	<span class="hidden group-hover:block"><Icon icon="ri:draggable" width="1.4rem" /></span>
</div>
