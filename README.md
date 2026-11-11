# Pizza King & Pasta: ordering website

A working front-end demo of the online ordering site for **Pizza King & Pasta**, 10-511 Ray Lawson Blvd, Brampton, ON.

It covers the homepage, the full menu, the category pages (Meat Favourites, Pasta Bar, Wings & Sides, Drinks Bar, Gelato & Shakes), a live pizza builder, the pickup combo builder, the cart, checkout and the order confirmation. Everything runs in the browser. **No orders are sent and no payments are taken.** The cart is saved in the browser's local storage.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Stack

- Vite, React 18, TypeScript
- Styling uses inline style objects ported 1:1 from the Claude Design prototype. Responsive values come from `useWidth()` (breakpoints: under 600 is phone, 600–999 is tablet, 1000 and up is desktop).
- Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Layout

```
src/
  App.tsx              shell state: cart, pickup/delivery, in-place pages, sheets
  shell/               header, footer, homepage sections, start-order sheet, toasts
  components/          MenuPage, PizzaBuilder, ComboBuilder, CartCheckout,
                       CategoryPage, MeatFavourites, PastaPage
  lib/                 shared types, catalog/pricing, hooks, UI helpers (Hov, Photo, icons)
public/assets/         logo, pizza base, topping cut-outs, dips, pops, menu photos
```

## Square checkout (pickup orders)

Pickup orders are charged through Square. The browser uses Square's Web Payments SDK (card form and Google Pay; Apple Pay once the shop's domain is verified). A small server function, `worker/index.ts` → `server/square.ts`, creates a PICKUP order in Square and charges it, so orders show up in the shop's Square Order Manager. Declined payments cancel their order automatically. Delivery is handed off to DoorDash and Uber Eats.

- **Local:** put the keys in `.env.local` (never committed):
  `VITE_SQUARE_APP_ID`, `VITE_SQUARE_LOCATION_ID`, `SQUARE_ACCESS_TOKEN`, `SQUARE_ENV` (`sandbox` or `production`).
  `npm run dev` serves `/api/pay` from the Vite dev server.
- **Hosting (free):** a Cloudflare Worker with static assets (`wrangler.jsonc`). Build command `npm run build`, deploy command `npx wrangler deploy`. Build variables: `VITE_SQUARE_APP_ID`, `VITE_SQUARE_LOCATION_ID`. Worker variables: `SQUARE_ENV`, `VITE_SQUARE_LOCATION_ID`, and `SQUARE_ACCESS_TOKEN` as a secret.
- **GitHub Pages** has no server, so that build has no Square keys and stays a demo checkout that charges nothing.
- Test mode card: `4111 1111 1111 1111`, any future date, CVV `111`, ZIP `94103`.

## Before going live

- **Square:** switch the keys to production, verify the domain for Apple Pay, and re-price lines on the server from the Square catalog (see the TODO in `server/square.ts`).
- **Photography:** replace the stock photos (Unsplash and Wikimedia, credited on screen) with the shop's own photos.
- **Confirm with the owner:** the $4.99 delivery fee, 13% HST, tip presets, delivery radius, pop prices, the hot drink price ($3.10) and the extra-dip rule.
- **Content:** write the Terms and Privacy pages.
