<script lang="ts">
	type Item = {
		id: string;
		name: string;
	};

	let channelMembers: Item[] = [
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

	let deprived: Item[] = [];
	$: channelMembers && setDerived();
	const setDerived = () => {
		deprived = channelMembers.map((item) => ({
			...item,
			name: 'D: ' + item.name
		}));
	};
</script>

<div class="flex">
	<div class="flex flex-col w-64">
		Основной
		<div class="flex space-x-2">
			<button
				on:click={() => {
					const id = Date.now().toString();
					channelMembers.push({
						id,
						name: 'Nnew_' + id
					});
					channelMembers = channelMembers;
				}}>ADD</button
			>
			<button
				on:click={() => {
					channelMembers.pop();
					channelMembers = channelMembers;
				}}
			>
				REMOVE
			</button>
		</div>
		<div>
			{#each channelMembers as channelMember (channelMember.id)}
				<div class="bg-surface-300 flex p-2">
					{channelMember.id}: {channelMember.name}
				</div>
			{/each}
		</div>
	</div>
	<div class="flex flex-col w-64">
		Производный
		<div class="flex space-x-2">
			<button
				on:click={() => {
					const id = Date.now().toString();
					deprived.push({
						id,
						name: 'Dnew_' + id
					});
					deprived = deprived;
				}}>ADD</button
			>
			<button
				on:click={() => {
					deprived.pop();
					deprived = deprived;
				}}
			>
				REMOVE
			</button>
		</div>
		<div>
			{#each deprived as channelMember (channelMember.id)}
				<div class="bg-surface-300 flex p-2">
					{channelMember.id}: {channelMember.name}
				</div>
			{/each}
		</div>
	</div>
</div>
