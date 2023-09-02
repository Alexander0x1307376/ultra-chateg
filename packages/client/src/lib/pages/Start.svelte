<script lang="ts">
	import Ava from '$lib/components/Ava.svelte';
	import BlockInCenter from '$lib/components/BlockInCenter.svelte';
	import Button from '$lib/components/Button.svelte';
	import ContactList from '$lib/components/ContactList.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';

	const handleClick = () => {
		console.log('click');
	};

	const user = {
		id: 111,
		name: 'Vasya Pupkin'
	};

	const channels = [
		{
			id: 222,
			name: 'Atata tretatex Abraham Inn Atata',
			url: '222'
		},
		{
			id: 333,
			name: 'Amasing Channel',
			url: '333'
		},
		{
			id: 444,
			name: 'мегаканал',
			url: '224442'
		},
		{
			id: 555,
			name: 'Десантно-штурмовой батальон "Фасолинка"',
			url: '555'
		},
		{
			id: 666,
			name: 'АццкиЙ СоТоНа 8==D',
			url: '666'
		}
	];
</script>

<!-- route: / - главная страница -->

<MainLayout>
	<!-- sidebarHeader -->
	<h1 slot="sidebarHeader">Каналы</h1>
	<!-- sidebarBody -->
	<div slot="sidebarBody" class="absolute inset-0 overflow-auto">
		<ContactList items={channels} />
	</div>
	<!-- bottom -->
	<div slot="bottom" class="flex items-center space-x-2">
		<Ava label={user.name} />
		<span>{user.name}</span>
	</div>

	<BlockInCenter>
		<div class="flex flex-col items-center space-y-4">
			<span>Войдите в канал или создайте свой</span>
			<Button on:click={handleClick} label="Создать канал" icon="ri:add-line" />
		</div>
	</BlockInCenter>
</MainLayout>
