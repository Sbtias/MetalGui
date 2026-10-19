# MetalGui

MetalGui is a lightweight browser-based game-making workspace. The current MVP includes a landing page, Supabase email/password authentication, private cloud-saved projects, a 2D scene editor, object hierarchy and inspector, drag-to-move editing, and a simple playable preview.

## Stack
- HTML, CSS and vanilla JavaScript
- Supabase Auth + Postgres
- Canvas 2D for the scene editor
- No build step required; can be hosted as a static site

## Setup
1. Open the Supabase project linked to this repository.
2. Apply the SQL migration in `supabase/migrations/20261019000000_create_game_projects.sql` (or confirm it has already been applied).
3. In Supabase Authentication settings, configure the site URL and allowed redirect URLs for your deployed site.
4. Host the repository as a static site (GitHub Pages, Netlify, or similar). Keep `index.html`, `styles.css`, `script.js`, `studio.html`, `studio.css`, and `studio.js` together at the same path.
5. Visit `studio.html`, create an account, and confirm the email if email confirmation is enabled.

The frontend uses the Supabase **publishable** key, which is designed for public clients. Never put a service-role or secret key in frontend files. Row Level Security policies ensure users can only access their own project rows.

## Current scope
This is a working 2D editor MVP, not a replacement for Unity/Godot yet. It does not currently compile native games, support 3D scenes, import arbitrary assets, or export standalone game builds. Play mode is a basic in-browser preview.
