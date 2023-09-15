<script lang="ts">
	import type { User } from '$lib/entities/entities';
	import Channel from '$lib/pages/Channel.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const mockUser: User = {
		id: -1,
		name: 'пользователь'
	};

	const { authStore, channelDetailsRemoteStore } = data;

	$: members = $channelDetailsRemoteStore?.members || [];
	$: scopes = $channelDetailsRemoteStore?.scopes || [];
</script>

<!-- route /[channelId] -->
<Channel currentUser={$authStore?.userData || mockUser} {members} {scopes} />
