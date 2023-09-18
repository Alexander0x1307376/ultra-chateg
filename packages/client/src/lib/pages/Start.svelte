<script lang="ts">
	import Ava from '$lib/components/Ava.svelte';
	import BlockInCenter from '$lib/components/BlockInCenter.svelte';
	import Button from '$lib/components/Button.svelte';
	import ContactList from '$lib/components/ContactList.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import type { User } from '$lib/entities/entities';
	import type { ChannelsRemoteStore } from '$lib/features/channels/ChannelsRemoteStore';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	export let currentUser: User;
	export let channelsRemoteStore: ChannelsRemoteStore;
	$: channels = $channelsRemoteStore.map((item) => ({ ...item, url: item.id }));

	const modal: ModalSettings = {
		type: 'component',
		component: 'CreateChannelModal',
		backdropClasses: '!overflow-hidden',
		meta: { addChannel: channelsRemoteStore.addChannel }
	};
	const handleClick = () => {
		modalStore.trigger(modal);
	};
</script>

<!-- route: / - главная страница -->

<MainLayout>
	<!-- sidebarHeader -->
	<h1 slot="sidebarHeader">Каналы</h1>
	<!-- sidebarBody -->
	<div slot="sidebarBody" class="absolute inset-0 overflow-auto" data-sveltekit-preload-data="off">
		{#if channels.length}
			<ContactList items={channels} />
		{:else}
			<span>нет активных каналов</span>
		{/if}
	</div>
	<!-- bottom -->
	<div slot="bottom" class="flex items-center space-x-2">
		<Ava label={currentUser.name} />
		<span>{currentUser.name}</span>
	</div>

	<BlockInCenter>
		<div class="flex flex-col items-center space-y-4">
			<span>Войдите в канал или создайте свой</span>
			<Button on:click={handleClick} label="Создать канал" icon="ri:add-line" />
		</div>
	</BlockInCenter>
</MainLayout>
