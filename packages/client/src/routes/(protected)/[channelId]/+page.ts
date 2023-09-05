import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { core } = await parent();
	const { authStore } = core;
	const { channelId } = params;

	return {
		authStore,
		channelId
	};
};
