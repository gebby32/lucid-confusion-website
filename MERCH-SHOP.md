# Fourthwall Merch Shop

Approved for publication to the existing GitHub Pages site at https://lucidconfusion.gg/.

## Files

- `arcade.js`: Merch Shop preview now uses the shared green typing animation and “Merch Shop” / “<click to continue>”. The existing `/merch-shop/` and `/merch-shop/view/` routes, camera transitions, Back buttons and browser history are retained. Shop interactions are excluded from the monitor's double-tap return gesture.
- `index.html`: isolated shop panel, stylesheet reference and Back to Arcade control using the existing transparent artwork.
- `merch-shop.css`: larger product cards fill the available row. The shop fills the viewport width and height, including ultrawide displays. Back to Cabinet and Back to Arcade fit in the left and right black header recesses on desktop; compact screens use a separate row inside the frame with 44px touch targets. The nine-slice frame keeps corner proportions and extends the rails to fit. Purple image backgrounds use a softly lit center to distinguish dark shirts, with a soft green glow following each product's transparent silhouette in the catalog, gallery and cart. “Wear the confusion” is neon green.
- `router.js`: product, enlarged-image and cart URL/history entries; return controls follow actual visited entries instead of assuming route depth equals the number of screens visited.
- `.github/workflows/pages.yml` and `tools/prepare-pages.cjs`: publish tracked website files through GitHub Pages, supplying the public Storefront configuration from a repository secret during the build. Development files and verification output are excluded from the website artifact.
- `merch-shop.js`: responsive catalog, fresh product details, variant/color/size selectors, gallery, quantities, cart editing, loading/error states and checkout redirect.
- `merch-api.js`: official Storefront API requests, all-collection pagination, availability, cart persistence and mutation guards.
- `merch-config.example.json`: credential-free configuration template.
- `.gitignore`: excludes the actual local configuration, temporary live catalog response and verification output.
- `verification/merch-api-check.mjs`, `verification/merch-shop-check.cjs` and `verification/merch-history-check.cjs`: API behavior, live browser, layout and individual-screen history checks.
- `assets/arcade/art/1 Merch Shop (widescreen).png`: supplied artwork added in checkpoint `b0a3374`; the pixels have not been modified. RGBA alpha spans 0–255, and the center is transparent.

## Configuration and credentials

The supplied Storefront Token is configured in **`merch-config.json`**, which is ignored by Git. No additional Fourthwall setting or credential is needed to run this local checkout.

On another checkout, create that file from `merch-config.example.json` and set `storefrontToken` to the shop's **Storefront Token** from Fourthwall **Settings → For developers**. Do not put a private Platform API key in this frontend.

Fourthwall explicitly supports direct browser calls with its Storefront Token. Consequently the running browser can inspect this public token even though it is excluded from Git. Production builds generate `merch-config.json` from the GitHub repository secret `FOURTHWALL_STOREFRONT_TOKEN`; its value is never committed or printed. GitHub Pages uses the `Publish arcade` workflow on pushes to `main`, retaining the existing custom domain. The build fails if the secret is missing, leaving the previous deployment intact.

## Behavior

The catalog is fetched when the shop opens, and on Refresh, from `/v1/collections/all/products`, beginning at page 0 with size 50 and following `paging.hasNextPage`. No product catalog, price or image is hardcoded or served from verification fixtures. Each product detail request obtains fresh data from `/v1/products/{slug}`.

Catalog, product, enlarged image and cart are individual browser-history entries. Product URLs use `/merch-shop/view/?product=<live-slug>`, enlarged images add `&image=expanded`, and the cart uses `/merch-shop/view/?cart=1`. Query routes reuse the existing static entry, so future products need no generated files or hosting rewrites. Fresh direct links seed their parent screens once; reloads retain the current screen and history. Browser Back/Forward follows one visited screen at a time. Back to Cabinet goes to the cabinet close-up; Back to Arcade goes directly to the main carousel. All merch/Continue shopping return to the catalog. Refresh updates the current shop screen without adding an entry.

Only the Fourthwall cart ID is saved locally, under `lucid-fourthwall-cart-v1`. Prices and item contents come from Fourthwall. Creating an empty cart includes `items: []`, which the live API requires. Add, change and remove requests use actual variant IDs. A per-page guard and Web Locks where supported serialize cart mutations. POST requests are never automatically retried. A network error retains the saved cart ID; a confirmed 404/410 expiration clears it. Blocked browser storage falls back to an in-memory cart with a visible warning.

