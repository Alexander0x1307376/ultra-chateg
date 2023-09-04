<script lang="ts">
	import type { Scope } from '$lib/entities/entities';
	import Card from '../Card.svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import Button from '../Button.svelte';
	import ContactDraggableItem from '../ContactDraggableItem.svelte';
	import { fade } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';

	const dispatch = createEventDispatcher<{ scopeUpdated: Scope; removeScope: void }>();

	const FLIP_DURATION_MS = 100;

	export let scopeData: Scope;
	export let dragType: string;

	let dropFromOthersDisabled = false;

	const handleSort = (e: any) => {
		e.detail.items.sort((itemA: any, itemB: any) => itemA.id - itemB.id);
		scopeData.members = e.detail.items;
	};
</script>

<Card noPadding={true}>
	<div class="w-full flex flex-wrap">
		<div class="w-full flex items-center">
			<h1 class="grow p-2">{scopeData.name}</h1>
			<button
				class="
					h-10 w-10 flex items-center justify-center hover:bg-secondary-600 rounded
					rounded-tr-[calc(0.5rem-3px)] text-slate-200 hover:text-white transition-colors duration-100
				"
				on:click={() => {
					dispatch('removeScope');
				}}
			>
				<Icon width={'1.6rem'} icon="ri:delete-bin-2-line" />
			</button>
		</div>
		<div
			class="grid grid-cols-2 w-full gap-2 p-2"
			use:dndzone={{
				items: scopeData.members,
				flipDurationMs: FLIP_DURATION_MS,
				autoAriaDisabled: true,
				type: dragType,
				dropFromOthersDisabled,
				dropTargetStyle: {}
			}}
			on:consider={handleSort}
			on:finalize={(e) => {
				handleSort(e);
				dispatch('scopeUpdated', scopeData);
			}}
		>
			{#if scopeData.members.length}
				{#each scopeData.members as item (item.id)}
					<div class="relative" animate:flip={{ duration: FLIP_DURATION_MS }}>
						<ContactDraggableItem {item} />
						{#if SHADOW_ITEM_MARKER_PROPERTY_NAME in item}
							<div
								class="absolute inset-0 border-2 border-dashed rounded-md border-surface-500 visible"
								in:fade={{ duration: 200, easing: cubicIn }}
							/>
						{/if}
					</div>
				{/each}
			{:else}
				<div
					class="pointer-events-none p-2 border-[2px] border-dashed border-surface-400 text-surface-400 rounded w-full text-center"
				>
					пусто
				</div>
			{/if}
		</div>
	</div>
</Card>
