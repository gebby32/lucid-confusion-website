# Local verification — October 6, 2026

Passed in Microsoft Edge through Playwright:
- All nine GLBs loaded; each has four textures. Normalized height: 1.8 units; ground minimum: zero.
- Two full revolutions in each direction; all nine models remain visible scene members throughout.
- Mouse drag and snap; emulated touchscreen drag and snap; no activation from dragging.
- Active cabinet raycast click displays Coming soon; selection controls and keyboard navigation work.
- Reduced-motion controls snap immediately.
- Privacy and Terms return HTTP 200; their source files and legal.css are unchanged.
- No JavaScript exceptions or browser console errors during the full interaction suite.
- Desktop (1440×900), tablet (768×1024), phone (390×844), and small phone (320×568) screenshots inspected. Final phone framing was rechecked after lowering the carousel; no horizontal overflow.
- SHA-256 comparison confirms all nine copied GLBs and all three copied PNGs exactly match supplied source assets.
- git diff --check passed.

Screenshots: desktop.png, tablet.png, mobile.png, small-phone.png.

Review together: overall cabinet scale and spacing, camera elevation, lighting, and portrait background crop. Portrait screens preserve the center of the artwork but crop its sides to fill the screen. Phones were emulated; physical-device performance and gestures have not been measured. Screens remain dark as authored in the supplied models. All destinations intentionally show Coming soon. No deployment or publication performed.
