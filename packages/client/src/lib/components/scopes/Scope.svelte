<script context="module" lang="ts">
	export type ScopeDataVisual = {
		id: string;
		name: string;
		members: UserVisual[];
	};
</script>

<script lang="ts">
	import Card from '../Card.svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import ContactDraggableItem from '../ContactDraggableItem.svelte';
	import { fade } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';
	import { createEventDispatcher, getContext } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { UserVisual } from '$lib/pages/Channel.svelte';
	import type { Core } from '$lib/bootstrap/bootstrap';
	import type { AudioStateItem } from '$lib/features/audio/MemberAudios';

	const { memberAudios } = getContext<Core>('core');

	export let scopeData: ScopeDataVisual;
	export let dragType: string;
	export let isEditControlsEnabled = true;
	export let isLeaveButtonVisible = false;

	$: audioIndocators = scopeData.members.reduce((acc, item) => {
		if (item.id in $memberAudios) {
			acc[item.id] = $memberAudios[item.id];
		}
		return acc;
	}, {} as Record<string, AudioStateItem>);

	const dispatch = createEventDispatcher<{
		scopeUpdated: ScopeDataVisual;
		removeScope: void;
		joinClick: void;
		leaveClick: void;
	}>();
	const FLIP_DURATION_MS = 100;

	const handleSort = (e: any) => {
		e.detail.items.sort((itemA: any, itemB: any) => itemA.id - itemB.id);
		scopeData.members = e.detail.items;
	};

	// Изменение имени
	let name: string;
	let preservedName: string;
	let isEditableHeader = false;
	$: scopeData.name && setName();
	const setName = () => {
		name = scopeData.name;
	};
	const handleEditMode = () => {
		isEditableHeader = true;
		preservedName = name;
		console.log({
			preservedName,
			name
		});
	};
	const handleSaveName = () => {
		console.log('handleSaveName', { name });
		if (!name) {
			handleCancelEditName();
			return;
		}
		isEditableHeader = false;
		preservedName = '';
		scopeData.name = name;
		dispatch('scopeUpdated', scopeData);
	};
	const handleCancelEditName = () => {
		isEditableHeader = false;
		name = preservedName;
	};
	const fieldSelection = (node: HTMLElement) => {
		node.focus();
		const range = document.createRange();
		range.selectNodeContents(node);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	};
</script>

<Card noPadding={true}>
	<div class="w-full flex flex-wrap group">
		<div class="w-full flex items-center">
			<!-- Название -->
			{#if isEditableHeader}
				<h1
					use:fieldSelection
					style={'font-weight: 400;'}
					contenteditable="true"
					bind:textContent={name}
					on:keydown={(e) => {
						if (e.key === 'Enter') handleSaveName();
						else if (e.key === 'Escape') handleCancelEditName();
					}}
					class="mx-2 py-2 ring-0 outline-none border-b-[1px] border-surface-300 pb-0 mb-2"
				>
					{name}
				</h1>
			{:else}
				<h1 class="mx-2 py-2 ring-0 outline-none border-b-[1px] border-transparent">
					{name}
				</h1>
			{/if}

			<!-- Кнопы редактирования -->
			{#if isEditControlsEnabled}
				{#if !isEditableHeader}
					<button
						class="flex items-center justify-center rounded text-slate-300 hover:text-white transition-colors duration-100"
						on:click={handleEditMode}
					>
						<Icon width={'1.4rem'} icon="ri:edit-2-line" />
					</button>
				{/if}
				{#if isEditableHeader}
					<button
						class="flex items-center justify-center rounded text-green-300 hover:text-green-500 transition-colors duration-100"
						on:click={handleSaveName}
					>
						<Icon width={'1.6rem'} icon="ri:check-line" />
					</button>
					<button
						class="flex items-center justify-center rounded text-red-300 hover:text-red-400 transition-colors duration-100"
						on:click={handleCancelEditName}
					>
						<Icon width={'1.6rem'} icon="ri:close-line" />
					</button>
				{/if}
			{/if}

			<!-- Кнопы входа-выхода -->
			{#if !isLeaveButtonVisible}
				<button
					class="flex items-center justify-center rounded text-green-300 hover:bg-surface-500 hover:text-white transition-colors duration-100 p-1 mx-1"
					on:click={() => {
						dispatch('joinClick');
					}}
				>
					<span>Войти</span>
					<Icon width={'1.4rem'} icon="ri:user-add-line" />
				</button>
			{:else}
				<button
					class="flex items-center justify-center rounded text-yellow-300 hover:bg-surface-500 hover:text-white transition-colors duration-100 p-1 mx-1"
					on:click={() => {
						dispatch('leaveClick');
					}}
				>
					<span>Выйти</span>
					<Icon width={'1.4rem'} icon="ri:user-shared-2-line" />
				</button>
			{/if}

			<span class="grow" />

			{#if isEditControlsEnabled}
				<button
					class="
						flex h-10 w-10 items-center justify-center rounded
						text-slate-300 hover:text-white transition-colors duration-100
					"
					on:click={() => {
						dispatch('removeScope');
					}}
				>
					<Icon width={'1.2rem'} icon="ri:delete-bin-2-line" />
				</button>
			{/if}
		</div>
		<div
			class="grid grid-cols-2 w-full gap-2 p-2"
			use:dndzone={{
				items: scopeData.members,
				flipDurationMs: FLIP_DURATION_MS,
				autoAriaDisabled: true,
				type: dragType,
				dropFromOthersDisabled: false,
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
						<ContactDraggableItem {item} isAvaHighlighted={audioIndocators[item.id]?.isVoice} />
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
