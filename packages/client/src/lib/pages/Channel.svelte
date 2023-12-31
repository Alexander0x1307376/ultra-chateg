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
	import type { User } from '$lib/entities/entities';
	import { fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { ChannelDetailsTransfer } from '$lib/features/channels/ChannelDetailsRemoteStore';
	import { goto } from '$app/navigation';
	import {
		channelDetailsTransferToVisual,
		isUserInScope
	} from '$lib/features/channels/channelUtils';
	import AudioInputMenu from '$lib/components/AudioInputMenu.svelte';
	import { contextMenuPosition } from '$lib/components/contextMenus/contextMenuPosition';
	import ContactMenu from '$lib/components/ContactMenu.svelte';
	import Icon from '@iconify/svelte';
	import MemberAudiosComponent from '$lib/components/MemberAudios.svelte';
	import { getContext } from 'svelte';
	import type { Core } from '$lib/bootstrap/bootstrap';

	// channelDetailsRemoteStore ---> channelVisual ---> channelTransfer ---> socketEmit ---> channelDetailsRemoteStore

	const core = getContext<Core>('core');
	const { channelDetailsRemoteStore, devicesService, memberAudios } = core;

	export let currentUser: User;

	$: isCurrentUserOwner = $channelDetailsRemoteStore?.ownerId == currentUser.id;

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
	$: {
		scopeDragType = isContactDragging ? CONTACTS_DRAG_TYPE : SCOPE_DRAG_TYPE;
	}
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

	// #region вспомогательные функции

	const handleCheckNewScopeName = (value: string) =>
		!channelDetailsVisual.scopes.some((item) => item.name === value);

	// #endregion

	// #region Изменеине данных скопов
	// TODO: Перетащить в системы
	const handleScopeUpdated = (scope: ScopeDataVisual) => {
		channelDetailsRemoteStore.updateOnServer((prev) => {
			if (!prev) return prev;
			const scopeIndex = prev.scopes.findIndex((item) => item.id === scope.id);
			if (scopeIndex !== -1) {
				prev.scopes[scopeIndex] = {
					id: scope.id,
					name: scope.name,
					members: scope.members.map((member) => Number(member.id))
				};
			} else {
				console.warn(`no scope fith id: ${scope.id} found`);
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

	const handleJoinScope = (scopeItemId: string) => {
		channelDetailsRemoteStore.joinScope(scopeItemId);
	};
	const handleLeaveScope = (scopeItemId: string) => {
		channelDetailsRemoteStore.leaveScope(scopeItemId);
	};

	// #endregion

	// #region Контекстные меню
	type Position = { x: number; y: number };
	let contactsContextMenuPosition: Position | undefined;
	let contactsContextMenuSelectedId: number | undefined;
	const handleContactsContextMenu = (
		data: { position: Position | undefined; itemId: string } | undefined
	) => {
		contactsContextMenuSelectedId = Number(data?.itemId);
		contactsContextMenuPosition = data?.position;
	};
	const handleContactsClickOutside = () => {
		contactsContextMenuPosition = undefined;
	};
	// #endregion

	// #region контекстое меню аудиоустройств текущего пользователя
	let isMicOn = true;
	const handleToggleMicrophone = () => {
		isMicOn = !isMicOn;
	};
	let audioContextMenuPosition: Position | undefined;
	const handleAudioContextMenu = (position: Position | undefined) => {
		audioContextMenuPosition = position;
	};
	const handleAudioContextMenuClickOutside = () => {
		audioContextMenuPosition = undefined;
	};
	// #endregion

	// #region аудиоустройства текущего пользователя
	// $: volume = $devicesService.volume;
	$: audioState = devicesService.audioState;
	$: volume = $audioState.volume;
	const handleSetVolume = (volume: number) => {
		devicesService.setVolume(volume);
	};
	const handleAudioDeviceChanged = (deviceId: string) => {
		devicesService.selectAudioDevice(deviceId);
	};

	$: devicesInfo = $devicesService.audioDevices.map((device) => ({
		key: device.deviceId,
		label: device.label
	}));
	$: selectedDeviceId = $devicesService.selectedAudioDevice?.deviceId || 'NONE';

	$: voiceValue = devicesService.noiseValue;
	// #endregion

	// #region индикаторы звука участников канала
	let currentUserAudioState = devicesService.audioState;
	$: memberAudioIndicators = $memberAudios;
	// #endregion
</script>

<MemberAudiosComponent />

{#if contactsContextMenuPosition && contactsContextMenuSelectedId}
	<div
		use:contextMenuPosition={{
			clickPosition: contactsContextMenuPosition,
			outsideClick: handleContactsClickOutside
		}}
		class="z-10"
	>
		<ContactMenu selectedMemberId={contactsContextMenuSelectedId} />
	</div>
{/if}

{#if audioContextMenuPosition}
	<div
		use:contextMenuPosition={{
			clickPosition: audioContextMenuPosition,
			outsideClick: handleAudioContextMenuClickOutside
		}}
		class="z-10"
	>
		<AudioInputMenu
			on:volumeChanged={(e) => handleSetVolume(e.detail)}
			on:audioDeviceChanged={(e) => handleAudioDeviceChanged(e.detail)}
			{volume}
			{devicesInfo}
			{selectedDeviceId}
		/>
	</div>
{/if}

<!-- route /[channelId] - страница конкретного канала -->
<MainLayout>
	<!-- sidebarHeader Заголовок сайдбара -->
	<div slot="sidebarHeader" class="flex items-center mb-2">
		<h1 class="grow">Контакты</h1>
		<Button
			icon="ri:logout-box-line"
			on:click={() => {
				goto('/');
			}}
		/>
	</div>
	<!-- sidebarBody Список контактов -->
	<div slot="sidebarBody" class="absolute inset-0 overflow-auto">
		<DndContactList
			contactsAudioData={memberAudioIndicators}
			isDraggable={isCurrentUserOwner}
			ownerId={$channelDetailsRemoteStore?.ownerId.toString()}
			items={channelDetailsVisual.members}
			dragType={CONTACTS_DRAG_TYPE}
			on:dragStart={() => {
				isContactDragging = true;
			}}
			on:dragEnd={() => {
				isContactDragging = false;
			}}
			on:contextMenuClick={(e) => {
				handleContactsContextMenu({
					position: {
						x: e.detail.event.x,
						y: e.detail.event.y
					},
					itemId: e.detail.itemId
				});
			}}
		/>
	</div>
	<!-- bottom Current Виджет текущего пользователя -->
	<div slot="bottom" class="">
		<div class="flex items-center space-x-2">
			<Ava label={currentUser.name} />
			<span class="grow">{currentUser.name}</span>
			<span>
				<Button
					on:click={handleToggleMicrophone}
					on:contextmenu={(e) => {
						handleAudioContextMenu({
							x: e.detail.x,
							y: e.detail.y
						});
					}}
					icon={isMicOn ? 'ri:mic-fill' : 'ri:mic-off-fill'}
				/>
			</span>
		</div>
		<div class="flex space-x-2 items-center">
			<span class="text-green-500">
				<Icon
					icon={$currentUserAudioState.isVoice
						? 'ri:checkbox-blank-circle-fill'
						: 'ri:checkbox-blank-circle-line'}
				/>
			</span>
			<span>
				{$voiceValue}
			</span>
		</div>
	</div>

	<!-- main content Скопы -->
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
										isLeaveButtonVisible={isUserInScope(
											currentUser.id,
											scopeView.item.id,
											$channelDetailsRemoteStore
										)}
										isEditControlsEnabled={isCurrentUserOwner}
										scopeData={scopeView.item}
										dragType={scopeDragType}
										on:joinClick={() => {
											scopeView.item?.id && handleJoinScope(scopeView.item.id);
										}}
										on:leaveClick={() => {
											scopeView.item?.id && handleLeaveScope(scopeView.item.id);
										}}
										on:scopeUpdated={(e) => {
											handleScopeUpdated(e.detail);
										}}
										on:removeScope={() => {
											scopeView.item && handleRemoveScope(scopeView.item.id);
										}}
									/>
								{:else if isCurrentUserOwner}
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
