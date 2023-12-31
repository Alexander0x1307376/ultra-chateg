import type { PageLoad } from './$types';
export const prerender = false;

export const load: PageLoad = async ({ params, parent }) => {
	const { core } = await parent();
	const { authStore, channelDetailsRemoteStore, peerConnections, devicesService, memberAudios } =
		core;
	const { channelId } = params;

	channelDetailsRemoteStore.channelId = channelId;

	return {
		authStore,
		channelId,
		channelDetailsRemoteStore,
		peerConnections,
		devicesService,
		memberAudios
	};
};
