import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { core } = await parent();

	const { authStore } = core;

	if (authStore.authData) {
		console.log(`[route '/']: there's authData`);
	} else {
		console.log(`[route '/']: there isn't authData`);
		throw redirect(303, '/login');
	}

	return {
		atata: {
			name: 'ATATA'
		}
	};
};
