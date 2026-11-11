# Handoff: Pizza King & Pasta — ordering website

## Overview
A website for **Pizza King & Pasta**, a local pizzeria at **10-511 Ray Lawson Blvd, Brampton, ON L6Y 0N2** (phone 905-460-9494, open every day 11 AM – 2 AM).

The site's main job is **online ordering for pickup**. Delivery is handed off to DoorDash and Uber Eats. It also covers the full menu, walk-in combos, hours and location. It's built mobile-first: most customers order from a phone.

Business facts the build must respect (confirmed by the owner):
- **POS is Square.** Orders, menu, prices and payments should go through Square (Orders API, Catalog API, Web Payments SDK).
- **Every pizza is wood-fired.** Customers can choose conventional oven instead.
- **Delivery is NOT done by the shop.** It's a small family shop with no drivers. Delivery goes through **DoorDash** and **Uber Eats** using each app's free, commission-free storefront ordering page. The customer pays the delivery fee and tip to the app, and the app's driver delivers. Our site never takes a delivery address or delivery payment. **Never say "our own drivers" anywhere.**
- **SkipTheDishes is deliberately left out** (it charges the shop per order).
- **The website is pickup-only.** Menu, pizza builder, combos, cart and checkout all work as pickup. Choosing Delivery anywhere shows two buttons that open the shop's page in DoorDash or Uber Eats.
- **Walk-in combos** are pickup only, which matches the site.
- **No dine-in.** The site has no dine-in photos or reservations.
- **English only** for now.
- **No wait-time estimates anywhere.** Pickup is "Ready as soon as possible". The owner explicitly asked for no "18 min" or "15/30/45 min" choosers, because the shop doesn't track times.
- **No "Open now" green or red status dots or pills.** The owner asked for these to be removed. The hours appear only in the Hours & location section.

## About the design files
The files in `prototype/` are **design references built in HTML**. They are working prototypes that show the intended look, copy and behaviour. They are **not production code**. Recreate them in a real stack (recommended: **Next.js + React + TypeScript + Tailwind**, wired to Square) using that stack's normal patterns. Don't ship the HTML.

To view them, open `prototype/Pizza King Home v2.dc.html` in a browser through a local static server, for example `npx serve prototype`. It is the entry point. Every other screen is mounted from it as a child component (`<dc-import name="…">`).

Prototype format notes, useful for reading the source:
- Each `*.dc.html` has a template (HTML with `{{ value }}` holes, plus `<sc-for>` loops and `<sc-if>` conditionals) and a `class Component` whose `renderVals()` computes everything the template shows. All styling is inline `style="…"`. `style-hover="…"` is the hover state.
- Data such as menu items, prices and toppings lives in `const` arrays at the top of each component's script. **Those arrays are the spec** for content and pricing.
- `support.js` is the prototype runtime and `image-slot.js` is a drag-and-drop image placeholder. Neither is needed in production.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, copy and interactions are final, so recreate them closely. The exceptions are photography (see Assets) and the payment form, which is a visual mock to be replaced with the Square Web Payments SDK card element.

---

## Design principles (what the owner asked for and why)
These came out of many review rounds. Treat them as rules.

1. **Modern, premium, not "vibe-coded".** Big confident type, generous rounding, real food photography, a clean white canvas. No clip art, no cartoon illustrations, no emoji, no gimmicky colour blocks.
2. **White everywhere.** The page and checkout backgrounds are pure `#FFFFFF`. Neutral surfaces are cool greys (`#F2F2F5`, `#EDEDF0`). **No beige, cream or warm-grey backgrounds** anywhere; the owner explicitly rejected them.
3. **Professional copy.** Short, factual, no slang, no cutesy lines, no repeated words ("Wood burning oven" next to "Wood-fired" was removed). Describe what's on the page.
4. **One visual system.** Every page shares the same header, footer, cart, font (Figtree) and card style. The menu was moved *inside* the homepage shell for this reason.
5. **Real photos only.** If a photo doesn't show the actual item, leave an empty image box rather than a misleading picture.
6. **Live pizza.** In the builder, toppings appear on a real pizza as they're added, on the whole pizza or just the left or right half, using photo cut-outs of real ingredients.
7. **Works on every screen.** Checked at 320, 375, 390, 430, 768, 1024 and 1366px wide: nothing overflows, gets cut off or overlaps, and tap targets are at least 40–44px.

