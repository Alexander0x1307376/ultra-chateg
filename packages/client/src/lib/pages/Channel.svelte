<script lang="ts">
	import Ava from '$lib/components/Ava.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import ContactList from '$lib/components/ContactList.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import AddScope from '$lib/components/scopes/AddScope.svelte';

	const scopes = [
		{
			id: 111,
			name: 'Командиры'
		}
	];

	const user = {
		id: 111,
		name: 'Vasya Pupkin'
	};

	const users = [
		{
			id: 222,
			name: 'Николай Иванович',
			url: '222'
		},
		{
			id: 333,
			name: 'КрЕвЕдКо',
			url: '333'
		},
		{
			id: 444,
			name: 'Pussy Destroyer',
			url: '224442'
		},
		{
			id: 555,
			name: 'Калич',
			url: '555'
		},
		{
			id: 666,
			name: 'АццкиЙ СоТоНа 8==D',
			url: '666'
		}
	];

	const handleCreateScope = () => {
		console.log('handleCreateScope');
	};
</script>

<!-- route /[channelId] - страница конкретного канала -->
<MainLayout>
	<!-- sidebarHeader -->
	<div slot="sidebarHeader" class="flex items-center">
		<h1 class="grow">Контакты</h1>
		<Button icon="ri:logout-box-line" />
	</div>
	<!-- sidebarBody -->
	<div slot="sidebarBody" class="absolute inset-0 overflow-auto">
		<ContactList items={users} />
	</div>
	<!-- bottom -->
	<div slot="bottom" class="flex items-center space-x-2">
		<Ava label={user.name} />
		<span>{user.name}</span>
	</div>

	<div class="space-y-2">
		<Card>
			<div class="w-full flex items-center">
				<h1 class="grow">Канал "мегаканал"</h1>
				<div>
					<Button on:click={handleCreateScope} label="Кнопка" icon="ri:add-line" />
				</div>
			</div>
		</Card>
		<!-- Скопы -->
		<div>
			<AddScope />
		</div>
	</div>
</MainLayout>
