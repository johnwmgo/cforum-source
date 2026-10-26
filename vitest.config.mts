import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
			// wrangler.jsonc marks the D1 binding "remote": true. Tests must never touch the real database,
			// so force every binding to local, in-memory storage.
			remoteBindings: false,
			miniflare: {
				bindings: {
					JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
				},
			},
		}),
	],
	test: {},
});
