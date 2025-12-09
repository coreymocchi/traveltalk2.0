# TravelTalk (local dev)

Quick guide to run the app in this workspace and access it from your host or remote editor.

Requirements
- Node.js (>=16) and npm

Local development
1. Install dependencies:

```bash
npm install
```

2. Create a `.env` with your API key (optional for translation):

```bash
cat > .env <<'EOF'
VITE_API_KEY=your_google_cloud_translate_api_key_here
EOF
```

3. Start dev server (binds to all interfaces so remote port forwarding works):

```bash
npm run dev -- --host 0.0.0.0
```

Open in browser
- If running locally in the same machine, open: `http://localhost:5173/`
- If running inside a remote dev container / Codespace / Codeserver, forward container port `5173` to your host (VS Code does this automatically when you "Forward Port") and open the forwarded URL. Vite also prints the network address (e.g. `http://10.x.x.x:5173/`).

Port forwarding (VS Code devcontainer / Codespaces)
1. Click the 'Ports' view in VS Code and forward port `5173`.
2. Open the forwarded address in your browser.

Production build

```bash
npm run build
```

Commit changes

```bash
git add -A
git commit -m "chore: add README with run/port-forward instructions"
```

If you want me to push the commit to `origin/main`, tell me and I'll run `git push` for you.

If you still see a "connection refused" error, tell me whether you're using a remote container, Codespace, or local machine and I will give explicit port-forward steps.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MrtVUKhC6IYrtHNoWYn0SbN8mXAN0DST

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
