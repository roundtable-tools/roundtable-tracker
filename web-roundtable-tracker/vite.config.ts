/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
const config: UserConfig & { test: InlineConfig } = {
	base: '/roundtable-tracker/',
	plugins: [
		tailwindcss(),
		// Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
		TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
		react(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		sourcemap: true,
		modulePreload: {
			polyfill: false,
		},
	},
	test: {
		setupFiles: ['./vitest.setup.ts'],
		coverage: {
			// you can include other reporters, but 'json-summary' is required, json is recommended
			reporter: ['text', 'json-summary', 'json'],
			// If you want a coverage reports even if your tests are failing, include the reportOnFailure option
			reportOnFailure: true,
		},
	},
};

export default defineConfig(config);
