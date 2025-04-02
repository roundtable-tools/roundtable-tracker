import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslint from 'vite-plugin-eslint';

// https://vite.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths(), react(), eslint()],
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
