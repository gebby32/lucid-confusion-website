# Arcade homepage

Static, locally bundled Three.js 0.183.2 homepage; no build step or external CDN. Serve the repository with `node verification/serve.cjs` and visit http://127.0.0.1:8771/. Do not open index.html via file:// because GLB loading requires HTTP.

## Files and tuning

- `index.html`: accessible homepage, controls, supplied banner and construction character, legal links.
- `style.css`: stationary background and responsive placement. `--banner-glow` adjusts the added green glow; set `--show-construction: none` to hide the sloth.
- `arcade.js`: nine destinations (currently `href: null`, showing Coming soon), loader, normalization, camera, carousel and pointer/keyboard controls. Set actual section URLs in the `cabinets` array when ready.
- `assets/arcade/`: byte-identical copies of the three supplied PNGs and nine GLBs, organized for hosting. Original source folders are untouched.
- `assets/vendor/three/`: local Three.js runtime, GLTFLoader, required utilities and MIT license copied from the existing model project. No npm install is needed to run the website.

The `settings` object in arcade.js controls radius, normalized height, field of view, camera distance and elevation. All cabinets face outward on a true circular path, rotating with their parent; there is no rear-cabinet visibility cutoff or automatic rotation. The loop stops rendering when idle. Loads are sequential with Retro Arcade first. Device pixel ratio is capped for mobile rendering without altering the source models or textures.

Desktop drag, touchscreen horizontal drag, arrow buttons, selection dots, and keyboard Left/Right/Enter/Space are supported. Vertical touch scrolling and pinch zoom remain browser gestures. Reduced motion skips momentum and animated button snapping. Model load failures and unavailable WebGL show status text; HTML controls and legal links remain accessible.

## Verification

`verification/verify.cjs` uses the locally available Playwright package and Microsoft Edge. Its require path is specific to this workstation; set it to your own Playwright installation on another computer. Run the local server first, then `node verification/verify.cjs`. Screenshots are saved in verification/. Add `?debug=1` to expose read-only scene diagnostics for local inspection.

No section pages exist yet. All nine destinations intentionally show Coming soon, as approved. Privacy and Terms pages, legal.css, favicon, CNAME and the original bg.webp remain unchanged. Nothing has been deployed or published.
