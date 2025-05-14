import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		// Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
		TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
		tsconfigPaths(),
		react(),
	],
	build: {
		sourcemap: true,
	},
	test: {
		coverage: {
			// you can include other reporters, but 'json-summary' is required, json is recommended
			reporter: ['text', 'json-summary', 'json'],
			// If you want a coverage reports even if your tests are failing, include the reportOnFailure option
			reportOnFailure: true,
		},
	},
});
