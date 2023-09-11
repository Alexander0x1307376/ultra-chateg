<script context="module" lang="ts">
	export type ContactItem = { id: string; name: string; avaUrl?: string; url: string };
</script>

<script lang="ts">
	import Ava from './Ava.svelte';

	export let items: ContactItem[];
</script>

{#each items as item}
	<a
		href={item.url}
		class="flex items-center space-x-2 hover:bg-slate-800/50 rounded-l-[30px] rounded-r-md p-1"
	>
		<div>
			<Ava width="w-8" label={item.name} src={item.avaUrl} />
		</div>
		<span class="grow truncate pr-1">{item.name}</span>
	</a>
{/each}
