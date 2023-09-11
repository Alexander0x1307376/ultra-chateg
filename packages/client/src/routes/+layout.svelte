<script lang="ts">
	import '../app.postcss';
	import { Modal, initializeStores } from '@skeletonlabs/skeleton';
	import { modalComponentRegistry } from '$lib/components/modals/modalComponentRegistry';
	initializeStores();
</script>

<Modal components={modalComponentRegistry} />
<slot />
