import { bootstrap } from './bootstrap';

console.log('[init]: app initialization...');
const core = bootstrap();

core.authStore.subscribe((authData) => {
	if (authData) {
		console.log('INIT WEBSOCKETS', authData);
	}
});

export default core;
