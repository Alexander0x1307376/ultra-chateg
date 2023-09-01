import { bootstrap } from '$lib/bootstrap/bootstrap';
import type { LayoutLoad } from './$types';

export const prerender = false;
export const ssr = false;

export const load: LayoutLoad = async () => {
	console.log(`[root layout loader]: app initialization...`);
	const core = bootstrap();
	const { authStore, authQueryService } = core;

	authStore.subscribe((authData) => {
		if (authData) {
			console.log('INIT WEBSOCKETS', authData);
		}
	});

	const initialRefresh = async () => {
		console.log('INITIAL_REFRESH');
		await authQueryService.refresh();
	};
	await initialRefresh().then(() => {
		if (authStore.authData) {
			console.log('[root layout loader]: Auth data refreshed. Start socket connection');
		} else {
			console.log(
				"[root layout loader]: No auth data refreshed. Socket connection won't be established"
			);
		}
	});

	return {
		core
	};
};
