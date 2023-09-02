<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const handleClick = () => {
		dispatch('click');
	};
</script>

<button
	class="flex flex-col items-center justify-center p-2 h-72 w-48 border-[3px] text-slate-400 border-slate-400 border-dashed rounded-lg hover:text-slate-300 hover:border-slate-300 duration-100 transition-colors"
	on:click={handleClick}
>
	<Icon width={'3rem'} icon="ri:add-line" />
	<span class=" text-lg">Новый скоп</span>
</button>
