<script lang="ts">
	import '../app.postcss';
	import { Modal, initializeStores } from '@skeletonlabs/skeleton';
	import { modalComponentRegistry } from '$lib/components/modals/modalComponentRegistry';
	import { setContext } from 'svelte';
	import type { LayoutData } from './$types';
	initializeStores();

	export let data: LayoutData;
	const { core } = data;
	setContext('core', core);
</script>

<svelte:body on:contextmenu|preventDefault />
<Modal components={modalComponentRegistry} />
<slot />
