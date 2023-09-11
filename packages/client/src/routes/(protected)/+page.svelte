<script lang="ts">
	import type { User } from '$lib/entities/entities';
	import Start from '$lib/pages/Start.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const mockUser: User = {
		id: 'none',
		name: 'пользователь'
	};

	const { authStore, channelsRemoteStore } = data;
</script>

<!-- route / -->
<Start currentUser={$authStore?.userData || mockUser} {channelsRemoteStore} />
