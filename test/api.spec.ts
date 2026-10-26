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
