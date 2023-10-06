<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import ContextMenuCard from './contextMenus/ContextMenuCard.svelte';
	import type { Core } from '$lib/bootstrap/bootstrap';

	export let itemId: string | undefined = undefined;
	const { memberAudios } = getContext<Core>('core');

	let localVolume: number;
	onMount(() => {
		if (itemId) localVolume = Math.trunc($memberAudios[itemId].volume);
	});

	$: localVolume && setVolume(localVolume);
	const setVolume = (inputVolume: number) => {
		if (!itemId) return;
		memberAudios.setMemberVolume(parseInt(itemId), inputVolume);
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
		<li>
			<button class="p-2 hover:bg-secondary-600 rounded w-full text-left"
				>Сделать владельцем канала</button
			>
		</li>
		<li class="border-y-2 border-surface-600 my-1 px-2">
			<span class="inline-flex space-x-1">
				<p>Громкость пользователя</p>
				<span>{localVolume}%</span>
			</span>
			<div class="py-2">
				<input type="range" bind:value={localVolume} max="100" />
			</div>
		</li>
	</ul>
</ContextMenuCard>