---

## Design tokens

### Colour
| Token | Hex | Use |
|---|---|---|
| ink | `#1A1414` | Primary text, dark buttons, dark sections, footer bg |
| red (brand) | `#D7192D` | Primary CTA, prices, accents, "&" in wordmark |
| red-hover | `#B5121F` / `#C0121F` | CTA hover |
| red-deep | `#C11425` | Pressed / secondary red |
| red-light | `#FF4B57` | Second hero line ("Made to order.") on dark photo |
| red-soft | `#FF7A85` | Footer link hover on dark |
| white | `#FFFFFF` | Page background, cards |
| grey-50 | `#F8F8FB` | Subtle fills |
| grey-100 | `#F2F2F5` | Neutral surfaces (Hours card, chips, segmented controls) |
| grey-150 | `#EDEDF0` | Card borders (as `inset 0 0 0 1px`), BYO tile |
| grey-200 | `#E4E4E7` / `#E6E6EA` / `#E8E8EB` | Dividers, rings |
| text-2 | `#636366` / `#646467` | Secondary text |
| text-3 | `#818184` / `#87878A` | Tertiary text, footer legal |
| green | `#1E8A4C` | "Added" confirmation state on buttons |
| green-veg | `#1E9E4A` (dot) / `#1E7A3C` (text) / `#12663A` | Vegetarian marker |
| orange (Meat tile) | `#C2511F` | Meat Favourites menu tile |
| amber (Pasta tile) | `#F2B53A` | Pasta Bar tile |

Dark photo overlays: `linear-gradient(0deg, rgba(14,8,8,.9), rgba(14,8,8,.1) 62%)`.

