<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import ContextMenuCard from './contextMenus/ContextMenuCard.svelte';
	import type { Core } from '$lib/bootstrap/bootstrap';

	export let selectedMemberId: number;
	const { memberAudios, authStore, channelDetailsRemoteStore } = getContext<Core>('core');
	const DEFAULT_VOLUME = 55;

	let localVolume: number = DEFAULT_VOLUME;
	$: currentUserId = $authStore?.userData.id;
	$: ownerId = $channelDetailsRemoteStore?.ownerId;
	$: isOwner = currentUserId === ownerId;
	$: isCurrentUser = currentUserId === selectedMemberId;

	onMount(() => {
		if (!isCurrentUser) localVolume = Math.trunc($memberAudios[selectedMemberId].volume);
	});

	$: localVolume && setVolume(localVolume);
	const setVolume = (inputVolume: number) => {
		if (!selectedMemberId) return;
		memberAudios.setMemberVolume(selectedMemberId, inputVolume);
	};

	const handleChangeOwner = () => {
		if (!(isOwner && currentUserId)) return;
		channelDetailsRemoteStore.updateOnServer((prev) => {
			if (!prev) return prev;
			prev.ownerId = selectedMemberId;
			return prev;
		});
	};
</script>

<ContextMenuCard>
	<ul class="flex flex-col">
		<li>
			<button class="p-2 hover:bg-secondary-600 rounded w-full text-left">Профиль</button>
		</li>
		<li>
			<button class="p-2 hover:bg-secondary-600 rounded w-full text-left">Переместить</button>
		</li>
		{#if isOwner && !isCurrentUser}
			<li>
				<button
					class="p-2 hover:bg-secondary-600 rounded w-full text-left"
					on:click={handleChangeOwner}>Сделать владельцем канала</button
				>
			</li>
		{/if}
		{#if !isCurrentUser}
			<li class="border-y-2 border-surface-600 my-1 px-2">
				<span class="inline-flex space-x-1">
					<p>Громкость</p>
					<span>{localVolume}%</span>
				</span>
				<div class="py-2">
					<input type="range" bind:value={localVolume} max="100" />
				</div>
			</li>
		{/if}
	</ul>
</ContextMenuCard>
