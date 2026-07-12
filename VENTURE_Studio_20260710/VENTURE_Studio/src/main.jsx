/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * This software is the exclusive intellectual property of DivineDemonGaming Inc.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * See LEGAL.md for full terms.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/* ---------- Ownership watermark (visible in browser DevTools console) ---------- */
const OWNERSHIP = {
  owner:     'DivineDemonGaming Inc.',
  product:   'VENTURE Creator Platform — Studio',
  copyright: '© 2024 DivineDemonGaming Inc. All Rights Reserved.',
  contact:   'legal@divinedemongaming.com',
};

console.log(
  `%c${OWNERSHIP.copyright}\n%c${OWNERSHIP.product}\nOwner: ${OWNERSHIP.owner}\nContact: ${OWNERSHIP.contact}`,
  'color:#7C3AED;font-size:14px;font-weight:bold;',
  'color:#94A3B8;font-size:12px;'
);

/* Attach to window for programmatic verification */
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__VENTURE_OWNERSHIP__', {
    value: Object.freeze(OWNERSHIP),
    writable: false,
    configurable: false,
  });
}
/* ------------------------------------------------------------------------------ */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
