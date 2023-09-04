<script lang="ts">
	export let noPadding: boolean = false;
</script>

<div class="h-full w-full card {noPadding ? 'p-0' : 'p-2'}">
	<!-- <div class="h-full w-full bg-surface-800 p-2 rounded-lg"> -->
	<slot />
</div>