### Typography
- **Font:** [Figtree](https://fonts.google.com/specimen/Figtree), weights 400, 500, 600, 700, 800 and 900, used everywhere including the builder. Fallback `system-ui, sans-serif`.
- **Display / hero:** 900 weight, line-height .86–.9, letter-spacing −.055em to −.065em. Size `clamp(64px, 6.8vw, 96px)` on desktop, 84px on tablet, `15vw` on phone.
- **Section H2:** 900, `clamp(34px, 4vw, 52px)`, lh 1, ls −.04em.
- **Card title:** 900, 22px, ls −.03em, lh 1.1.
- **Price:** 900, 22–26px, ls −.035em to −.04em.
- **Body:** 400–600, 14–17px, lh 1.45–1.5, with `text-wrap: pretty`.
- **Eyebrow / label:** 800, 12–13px, uppercase, letter-spacing .06–.14em.
- **Buttons:** 800, 14–16px. The hero CTA is 900, 18px.

### Radius
- Hero and large panels: 32–36px
- Cards: 24–28px
- Thumbnails: 14–18px
- Buttons, chips, segmented controls and pills: 999px (fully rounded)

### Spacing
- Page max-width **1320px**, side padding `clamp(16px, 3vw, 32px)`.
- Section vertical padding `clamp(56px, 7vw, 96px)`.
- Grid gaps: 14px (bento), 16–20px (cards).

### Shadows
- Card resting: `inset 0 0 0 1px #EEE6E0` (hairline ring, no drop shadow).
- Card hover: `translateY(-4px)` plus `0 22px 44px rgba(26,20,20,.12)`.
- Floating toast/popover: `0 1px 2px rgba(26,20,20,.06), 0 24px 56px -12px rgba(26,20,20,.3)`.
- Cut-out food on a pizza: `drop-shadow(0 10px 14px rgba(60,30,10,.22))`.
- **No white halo or ring behind pizza cut-outs.** The owner flagged this specifically.

### Motion
- Standard ease: `cubic-bezier(.2,.8,.2,1)`.
- Hero headline lines rise in (`pkUp`, 1s), staggered 0 / .12s / .24s.
- Hero photo: slow Ken-Burns zoom (`pkZoom`, 18s, alternate, infinite).
- Hover lifts: .2–.3s. "Added ✓" button confirmation: 1.4s, then it reverts.
- The **Build Your Own** tile's pizza cycles through topping combinations every ~2–3s (`BYO_SETS` in the homepage).
- The hero has **no floating item pill**; the owner asked for it to be removed.
- Respect `prefers-reduced-motion` in production.

---

## Screens

### 1. Homepage — `Pizza King Home v2.dc.html`
**Header** (sticky, white at 86% opacity with `blur(16px)`, 1px bottom hairline):
- Left: round chef logo (44px) plus the wordmark "Pizza King **&** Pasta" (900, 19px). The wordmark is hidden on narrow phones.
- Centre nav (desktop only): Menu · Specials · Pickup combos · Hours & location.
- Right: order-type button showing "Pickup · ASAP" (or "Pickup · {time}" when scheduled). Tapping it opens the Start-your-order sheet, where Delivery can be found. Then a Cart button with a count badge.

**Hero, a bento grid** (`data-screen-label="Hero"`):
- **Desktop (≥1000px):** columns `1.55fr 1fr 1fr`, areas `"hero deal deal" "hero byo pasta"`. Height `clamp(640px, 100vh − 110px, 800px)`.
- **Tablet (600–999px):** areas `"hero hero" "deal deal" "byo pasta"`, rows 560 / 320 / 300px.
- **Phone (<600px):** one column stacked; rows 540 / 330 / 290 / 290px.
- **Hero tile:** full-bleed wood-fired pizza photo with a dark gradient overlay.
  - Headline "Wood-fired." / "Made to order." (second line in `#FF4B57`).
  - CTA row: **Start your order** (red, 60px tall, white circle arrow) and **See the menu** (frosted). They sit directly under the headline with no odd gaps. Button placement was a repeated complaint, so keep them aligned to the headline's left edge.
- **Deal tile (Pickup combo):** "Two Large $35.99".
  - Shows two pizzas, plus two Coca-Cola cans and two **Pizza King-branded dip cups** (custom labels, not Heinz).
  - The cans and dips are small and tucked bottom-right so the pizzas stay dominant.
  - The extras and the second pizza are hidden under 600px.
- **Build Your Own tile:** "Any 4 toppings". The pizza animates through topping sets.
- **Fresh pasta tile:** "Rosé, Alfredo, tomato". Opens the Pasta Bar.

**Menu categories** (`#menu`): a grid of 8 photo tiles, each opening a page in-place:

| Tile | Caption | Background |
|---|---|---|
| Build Your Own | Any 4 toppings | `#EDEDF0` |
| House Specials | Desi & classic | `#D7192D` |
| Meat Favourites | Pepperoni, bacon, sausage | `#C2511F` |
| Pickup Combos | From $11.99 | `#1A1414` |
| Pasta Bar | Pasta and momos | `#F2B53A` |
| Wings & Sides | Wings, tandoori, salads, sides | — |
| Drinks Bar | Juice, lassi, coffee, beer | — |
| Gelato & Shakes | Cones, scoops, thick shakes | — |

Below the grid is a "View full menu →" link.

**House specials** (`#bestsellers`): photo cards for Shahi Paneer (Veg), Butter Chicken, Shawarma Chicken (tag "Spicy") and Meat Lover. Each card has an S/M/L/XL size switch, a price, a "+" button and "Customize".

**Pickup combos** (`#deals`): 4 cards in a 4/2/1-column grid (breakpoints ≥1100 / ≥560 / below), tall 4:5 photo cards with a red price tag. Tapping one opens the Combo builder.
- One Large $11.99: 1 large pizza, 1 topping.
- Two Large $35.99: 2 large, 4 toppings each, 2 dips, 2 pops, sugarcane juice or wood-oven corn.
- Two Medium $31.99: same inclusions as Two Large.
- Two Small $25.99: 4 toppings each, 2 dips.

**Wood oven** (`#oven`): a dark split panel with a photo of the oven and the heading "Wood-fired or conventional, on every pizza."

**Hours & location** (`#visit`): a grey card with Address, Hours ("Every day / 11 AM – 2 AM") and Phone (tap to call). Buttons: **Get directions** (Google Maps link) and **Call the shop**. Below a hairline divider is a **Delivery** block: "Available through DoorDash and Uber Eats." plus two white pill buttons, **Order delivery on DoorDash** and **Order delivery on Uber Eats**. Next to the card is a photo panel.

**Footer** (`#1A1414`):
- Logo and wordmark with a "Start your order" CTA.
- Menu column: House specials, Build your own, Pasta, Wings & sides, Juice & gelato.
- Order column: Pickup, Delivery (opens the Start-your-order sheet on the Delivery tab), Pickup combos, Our wood oven.
- Legal row: "© 2026 Pizza King & Pasta · Prices exclude HST", Terms of Service, Privacy Policy.
- When the cart has items, the footer gets extra bottom padding (124px instead of 28px) so the floating **View order** bar never covers the legal links.

**Start-your-order sheet** (opens from the CTA and the header button):
- Pickup / Delivery segmented control.
- **Pickup tab:** store map and address with Directions, timing (**As soon as possible** or **Schedule for later**), then "Start pickup order". When the shop is closed, the next available time is 11:00 AM.
- **Delivery tab:** no address field and no timing. It shows "Delivery is handled by DoorDash and Uber Eats. You'll finish your order in their app.", then two full-width dark buttons, **Order delivery on DoorDash** and **Order delivery on Uber Eats**, which open the shop's storefront in a new tab. Below them: "Delivery fees and tips are paid in the app."

**Item sheet** (tapping a house special): size, crust, bake and quantity, then "Add to order".

**Toasts:**
- "Added to your order": photo, name, options and price. Names wrap; they're never cut off with "…".
- Info toast, e.g. "Pickup, as soon as possible" after starting an order. Also wraps.

### 2. Full menu — `MenuPage.dc.html`
Opened by "See the menu" or "View full menu". It renders inside the homepage shell, with the same header and cart.
- **Sticky section bar** under the header: Walk-in specials · Pizzas · Wings & tandoori · Sides & salads · Pasta & momos · Drinks · Gelato & shakes · Dipping sauces. The active section highlights as you scroll.
  - **Dipping sauces is always last**, after drinks.
  - Price tags must never slide over this bar; it sits above them in z-order.
- **Walk-in specials:** dark cards (`#2A2020`). Each shows a composed scene of real pizzas topped with ingredient cut-outs, plus Coke cans and Pizza King dip cups on the dark background.
- **Every other section** uses the same photo-card grid as Pizzas: photo on top, name, description, price and a "+" button. The owner liked the Pizzas section most, so all sections follow it.
- **Pizzas:** all flyer pizzas. "Customize" opens the Pizza Builder.
- **Dipping sauces:** Creamy garlic, Ranch, Chipotle, Jalapeño cheddar, Marinara. Shown as top-down open white cups with the sauce visible (`assets/dips/*`, drawn in code; replace with real top-down photos when available).
- `Menu reference.md` is the **source of truth for items and prices**. It was transcribed from the paper flyer with crossed-out items excluded.

### 3. Pizza builder — `PizzaBuilder.dc.html` (full-screen sheet)
The main feature: build or customise a pizza and watch it change.
- **Layout:**
  - Desktop: the live pizza is pinned on the left. The options column is on the right with a sticky tab bar (**Oven & crust · Base sauce · Cheese · Toppings · Instructions**, no check marks; the active tab is highlighted).
  - Phone: the pizza sits at the top and the options scroll below it.
  - A sticky footer holds quantity, the price and **Add to order**.
- **Live pizza:**
  - Base image `assets/pizza-base.png`, a real cheese pizza.
  - Sauce choice tints or changes the sauce layer.
  - Each topping scatters real cut-out pieces (`assets/toppings/pz/*`) over the cheese.
  - Placement can be **Left half / Whole / Right half**; pieces only render on the chosen half.
  - The pizza scales with size (S .8 → XL 1.0).
  - Tandoori paneer shows **reddish-orange** paneer and Shahi paneer shows **yellow** paneer; they must be visually distinct.
  - Opening "Customize" on any special shows the **plain cheese base with that pizza's toppings already on**, not the menu photo.
- **Sizes:** Small 24cm $11.99 · Medium 29cm $14.60 · Large 34cm $16.50 · X-Large 40cm $22.80.
- **Extra topping price** by size: S $0.99 · M $2.00 · L $2.50 · XL $3.00. Build Your Own includes 4 toppings, and specials include their own.
- **Crust:** Regular, Thin or Thick, shown as large photo cards with the name in white over the photo. These are stock photos; replace with the shop's own crust shots. The small summary thumbnail always shows `pizza-base.png`.
- **Bake:** Wood-fired (default, card shows the oven-with-flames photo) or Conventional.
- **Base sauce** (section and tab are labelled "Base sauce"): Marinara (default; internal value `Regular`), Butter chicken, Shahi paneer, Garlic, Hot, BBQ, Pesto, Honey garlic. Each sauce swaps the live pizza's base image (`assets/sauce-base/*`). Pesto uses a dark olive-basil tone concentrated at the sauce ring, not bright green.
- **Toppings:** tabs Veggie / Meat / Cheese. Each topping is a photo tile with a whole/left/right placement control. The full list is in `TOPS`.
- **Free add-ons (no charge):** Ginger, Garlic, Coriander, Red chilli, Green chilli, Oregano, Italian spice. Each has a real photo; red chilli is a red-recoloured version of the green chilli photo.
- **Instructions:**
  - **Bake level:** Light / Regular / Well done, shown as the real pizza photo with paler, normal and darker treatment.
  - **Cut:** Triangles (8) / Squares (3×3) / Uncut, shown as knife lines over the photo.
  - **Note for the kitchen:** a large, styled text area.
- **No-cut-out toppings:** Feta, Capers, Artichokes, Calamari, Salmon and Tandoori fish have no cut-out yet, so they don't render on the pizza. They need real cut-outs.

### 4. Combo builder — `ComboBuilder.dc.html` (full-screen sheet)
Opened from any pickup combo.
- **Header:** close button, title (e.g. "Two Large combo"), a deal line that wraps on phones, and the price.
- **Pizzas:** one card per pizza in the deal, labelled with a kicker ("Pizza 1"), name and summary, and "Customize pizza N". Each opens the Pizza Builder with that combo's topping allowance. A tracker shows "0 of 2 ready". Cards wrap their button under the text on narrow phones.
- **Dips:** pick up to N of 5 dips (top-down cup images, 112px). Extras are added separately from the menu.
- **Pops:** pick N of Coca-Cola, Pepsi, Sprite, Canada Dry and Orange Crush. All can images are trimmed and normalised to the **same height and baseline**.
- **Side:** Sugarcane juice or Wood-oven corn, for Two Large and Two Medium.
- Rules come from `SPEC`:

| Deal | Size | Pizzas | Toppings | Dips | Pops | Side |
|---|---|---|---|---|---|---|
| one-large | L | 1 | 1 | 0 | 0 | No |
| two-large | L | 2 | 4 | 2 | 2 | Yes |
| two-medium | M | 2 | 4 | 2 | 2 | Yes |
| two-small | S | 2 | 4 | 2 | 0 | No |

### 5. Category pages
**`CategoryPage.dc.html`** is one shared template for three pages (prop `category`):
- **Wings & Sides:**
  - Filters: All / Wings & tandoori / Sides & salads.
  - Tandoori wings: flavour Hot, Honey garlic or BBQ; 8/12/16/24/34/48 wings at $9.99–$41.99.
  - Chicken leg $4.99 per piece. Fish $12.50 per lb.
  - Wedges, sub, salads, corn, fruit chaat.
- **Drinks Bar:**
  - Fresh fruit juice (flavour and size), sugarcane, coconut, lassi.
  - Italian espresso $2.00. Hot drinks $3.10.
  - Beer: bottle $5.70, can $7.50.
- **Gelato & Shakes:** cone (10 flavours), by the scoop ($2.99 each), thick shake (6 flavours, M/L/XL).

Each page layout:
- A full-width photo hero (32px radius, dark gradient) with a Back button, eyebrow and a two-line headline (second line red).
- Then a grid of white photo cards (`minmax(min(100%, 290px), 1fr)`). Each card has a segmented size control or flavour chips, a price that updates live, and a red "+" that flashes green ✓ for 1.4s.

**`MeatFavourites.dc.html`:**
- Hero, filter chips, Build Your Own card first, then the meat pizzas.
- Each pizza card has an S/M/L/XL switch, a price, "+" and "Customize".

**`PastaPage.dc.html` (Pasta Bar):**
- Choose a sauce (Rosé / Alfredo / Tomato) from photo cards, then a base (Classic / Veggie / Chicken). Some bases are only available with certain sauces; see `BASES[].p`.
- A sticky summary panel on the right (desktop) or below (phone) shows the photo, title, description, quantity and "Add to order $X". On small phones the add button wraps below the quantity control.
- **Momos:** Veggie $8.99 · Non-veggie $10.99.

### 6. Cart and checkout — `CartCheckout.dc.html`
- **Floating cart bar** on phone and tablet: dark pill pinned to the bottom.
  - Content: a red bag icon with a count badge, "View order", "N items · Pickup" and the subtotal.
  - On screens under 360px it shows just "N items".
  - On desktop it's a 380px card at the bottom right.
- **Cart drawer** ("Your order"):
  - Line items with thumbnail, name, options (2-line clamp), line total, and a −/qty/+ stepper (44px pill, 40px buttons).
  - "Goes well with" upsells: Fresh juice $6.80, Gelato cone $5.99.
  - "Subtotal · taxes at checkout", then **Go to checkout**.
  - Empty state: "Your order is empty / Add a pizza to get started. / Browse the menu".
- **Checkout** (white background, **pickup only**):
  - **Pickup:** the store address and phone. There's no delivery option, no address fields and **no time picker**; timing is ASAP or scheduled from the start sheet.
  - **Contact:** Full name, Phone, Email.
  - **Note for the kitchen.**
  - **Payment:** card (mock; replace with the Square Web Payments SDK) or Pay at pickup. Accepted cards are shown.
  - **"Your order" receipt:** a clean breakdown of each item with all chosen options, then Subtotal, HST (13%) and Total. No delivery fee and no tip. It was redesigned to read like a proper receipt, not a dark block.
  - **Place order:** validates name, phone and email, showing inline errors. On success the **Order placed** screen appears. This is the **approved design**, built from the `Order Confirmation Options` board:
    - A dark "In the oven" status card: big headline, "Wood-fired and made to order. We’ll text you the moment it’s ready.", and the cheese pizza turning slowly.
    - Three progress steps: Received (done, green) · In the oven (current) · Ready for pickup (next).
    - Pickup line: "Ready as soon as possible" or "Ready at {time}"; "Ready now" when the stage is `ready`.
    - Store address with directions and call actions, then an itemized receipt (thumbnail, name, options, line totals, Subtotal, HST, Total, payment line).
    - "Back to menu" closes it and empties the cart.
    - Prop `stage` (`oven` | `ready`) drives the status. In production, drive it from the Square order state.
    - `Order Confirmation Preview.dc.html` (in `prototype/`) opens this screen directly with sample items, for review.
- The cart persists to `localStorage` (`CART_KEY`). In production, use server or Square order state.

---

## State (homepage root)
- `mode`: always `'pickup'` once an order starts (null before). There is no on-site delivery mode. `wMode` is only the sheet's active tab (pickup or delivery).
- `cart`: `{ key, name, summary, unit, qty }[]`, where `key` encodes the item and its options so identical builds merge.
- `cartOpen`, `view` (which in-place page is showing: home / menu / pasta / meat / wings / juice / gelato), `item` (open item sheet), `combo` (open combo builder).
- `when`: `'asap' | scheduled time` for pickup.
- `w`: viewport width, which drives all responsive layout values.
- Builder-local: size, crust, bake, sauce, cheese, `tops` (`{ id: 'left' | 'whole' | 'right' }`), `free`, doneness, cut, notes, qty.
- Prototype tweak props, for the demo only: `showWelcome`, `autoplay`, `openState` (forces open or closed for preview). In production, open/closed comes from Square location hours in America/Toronto time; the shop is open 11:00 to 02:00.

## Responsive behaviour
- **Breakpoints:** <600 phone, 600–999 tablet, ≥1000 desktop. Deals grid: ≥1100 has 4 columns, ≥560 has 2, below that 1. The Pasta page goes two-column at ≥980px.
- **Required checks, all passing in the prototype:**
  - No horizontal scroll at 320 / 375 / 390 / 430 / 768 / 1024 / 1366px.
  - No text cut off, except single-line ellipsis in header titles.
  - No overlapping text, and tap targets of at least 40px.
  - The cart bar never covers content, because the footer pads itself.

---

## Assets
Everything is under `prototype/assets/`:
- `chef-logo.png`: the Pizza King chef logo, supplied by the owner.
- `pizza-base.png`: real cheese pizza, the base for the builder and all scenes.
- `toppings/pz/*.png`: transparent cut-outs of each topping, cut from a reference pizza photo the owner supplied. They're used to build the live pizza; scatter 2–4 variants per topping with random rotation.
- `ingredients/*`: ingredient photos for topping tiles and free add-ons. The sources are the TheMealDB ingredient library and recoloured variants.
- `combo/`: Coke can and Pizza King dip cup. `pops/`: the five pop cans, normalised to the same height. `dips/`: five top-down open dip cups used in the menu and combo builder. The Pizza King-branded cup (`combo/`) is still used on the homepage combo tile and walk-in special scenes.
- `menu/`: pasta, gelato and mixed-juice photos. The juice is recoloured to the shop's real pink-red mix juice.
- **Stock photography:** most food photos load from Unsplash URLs in the source.
  - The Unsplash licence is free, but the prototype shows a small "Photo by … on Unsplash" credit on each.
  - The pasta photo is Wikimedia Commons, **CC BY-SA**, and requires attribution.
  - **Replace all stock photos with the restaurant's own photography before launch.** Several items have no matching photo and show an empty box on purpose: coconut juice, sugarcane juice and tandoori fish.
- **Trademarks:** Coca-Cola, Pepsi, Sprite, Canada Dry and Orange Crush can images are the brands' own. Reselling the products is normal, but confirm usage with the bottler or distributor.

## Open items for the developer
1. **Square integration:** catalog sync, orders, Web Payments SDK, location hours, and pickup/delivery fulfilment.
2. **Pop price** is missing from the flyer, so pop isn't sold à la carte yet. Get it from the owner.
3. **Topping cut-outs:** six toppings have none (Feta, Capers, Artichokes, Calamari, Salmon, Tandoori fish).
4. **Real photography** of the shop's pizzas, oven, juice, lassi and momos.
5. **Delivery links are placeholders.** The buttons currently point to `https://www.doordash.com/` and `https://www.ubereats.com/`. The owner will enable the free storefront pages (DoorDash Storefront, Uber Eats direct ordering) and send the real URLs. Put them in one config constant and use it in all four places (the sheet's two buttons and Hours & location's two buttons). Use text buttons, or the brands' official marks only if added properly per their brand guidelines; never redraw the logos.
6. **Terms and Privacy pages** need content.
7. Confirm **13% HST** with the owner.

## Files
- `prototype/Pizza King Home v2.dc.html`: **entry point**. Shell, header, hero bento, categories, house specials, pickup combos, oven, hours, footer, start sheet, toasts. It mounts all the others.
- `prototype/MenuPage.dc.html`: full menu with sticky section nav.
- `prototype/PizzaBuilder.dc.html`: live pizza builder.
- `prototype/ComboBuilder.dc.html`: pickup combo builder.
- `prototype/CartCheckout.dc.html`: cart bar, cart drawer, checkout, order confirmation (approved design).
- `prototype/Order Confirmation Preview.dc.html`: opens the confirmation screen directly with sample items.
- `prototype/CategoryPage.dc.html`: Wings & Sides, Drinks Bar, Gelato & Shakes.
- `prototype/MeatFavourites.dc.html`: Meat Favourites page.
- `prototype/PastaPage.dc.html`: Pasta Bar plus momos.
- `prototype/support.js`, `prototype/image-slot.js`: prototype runtime only.
- `Menu reference.md`: full menu and prices from the flyer (source of truth).
- `references/`: screenshots of the Pizza Pizza and Pizza Nova sites the owner gave as **inspiration only**. Don't copy their branding or layouts.
- `explorations/`: option boards for context only. `Homepage Hero Options` and `Walk-in Specials Options` (chosen directions are already in the prototype), `Order Confirmation Options` (the direction board the confirmation screen was chosen from; the approved version is already in `CartCheckout.dc.html`), and `Checkout Payment States` (every state of the payment box: ready, loading, test mode, processing, declined, card error, details missing, unavailable, demo, and receipt payment lines).
