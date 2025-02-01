import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		coverage: {
			// you can include other reporters, but 'json-summary' is required, json is recommended
			reporter: ['text', 'json-summary', 'json'],
			// If you want a coverage reports even if your tests are failing, include the reportOnFailure option
			reportOnFailure: true,
		},
	},
});
