# ISHIMWE KENY KELVIN — Portfolio (Full-Stack)

Production-ready portfolio inspired by landonorris.com. Only you can edit it — through a password-protected admin panel with full CRUD.

**Stack:** Node.js · Express · SQLite (built-in `node:sqlite`, Node 22.5+) · JWT auth (httpOnly cookie) · bcrypt · GSAP animations · vanilla JS frontend · mobile-first CSS · light/dark mode.

## Run it

```bash
npm install
copy .env.example .env      # then edit .env — set ADMIN_PASSWORD
npm start
```

- Site: http://localhost:4000
- Admin: http://localhost:4000/admin

On first run the server creates your admin account and **prints the username + password in the terminal**. Log in and change the password right away (Admin → Account).

## Two ways to edit (admin only)

**1. Edit-in-place on the site itself.** When you're logged in, an admin bar appears at the bottom of the portfolio. Click **✎ Edit page**: click any text to retype it, click any image to replace it, ✕ removes items, + buttons add them. **✓ Save** writes everything to the database.

**2. The dashboard** (`/admin`): structured forms for everything, plus reordering (↑↓), image/PDF uploads, an **Inbox** for contact-form messages, and password change.

## What's on the site

Hero (name, role, photo with the reveal animation, optional **Download CV** button), marquee, two quotes (`**stars**` = lime highlight), horizontal-scroll gallery, ON/OFF CODE banners, projects grid, **career timeline**, skills strips, socials, **working contact form** (spam honeypot + rate-limited, messages land in your Inbox), lime footer. Light/dark mode, mobile-first, GSAP animations throughout.

## Security

Passwords hashed with bcrypt; login rate-limited (10 tries / 15 min); JWT stored in an httpOnly cookie (not readable by scripts); all write endpoints require auth; helmet security headers + CSP; uploads restricted to images and PDFs (max 8 MB).

## Deploy free (Render)

1. Push this folder to a GitHub repo (`.gitignore` already excludes secrets, database and uploads).
2. On [render.com](https://render.com): New → Web Service → connect the repo.
3. Build command `npm install`, start command `npm start`.
4. Environment: `NODE_ENV=production`, `ADMIN_USER`, `ADMIN_PASSWORD`, `JWT_SECRET` (long random string).
5. Note: on free hosting the SQLite file and uploads reset on redeploy — attach a persistent disk (Render supports this) to keep your data.

Railway, Fly.io, or any VPS work the same way. Vercel/Netlify will NOT work (they don't run persistent Node servers with SQLite).

## Notes

- Gallery seeds with your GitHub avatar as placeholders — replace with your own photos via Admin → Gallery.
- Theme toggle (◐ in the nav) switches dark/light; visitor choice is remembered.
- Don't run `npm install` inside OneDrive if sync is slow — or pause OneDrive sync during install.

## Structure

```
server.js          Express app, auth, CRUD API, uploads
db.js              SQLite layer + seed content
public/index.html  Portfolio (fetches /api/content)
public/admin.html  Admin dashboard
public/js|css/     Frontend logic & styles
data/              SQLite database (auto-created)
public/uploads/    Uploaded images (auto-created)
```
