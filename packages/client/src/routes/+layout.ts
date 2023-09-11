import { bootstrap } from '$lib/bootstrap/bootstrap';
import type { LayoutLoad } from './$types';

export const prerender = false;
export const ssr = false;

export const load: LayoutLoad = async () => {
	console.log(`[root layout loader]: app initialization...`);
	const core = bootstrap();
	const { authStore, authQueryService, webSocketConnection, realtimeService } = core;

	authStore.subscribe((authData) => {
		if (!authData) return;
		webSocketConnection.init();
	});

	webSocketConnection.subscribe((socket) => {
		if (!socket) return;
		realtimeService.bindSocket(socket);
	});

	const initialRefresh = async () => {
		await authQueryService.refresh();
	};
	await initialRefresh().then(() => {
		if (authStore.authData) {
			console.log('[root layout loader]: Auth data refreshed');
		} else {
			console.warn('[root layout loader]: No auth data refreshed');
		}
	});

	return {
		core
	};
};
