import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import svelteKitInspector from 'svelte-kit-inspector';

export default defineConfig({
	plugins: [svelteKitInspector(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
