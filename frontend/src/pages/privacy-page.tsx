import * as React from 'react';

import { PageShell } from '@/components/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CONTACT_EMAIL = 'support@felting.com';
const EFFECTIVE_DATE = 'October 30, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="space-y-3">
			<h2 className="text-lg font-semibold">{title}</h2>
			{children}
		</section>
	);
}

const link = 'underline underline-offset-4';

export function PrivacyPage() {
	return (
		<PageShell>
			<div className="flex justify-center">
				<Card className="w-full max-w-2xl">
					<CardHeader>
						<CardTitle>Privacy Policy</CardTitle>
						<p className="text-sm text-muted-foreground">Effective {EFFECTIVE_DATE}</p>
					</CardHeader>
					<CardContent className="space-y-6 text-base leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
						<p>
							This policy explains what information Felting Forum (forum.felting.com) collects, how it is used, and the choices you have.
							Felting Forum is run by WebDev LLC, which operates under the laws of the United States of America. The forum is separate from
							felting.com, and the felting.com privacy policy does not apply here.
						</p>

						<Section title="What we collect">
							<p>
								<strong>When you register:</strong> your email address, the username you choose, and your password. Your password is stored
								only in hashed form, so we cannot read it. A default avatar image is generated for you.
							</p>
							<p>
								<strong>Your profile and settings:</strong> your avatar (an image you upload, or a link to an image elsewhere), whether you want
								email notifications, and, if you turn on two-factor authentication (2FA), the secret key used to check your 2FA codes.
							</p>
							<p>
								<strong>What you post:</strong> your posts, comments and replies, the posts you like, and images you upload. Before an image is
								uploaded, your browser removes its EXIF metadata, such as GPS location and camera details. GIF images are uploaded unchanged.
							</p>
							<p>
								<strong>Activity log:</strong> for security, we record actions such as logging in, creating posts and comments, deleting
								content, changing your email address and setting up 2FA. Each entry includes your account, the action, the time and your IP
								address. Login entries also include the email address used, and email-change entries include the new address.
							</p>
							<p>
								<strong>Category requests:</strong> if you request a new category, your username, email address, the category name and your
								reason are emailed to us.
							</p>
							<p>
								<strong>Page views:</strong> each post shows a view count. This is a simple total and is not linked to you.
							</p>
						</Section>

						<Section title="What is public">
							<p>
								Anyone, including people without an account, can see posts, comments, usernames, avatars, like counts and view counts. Your
								email address is never shown publicly. Uploaded images can be viewed by anyone who has their link.
							</p>
						</Section>

						<Section title="How we use your information">
							<ul>
								<li>To run your account: logging you in, verifying your email address, resetting your password and checking 2FA codes.</li>
								<li>
									To send you email: account emails (verification, password reset, email-change confirmation) and, if notifications are on,
									an email when someone comments on your post or replies to your comment. Notification emails include the commenter's
									username and the comment text. Notifications are on by default and can be turned off in Settings.
								</li>
								<li>To keep the forum secure and to investigate abuse, using the activity log.</li>
								<li>
									For moderation. Forum administrators can see every account's email address, username, avatar and verification status, and
									can edit or delete accounts, posts and comments. You may get an email when an administrator verifies, renames or deletes your
									account.
								</li>
							</ul>
							<p>We do not sell your information, show advertising, or use your information to build marketing profiles.</p>
						</Section>

						<Section title="Services we use">
							<p>
								Felting Forum runs on{' '}
								<a className={link} href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">
									Cloudflare
								</a>
								, which processes information on our behalf:
							</p>
							<ul>
								<li>Hosting: the website, database and uploaded images are stored on Cloudflare's servers, which may be outside your country.</li>
								<li>Email: account and notification emails are sent through Cloudflare's email service.</li>
								<li>
									Bot protection: login, registration, password reset, posting and commenting use Cloudflare Turnstile, which checks your
									browser to tell people from automated programs.
								</li>
								<li>Analytics: Cloudflare Web Analytics measures overall site traffic. It does not use cookies.</li>
								<li>Logs: Cloudflare keeps short-term technical logs of requests to the site, which include IP addresses.</li>
							</ul>
							<p>
								<strong>Images from other websites:</strong> if an avatar or post links to an image hosted elsewhere, your browser loads it
								from that website, which can see your IP address. We tell your browser not to send that website the address of the forum
								page you were viewing.
							</p>
						</Section>

						<Section title="Cookies and browser storage">
							<p>
								Felting Forum does not set its own cookies. When you log in, your browser's local storage keeps your login token and basic
								account details (including your email address) so you stay logged in. It also remembers your light or dark theme choice.
								Logging out removes the login information. Cloudflare's security services may set their own cookies.
							</p>
						</Section>

						<Section title="How long we keep information">
							<ul>
								<li>Your account and everything you post are kept until you delete them or an administrator removes them.</li>
								<li>Login sessions expire after 24 hours.</li>
								<li>Password reset links expire after 1 hour, and email-change links after 24 hours.</li>
								<li>Accounts that never verify their email address are kept until an administrator removes them.</li>
								<li>Activity log entries are currently kept indefinitely, including after an account is deleted.</li>
							</ul>
						</Section>

						<Section title="Your choices">
							<ul>
								<li>Change your username, avatar and email notification setting in Settings.</li>
								<li>Change your email address in Settings. This requires your password and confirmation from the new address.</li>
								<li>Edit or delete your own posts, and delete your own comments.</li>
								<li>
									Delete your account in Settings. This permanently removes your account, your posts and the comments and likes on them,
									your own comments and likes, your avatar and the images in your posts. It does not remove activity log entries.
								</li>
								<li>
									For anything else, such as a copy of your information or removal of activity log entries, email{' '}
									<a className={link} href={`mailto:${CONTACT_EMAIL}`}>
										{CONTACT_EMAIL}
									</a>
									.
								</li>
							</ul>
						</Section>

						<Section title="Who can join">
							<p>
								You must be 13 years of age or older to create an account, and you confirm this when you register. Anyone can read the
								forum without an account. We do not knowingly collect personal information from children under 13. If we learn that an
								account belongs to someone under 13, we will delete it and its information. If you believe a child under 13 has an
								account, please contact us at{' '}
								<a className={link} href={`mailto:${CONTACT_EMAIL}`}>
									{CONTACT_EMAIL}
								</a>
								.
							</p>
						</Section>

						<Section title="Security">
							<p>
								The site uses HTTPS. Passwords are stored as salted hashes, and you can protect your account with 2FA. No system is perfectly
								secure, so please use a password you don't use anywhere else.
							</p>
						</Section>

						<Section title="Changes to this policy">
							<p>If we change this policy, we will update it here and change the effective date at the top.</p>
						</Section>

						<Section title="Contact">
							<p>
								Questions about this policy or your information can be sent to WebDev LLC at{' '}
								<a className={link} href={`mailto:${CONTACT_EMAIL}`}>
									{CONTACT_EMAIL}
								</a>
								.
							</p>
						</Section>
					</CardContent>
				</Card>
			</div>
		</PageShell>
	);
}
