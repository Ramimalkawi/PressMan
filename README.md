# PressMan — Simple Order Tracker

A minimal Vite + React app to manage print-press orders through sequential departments:
Received → Design → Prepress → Press → Postpress → Delivery → Completed

Quick start

Install dependencies and run the dev server:

```bash
cd /Users/apple/Documents/Developer/Pressman
npm install
npm run dev
```

What I scaffolded

- `package.json` — scripts and dependencies
- `index.html` — app entry
- `src/main.jsx` — React entry
- `src/App.jsx` — layout and provider wrapper
- `src/state/orders.jsx` — orders context + persistence
- `src/components/OrderForm.jsx` — create/receive orders
- `src/components/OrderList.jsx` — list orders + progress
- `src/components/OrderDetails.jsx` — per-order step progress and actions
- `src/styles.css` — basic styling

Next steps (optional)

- Add authentication and manager roles
- Add server-side persistence (API + DB)
- Add user notifications and PDF proofs

If you want, I can:

- Add TypeScript
- Wire a lightweight Express API
- Commit these files and run `npm install` for you
