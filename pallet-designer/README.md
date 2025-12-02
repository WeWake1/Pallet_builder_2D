# 🎨 Pallet Designer# React + TypeScript + Vite



A mobile-first, drag-and-drop 2D pallet specification sheet designer. Create professional pallet specifications with ease and export to A4 PDF.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 Features (Planned)Currently, two official plugins are available:



- **Drag & Drop Components**: Blocks, stringers, deck boards, notched blocks, chamfered blocks- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **Multiple Views**: Top, Side, End, and Bottom views- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Pallet Presets**: Euro EPAL, GMA, CP1-CP9, and Custom pallets

- **Mobile-First Design**: Touch-friendly interface with pinch-to-zoom## React Compiler

- **A4 PDF Export**: Professional specification sheets ready for clients

- **Branding**: Company logo, watermark, and custom colorsThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



## 📁 Project Structure## Expanding the ESLint configuration



```If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

src/

├── components/```js

│   ├── Canvas/        # Main canvas area and Fabric.js integrationexport default defineConfig([

│   ├── Layout/        # Header, layout components  globalIgnores(['dist']),

│   ├── Sidebar/       # Component palette, view selector  {

│   ├── Specification/ # Specification form and data    files: ['**/*.{ts,tsx}'],

│   ├── Toolbar/       # Mobile toolbar    extends: [

│   └── UI/            # Reusable UI components      // Other configs...

├── constants/         # App constants, component definitions

├── hooks/             # Custom React hooks      // Remove tseslint.configs.recommended and replace with this

├── store/             # Zustand state management      tseslint.configs.recommendedTypeChecked,

├── types/             # TypeScript type definitions      // Alternatively, use this for stricter rules

└── utils/             # Helper functions      tseslint.configs.strictTypeChecked,

```      // Optionally, add this for stylistic rules

      tseslint.configs.stylisticTypeChecked,

## 🛠️ Tech Stack

      // Other configs...

- **Framework**: React 19 + TypeScript    ],

- **Build Tool**: Vite 7    languageOptions: {

- **Styling**: Tailwind CSS 4      parserOptions: {

- **Canvas**: Fabric.js        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **State Management**: Zustand        tsconfigRootDir: import.meta.dirname,

- **PDF Export**: jsPDF + html2canvas      },

- **Touch Gestures**: @use-gesture/react      // other options...

    },

## 🏃 Getting Started  },

])

```bash```

# Install dependencies

npm installYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



# Start development server```js

npm run dev// eslint.config.js

import reactX from 'eslint-plugin-react-x'

# Build for productionimport reactDom from 'eslint-plugin-react-dom'

npm run build

```export default defineConfig([

  globalIgnores(['dist']),

## 📋 Development Phases  {

    files: ['**/*.{ts,tsx}'],

- [x] **Phase 0**: Setup & Foundation    extends: [

- [ ] **Phase 1**: Core Canvas & A4 Layout      // Other configs...

- [ ] **Phase 2**: Component Library & Drag-Drop      // Enable lint rules for React

- [ ] **Phase 3**: Pallet Presets      reactX.configs['recommended-typescript'],

- [ ] **Phase 4**: Annotations & Text      // Enable lint rules for React DOM

- [ ] **Phase 5**: Specification Panel      reactDom.configs.recommended,

- [ ] **Phase 6**: Branding & Watermark    ],

- [ ] **Phase 7**: PDF Export    languageOptions: {

- [ ] **Phase 8**: Mobile Optimization & Polish      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 📄 License        tsconfigRootDir: import.meta.dirname,

      },

Private - All rights reserved      // other options...

    },
  },
])
```
