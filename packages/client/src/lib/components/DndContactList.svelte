<script lang="ts">
	import { flip } from 'svelte/animate';
	import { SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS, dndzone } from 'svelte-dnd-action';
	import type { EntityWithAva } from '$lib/entities/entities';
	import { createEventDispatcher } from 'svelte';
	import ContactDraggableItem from './ContactDraggableItem.svelte';

	const dispatch = createEventDispatcher<{
		dragStart: void;
		dragEnd: void;
		contextMenuClick: {
			event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement };
			itemId: string;
		};
	}>();

	const FLIP_DURATION_MS = 300;

	export let items: EntityWithAva[];
	export let ownerId: string = '';
	export let dragType: string;
	export let isDraggable = true;

	let itemsVisual: EntityWithAva[] = [];
	$: items && setItems();
	const setItems = () => {
		itemsVisual = items;
	};

	let draggingItemData:
		| {
				item: any;
				idCopy: string;
				index: number;
		  }
		| undefined = undefined;
	let shouldIgnoreDndEvents = false;
	const handleDndConsider = (
		e: CustomEvent<DndEvent<EntityWithAva>> & {
			target: HTMLDivElement;
		}
	) => {
		dispatch('dragStart');
		const { trigger, id } = e.detail.info;
		if (trigger === TRIGGERS.DRAG_STARTED) {
			const idx = itemsVisual.findIndex((item) => item.id === id);
			const idCopy = `${id}_copy_${Math.round(Math.random() * 100000)}`;

			draggingItemData = {
				idCopy,
				index: idx,
				item: idx !== -1 ? itemsVisual[idx] : undefined
			};

			e.detail.items = e.detail.items.filter((item) => {
				return !(SHADOW_ITEM_MARKER_PROPERTY_NAME in item);
			});
			e.detail.items.splice(idx, 0, { ...itemsVisual[idx], id: idCopy });

			itemsVisual = e.detail.items;
			shouldIgnoreDndEvents = true;
		} else if (!shouldIgnoreDndEvents) {
			itemsVisual = e.detail.items;
		} else {
			itemsVisual = [...itemsVisual];
		}

		return itemsVisual;
	};

	const handleDndFinalize = (
		e: CustomEvent<DndEvent<EntityWithAva>> & {
			target: HTMLDivElement;
		}
	) => {
		if (!shouldIgnoreDndEvents) {
			itemsVisual = e.detail.items;
		} else {
			shouldIgnoreDndEvents = false;
			if (draggingItemData) {
				itemsVisual[draggingItemData.index] = draggingItemData.item;
				draggingItemData = undefined;
			}
			itemsVisual = [...itemsVisual];
		}
		dispatch('dragEnd');
		return itemsVisual;
	};
</script>

<div
	class="grid grid-cols-1 gap-2"
	use:dndzone={{
		dragDisabled: !isDraggable,
		items: itemsVisual,
		flipDurationMs: FLIP_DURATION_MS,
		type: dragType,
		dropTargetStyle: {}
	}}
	on:consider={(e) => {
		itemsVisual = handleDndConsider(e);
	}}
	on:finalize={(e) => {
		itemsVisual = handleDndFinalize(e);
	}}
>
	{#each itemsVisual as item (item.id)}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			animate:flip={{ duration: FLIP_DURATION_MS }}
			on:contextmenu={(e) => {
				dispatch('contextMenuClick', { event: e, itemId: item.id });
			}}
		>
			<ContactDraggableItem
				{isDraggable}
				{item}
				icon={ownerId === item.id ? 'ri:vip-crown-line' : ''}
			/>
		</div>
	{/each}
</div>
