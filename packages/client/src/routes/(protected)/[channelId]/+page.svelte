<script lang="ts">
	import type { User } from '$lib/entities/entities';
	import Channel from '$lib/pages/Channel.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const mockUser: User = {
		id: -1,
		name: 'пользователь'
	};

	const { authStore, channelDetailsRemoteStore, peerConnections, devicesService } = data;
	$: currentUser = $authStore?.userData ? $authStore?.userData : mockUser;
</script>

<!-- route /[channelId] -->
<Channel {currentUser} {channelDetailsRemoteStore} {peerConnections} {devicesService} />
