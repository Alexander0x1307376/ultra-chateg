import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import svelteKitInspector from 'svelte-kit-inspector';
import FullReload from 'vite-plugin-full-reload';

export default defineConfig({
	plugins: [svelteKitInspector(), sveltekit(), FullReload(['./src/**/*'])],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
