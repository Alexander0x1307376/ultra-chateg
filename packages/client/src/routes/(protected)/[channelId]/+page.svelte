<script lang="ts">
	import type { User } from '$lib/entities/entities';
	import Channel from '$lib/pages/Channel.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const mockUser: User = {
		id: 'none',
		name: 'пользователь'
	};

	const { authStore } = data;
</script>

<!-- route /[channelId] -->
<Channel currentUser={$authStore?.userData || mockUser} />
