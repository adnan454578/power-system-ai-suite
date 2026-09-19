Power‑System AI Suite
A full‑stack web application that demonstrates AI‑driven power‑system analysis and forecasting.

Table of Contents


Project Overview


Demo


Features


Tech Stack


Setup & Installation


Development Workflow


Running the App


Testing


License
Project Overview
power-system-ai-suite is a Vite‑powered React application that uses large‑language‑model (LLM) services to power a chat‑based interface for power‑system calculations, forecasting, and cost‑engine simulations. The repo contains a lightweight front‑end, an extensible LLM service layer, and utilities for loading multimodal files.

Demo

The app’s main view – a chat bot that accepts queries about power‑system calculations.

Features
Feature	Description
Chat‑Bot UI	Interactive React component (ChatContainer.jsx) for natural‑language queries.
LLM Service	src/services/llmService.js – wrapper around Gemini/OSS LLM with offline fallback.
Multi‑Modal Reader	multiModalFileReader.js loads files (CSV, JSON, images) for AI‑driven analysis.
Cost Engine	Modules for LCOE calculation, merit‑order dispatch, and plant parameter tuning.
Forecasting	Time‑series load forecasting components with confidence bands.
Responsive Design	Works on desktop and mobile browsers.
Live‑Reload	Powered by Vite for instant development feedback.
Tech Stack
Layer	Technology
Frontend	React 18, JSX, Vite, Tailwind‑free vanilla CSS (custom design)
Styling	Modern CSS variables, dark‑mode, glassmorphism effect
LLM	Gemini/OSS LLM via src/services/llmService.js
Package Manager	npm (see package.json)
Version Control	Git + GitHub (https://github.com/adnan454578/power-system-ai‑suite)
Setup & Installation
bash
# 1️⃣ Clone the repo
git clone https://github.com/adnan454578/power-system-ai-suite.git
cd power-system-ai-suite
# 2️⃣ Install dependencies
npm install
# 3️⃣ (Optional) Create a .env file for API keys & Supabase
#    Example:
#    VITE_GEMINI_API_KEY=your‑gemini‑api‑key
#    VITE_SUPABASE_URL=https://your-project.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 4️⃣ (Optional) Setup Supabase for Train Mode (Knowledge Base)
#    - Create a Supabase project at https://supabase.com
#    - Run the schema script in `supabase_schema.sql` via Supabase SQL Editor
#    - Enter your Project URL & Anon Key in .env or directly in the UI (Train GridMind > Supabase Settings)

NOTE – The app ships with a fallback “offline engineering engine” and local browser storage so you can run it locally without an API key or Supabase database, but connecting them unlocks cloud persistence and full LLM capabilities.

Development Workflow
Create a new branch: git checkout -b feat/your‑feature
Make changes – edit files under src/.
Run the dev server: npm run dev (Vite watches for changes).
Commit often – follow conventional commits (e.g., feat: add new forecasting chart).
Push & PR – git push -u origin feat/your‑feature and open a Pull Request on GitHub.
Running the App
bash
npm run dev
# Opens http://localhost:5173 (or similar) in your browser.
The UI loads automatically; you can start typing queries in the chat area.

Testing
No formal test suite is currently configured.
For now, use manual testing:

Start the dev server (npm run dev).
Open the app in a browser.
Verify each component (chat, forecasting, cost engine) works as expected.
Future work: add Jest + React Testing Library tests for core services.

License
This project is MIT‑licensed – feel free to fork, modify, and redistribute. See the LICENSE file for details.

Happy coding! 🎉
