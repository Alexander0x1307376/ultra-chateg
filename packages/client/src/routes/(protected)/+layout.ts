import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const result = await parent();

	console.log('protected layout', result);
	return {
		param: 'LOAD'
	};
};
