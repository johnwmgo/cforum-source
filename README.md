# CForum

A forum built on Cloudflare Workers + Pages + D1 + R2, with support for posts, comments, image uploads, 2FA and more.

**💡 Performance optimization**: Uses a hybrid Pages + Worker deployment — static assets get free, unlimited requests, saving ~90% of Worker costs!

---

## 🏗️ Architecture

### Single domain + smart gateway

```
User visits: forum.adysec.com
         ↓
    Cloudflare Pages (Edge network)
         ↓
  ┌─ Pages Functions decide the route
  │
  ├─ /api/* ?
  │  ├─ YES → Forward to Worker (business logic + database)
  │  │         Returns JSON
  │  │
  │  └─ NO  → Return static file or index.html
  │           Frontend React Router takes over
  │
  └─ User sees the page
```

## ✨ Features

- ✅ **Post management** - Create, edit, delete, pin, categorize
- ✅ **Comment system** - Nested comments with replies
- ✅ **User authentication** - Registration, login, email verification, 2FA
- ✅ **Image uploads** - Images upload directly to R2, with Markdown preview
- ✅ **User profiles** - Avatar upload, profile info, email notification settings
- ✅ **Admin panel** - User management, category management, settings management
- ✅ **View statistics** - Post view counts
- ✅ **Like system** - Flexible like/unlike
- ✅ **CAPTCHA** - Cloudflare Turnstile integration
- ✅ **Email service** - SMTP configuration, verification emails, password reset

## 🚀 Quick Start

### Method 1: Fork + one-click deploy (for users deploying once)

