import type { PageLoad } from './$types';

// route /
export const load: PageLoad = async ({ parent }) => {
	const { core } = await parent();
	const { authStore, channelsRemoteStore } = core;

	return {
		authStore,
		channelsRemoteStore
	};
};
