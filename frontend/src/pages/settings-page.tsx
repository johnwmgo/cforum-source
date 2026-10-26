import * as React from 'react';

import QRCode from 'qrcode';

import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiFetch, getSecurityHeaders } from '@/lib/api';
import { getUser, logout, setUser, type User } from '@/lib/auth';
import { validateText } from '@/lib/validators';
import { prepareImageForUpload } from '@/lib/image';

export function SettingsPage() {
	const [user, setUserState] = React.useState<User | null>(() => getUser());
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');

	const [username, setUsername] = React.useState(user?.username || '');
	const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || '');
	const [emailNotifications, setEmailNotifications] = React.useState<boolean>(user?.email_notifications !== false);

	const [emailNew, setEmailNew] = React.useState('');
	const [emailTotp, setEmailTotp] = React.useState('');

	const [totpSecret, setTotpSecret] = React.useState('');
	const [totpUri, setTotpUri] = React.useState('');
	const [totpCode, setTotpCode] = React.useState('');
	const qrCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

	const [deletePassword, setDeletePassword] = React.useState('');
	const [deleteTotp, setDeleteTotp] = React.useState('');

	React.useEffect(() => {
		if (!user) {
			window.location.href = '/login';
		}
	}, [user]);

	React.useEffect(() => {
		if (!totpUri || !qrCanvasRef.current) return;
		QRCode.toCanvas(qrCanvasRef.current, totpUri).catch(() => {});
	}, [totpUri]);

	async function saveProfile() {
		if (!user) return;
		setError('');
		const err = username ? validateText(username, 'Username') : null;
		if (err) return setError(err);
		if (username.length > 20) return setError('Username is too long (max 20 characters)');
		if (avatarUrl && avatarUrl.length > 500) return setError('Avatar URL is too long (max 500 characters)');

		setLoading(true);
		try {
			const data = await apiFetch<{ user: User }>('/user/profile', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({
					username,
					avatar_url: avatarUrl,
					email_notifications: emailNotifications
				})
			});
			setUser(data.user);
			setUserState(data.user);
			alert('Profile updated');
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	async function uploadAvatar(file: File) {
		if (!user) return;
		setError('');
		setLoading(true);
		try {
			const formData = new FormData();
			formData.append('file', await prepareImageForUpload(file, 'avatar'));
			formData.append('type', 'avatar');

			const res = await fetch('/api/upload', {
				method: 'POST',
				headers: getSecurityHeaders('POST', null),
				body: formData
			});
			const data = (await res.json()) as any;
			if (!res.ok) throw new Error(data?.error || 'Upload failed');
			setAvatarUrl(data.url);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	async function requestEmailChange() {
		if (!user) return;
		setError('');
		if (!emailNew) return setError('Please enter a new email');
		setLoading(true);
		try {
			await apiFetch('/user/change-email', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({ new_email: emailNew, totp_code: emailTotp })
			});
			alert('A verification email has been sent to the new address. Please confirm it there.');
			setEmailNew('');
			setEmailTotp('');
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	async function startTotpSetup() {
		setError('');
		setLoading(true);
		try {
			const data = await apiFetch<{ secret: string; uri: string }>('/user/totp/setup', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({})
			});
			setTotpSecret(data.secret);
			setTotpUri(data.uri);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	async function verifyTotp() {
		setError('');
		setLoading(true);
		try {
			await apiFetch('/user/totp/verify', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({ token: totpCode })
			});
			if (user) {
				const updated = { ...user, totp_enabled: true };
				setUser(updated);
				setUserState(updated);
			}
			setTotpSecret('');
			setTotpUri('');
			setTotpCode('');
			alert('2FA enabled');
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	async function deleteAccount() {
		if (!user) return;
		setError('');
		if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
		setLoading(true);
		try {
			await apiFetch('/user/delete', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({ password: deletePassword, totp_code: deleteTotp })
			});
			logout();
			window.location.href = '/';
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	return (
		<PageShell>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
						<p className="text-sm text-muted-foreground">Manage your profile, email and 2FA.</p>
					</div>
					<Button
						variant="outline"
						onClick={() => {
							logout();
							window.location.href = '/';
						}}
					>
						Log Out
					</Button>
				</div>

				{error ? <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}

				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="profile-username">Username</Label>
								<Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="profile-avatar">Avatar URL</Label>
								<Input id="profile-avatar" value={avatarUrl || ''} onChange={(e) => setAvatarUrl(e.target.value)} />
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="avatar-file">Upload avatar</Label>
							<Input
								id="avatar-file"
								type="file"
								accept="image/jpeg,image/png,image/gif,image/webp"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) uploadAvatar(f);
									e.target.value = '';
								}}
							/>
						</div>

						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								className="h-4 w-4"
								checked={emailNotifications}
								onChange={(e) => setEmailNotifications(e.target.checked)}
							/>
							Receive email notifications (comments only)
						</label>

						<Button onClick={saveProfile} disabled={loading}>
							{loading ? 'Saving...' : 'Save Profile'}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Change Email</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="email-new">New email address</Label>
								<Input id="email-new" type="email" value={emailNew} onChange={(e) => setEmailNew(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="email-totp">2FA code (if enabled)</Label>
								<Input
									id="email-totp"
									type="text"
									inputMode="numeric"
									maxLength={6}
									autoComplete="one-time-code"
									value={emailTotp}
									onChange={(e) => setEmailTotp(e.target.value)}
								/>
							</div>
						</div>
						<Button onClick={requestEmailChange} disabled={loading}>
							{loading ? 'Processing...' : 'Send Confirmation Email'}
						</Button>
						<div className="text-sm text-muted-foreground">A confirmation link will be sent to the new email.</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Two-Factor Authentication (2FA)</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{user?.totp_enabled ? (
							<div className="rounded-md border bg-muted/30 p-3 text-sm">✅ 2FA is enabled</div>
						) : (
							<>
								<div className="text-sm text-muted-foreground">Enable 2FA to protect your account.</div>
								<Button onClick={startTotpSetup} disabled={loading || !!totpSecret}>
									{loading ? 'Processing...' : 'Set Up 2FA'}
								</Button>
								{totpSecret ? (
									<div className="space-y-3 rounded-md border p-4">
										<div className="text-sm font-medium">1. Scan the QR code</div>
										<canvas ref={qrCanvasRef} />
										<div className="text-sm text-muted-foreground">Or enter the key manually: {totpSecret}</div>
										<Separator />
										<div className="text-sm font-medium">2. Enter the code</div>
										<div className="flex flex-wrap items-center gap-2">
											<Input
												value={totpCode}
												onChange={(e) => setTotpCode(e.target.value)}
												placeholder="000000"
												maxLength={6}
												autoComplete="one-time-code"
												className="w-32"
											/>
											<Button onClick={verifyTotp} disabled={loading}>
												{loading ? 'Verifying...' : 'Verify and Enable'}
											</Button>
										</div>
									</div>
								) : null}
							</>
						)}
					</CardContent>
				</Card>

				<Card className="border-destructive/40">
					<CardHeader>
						<CardTitle className="text-destructive">Danger Zone</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-sm text-muted-foreground">Deleted accounts cannot be recovered.</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="delete-password">Password</Label>
								<Input
									id="delete-password"
									type="password"
									autoComplete="current-password"
									value={deletePassword}
									onChange={(e) => setDeletePassword(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="delete-totp">2FA code (if enabled)</Label>
								<Input
									id="delete-totp"
									type="text"
									inputMode="numeric"
									maxLength={6}
									autoComplete="one-time-code"
									value={deleteTotp}
									onChange={(e) => setDeleteTotp(e.target.value)}
								/>
							</div>
						</div>
						<Button variant="destructive" onClick={deleteAccount} disabled={loading}>
							{loading ? 'Processing...' : 'Delete Account'}
						</Button>
					</CardContent>
				</Card>
			</div>
		</PageShell>
	);
}
