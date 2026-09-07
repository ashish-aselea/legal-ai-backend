# Legal AI — Admin Panel

React + Vite + Tailwind admin dashboard for the Legal AI backend.

## Setup

```bash
cd admin-panel
npm install
```

Create `.env` (already included for local dev):

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Run

The backend must be running first (`npm run dev` in the project root).

```bash
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Login

Only `role: admin` accounts can sign in. Create one from the backend folder:

```bash
npm run create:admin -- 9000000099 "Admin Name"
```

Then log in with that mobile number; the OTP in development is `123456`.

## What is real vs demo

Widgets marked with a **DEMO** badge use sample data because those features have no
backend yet. Everything else reads live data from MongoDB.

| Widget | Source |
| --- | --- |
| Total Users, Verified Lawyers, Consultations, Pending Approvals | `GET /admin/dashboard/stats` |
| User Growth chart | `GET /admin/dashboard/user-growth?days=` |
| Recent Users, Recent Lawyer Applications | `GET /admin/dashboard/recent` |
| System Status — API Server, Database | live |
| AI Analyses card, AI Usage chart, Recent AI Analyses, other System Status rows | demo |

Sidebar items whose backend does not exist yet are greyed out and show a notice when
clicked, so nothing looks functional that isn't.

## Structure

```
src/
  App.jsx                  Auth gate + shell (sidebar, topbar, page switch)
  lib/api.js               Fetch wrapper, token storage, endpoint list
  pages/
    Login.jsx              Mobile + OTP admin login
    Dashboard.jsx          The dashboard screen
  components/
    Sidebar.jsx            Nav sections, marks which pages have a backend
    Topbar.jsx             Search, notifications, admin menu
    StatCard.jsx           The five metric cards
    UserGrowthChart.jsx    Area chart (recharts)
    AiUsageChart.jsx       Donut chart (demo data)
    SystemStatus.jsx       Service status list
    Tables.jsx             The three bottom tables
```
