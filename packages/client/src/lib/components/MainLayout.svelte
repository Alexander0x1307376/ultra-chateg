<script lang="ts">
	import Card from '$lib/components/Card.svelte';
</script>

<div class="h-full w-full overflow-auto flex p-2 space-x-2">
	<!-- Left navbar -->
	<div class="w-60 flex flex-col space-y-2">
		<div class="grow">
			<Card>
				<div class="relative h-full flex flex-col">
					{#if $$slots.sidebarHeader}
						<div>
							<slot name="sidebarHeader" />
						</div>
					{/if}
					<div class="relative grow flex flex-col overflow-auto">
						<slot name="sidebarBody" />
					</div>
					{#if $$slots.sidebarFooter}
						<div>
							<slot name="sidebarFooter" />
						</div>
					{/if}
				</div>
			</Card>
		</div>
		{#if $$slots.bottom}
			<div>
				<Card>
					<slot name="bottom" />
				</Card>
			</div>
		{/if}
	</div>
	<!-- Main content -->
	<div class="grow overflow-auto">
		<slot />
	</div>
</div>
