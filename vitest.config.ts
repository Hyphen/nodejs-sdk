import {defineConfig} from 'vitest/config';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
	test: {
		coverage: {
			exclude: [
				'dist/**',
				'vitest.config.ts',
				'src/link-stats-type.ts',
			],
		},
	},
});
