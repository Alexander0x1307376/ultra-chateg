<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	type ButtonType = 'default' | 'transparent';

	export let icon: string | undefined = undefined;
	export let label: string | undefined = undefined;
	export let type: ButtonType = 'default';
	export let htmlType: 'button' | 'submit' | 'reset' | null | undefined = 'button';

	const dispatch = createEventDispatcher();

	const styles: Record<ButtonType, string> = {
		default: 'variant-ghost-surface',
		transparent: '!bg-transparent'
	};
</script>

<button
	on:click={() => dispatch('click')}
	type={htmlType}
	class="{icon && !label ? 'btn-icon' : 'btn'} {styles[type]}"
>
	{#if icon}
		<span><Icon width={'1.5rem'} {icon} /></span>
	{/if}
	{#if !label && !icon}
		<span>Кнопа</span>
	{/if}
	{#if label}
		<span>{label}</span>
	{/if}
</button>