[![Deploy to Cloudflare](https://camo.githubusercontent.com/aa3de9a0130879a84691a2286f5302105d5f3554c5d0af4e3f2f24174eeeea25/68747470733a2f2f6465706c6f792e776f726b6572732e636c6f7564666c6172652e636f6d2f627574746f6e)](https://deploy.workers.cloudflare.com/?url=https://github.com/adysec/cforum)

> In the Cloudflare dashboard, add a `JWT_SECRET` secret of at least 32 characters to the Worker.
> **Frontend notice**: If the Worker does not detect a valid `JWT_SECRET` at runtime, a yellow banner appears at the top of the page suggesting a random key, which you can copy and paste into Secrets.

### Method 2: Automatic deployment with GitHub Actions (recommended)

The project includes `.github/workflows/deploy.yml`, which automatically builds and deploys to Cloudflare on every push to the `main` branch or when triggered manually.

#### Step 1: Get a Cloudflare API Token

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile > API Tokens**
3. Click **Create Token**
4. Configure custom permissions:
   - **Account > Workers Scripts** - Edit
   - **Account > D1** - Edit
   - **Account > R2** - Edit
   - **Account > Pages** - Edit
5. Select your account and click **Continue to summary**
6. After creating it, copy the token (it is only shown once)
<img width="1778" height="506" alt="Screenshot" src="https://github.com/user-attachments/assets/0f7f179b-d2a9-4f3b-8981-f736d294898a" />

#### Step 2: Get your Account ID

1. On the Cloudflare Dashboard home page, select any domain
2. The **Account ID** is shown in the right sidebar — copy it

#### Step 3: Configure GitHub Secrets

In your GitHub repository:
1. Go to **Settings > Secrets and variables > Actions**
2. Click **New repository secret** and add the following secrets:

| Secret name | Value | Description | Required |
|-----------|----|----|----|
| `CF_API_TOKEN` | Cloudflare API Token | [Create CF_API_TOKEN](https://dash.cloudflare.com/profile/api-tokens) | Required |
| `CF_ACCOUNT_ID` | Your Cloudflare Account ID | [Find CF_ACCOUNT_ID](https://dash.cloudflare.com/caching/overview) | Required |
| `JWT_SECRET` | Random string | `head -c 32 /dev/urandom \| base64` | Required |
| `SMTP_HOST` | SMTP server address | Used for sending email, e.g. smtp.exmail.qq.com | Optional; registration won't work without it |
| `SMTP_PORT` | SMTP port | e.g. 465 | Optional; registration won't work without it |
| `SMTP_USER` | SMTP username | Email address | Optional; registration won't work without it |
| `SMTP_PASS` | SMTP password | App-specific password (not your main password) | Optional; registration won't work without it |
| `SMTP_FROM` | Sender email | e.g. noreply@example.com (defaults to SMTP_USER) | Optional; registration won't work without it |
| `SMTP_FROM_NAME` | Sender display name | e.g. CForum (defaults to "Forum Admin") | Optional; registration won't work without it |
| `BASE_URL` | Site URL | e.g. `https://forum.adysec.com` (defaults to the current request's domain) | Optional; email links may break without it |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key | [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) | Optional; Turnstile is disabled without it |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Secret | [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) | Optional; Turnstile is disabled without it |
<img width="2244" height="1350" alt="Screenshot" src="https://github.com/user-attachments/assets/77b109a9-ebb6-4e9d-a660-0828e28c5bd1" />

#### Step 4: Trigger a deployment manually

On your GitHub repository's **Actions** page:
1. Select the **Deploy to Cloudflare** workflow
2. Click **Run workflow**
3. Select the `main` branch and confirm

---

## 🌐 Custom Domain Setup (optional)

### Single-domain setup (recommended)

CForum uses a **hybrid Pages + Worker architecture with a single entry point through Pages Functions**:

```
User visits: https://forum.adysec.com
    ↓
Cloudflare Pages CDN (smart routing)
    ├─ /api/* → Pages Functions proxy → Worker (D1/R2)
    └─ other  → Return static file (index.html → frontend routing)
```

**Benefits**:
- ✅ Users only need one domain
- ✅ Fully automated — no need to configure a Worker domain manually
- ✅ Pages hosts static assets (free)
- ✅ Worker stays hidden behind it (free tier: 100k requests/day)

### Binding steps

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages**
2. Select the **cforum** project → **Settings** → **Custom domains**
3. Click **Add custom domain** and enter your domain (e.g. `forum.adysec.com`)
4. Complete verification ✅

**Default admin account** (change it immediately after first login!):
- Email: `admin@adysec.com` / Password: `Admin@123`

## 🔧 Modifications

This is a modified version of [adysec/CForum](https://github.com/adysec/CForum), changed by johnwmgo starting 2026-10-16 to run the Felting Forum at [forum.felting.com](https://forum.felting.com). The original code is by AdySec (last upstream commit `1f80425`, 2026-02-28).

Main changes from the original:

- **Translation** - UI text, comments and docs translated from Chinese to English; post dates shown in English (2026-10-16 to 2026-10-25)
- **Deployment** - Pointed at our own Cloudflare Worker, D1 database and R2 bucket; Node 24 and newer GitHub Actions in the deploy workflow; API tests run before each deploy (2026-10-16 to 2026-10-25)
- **Email** - Sends email through the Cloudflare Email Sending binding (2026-10-25)
- **Upload safety** - Image uploads limited to JPEG, PNG, GIF and WebP (checked by file signature), with EXIF metadata stripped and large images downscaled (2026-10-25)
- **Fixes** - Restored the comment posting endpoint, fixed TypeScript and build errors, and made post links work on Pages (2026-10-25)
- **Interface** - Log Out button, header tooltips, clearer post editor and registration messages (2026-10-25)
- **Category requests** - Logged-in users can request a new category (2026-10-25)
- **Branding** - Renamed from CForum to Felting Forum (2026-10-25 to 2026-10-26)
- **About / Legal page** - Footer link to an About / Legal page with the license notice and a link to this source code (2026-10-26)
- **Styling** - Light and dark themes, serif headings and link colors to match [felting.com](https://felting.com) (2026-10-26)

For the complete, dated list of changes, see the [commit history](https://github.com/johnwmgo/cforum-source/commits/main). Every commit after `1f80425` is a modification.

## 📄 License

GNU Affero General Public License v3.0 - see [LICENSE](LICENSE)

## 🙋 Support

- 💬 Issues and Pull Requests are welcome
- 🌟 If this project helps you, please give it a Star!
