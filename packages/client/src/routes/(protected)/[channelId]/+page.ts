import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { core } = await parent();
	const { authStore, webSocketConnection } = core;
	const { channelId } = params;

	const socket = webSocketConnection.getSocket();
	socket?.emit('watch', { page: 'channel', params: { channelId } });

	return {
		authStore,
		channelId
	};
};
