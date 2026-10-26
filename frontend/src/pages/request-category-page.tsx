import * as React from 'react';

import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, getSecurityHeaders } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { validateText } from '@/lib/validators';

export function RequestCategoryPage() {
	const [user] = React.useState(() => getUser());
	const [name, setName] = React.useState('');
	const [reason, setReason] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [success, setSuccess] = React.useState('');

	React.useEffect(() => {
		if (!user) {
			window.location.href = '/login';
		}
	}, [user]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');
		setSuccess('');
		const err = validateText(name.trim(), 'Category name');
		if (err) return setError(err);
		if (name.trim().length > 50) return setError('Category name is too long (max 50 characters)');
		if (reason.length > 1000) return setError('Reason is too long (max 1000 characters)');

		setLoading(true);
		try {
			await apiFetch('/categories/request', {
				method: 'POST',
				headers: getSecurityHeaders('POST'),
				body: JSON.stringify({ name: name.trim(), reason: reason.trim() })
			});
			setSuccess('Thanks! Your request has been sent to the forum team.');
			setName('');
			setReason('');
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}

	if (!user) return null;

	return (
		<PageShell>
			<div className="flex justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Request a Category</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleSubmit}>
							{error ? <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
							{success ? <div className="rounded-md border bg-muted/40 p-3 text-sm">{success}</div> : null}
							<div className="space-y-2">
								<Label htmlFor="category-name">Category name</Label>
								<Input
									id="category-name"
									value={name}
									maxLength={50}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="category-reason">Why should we add it? (optional)</Label>
								<Textarea
									id="category-reason"
									rows={5}
									value={reason}
									maxLength={1000}
									onChange={(e) => setReason(e.target.value)}
								/>
							</div>
							<Button className="w-full" type="submit" disabled={loading}>
								{loading ? 'Sending...' : 'Send Request'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</PageShell>
	);
}
