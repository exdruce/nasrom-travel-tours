<div align="center">
<img width="1200" height="475" alt="GHBanner" src="assets/ntt-1.png" />
</div>

Live Website: [https://jetitokbali.com](https://jetitokbali.com)

# NASROM Travel & Tours

Official website for **NASROM Travel & Tours Sdn Bhd** — your gateway to island adventures in Kelantan, Malaysia. Explore packages to Pulau Perhentian, Pulau Redang, and scenic river cruises on Sungai Semerak.

## ✨ Features

- 🏝️ **Island Packages** — Curated travel packages to Pulau Perhentian, Pulau Redang, and Sungai Semerak cruises
- 🌐 **Multi-language Support** — English and Malay (i18next)
- 📱 **Fully Responsive** — Optimized for mobile, tablet, and desktop
- 🎨 **Modern UI** — Glassmorphism, smooth animations with GSAP, and premium aesthetics
- 📝 **Inquiry Form** — WhatsApp-integrated contact form with validation (Zod + React Hook Form)
- ⚡ **Fast Performance** — Built with Vite for lightning-fast development and builds

## 🛠️ Tech Stack

| Category   | Technology            |
| ---------- | --------------------- |
| Framework  | React 18 + TypeScript |
| Styling    | Tailwind CSS          |
| Animations | GSAP                  |
| Routing    | React Router v6       |
| Forms      | React Hook Form + Zod |
| i18n       | i18next               |
| Build Tool | Vite                  |

## 📁 Project Structure

```
nasrom-travel-tours/
├── assets/           # Images, logos, and static files
├── components/       # Reusable UI components
│   ├── layout/       # Navbar, Footer
│   └── ui/           # Buttons, Cards, etc.
├── lib/              # Utilities and i18n config
├── pages/            # Page components (Home, Packages, Contact, etc.)
├── App.tsx           # Main app with routing
├── index.html        # Entry HTML
└── vite.config.ts    # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/exdruce/nasrom-travel-tours.git
cd nasrom-travel-tours

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## 📄 License

© 2026 NASROM Travel & Tours Sdn Bhd. All rights reserved.
