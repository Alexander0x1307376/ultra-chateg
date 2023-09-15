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
</script>

<script lang="ts">
	import Ava from '$lib/components/Ava.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import AddScope from '$lib/components/scopes/AddScope.svelte';
	import Scope from '$lib/components/scopes/Scope.svelte';
	import DndContactList from '$lib/components/DndContactList.svelte';
	import type { EntityWithAva, Scope as ScopeData, User } from '$lib/entities/entities';
	import { fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { ScopeTransfer } from '$lib/features/channels/ChannelDetailsRemoteStore';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// members ---> membersVisual ---> socketEmit ---> members
	// scopes ---> scopesVisual ---> socketEmit ---> scopes

	export let currentUser: User;
	export let members: User[];
	export let scopes: ScopeTransfer[];

	// представление данных в dnd-системе
	let scopesVisual: ScopeDataVisual[] = [];

	$: channelMembers =
		(members.map((member) => ({
			id: member.id.toString(),
			name: member.name
		})) as EntityWithAva[]) || [];

	// все члены канала
	// let channelMembers: EntityWithAva[] = [
	// 	{ id: '001', name: 'Николай Иванович' },
	// 	{ id: '002', name: 'КрЕвЕдКо' },
	// 	{ id: '003', name: 'Pussy Destroyer' },
	// 	{ id: '004', name: 'Калич' },
	// 	{ id: '005', name: 'АццкиЙ СоТоНа 8==D' },
	// 	{ id: '006', name: 'Николай Иванович' },
	// 	{ id: '007', name: 'Нагибатор228' },
	// 	{ id: '008', name: 'Pussy Destroyer 666' },
	// 	{ id: '009', name: 'Ататец' },
	// 	{ id: '010', name: 'User 004' }
	// ];

	const CONTACTS_DRAG_TYPE = 'contacts';
	const SCOPE_DRAG_TYPE = 'scope';
	let isContactDragging: boolean = false;
	let scopeDragType: 'scope' | 'contacts' = 'scope';

	// scopesView и связанная с ним логика нужны для корректной отработки анимации на
	// элементе формы добавления скопа, который для этого пришлось сделать частью списка
	type ScopeView = {
		key: string | 'last';
		item?: ScopeDataVisual;
	};

	$: scopesView = [
		...scopesVisual.map((scope) => ({
			key: scope.id,
			item: scope
		})),
		{ key: 'last' }
	] as ScopeView[];

	$: {
		scopeDragType = isContactDragging ? CONTACTS_DRAG_TYPE : SCOPE_DRAG_TYPE;
	}

	const handleCheckNewScopeName = (value: string) =>
		!scopesVisual.some((item) => item.name === value);

	// #region Изменеине данных
	const handleScopeUpdated = ({ detail }: { detail: ScopeDataVisual }) => {
		const scopeIndex = scopesVisual.findIndex((item) => item.id === detail.id);
		if (scopeIndex !== -1) {
			scopesVisual[scopeIndex] = detail;
		} else {
			console.warn(`no scope fith id: ${detail.id} found`);
		}
	};

	const handleCreateScope = (e: { detail: string }) => {
		scopesVisual.push({
			id: Date.now().toString(),
			name: e.detail,
			members: []
		});
		scopesVisual = scopesVisual;
	};

	const handleRemoveScope = (scopeId: string) => {
		const scopeIndex = scopesVisual.findIndex((scope) => scope.id === scopeId);
		if (scopeIndex !== -1) {
			scopesVisual.splice(scopeIndex, 1);
			scopesVisual = scopesVisual;
		}
	};

	const removeUserFromScopes = (userId: string) => {
		const userIndex = channelMembers.findIndex((member) => member.id === userId);
		if (userIndex !== -1) {
			channelMembers.splice(userIndex, 1);
			channelMembers = channelMembers;
		}

		scopesVisual.forEach(({ members }) => {
			const userIndex = members.findIndex((member) => member.id === userId);
			if (userIndex !== -1) {
				members.splice(userIndex, 1);
				members = members;
			}
		});
		scopesVisual = scopesVisual;
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
			items={channelMembers}
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
					<h1 class="grow">Канал "мегаканал"</h1>
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
						{#each scopesView as scopeView (scopeView.key)}
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
							{#each scopesVisual as scope (scope.id)}
								<div>{scope.name}</div>
							{/each}
						</div>
					</Card>
				</div>
			</div>
		</div>
	</div>
</MainLayout>
