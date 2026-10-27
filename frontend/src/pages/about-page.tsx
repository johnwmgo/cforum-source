import { PageShell } from '@/components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Public mirror of this repo, kept in sync by .github/workflows/mirror.yml (AGPL-3.0 §13)
const SOURCE_REPO_URL = 'https://github.com/johnwmgo/cforum-source';

export function AboutPage() {
	return (
		<PageShell>
			<div className="flex justify-center">
				<Card className="w-full max-w-2xl">
					<CardHeader>
						<CardTitle>About / Legal</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-base leading-relaxed">
							This forum is for use by users of felting.com to communicate about all things "felting". This forum was created in late October of 2026.
						</p>
						<p className="text-base leading-relaxed">
							This website utilizes a modified version of{' '}
							<a className="underline underline-offset-4" href="https://github.com/adysec/CForum" target="_blank" rel="noreferrer">
								adysec/CForum
							</a>
							, which is licensed under the{' '}
							<a className="underline underline-offset-4" href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer">
								GNU Affero General Public License v3.0
							</a>
							. In accordance with the license, you can download our modified source code{' '}
							<a className="underline underline-offset-4" href={SOURCE_REPO_URL} target="_blank" rel="noreferrer">
								here
							</a>
							.
						</p>
					</CardContent>
				</Card>
			</div>
		</PageShell>
	);
}
