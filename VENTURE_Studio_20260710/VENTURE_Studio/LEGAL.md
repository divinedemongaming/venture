# VENTURE Studio — Legal Notice

## Intellectual Property

**VENTURE Creator Platform — Studio** is the exclusive intellectual property of **DivineDemonGaming Inc.**

Copyright © 2024 DivineDemonGaming Inc. All Rights Reserved.

---

## Ownership

| Field       | Value                              |
|-------------|------------------------------------|
| **Owner**   | DivineDemonGaming Inc.             |
| **Product** | VENTURE Creator Platform           |
| **Module**  | Studio (Web)                       |
| **Year**    | 2024                               |
| **Contact** | legal@divinedemongaming.com        |

---

## Rights Reserved

This software, including all source code, design, architecture, branding, and associated intellectual property, is the sole and exclusive property of **DivineDemonGaming Inc.**

The following are strictly prohibited without prior written permission:

- Copying or reproducing any part of this software
- Distributing, sublicensing, or selling this software
- Modifying, reverse-engineering, or creating derivative works
- Using the VENTURE brand, name, or logo in any form
- Claiming ownership or authorship of this software

---

## Digital Watermarking — Studio Module

This codebase contains multiple layers of digital watermarking:

| Layer | Implementation |
|---|---|
| **1. Source file headers** | Every `.js`/`.jsx` file begins with `© 2024 DivineDemonGaming Inc.` + Owner + Product |
| **2. HTML comment** | `index.html` contains a copyright comment in the document root |
| **3. Meta tags** | `<meta name="author">`, `<meta name="copyright">`, `<meta name="owner">` in every page |
| **4. Dev HTTP headers** | Vite dev server injects `X-Owner`, `X-Copyright`, `X-Product` on every response |
| **5. Production HTTP headers** | `_headers` file applies ownership + security headers on CDN/static host |
| **6. Build banner** | Rollup injects a copyright comment into every compiled JS chunk |
| **7. Console watermark** | `main.jsx` prints a styled ownership notice in the browser DevTools console |
| **8. Window object** | `window.__VENTURE_OWNERSHIP__` is a frozen, non-writable ownership certificate |
| **9. Ownership module** | `src/utils/ownership.js` exposes `verifyOwnership()` for programmatic verification |
| **10. robots noindex** | `<meta name="robots" content="noindex, nofollow">` prevents unauthorized indexing |

---

## Verification

To verify Studio ownership at runtime, open the browser console on any Studio page and run:

```js
window.__VENTURE_OWNERSHIP__
```

Expected output:
```json
{
  "owner": "DivineDemonGaming Inc.",
  "product": "VENTURE Creator Platform",
  "module": "Studio (Web)",
  "copyright": "© 2024 DivineDemonGaming Inc. All Rights Reserved.",
  "year": 2024,
  "contact": "legal@divinedemongaming.com"
}
```

---

## DMCA & Enforcement

Any unauthorized use, reproduction, or distribution of VENTURE Studio or its components may result in:

- Civil litigation for intellectual property infringement
- DMCA takedown requests
- Criminal prosecution under applicable law

To report infringement: **legal@divinedemongaming.com**

---

*DivineDemonGaming Inc. — All Rights Reserved Worldwide*
