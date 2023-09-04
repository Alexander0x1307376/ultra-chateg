<script lang="ts">
	import Ava from '$lib/components/Ava.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import AddScope from '$lib/components/scopes/AddScope.svelte';
	import Scope from '$lib/components/scopes/Scope.svelte';
	import DndContactList from '$lib/components/DndContactList.svelte';
	import type { Scope as ScopeData } from '$lib/entities/entities';

	// #region Старое
	// const users: Record<string, User> = {
	// 	'001': { id: '001', name: 'Николай Иванович' },
	// 	'002': { id: '002', name: 'КрЕвЕдКо' },
	// 	'003': { id: '003', name: 'Pussy Destroyer' },
	// 	'004': { id: '004', name: 'Калич' },
	// 	'005': { id: '005', name: 'АццкиЙ СоТоНа 8==D' },
	// 	'006': { id: '006', name: 'Николай Иванович' },
	// 	'007': { id: '007', name: 'Нагибатор228' },
	// 	'008': { id: '008', name: 'Pussy Destroyer 666' },
	// 	'009': { id: '009', name: 'Ататец' },
	// 	'010': { id: '010', name: 'User 004' }
	// };
	// #endregion

	const user = {
		id: '111',
		name: 'Vasya Pupkin'
	};

	// все члены канала
	let channelMembers = [
		{ id: '001', name: 'Николай Иванович' },
		{ id: '002', name: 'КрЕвЕдКо' },
		{ id: '003', name: 'Pussy Destroyer' },
		{ id: '004', name: 'Калич' },
		{ id: '005', name: 'АццкиЙ СоТоНа 8==D' },
		{ id: '006', name: 'Николай Иванович' },
		{ id: '007', name: 'Нагибатор228' },
		{ id: '008', name: 'Pussy Destroyer 666' },
		{ id: '009', name: 'Ататец' },
		{ id: '010', name: 'User 004' }
	];

	const contactsDragType = 'contacts';
	let scopes: ScopeData[] = [];
	let isContactDragging: boolean = false;
	let scopeDragType: 'scope' | 'contacts' = 'scope';

	$: {
		scopeDragType = isContactDragging ? 'contacts' : 'scope';
	}

	$: {
		console.log({ scopes });
	}

	const handleScopeUpdated = ({ detail }: { detail: ScopeData }) => {
		const scopeIndex = scopes.findIndex((item) => item.id === detail.id);
		if (scopeIndex !== -1) {
			scopes[scopeIndex] = detail;
		} else {
			console.warn(`no scope fith id: ${detail.id} found`);
		}
	};

	const handleCreateScope = (e: { detail: string }) => {
		scopes.push({
			id: Date.now().toString(),
			name: e.detail,
			members: []
		});
		scopes = scopes;
	};

	const handleRemoveScope = (scopeId: string) => {
		const scopeIndex = scopes.findIndex((scope) => scope.id === scopeId);
		if (scopeIndex !== -1) {
			scopes.splice(scopeIndex, 1);
			scopes = scopes;
		}
	};

	const removeUserFromScopes = (userId: string) => {
		const userIndex = channelMembers.findIndex((member) => member.id === userId);
		if (userIndex !== -1) {
			channelMembers.splice(userIndex, 1);
			channelMembers = channelMembers;
		}

		scopes.forEach(({ members }) => {
			const userIndex = members.findIndex((member) => member.id === userId);
			if (userIndex !== -1) {
				members.splice(userIndex, 1);
				members = members;
			}
		});
		scopes = scopes;
	};
</script>

<!-- route /[channelId] - страница конкретного канала -->
<MainLayout>
	<!-- sidebarHeader -->
	<div slot="sidebarHeader" class="flex items-center mb-2">
		<h1 class="grow">Контакты</h1>
		<Button icon="ri:logout-box-line" />
	</div>
	<!-- sidebarBody -->
	<div slot="sidebarBody" class="absolute inset-0 overflow-auto">
		<DndContactList
			items={channelMembers}
			dragType={contactsDragType}
			on:dragStart={() => {
				isContactDragging = true;
			}}
			on:dragEnd={() => {
				isContactDragging = false;
			}}
		/>
	</div>
	<!-- bottom -->
	<div slot="bottom" class="flex items-center space-x-2">
		<Ava label={user.name} />
		<span>{user.name}</span>
	</div>

	<!-- main content -->
	<div class="space-y-2 flex flex-col h-full">
		<!-- header -->
		<div>
			<Card>
				<div class="w-full flex items-center">
					<h1 class="grow">Канал "мегаканал"</h1>
					<div>
						<Button label="Кнопка" icon="ri:add-line" />
					</div>
				</div>
			</Card>
		</div>
		<!-- скопы и инфа юзера -->
		<div class="grow h-full w-full flex space-x-2">
			<!-- скопы -->
			<div class="relative grow">
				<div class="absolute inset-0 flex flex-col space-y-2 overflow-auto">
					{#each scopes as scope (scope.id)}
						<div>
							<Scope
								scopeData={scope}
								dragType={scopeDragType}
								on:scopeUpdated={handleScopeUpdated}
								on:removeScope={() => handleRemoveScope(scope.id)}
							/>
						</div>
					{/each}
					<div class="h-48">
						<AddScope
							on:addScope={(e) => {
								handleCreateScope(e);
							}}
						/>
					</div>
				</div>
			</div>
			<!-- инфа юзера -->
			<div class="w-64">
				<div>
					<Card>
						<h1>Скопы</h1>
						<div>
							{#each scopes as scope (scope.id)}
								<div>{scope.name}</div>
							{/each}
						</div>
					</Card>
				</div>
			</div>
		</div>
	</div>
</MainLayout>
