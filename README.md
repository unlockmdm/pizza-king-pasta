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

## Before going live

- **Square:** catalog sync, Orders API, the Web Payments SDK (to replace the mock card form), location hours, and pickup/delivery fulfilment. This needs a small server for the Square access token.
- **Photography:** replace the stock photos (Unsplash and Wikimedia, credited on screen) with the shop's own photos.
- **Confirm with the owner:** the $4.99 delivery fee, 13% HST, tip presets, delivery radius, pop prices, the hot drink price ($3.10) and the extra-dip rule.
- **Content:** write the Terms and Privacy pages.
