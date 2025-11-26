# Allergen Webapp — PWA (static)

This is a static Progressive Web App (PWA) ready to be deployed to GitHub Pages.

## Files
- `index.html` — main page
- `app.js` — React app (JSX, compiled in-browser with Babel)
- `sw.js` — Service Worker (caches app shell for offline)
- `manifest.json` — Web manifest
- `icons/` — simple icons (SVG content)

## Local testing
1. Unzip and open `index.html` in a modern browser. For service worker functionality test, you need to serve files over `http(s)`.
2. To test offline behavior, serve via a simple local server:
   - Python 3: `python -m http.server 8000`
   - Then open: `http://localhost:8000`

## Deploy to GitHub Pages
1. Create a new GitHub repository.
2. Upload all files to the repository root (not in a subfolder).
3. In GitHub, go to Settings → Pages, set "Source" to branch `main` (or `gh-pages`) and folder `/ (root)`. Save.
4. After a minute your site will be available at `https://<username>.github.io/<repo>/`.

**Note:** Because the app uses in-browser Babel for JSX, the first load will parse the JS. For production you can pre-build with a bundler (recommended), but this static approach works and is simpler to deploy.

## PWA notes
- The service worker caches `index.html`, `app.js`, `manifest.json` and icons.
- On first visit the shell is cached; afterwards the app works offline.

