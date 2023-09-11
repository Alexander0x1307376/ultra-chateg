<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import Card from '../Card.svelte';
	import Button from '../Button.svelte';
	import { goto } from '$app/navigation';
	import type { AckResponse, Channel } from '$lib/features/channels/ChannelsRemoteStore';

	export let parent: { onClose: () => void };

	const modalStore = getModalStore();

	let name = '';

	const handleSubmit = async () => {
		if (!name) return;
		const trimmedName = name.trim();
		if (!trimmedName) return;

		try {
			const response: AckResponse<Channel> = await $modalStore[0].meta?.addChannel?.({
				name: trimmedName
			});
			if (response?.data?.id) {
				goto(response?.data?.id);
			}
			console.log({ response });
			modalStore.close();
		} catch (e) {
			console.warn('ERR in MODAL');
		}
	};
</script>

{#if $modalStore[0]}
	<div class="w-96">
		<Card noPadding>
			<div class="flex items-center">
				<h2 class="p-4 grow">Создать канал</h2>
				<Button icon="ri:close-fill" type="transparent" on:click={parent.onClose} />
			</div>
			<form class="flex flex-col space-y-4 p-4" on:submit|preventDefault={handleSubmit}>
				<input bind:value={name} name="login" class="input" type="text" placeholder="название" />
				<button type="submit" class="btn variant-filled-primary w-full">Создать</button>
			</form>
			<slot />
		</Card>
	</div>
{/if}
