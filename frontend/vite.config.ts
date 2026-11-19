import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [
		react(),
		// Support older iPads (iOS/Safari 12+): compile the normal bundles down to Safari 12
		// syntax and add a small polyfill bundle for missing built-ins (e.g. Array.prototype.at).
		// No separate legacy bundle: every target supports ES modules, and the legacy bundle
		// needs inline scripts that the Content-Security-Policy blocks.
		legacy({
			modernTargets: ['defaults', 'safari >= 12', 'ios_saf >= 12'],
			modernPolyfills: true,
			renderLegacyChunks: false
		})
	],
	root: path.resolve(__dirname, 'pages'),
	publicDir: path.resolve(__dirname, 'static'),
	build: {
		outDir: path.resolve(__dirname, '..', 'public'),
		emptyOutDir: true,
		assetsDir: 'assets',
		modulePreload: {
			polyfill: false
		},
		rollupOptions: {
			input: {
				index: path.resolve(__dirname, 'pages', 'index.html'),
				login: path.resolve(__dirname, 'pages', 'login.html'),
				register: path.resolve(__dirname, 'pages', 'register.html'),
				forgot: path.resolve(__dirname, 'pages', 'forgot.html'),
				reset: path.resolve(__dirname, 'pages', 'reset.html'),
				post: path.resolve(__dirname, 'pages', 'post.html'),
				settings: path.resolve(__dirname, 'pages', 'settings.html'),
				admin: path.resolve(__dirname, 'pages', 'admin.html'),
				'request-category': path.resolve(__dirname, 'pages', 'request-category.html'),
				about: path.resolve(__dirname, 'pages', 'about.html'),
				privacy: path.resolve(__dirname, 'pages', 'privacy.html')
			}
		}
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	}
});
