# Cyprus Crags Sun/Shade Calculator

Single-page app that shows sun vs. shade timeline for climbing sectors in Cyprus and includes a feedback form that sends email through a small Node/Express backend.

## Contents
- `calc.html` – Main frontend (loads `sectors.json`, renders chart, feedback form)
- `sectors.json` – Data for sectors (served statically)
- `server.js` – Express server (serves static files + `/api/feedback` POST)
- `package.json` – Node dependencies and start script
- `.env.example` – Environment variable template
- `.gitignore` – Ignore node_modules and secrets

## Setup
1. Copy `.env.example` to `.env` and edit values:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_account@gmail.com
SMTP_PASS=app_password_here
FEEDBACK_TO=unique.center.yoni@gmail.com
PORT=3000
```
Gmail: enable 2FA, create an **App Password**, use it as SMTP_PASS.

2. Install dependencies:
```
npm install
```

3. Start server:
```
npm start
```
Visit: http://localhost:3000/calc.html

## Feedback API
`POST /api/feedback`
Body JSON:
```json
{ "name": "Optional", "email": "optional@example.com", "message": "Text" }
```
Success: `{ "ok": true }`
Errors return `{ ok:false, error:"CODE" }` with HTTP status.

## Deployment
Use any Node hosting (Render, Railway, Fly.io, VPS). Set the same env vars as `.env`.

Minimal start command: `node server.js`

If deploying behind a reverse proxy, ensure POST `/api/feedback` is allowed.

## Security Notes
- Do **not** commit `.env`.
- Rate limiting included is naive (memory); for production consider a real store (Redis) or external service.
- If you only host `calc.html` on a static host (GitHub Pages, etc.) without `server.js`, feedback sending will NOT work.

## Future Ideas
- Add captcha / hCaptcha token check.
- Add persistent logging or DB storage of feedback.
- Add multi-language localization for status messages.

## License
Internal / personal use (add a license if you want to open source).
