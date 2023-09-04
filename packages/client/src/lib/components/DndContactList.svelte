<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import type { EntityWithAva } from '$lib/entities/entities';
	import { createEventDispatcher } from 'svelte';
	import { notInternalDraggingBehaviour } from '$lib/utils/dndUtils';
	import ContactDraggableItem from './ContactDraggableItem.svelte';

	const dispatch = createEventDispatcher<{ dragStart: void; dragEnd: void }>();

	const FLIP_DURATION_MS = 300;

	export let items: EntityWithAva[];
	export let dragType: string;

	const { handleDndConsider: hc, handleDndFinalize: hf } = notInternalDraggingBehaviour(items, {
		dragStarted: () => {
			dispatch('dragStart');
		},
		dragEnded: () => {
			dispatch('dragEnd');
		}
	});
</script>

<div
	class="grid grid-cols-1 gap-2"
	use:dndzone={{
		items,
		flipDurationMs: FLIP_DURATION_MS,
		type: dragType,
		dropTargetStyle: {}
	}}
	on:consider={(e) => {
		items = hc(e);
	}}
	on:finalize={(e) => {
		items = hf(e);
	}}
>
	{#each items as item (item.id)}
		<div animate:flip={{ duration: FLIP_DURATION_MS }}>
			<ContactDraggableItem {item} />
		</div>
	{/each}
</div>
