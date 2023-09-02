<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	console.log('DATA', data);
</script>

<slot />
