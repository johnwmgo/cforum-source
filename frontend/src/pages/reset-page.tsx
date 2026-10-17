import * as React from 'react';

import { TurnstileWidget } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfig } from '@/hooks/use-config';
import { getSecurityHeaders } from '@/lib/api';

export function ResetPage() {
	const { config } = useConfig();
	const enabled = !!config?.turnstile_enabled;
	const siteKey = config?.turnstile_site_key || '';
	const turnstileActive = enabled && !!siteKey;

	const params = new URLSearchParams(window.location.search);
	const token = params.get('token') || '';

	const [password, setPassword] = React.useState('');
	const [totpCode, setTotpCode] = React.useState('');
	const [turnstileToken, setTurnstileToken] = React.useState('');
	const [turnstileResetKey, setTurnstileResetKey] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [success, setSuccess] = React.useState('');

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');
		setSuccess('');
		if (!token) return setError('Missing reset token');
		if (turnstileActive && !turnstileToken) return setError('Please complete the CAPTCHA');
		setLoading(true);
		try {
			const res = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({
					token,
					new_password: password,
					totp_code: totpCode,
					'cf-turnstile-response': turnstileToken
				})
			});
			const data = (await res.json()) as any;
			if (!res.ok) {
				setTurnstileToken('');
				setTurnstileResetKey((v) => v + 1);
				throw new Error(data?.error || 'Reset failed');
			}
			setSuccess('Password reset successful. Please log in again.');
			setPassword('');
			setTotpCode('');
			setTurnstileToken('');
			setTurnstileResetKey((v) => v + 1);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-dvh bg-muted/20">
			<main className="mx-auto flex max-w-5xl justify-center px-4 py-10">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Reset Password</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleSubmit}>
							{error ? <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
							{success ? <div className="rounded-md border bg-muted/40 p-3 text-sm">{success}</div> : null}
							<div className="space-y-2">
								<Label htmlFor="reset-password">New Password</Label>
								<Input
									id="reset-password"
									type="password"
									autoComplete="new-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="reset-totp">2FA code (if enabled)</Label>
								<Input
									id="reset-totp"
									type="text"
									inputMode="numeric"
									maxLength={6}
									autoComplete="one-time-code"
									value={totpCode}
									onChange={(e) => setTotpCode(e.target.value)}
								/>
							</div>
							<TurnstileWidget enabled={turnstileActive} siteKey={siteKey} onToken={setTurnstileToken} resetKey={turnstileResetKey} />
							<Button className="w-full" type="submit" disabled={loading}>
								{loading ? 'Processing...' : 'Reset Password'}
							</Button>
							<div className="text-sm">
								<a className="text-muted-foreground hover:underline" href="/login">
									Back to Login
								</a>
							</div>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}

