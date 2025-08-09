import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
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
