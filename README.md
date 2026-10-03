# Wrap and Wing Co — Official Web Application

> **Bold Flavour. Hot & Fresh.**
> Premier flame-grilled chicken, handcrafted wraps, and signature wings in Pinetown, KwaZulu-Natal.

---

## 🚀 Features & Architecture

* **Nando's-Inspired UI/UX:** Sticky horizontal category pills, flame heat selector, and slide-over order drawer.
* **Exact Real-World Menu:**
  * Wraps (Shwarma style from R39.90, Meals from R69.90)
  * Flame-Grilled Wings (3, 6, 10 pcs) with 5 Basting Sauces:
    * 🍋 Lemony
    * 🌶️ Mild
    * 🍶 Barbeque
    * 🍯 Sweet Chilli
    * 🔥 Hot
  * Flame-Grilled Chicken (1/4 Chicken R55, Family Feast R149.90)
  * Burgers, Toasted Sandwiches, Seafood, Sides & Kids Meals
* **Payment Gateways Supported:**
  * **PayFast** (Instant EFT, Capitec Pay, Visa, Mastercard, SnapScan)
  * **Yoco** (Card checkout, Apple Pay)
  * **WhatsApp Direct & Cash on Delivery**
* **Driver Navigation Engine:**
  * 📍 **1-Tap Google Maps Turn-by-Turn:** Pre-populated destination coordinates.
  * 🚙 **1-Tap Waze Navigation:** Direct traffic-aware routing.
  * 📞 **Direct Call / WhatsApp Customer:** Instant one-tap communication for gated complexes.
  * Food checklist to verify all drinks, sides, and sauces.
* **Franchise-Ready Multi-Store Setup:**
  * Configured for the **Pinetown Flagship** (Shop 1, Uniland Centre, Behind Hollywoodbets, Mon–Sun 9am–6pm).
  * Architecture supports instant addition of future branches in `src/data/stores.ts`.

---

## 🛠️ Local Development

```bash
# Navigate to website directory
cd "/Volumes/WDB-2TB-B/App Projects/Wrap and Wing Co/website"

# Start Vite development server
npm run dev
```

Open `http://localhost:3000` in your browser.

## 📦 Production Build

```bash
npm run build
```

The production output is generated in the `dist/` directory.

---

## 🌐 Connecting Custom Subdomain / Domain

To connect `wrapandwings.funnelflux.assets.com` (or your final primary domain):
1. Import this project to **Vercel** or **Cloudflare Pages**.
2. Go to **Settings > Domains** and add `wrapandwings.funnelflux.assets.com`.
3. Point your DNS CNAME to the provided Vercel/Cloudflare target.
4. When your final domain (e.g., `wrapandwing.co.za`) is ready, simply add it in the same dashboard — no code rebuild is needed!
