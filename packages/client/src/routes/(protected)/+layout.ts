import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { core } = await parent();
	const { authStore, webSocketConnection } = core;

	if (authStore.authData) {
		console.log(`[route layout '/']: there's authData`);
		const socket = webSocketConnection.getSocket();
		socket?.emit('watch', { page: 'main' });
	} else {
		console.log(`[route layout '/']: there isn't authData`);
		throw redirect(303, '/login');
	}
	return {};
};
