# Budget Barber – AI Hairstyle Advisor

AI-powered hairstyle recommendation app for Budget Barber Digital Men's Salon.

---

## Architecture

```
User Browser  →  GitHub Pages (index.html)
                      ↓
              Cloudflare Worker (worker.js)   ← FREE, 100k req/day
                      ↓
              Anthropic Claude API
```

GitHub Pages hosts the frontend (free).
Cloudflare Worker acts as a secure proxy so the API key is never exposed.

---

## STEP 1 — Set up Cloudflare Worker (Proxy)

### 1.1 Create a free Cloudflare account
Go to https://cloudflare.com and sign up (free).

### 1.2 Create a new Worker
1. In the Cloudflare dashboard, click **Workers & Pages** in the left sidebar
2. Click **Create** → **Create Worker**
3. Give it a name like `budget-barber-proxy`
4. Click **Deploy** (ignore the default code for now)

### 1.3 Paste the worker code
1. Click **Edit Code** on your new worker
2. Delete all existing code
3. Copy everything from `worker.js` (in this repo) and paste it
4. Click **Deploy**

### 1.4 Add your Anthropic API Key as a secret
1. Go to your worker's **Settings** tab
2. Click **Variables and Secrets** → **Add variable**
3. Set:
   - Variable name: `ANTHROPIC_API_KEY`
   - Value: your key starting with `sk-ant-...`
   - Click **Encrypt** (important — keeps it secret)
4. Click **Save and deploy**

### 1.5 Copy your Worker URL
Your worker URL looks like:
```
https://budget-barber-proxy.yourname.workers.dev
```
Copy this — you'll need it in Step 3.

---

## STEP 2 — Upload to GitHub

### 2.1 Create a GitHub account (if you don't have one)
Go to https://github.com and sign up.

### 2.2 Create a new repository
1. Click the **+** icon → **New repository**
2. Name it: `budget-barber` (or any name)
3. Set it to **Public**
4. Click **Create repository**

### 2.3 Upload the files
1. On your new repo page, click **Add file** → **Upload files**
2. Upload ONLY these two files:
   - `index.html`
   - `worker.js` (optional — just for reference, not needed on GitHub)
3. Click **Commit changes**

---

## STEP 3 — Update the Worker URL in index.html

### Option A — Edit directly on GitHub (easiest)
1. On your GitHub repo, click on `index.html`
2. Click the **pencil icon** (Edit this file)
3. Press **Ctrl+F** and search for: `YOUR_WORKER_URL`
4. Replace it with your actual worker URL, e.g.:
   ```
   const WORKER_URL = 'https://budget-barber-proxy.yourname.workers.dev';
   ```
5. Scroll down and click **Commit changes**

---

## STEP 4 — Enable GitHub Pages

1. In your GitHub repo, go to **Settings** (top menu)
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Set Branch to **main** and folder to **/ (root)**
5. Click **Save**
6. Wait 1–2 minutes, then your site will be live at:
   ```
   https://YOURUSERNAME.github.io/budget-barber/
   ```

---

## Done! 🎉

Your app is now live at:
`https://YOURUSERNAME.github.io/budget-barber/`

Share this link with customers to try AI hairstyle recommendations.

---

## Costs

| Service | Cost |
|---------|------|
| GitHub Pages | Free forever |
| Cloudflare Workers | Free (100,000 requests/day) |
| Anthropic API | ~₹0.25–₹0.80 per analysis |

---

## Troubleshooting

**"YOUR_WORKER_URL" error** — You haven't replaced the placeholder in index.html (Step 3).

**"Error: 401"** — Your Anthropic API key is wrong or not set in Cloudflare worker secrets.

**"Error: 403"** — Your Anthropic account may need billing enabled at console.anthropic.com.

**Page not loading** — GitHub Pages can take up to 5 minutes to go live after first setup.
