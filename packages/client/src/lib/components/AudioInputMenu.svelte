<script lang="ts">
	import Icon from '@iconify/svelte';

	const devices = [
		{ value: 'vebka', label: 'Вебка HUEBKA' },
		{ value: 'garnitura', label: 'Наушники SHADES ATATA Z1 Pro' },
		{ value: 'vr_hemlet', label: 'Окулус КУВЕСТ 2' },
		{ value: 'shur', label: 'SHUR ULTRA MEGO PRO' },
		{ value: 'mobila', label: 'Nokia 6111' }
	];

	let selectedValue: string = devices[0].value;
	let volume = 50;
</script>

<div class="w-72 bg-surface-900 shadow-md text-slate-200 shadow-black/50 rounded-md p-2">
	<form class="flex flex-col">
		<h2 class="uppercase px-2 mt-2">Устройство ввода</h2>
		<div class="flex flex-col border-b-2 border-surface-600">
			{#each devices as { label, value } (value)}
				<label class="hover:bg-secondary-600 rounded flex items-center cursor-pointer">
					<span class="truncate grow p-2">{label}</span>
					<span class="p-2">
						<Icon
							icon={selectedValue === value
								? 'ri:checkbox-blank-circle-fill'
								: 'ri:checkbox-blank-circle-line'}
						/>
					</span>
					<input {value} bind:group={selectedValue} type="radio" name="devices" class="hidden" />
				</label>
			{/each}
		</div>
		<h2 class="uppercase px-2 mt-2">Громкость</h2>
		<div class="p-2">
			<input type="range" bind:value={volume} max="100" />
		</div>
	</form>
</div>
