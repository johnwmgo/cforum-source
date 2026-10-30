import { env, exports } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';

const PASSWORD = 'password123';

type ApiOptions = { method?: string; body?: unknown; token?: string; securityHeaders?: boolean };

// Mirrors the frontend's apiFetch: mutations need X-Timestamp/X-Nonce, auth uses a Bearer token
async function api(path: string, { method = 'GET', body, token, securityHeaders = true }: ApiOptions = {}) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers.Authorization = `Bearer ${token}`;
	if (securityHeaders && method !== 'GET') {
		headers['X-Timestamp'] = Math.floor(Date.now() / 1000).toString();
		headers['X-Nonce'] = crypto.randomUUID();
	}
	const res = await exports.default.fetch(`https://forum.test/api${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let data: any;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		throw new Error(`Non-JSON response from ${method} ${path} (${res.status}): ${text}`);
	}
	return { status: res.status, data };
}

async function sha256(text: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Registration sends a real verification email, so seed users directly. Notifications are off
// so commenting doesn't try to send email either.
async function createUser(email: string, username: string, verified = 1) {
	await env.cforum_db
		.prepare('INSERT INTO users (email, username, password, role, verified, email_notifications) VALUES (?, ?, ?, "user", ?, 0)')
		.bind(email, username, await sha256(PASSWORD), verified)
		.run();
}

async function login(email: string) {
	const { status, data } = await api('/login', { method: 'POST', body: { email, password: PASSWORD } });
	expect(status).toBe(200);
	return data.token as string;
}

async function createPost(token: string, title: string) {
	const { status } = await api('/posts', { method: 'POST', token, body: { title, content: 'Post body' } });
	expect(status).toBe(201);
	const row = await env.cforum_db.prepare('SELECT id FROM posts WHERE title = ? ORDER BY id DESC').bind(title).first<{ id: number }>();
	return row!.id;
}

async function getComments(postId: number) {
	const { status, data } = await api(`/posts/${postId}/comments`);
	expect(status).toBe(200);
	return data as Array<{ id: number; parent_id: number | null; author_id: number; content: string; username: string }>;
}

let aliceToken: string;
let bobToken: string;

beforeAll(async () => {
	// The first request creates the schema
	await api('/config');
	await createUser('alice@example.com', 'alice');
	await createUser('bob@example.com', 'bob');
	await createUser('carol@example.com', 'carol', 0);
	aliceToken = await login('alice@example.com');
	bobToken = await login('bob@example.com');
});

describe('config', () => {
	it('returns public forum config as JSON', async () => {
		const { status, data } = await api('/config');
		expect(status).toBe(200);
		expect(data.turnstile_enabled).toBe(false);
		expect(data.jwt_secret_configured).toBe(true);
	});
});

describe('login', () => {
	it('returns a token and user for correct credentials', async () => {
		const { status, data } = await api('/login', { method: 'POST', body: { email: 'alice@example.com', password: PASSWORD } });
		expect(status).toBe(200);
		expect(data.token).toEqual(expect.any(String));
		expect(data.user).toMatchObject({ email: 'alice@example.com', username: 'alice', role: 'user' });
	});

	it('rejects a wrong password', async () => {
		const { status, data } = await api('/login', { method: 'POST', body: { email: 'alice@example.com', password: 'wrongpass1' } });
		expect(status).toBe(401);
		expect(data.error).toBe('Username or Password Error');
	});

	it('rejects an unknown email', async () => {
		const { status } = await api('/login', { method: 'POST', body: { email: 'nobody@example.com', password: PASSWORD } });
		expect(status).toBe(401);
	});

	it('rejects a user who has not verified their email', async () => {
		const { status, data } = await api('/login', { method: 'POST', body: { email: 'carol@example.com', password: PASSWORD } });
		expect(status).toBe(403);
		expect(data.error).toBe('Please verify your email first');
	});
});

describe('request security', () => {
	it('rejects mutations without timestamp/nonce headers', async () => {
		const { status, data } = await api('/login', {
			method: 'POST',
			securityHeaders: false,
			body: { email: 'alice@example.com', password: PASSWORD },
		});
		expect(status).toBe(400);
		expect(data.error).toBe('Missing security headers');
	});

	it('rejects a replayed nonce', async () => {
		const headers = {
			'Content-Type': 'application/json',
			'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
			'X-Nonce': crypto.randomUUID(),
		};
		const send = () =>
			exports.default.fetch('https://forum.test/api/login', {
				method: 'POST',
				headers,
				body: JSON.stringify({ email: 'alice@example.com', password: PASSWORD }),
			});
		expect((await send()).status).toBe(200);
		const replay = await send();
		expect(replay.status).toBe(400);
		expect(await replay.json()).toEqual({ error: 'Replay detected' });
	});

	it('requires login to create a post', async () => {
		const { status } = await api('/posts', { method: 'POST', body: { title: 'Nope', content: 'No token' } });
		expect(status).toBe(401);
	});
});

describe('posts', () => {
	it('creates a post that can then be fetched', async () => {
		const postId = await createPost(aliceToken, 'Hello world');
		const { status, data } = await api(`/posts/${postId}`);
		expect(status).toBe(200);
		expect(data).toMatchObject({ id: postId, title: 'Hello world', content: 'Post body', author_name: 'alice' });
	});

	it('rejects an empty title', async () => {
		const { status } = await api('/posts', { method: 'POST', token: aliceToken, body: { title: '', content: 'Body' } });
		expect(status).toBe(400);
	});
});

// Only the rejection paths are tested: a valid request sends a real email to support
describe('category requests', () => {
	it('requires login', async () => {
		const { status } = await api('/categories/request', { method: 'POST', body: { name: 'Needle felting' } });
		expect(status).toBe(401);
	});

	it('rejects an empty name', async () => {
		const { status } = await api('/categories/request', { method: 'POST', token: aliceToken, body: { name: '   ' } });
		expect(status).toBe(400);
	});

	it('rejects a multi-line name', async () => {
		const { status } = await api('/categories/request', { method: 'POST', token: aliceToken, body: { name: 'Wet\nBcc: x@y.z' } });
		expect(status).toBe(400);
	});
});

describe('comments', () => {
	let postId: number;

	beforeAll(async () => {
		postId = await createPost(aliceToken, 'Comment target');
	});

	it('posts a comment and lists it', async () => {
		const { status, data } = await api(`/posts/${postId}/comments`, { method: 'POST', token: bobToken, body: { content: 'Very funny!' } });
		expect(status).toBe(201);
		expect(data).toEqual({ success: true });

		const comments = await getComments(postId);
		expect(comments).toHaveLength(1);
		expect(comments[0]).toMatchObject({ content: 'Very funny!', username: 'bob', parent_id: null });
	});

	it('HTML-escapes comment content', async () => {
		const { status } = await api(`/posts/${postId}/comments`, { method: 'POST', token: bobToken, body: { content: '<b>bold</b>' } });
		expect(status).toBe(201);
		const comments = await getComments(postId);
		expect(comments.at(-1)!.content).toBe('&lt;b&gt;bold&lt;/b&gt;');
	});

	it('flattens a reply to a reply into the top-level thread with an @mention', async () => {
		await api(`/posts/${postId}/comments`, { method: 'POST', token: aliceToken, body: { content: 'Top level' } });
		const top = (await getComments(postId)).at(-1)!;

		await api(`/posts/${postId}/comments`, { method: 'POST', token: bobToken, body: { content: 'Reply', parent_id: top.id } });
		const reply = (await getComments(postId)).at(-1)!;
		expect(reply.parent_id).toBe(top.id);

		await api(`/posts/${postId}/comments`, { method: 'POST', token: aliceToken, body: { content: 'Reply to reply', parent_id: reply.id } });
		const nested = (await getComments(postId)).at(-1)!;
		expect(nested.parent_id).toBe(top.id);
		expect(nested.content).toBe('@bob Reply to reply');
	});

	it('requires login to comment', async () => {
		const { status } = await api(`/posts/${postId}/comments`, { method: 'POST', body: { content: 'Anonymous' } });
		expect(status).toBe(401);
	});

	it('rejects an empty comment', async () => {
		const { status } = await api(`/posts/${postId}/comments`, { method: 'POST', token: bobToken, body: { content: '   ' } });
		expect(status).toBe(400);
	});

	it('returns a JSON 404 for a post that does not exist', async () => {
		const { status, data } = await api('/posts/999999/comments', { method: 'POST', token: bobToken, body: { content: 'Hello?' } });
		expect(status).toBe(404);
		expect(data.error).toBe('Post not found');
	});

	it('only lets the author delete their comment', async () => {
		await api(`/posts/${postId}/comments`, { method: 'POST', token: bobToken, body: { content: 'Delete me' } });
		const comment = (await getComments(postId)).at(-1)!;

		const byOther = await api(`/comments/${comment.id}`, { method: 'DELETE', token: aliceToken });
		expect(byOther.status).toBe(403);

		const byAuthor = await api(`/comments/${comment.id}`, { method: 'DELETE', token: bobToken });
		expect(byAuthor.status).toBe(200);
		expect((await getComments(postId)).some((c) => c.id === comment.id)).toBe(false);
	});
});

describe('security hardening', () => {
	it('upgrades a legacy SHA-256 password hash to PBKDF2 on login', async () => {
		await createUser('dave@example.com', 'dave');
		await login('dave@example.com');
		const row = await env.cforum_db.prepare('SELECT password FROM users WHERE email = ?').bind('dave@example.com').first<{ password: string }>();
		expect(row!.password).toMatch(/^pbkdf2\$100000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
		// and the upgraded hash still verifies
		await login('dave@example.com');
	});

	it('does not expose a public list of users and their emails', async () => {
		const res = await exports.default.fetch('https://forum.test/api/users');
		expect(res.status).toBe(404);
	});

	it('only lets admins send test emails', async () => {
		const anon = await api('/test-email', { method: 'POST', body: { to: 'someone@example.com' } });
		expect(anon.status).toBe(401);
		const user = await api('/test-email', { method: 'POST', token: aliceToken, body: { to: 'someone@example.com' } });
		expect(user.status).toBe(403);
	});

	it('requires the current password to change email', async () => {
		const missing = await api('/user/change-email', { method: 'POST', token: aliceToken, body: { new_email: 'alice2@example.com' } });
		expect(missing.status).toBe(400);
		const wrong = await api('/user/change-email', { method: 'POST', token: aliceToken, body: { new_email: 'alice2@example.com', password: 'wrongpass1' } });
		expect(wrong.status).toBe(401);
	});

	it('will not reset 2FA on an account that already has it enabled', async () => {
		await env.cforum_db.prepare('UPDATE users SET totp_enabled = 1, totp_secret = ? WHERE email = ?').bind('JBSWY3DPEHPK3PXP', 'bob@example.com').run();
		const { status } = await api('/user/totp/setup', { method: 'POST', token: bobToken, body: {} });
		expect(status).toBe(400);
		const row = await env.cforum_db.prepare('SELECT totp_enabled, totp_secret FROM users WHERE email = ?').bind('bob@example.com').first<{ totp_enabled: number; totp_secret: string }>();
		expect(row).toEqual({ totp_enabled: 1, totp_secret: 'JBSWY3DPEHPK3PXP' });
		await env.cforum_db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE email = ?').bind('bob@example.com').run();
	});

	it('takes the role from the database, not the token', async () => {
		await env.cforum_db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").bind('alice@example.com').run();
		const token = await login('alice@example.com');
		expect((await api('/admin/stats', { token })).status).toBe(200);
		await env.cforum_db.prepare("UPDATE users SET role = 'user' WHERE email = ?").bind('alice@example.com').run();
		expect((await api('/admin/stats', { token })).status).toBe(403);
	});

	it('clamps the post listing page size', async () => {
		const { status } = await api('/posts?limit=100000&offset=-5');
		expect(status).toBe(200);
	});
});

describe('email change links', () => {
	async function confirm(token: string) {
		return exports.default.fetch(`https://forum.test/api/verify-email-change?token=${encodeURIComponent(token)}`, { redirect: 'manual' });
	}

	it('confirms a link that has not expired', async () => {
		await createUser('erin@example.com', 'erin');
		const token = `${crypto.randomUUID()}.${Date.now() + 60_000}`;
		await env.cforum_db.prepare('UPDATE users SET pending_email = ?, email_change_token = ? WHERE email = ?').bind('erin2@example.com', token, 'erin@example.com').run();
		const res = await confirm(token);
		expect(res.status).toBe(302);
		const row = await env.cforum_db.prepare('SELECT id FROM users WHERE email = ?').bind('erin2@example.com').first();
		expect(row).not.toBeNull();
	});

	it('rejects an expired link and clears the pending change', async () => {
		await createUser('frank@example.com', 'frank');
		const token = `${crypto.randomUUID()}.${Date.now() - 1000}`;
		await env.cforum_db.prepare('UPDATE users SET pending_email = ?, email_change_token = ? WHERE email = ?').bind('frank2@example.com', token, 'frank@example.com').run();
		const res = await confirm(token);
		expect(res.status).toBe(400);
		const row = await env.cforum_db.prepare('SELECT email, pending_email, email_change_token FROM users WHERE email = ?').bind('frank@example.com').first();
		expect(row).toEqual({ email: 'frank@example.com', pending_email: null, email_change_token: null });
	});

	it('rejects a link issued before expiries were added', async () => {
		await createUser('gina@example.com', 'gina');
		const token = crypto.randomUUID();
		await env.cforum_db.prepare('UPDATE users SET pending_email = ?, email_change_token = ? WHERE email = ?').bind('gina2@example.com', token, 'gina@example.com').run();
		expect((await confirm(token)).status).toBe(400);
	});
});

describe('like status privacy', () => {
	it('only reports like status for the logged-in viewer, not a user id in the query', async () => {
		const postId = await createPost(aliceToken, 'Like privacy');
		const alice = await env.cforum_db.prepare('SELECT id FROM users WHERE email = ?').bind('alice@example.com').first<{ id: number }>();
		expect((await api(`/posts/${postId}/like`, { method: 'POST', token: aliceToken, body: {} })).data.liked).toBe(true);

		// Anonymous lookup of someone else's like is no longer answered
		const anon = await api(`/posts/${postId}?user_id=${alice!.id}`);
		expect(anon.status).toBe(200);
		expect(anon.data.liked).toBeUndefined();

		// Bob asking about Alice's like gets his own status instead
		const bob = await api(`/posts/${postId}?user_id=${alice!.id}`, { token: bobToken });
		expect(bob.data.liked).toBe(false);

		// Alice sees her own like
		expect((await api(`/posts/${postId}`, { token: aliceToken })).data.liked).toBe(true);
	});
});
