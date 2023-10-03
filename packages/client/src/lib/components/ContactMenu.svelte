<script lang="ts">
	import ContextMenuCard from './contextMenus/ContextMenuCard.svelte';

	let volume = 0;
</script>

<ContextMenuCard>
	<ul class="flex flex-col">
		<li>
			<button class="p-2 hover:bg-secondary-600 rounded w-full text-left">Профиль</button>
		</li>
		<li>
			<button class="p-2 hover:bg-secondary-600 rounded w-full text-left">Переместить</button>
		</li>
		<li>
			<button class="p-2 hover:bg-secondary-600 rounded w-full text-left"
				>Сделать владельцем канала</button
			>
		</li>
		<li class="border-y-2 border-surface-600 my-1 px-2">
			<p>Громкость пользователя</p>
			<div class="py-2">
				<input type="range" bind:value={volume} max="100" />
			</div>
		</li>
	</ul>
</ContextMenuCard>
