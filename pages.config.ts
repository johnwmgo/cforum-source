/**
 * Cloudflare Pages deployment configuration
 * Supports local development and deployment
 * 
 * Usage:
 * - Local development: npm run dev:pages
 * - Deploy Pages: wrangler pages deploy
 */

export default {
	// Pages project configuration
	projectName: 'cforum',
	
	// Build configuration
	build: {
		command: 'npm run build:frontend',
		outputDir: 'public'
	},
	
	// Development configuration
	dev: {
		port: 3010,
		local: true
	},
	
	// Routing configuration
	routing: {
		// Forward API routes to Functions
		'/api/*': 'functions/[[path]]',
		'/r2/*': 'functions/[[path]]',
		'/user': 'functions/[[path]]',
		'/user/*': 'functions/[[path]]',
		'/post/*': 'functions/[[path]]',
		'/admin': 'functions/[[path]]',
		'/settings': 'functions/[[path]]',
		
		// Serve static assets from public
		'*': 'public/*'
	}
};
