<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import Button from '../Button.svelte';

	const dispatch = createEventDispatcher<{ addScope: string }>();
	let isFormOpened: boolean = false;

	let scopeName = '';

	const handleAddScope = () => {
		dispatch('addScope', scopeName);
	};

	const handleToggleForm = () => {
		isFormOpened = !isFormOpened;
	};
</script>

{#if !isFormOpened}
	<button
		class="
			flex flex-col items-center justify-center p-2 h-full w-full border-[3px] text-slate-400
			border-surface-400 border-dashed rounded-lg hover:text-slate-300 hover:border-slate-300 duration-100 transition-colors
		"
		on:click={handleToggleForm}
	>
		<Icon width={'3rem'} icon="ri:add-line" />
		<span class=" text-lg">Новый скоп</span>
	</button>
{:else}
	<div class="h-full w-full rounded-lg border-slate-600 border-dashed border-[3px]">
		<div class="flex items-center">
			<h1 class="pl-2 grow">Добавить скоп</h1>
			<button
				class="
					h-10 w-10 flex items-center justify-center hover:bg-secondary-600 rounded
					rounded-tr-[calc(0.5rem-3px)] text-slate-200 hover:text-white transition-colors duration-100
				"
				on:click={handleToggleForm}
			>
				<Icon width={'1.6rem'} icon="ri:close-line" />
			</button>
		</div>
		<form class="flex flex-col space-y-4 p-2 pt-0" on:submit|preventDefault={handleAddScope}>
			<label class="label">
				<span>Название</span>
				<input
					class="input"
					type="text"
					name="name"
					placeholder="название"
					bind:value={scopeName}
				/>
			</label>
			<Button label="Добавить" htmlType="submit" />
		</form>
	</div>
{/if}
