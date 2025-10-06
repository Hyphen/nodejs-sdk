import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		sequence: {
			concurrent: false, // run tests in each file sequentially
		},
		coverage: {
			reporter: ['text', 'json', 'lcov'],
			exclude: [
				'dist/**',
				'vitest.config.ts',
				'src/link-stats-type.ts',
			],
		},
	},
});
