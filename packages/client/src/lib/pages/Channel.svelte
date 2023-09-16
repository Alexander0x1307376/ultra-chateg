<script context="module" lang="ts">
	export type UserVisual = {
		id: string;
		name: string;
		avaUrl?: string;
	};
	export type ScopeDataVisual = {
		id: string;
		name: string;
		members: UserVisual[];
	};

	export type ChannelDetailsVisual = {
		id: string;
		name: string;
		members: UserVisual[];
		scopes: ScopeDataVisual[];
	};

	const setChannelDetailsVisualMock: ChannelDetailsVisual = {
		id: '-1',
		name: 'NONE',
		members: [],
		scopes: []
	};
</script>

<script lang="ts">
	import Ava from '$lib/components/Ava.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import AddScope from '$lib/components/scopes/AddScope.svelte';
	import Scope from '$lib/components/scopes/Scope.svelte';
	import DndContactList from '$lib/components/DndContactList.svelte';
	import type { Channel, EntityWithAva, Scope as ScopeData, User } from '$lib/entities/entities';
	import { fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type {
		ChannelDetailsRemoteStore,
		ChannelDetailsTransfer,
		ScopeTransfer
	} from '$lib/features/channels/ChannelDetailsRemoteStore';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		channelDetailsTransferToVisual,
		channelDetailsVisualToTransfer
	} from '$lib/features/channels/channelUtils';

	// channelDetailsRemoteStore ---> channelVisual ---> channelTransfer ---> socketEmit ---> channelDetailsRemoteStore

	export let currentUser: User;
	export let channelDetailsRemoteStore: ChannelDetailsRemoteStore;

	// #region channelDetailsRemoteStore ---> channelVisual
	let channelDetailsVisual: ChannelDetailsVisual = setChannelDetailsVisualMock;
	$: $channelDetailsRemoteStore && setChannelDetailsVisual();
	const setChannelDetailsVisual = () => {
		channelDetailsVisual = $channelDetailsRemoteStore
			? channelDetailsTransferToVisual($channelDetailsRemoteStore)
			: setChannelDetailsVisualMock;
	};
	// #endregion

	// #region dnd State
	const CONTACTS_DRAG_TYPE = 'contacts';
	const SCOPE_DRAG_TYPE = 'scope';
	let isContactDragging: boolean = false;
	let scopeDragType: 'scope' | 'contacts' = 'scope';
	// #endregion

	// #region scopesView
	// scopesView и связанная с ним логика нужны для корректной отработки анимации на
	// элементе формы добавления скопа, который для этого пришлось сделать частью списка
	type ScopeView = {
		key: string | 'last';
		item?: ScopeDataVisual;
	};

	$: scopesViewAndCreateForm = channelDetailsVisual?.scopes
		? ([
				...channelDetailsVisual.scopes.map((scope) => ({
					key: scope.id,
					item: scope
				})),
				{ key: 'last' }
		  ] as ScopeView[])
		: [];
	// #endregion

	$: {
		scopeDragType = isContactDragging ? CONTACTS_DRAG_TYPE : SCOPE_DRAG_TYPE;
	}

	const handleCheckNewScopeName = (value: string) =>
		!channelDetailsVisual.scopes.some((item) => item.name === value);

	// #region Изменеине данных
	const handleScopeUpdated = ({ detail }: { detail: ScopeDataVisual }) => {
		channelDetailsRemoteStore.updateOnServer((prev) => {
			if (!prev) return prev;
			const scopeIndex = prev.scopes.findIndex((item) => item.id === detail.id);
			if (scopeIndex !== -1) {
				prev.scopes[scopeIndex] = {
					id: detail.id,
					name: detail.name,
					members: detail.members.map((member) => Number(member.id))
				};
			} else {
				console.warn(`no scope fith id: ${detail.id} found`);
			}
			return prev;
		});
	};

	const handleCreateScope = (e: { detail: string }) => {
		channelDetailsRemoteStore.updateOnServer((prev) => {
			if (!prev) return prev;
			const newScope = {
				id: Date.now().toString(),
				name: e.detail,
				members: []
			};
			prev.scopes.push(newScope);
			return { ...prev } as ChannelDetailsTransfer;
		});
	};

	const handleRemoveScope = (scopeId: string) => {
		channelDetailsRemoteStore.updateOnServer((prev) => {
			if (!prev) return prev;
			prev.scopes = prev.scopes.filter((scope) => scope.id != scopeId);
			return prev as ChannelDetailsTransfer;
		});
	};

	// #endregion
</script>

<!-- route /[channelId] - страница конкретного канала -->
<MainLayout>
	<!-- sidebarHeader -->
	<div slot="sidebarHeader" class="flex items-center mb-2">
		<h1 class="grow">Контакты</h1>
		<Button
			icon="ri:logout-box-line"
			on:click={() => {
				goto('/');
			}}
		/>
	</div>
	<!-- sidebarBody -->
	<div slot="sidebarBody" class="absolute inset-0 overflow-auto">
		<DndContactList
			items={channelDetailsVisual.members}
			dragType={CONTACTS_DRAG_TYPE}
			on:dragStart={() => {
				isContactDragging = true;
			}}
			on:dragEnd={() => {
				isContactDragging = false;
			}}
		/>
	</div>
	<!-- bottom -->
	<div slot="bottom" class="flex items-center space-x-2">
		<Ava label={currentUser.name} />
		<span>{currentUser.name}</span>
	</div>

	<!-- main content -->
	<div class="space-y-2 flex flex-col h-full">
		<!-- header -->
		<div>
			<Card>
				<div class="w-full flex items-center">
					<h1 class="grow">Канал {channelDetailsVisual.name}</h1>
					<div>
						<Button label="Кнопка" icon="ri:add-line" />
					</div>
				</div>
			</Card>
		</div>
		<!-- скопы и инфа юзера -->
		<div class="grow h-full w-full flex space-x-2">
			<!-- скопы -->
			<div class="relative grow">
				<div class="absolute inset-0 overflow-y-auto overflow-x-hidden">
					<div class="flex flex-col space-y-2 h-full">
						{#each scopesViewAndCreateForm as scopeView (scopeView.key)}
							<div animate:flip={{ duration: 250 }} in:fade out:scale|local>
								{#if scopeView.item}
									<Scope
										scopeData={scopeView.item}
										dragType={scopeDragType}
										on:scopeUpdated={handleScopeUpdated}
										on:removeScope={() => {
											scopeView.item && handleRemoveScope(scopeView.item.id);
										}}
									/>
								{:else}
									<div class="h-48 mb-5">
										<AddScope
											checkName={handleCheckNewScopeName}
											on:addScope={(e) => {
												handleCreateScope(e);
											}}
										/>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
			<!-- инфа юзера -->
			<div class="w-64">
				<div>
					<Card>
						<h1>Скопы</h1>
						<div>
							{#each channelDetailsVisual.scopes as scope (scope.id)}
								<div>{scope.name}</div>
							{/each}
						</div>
					</Card>
				</div>
			</div>
		</div>
	</div>
</MainLayout>
