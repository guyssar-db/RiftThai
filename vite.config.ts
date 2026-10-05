import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import 'dotenv/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		// GSAP exposes an ESM entry without a package-level `type: module`.
		// Bundle it during SSR so Vercel's Node runtime does not try to parse
		// node_modules/gsap/index.js as CommonJS.
		noExternal: ['gsap']
	}
});
