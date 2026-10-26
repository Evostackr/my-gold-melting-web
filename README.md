# My Gold Melting (Web Application)

> A modern, responsive, offline-first web application for goldsmiths, jewellers, and artisans to calculate gold/silver melting purity, fine gold adjustments, and jewellery costing.

**Developed and maintained by [Evostackr](https://www.evostackr.in/)**  
**Developer:** Ujwal Anand  
**Support Email:** [support@evostackr.in](mailto:support@evostackr.in)  
**Website:** [https://www.evostackr.in/](https://www.evostackr.in/)  
**Contact:** [+91 62028 50596](tel:+916202850596)  

---

## 🌟 Key Features

* **Gold & Silver Melting Control:**
  * Multi-sample weighted touch calculations.
  * Real-time calculation of **Add Palo** (alloy) or **Add Fine Gold** to achieve target touch purity.
  * Live display of final weight and fine gold content.

* **Jewellery Cost Control:**
  * Accurate fine gold output and jewellery costing percentage.
  * 10 casting expense & sub-loss calculators (Alloy, Stone Bills, Gillet, Rhodium, etc.).

* **Full History & Persistence:**
  * Persistent client-side storage with IndexedDB (and LocalStorage fallback).
  * Filter, inspect, and delete calculation records with complete 14-field expense breakdowns.

* **Multi-Language Localization:**
  * Dynamic localization for **English**, **Hindi (हिंदी)**, and **Bengali (বাংলা)**.

* **Fully Responsive Experience:**
  * **Desktop / Laptop View:** Full-width modern banner, 3-column action cards, multi-column input grids, side-by-side action buttons, and centered modal dialogs.
  * **Phone / Mobile View:** 100% edge-to-edge native layout with zero margins or letterboxing.

* **100% Offline-First & Private:**
  * All calculations and history records stay strictly on your local device.
  * Zero remote telemetry, zero analytics tracking, and zero data harvesting.

---

## 🚀 Running Locally

You can open `index.html` directly in any web browser, or start the included zero-dependency Node.js server:

```bash
node server.js
```
Then visit `http://127.0.0.1:8085/`.

---

## 📁 Repository Structure

```
.
├── assets/
│   └── images/            # Graphics and app icons
├── css/
│   └── style.css          # Design system & responsive layout
├── js/
│   ├── app.js             # Router, UI events & modal controllers
│   ├── calculator.js      # Core gold melting & costing mathematical engine
│   ├── db.js              # IndexedDB client-side database layer
│   ├── i18n.js            # English, Hindi, and Bengali translations
│   └── session.js         # Client state manager
├── index.html             # Application entry point
├── privacy-policy.html    # Standalone Privacy Policy page
├── PRIVACY_POLICY.md      # Markdown Privacy Policy
├── README.md              # Project documentation
└── server.js              # Local Node.js HTTP server
```

---

## 📄 Privacy Policy

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) or open `privacy-policy.html` in your browser.

---

## 📄 License

Proprietary software developed by Evostackr. All rights reserved.
