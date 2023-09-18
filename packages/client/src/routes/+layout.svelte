<script lang="ts">
	import '../app.postcss';
	import { Modal, initializeStores } from '@skeletonlabs/skeleton';
	import { modalComponentRegistry } from '$lib/components/modals/modalComponentRegistry';
	initializeStores();
</script>

<svelte:body on:contextmenu|preventDefault />
<Modal components={modalComponentRegistry} />
<slot />