Checkout refreshes the cart and redirects the whole page to the documented shop URL `/checkout/?cartCurrency=USD&cartId=…`. Payments, shipping, taxes, discounts and fulfillment remain on Fourthwall. No payment form is implemented locally.

## Verification — October 22, 2026

- All **six** current public products loaded from the live API; names matched the all-collection response. Actual product/variant images decoded successfully.
- Real monitor clicks exercised both zoom stages, including the green continue message. Existing regression coverage exercised all nine cabinets, Back buttons, browser Back/Forward, deep links, resize and shared camera behavior at 1360×600, 1520×695, 1920×916, 1440×900, 390×844, 320×568 and 844×390.
- Dedicated shop layout checks passed at 1280×720, 1920×1080, 2560×1440, 3440×1440, 856×654, 390×844, 320×568 and 844×390. Full-width/full-height framing, portrait viewing space, option controls and absence of horizontal overflow were checked. Product silhouette glows and frame screenshots were visually inspected.
- Shop history checks passed at 1920×906 and 390×844: card rows fill the width; return controls remain separate; browser Back/Forward visits image, product, cart, catalog, cabinet and carousel individually; both direct return controls reach their targets; reloads and fresh product/image/cart links do not duplicate parents. A delayed product response cannot reopen a screen after Back.
- Existing `routing-edge-check.cjs` and `routing-check.cjs` passed after the router update, including rapid Back/Forward, all cabinet deep links, desktop/mobile game and Links navigation, fullscreen cleanup and all 33 published game URL entries.
- Live color/size selection changed the actual variant ID and images. Two rapid submit events produced one add request.
- Multiple different products shared one live cart. Quantity changes, removing a line, adding another product and page refresh preserved that cart correctly.
- Official Fourthwall checkout was visually verified in the in-app browser with **2 shirts + 1 cap**, subtotal **$62.00**. These were test-cart quantities and live prices at verification time, not application constants. No contact, shipping or payment data was entered, and no order was placed.
- The headless Edge browser receives HTTP 403 from Fourthwall checkout. The in-app browser successfully opens the same documented checkout flow and shows both products. This is a verification-environment restriction, not an unverified checkout handoff.
- Simulated API failure displayed no placeholder/stale catalog, provided the official store link and left arcade navigation functional. Unit checks cover pagination, expiration, network/429 preservation, unavailable variants, missing prices and duplicate request protection.

Evidence is in the Git-ignored `verification/merch-output/` directory, including `catalog-1920.png`, `catalog-390.png`, `cart-1280.png` and `checkout-verified.png`.

## Limits

- Prices are requested/displayed in USD. Shipping, tax and final discounts are computed by Fourthwall at checkout.
- All current public products are regular products and are fully supported. Future bundle products are listed dynamically but currently link to their official Fourthwall product page for option selection; in-arcade bundle selection/group editing is not implemented.
- Cart persistence depends on browser storage and Fourthwall retaining that cart. Private/blocked storage is explicitly reported in the interface.
- A real paid order and fulfillment were intentionally not tested.

## Local preview and checks

Run `node verification/serve.cjs`, then open `http://127.0.0.1:8771/merch-shop/view/` (the cabinet intro is at `/merch-shop/`). No build, framework, backend or added production dependency is required.

Run `node verification/merch-api-check.mjs`. The live browser suite uses the existing Playwright/Edge setup: `node verification/merch-shop-check.cjs`, with `PREVIEW_URL` pointing at the preview server. `MERCH_LAYOUT_ONLY=1` runs only layout/failure checks; `MERCH_CART_ONLY=1` runs only the live cart workflow. Live tests create disposable carts and do not submit an order. `verification/two-stage-zoom-check.cjs` is the unchanged existing arcade regression suite.

Run `node verification/merch-history-check.cjs` for shop history and return-control checks; it makes no cart mutations. Shared router regressions are `node verification/routing-edge-check.cjs` and `node verification/routing-check.cjs`.

## Official references

- [Storefront authentication and direct browser calls](https://docs.fourthwall.com/storefront/getting-started)
- [All products and pagination](https://docs.fourthwall.com/storefront/products)
- [Cart and checkout tutorial](https://docs.fourthwall.com/storefront/cart-checkout-tutorial)
- [Create cart API reference](https://docs.fourthwall.com/api-reference/storefront/carts/create-cart)
- [Change quantity](https://docs.fourthwall.com/api-reference/storefront/carts/change-cart-quantity) and [remove items](https://docs.fourthwall.com/api-reference/storefront/carts/remove-from-cart)
