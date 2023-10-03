<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import ContextMenuCard from './contextMenus/ContextMenuCard.svelte';

	export let volume: number;
	export let devicesInfo: { key: string; label: string }[];
	export let selectedDeviceId: string;

	const dispatch = createEventDispatcher<{
		volumeChanged: number;
		audioDeviceChanged: any;
	}>();

	$: selectedValue = selectedDeviceId;

	$: dispatch('volumeChanged', volume);
	$: dispatch('audioDeviceChanged', selectedValue);
</script>

<ContextMenuCard>
	<form class="flex flex-col">
		<h2 class="uppercase px-2 mt-2">Устройство ввода</h2>
		<div class="flex flex-col border-b-2 border-surface-600">
			{#each devicesInfo as { label, key } (key)}
				<label class="hover:bg-secondary-600 rounded flex items-center cursor-pointer">
					<span class="truncate grow p-2">{label}</span>
					<span class="p-2">
						<Icon
							icon={selectedValue === key
								? 'ri:checkbox-blank-circle-fill'
								: 'ri:checkbox-blank-circle-line'}
						/>
					</span>
					<input
						value={key}
						bind:group={selectedValue}
						type="radio"
						name="devices"
						class="hidden"
					/>
				</label>
			{/each}
		</div>
		<h2 class="uppercase px-2 mt-2">Громкость {volume}%</h2>
		<div class="p-2">
			<input type="range" bind:value={volume} max="100" />
		</div>
	</form>
</ContextMenuCard>
