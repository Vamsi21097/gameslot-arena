# GameSlot Arena

A simple, no-backend website for posting gaming tournament ads (PUBG, Free Fire, COD Mobile, etc.) with match time, entry fee, and open slots — and letting players register in one click.

## How it works

- All tournaments live in [`data.json`](./data.json). No coding needed to add/update one — just edit the JSON.
- Players click **Register**, fill a tiny form (IGN, contact, optional team), and the site opens **WhatsApp** with their details pre-filled, addressed to your organizer number. They just hit send to confirm.
- The site is a static page (HTML/CSS/JS) hosted for free on **GitHub Pages**.

## Setup (do this first)

1. Open `data.json` and edit `siteConfig`:
   - `organizerWhatsapp`: your WhatsApp number in international format, digits only (e.g. `919876543210` for a +91 number). This is where registration messages get sent by default.
   - `siteName`, `tagline`, `supportEmail`: your branding.
2. Add your tournaments under `tournaments`. Each entry:

```json
{
  "id": "unique-id",
  "game": "PUBG Mobile",
  "title": "Friday Night Squad Showdown",
  "mode": "Squad (4v4)",
  "map": "Erangel",
  "date": "2026-09-27",
  "time": "20:00",
  "timezone": "IST",
  "entryFee": 50,
  "currency": "₹",
  "prizePool": 2000,
  "slotsTotal": 25,
  "slotsFilled": 14,
  "notes": "Room ID & password shared 15 minutes before match start.",
  "organizerWhatsapp": "919876543210"
}
```

`organizerWhatsapp` on a tournament is optional — it overrides the site-wide number for that specific event (handy if different admins run different games).

3. Update `slotsFilled` as people register, so the site always shows accurate availability.

## Publishing

This repo already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the site to GitHub Pages automatically on every push to `main`.

If Pages isn't live yet after the first push, go to **Settings → Pages** in this repo and confirm the source is set to **GitHub Actions** (the workflow sets this up automatically the first time it runs). The site will then be available at:

```
https://<your-github-username>.github.io/<repo-name>/
```

## Local preview

No build step needed — just open `index.html` in a browser, or run a tiny local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Roadmap ideas (not included yet)

- A real backend (e.g. Google Sheets, Firebase, or Formspree) to auto-collect registrations instead of routing through WhatsApp.
- An admin panel to add tournaments without editing JSON directly.
- Payment collection for entry fees (UPI deep links, Razorpay, etc.).
