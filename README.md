# 🔍 SmartFinder — Web Admin Panel

> A modern lost-and-found management system for campus environments. The web admin panel provides staff with full control over item reports, claim validation, user management, and real-time analytics.

---

## 📋 Project Description

SmartFinder is a campus Lost & Found platform consisting of four integrated services. This repository contains the **Web Admin Panel** — a React-based single-page application used by administrators to manage the entire lost-and-found workflow: reviewing submitted posts, validating claims, managing users, and monitoring analytics.

It connects to two backend services:
- **Django DRF** — primary backend for authentication, CRUD, and business logic
- **FastAPI Analytics** — secondary read-only service for statistics and ML category prediction

---

## ✨ Features

- 🔐 **Token-based Authentication** — secure admin login with role-based access control
- 📋 **Dashboard** — overview of pending posts requiring review with quick approve/reject actions
- 📦 **Item Management** — full CRUD for lost and found reports, with image upload (Cloudinary) and ML-powered category prediction
- 🤝 **Claim Validation** — review, approve, reject, and release items to claimants with full audit trail
- 👥 **User Management** — admin-only panel to create, edit, and deactivate user accounts
- 📊 **Reports & Analytics** — interactive charts: trends over 30 days, by type, by status, by location (powered by FastAPI)
- 🔔 **Notifications** — real-time admin notifications for new reports and claims
- 👤 **Profile Management** — update personal info and change password
- 🍞 **Toast Notifications** — instant visual feedback on every action
- 📱 **Responsive Design** — adapts to desktop, tablet, and mobile screens

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite |
| **Routing** | React Router v7 |
| **Styling** | Vanilla CSS with CSS custom properties (design tokens) |
| **State Management** | React hooks (`useState`, `useCallback`, `useMemo`, custom hooks) |
| **Performance** | `React.lazy()` + `Suspense` for code splitting |
| **Primary Backend** | Django REST Framework (via REST API) |
| **Analytics Backend** | FastAPI (via REST API) |
| **Image Storage** | Cloudinary (production) |
| **Deployment** | Vercel (static site) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SmartFinder Ecosystem                  │
├──────────────┬──────────────────┬───────────────────────┤
│  Web Admin   │  Mobile App      │                       │
│  (React/     │  (React Native/  │                       │
│   Vite)      │   Expo)          │                       │
│              │                  │                       │
│  Vercel      │  Expo Go / APK   │                       │
└──────┬───────┴────────┬─────────┘                       │
       │                │                                  │
       ▼                ▼                                  │
┌─────────────────────────────┐   ┌──────────────────┐   │
│   Django DRF (Primary API)  │   │  FastAPI          │   │
│   Auth, CRUD, Business      │◄──│  Analytics + ML   │   │
│   Logic, Notifications      │   │  (read-only)      │   │
│   Render.com                │   │  Render.com       │   │
└──────────────┬──────────────┘   └────────┬─────────┘   │
               │                           │               │
               └───────────┬───────────────┘               │
                           ▼                               │
              ┌─────────────────────────┐                  │
              │  PostgreSQL Database    │                  │
              │  (Render.com - shared) │                  │
              └─────────────────────────┘                  │
                           │                               │
              ┌─────────────────────────┐                  │
              │  Cloudinary             │                  │
              │  (Image Storage)        │                  │
              └─────────────────────────┘                  │
```

**Data Flow:**
1. Admin logs in → Django issues a Token
2. Token stored in `localStorage` as `sf_token`
3. All CRUD requests → Django (`VITE_API_URL`)
4. All analytics/ML requests → FastAPI (`VITE_FASTAPI_URL`) using same token
5. FastAPI reads from the same PostgreSQL DB as Django (read-only)

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Running Django backend (see `smart-finder-backend` repo)
- Running FastAPI service (see `smart-finder-fastapi` repo)

### 1. Clone the repository
```bash
git clone https://github.com/Cejj28/smart-finder.git
cd smart-finder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_FASTAPI_URL=http://localhost:8001
```

> For production, these are already set in Vercel's environment variables.

### 4. Run the development server
```bash
npm run dev
```

App will be available at `http://localhost:5173`

### 5. Build for production
```bash
npm run build
```

---

## 🚀 Deployment Link

| Service | URL |
|---|---|
| **Web Admin Panel** | [https://smart-finder-ten.vercel.app/](https://smart-finder-ten.vercel.app/) |
| **Django API** | [https://smart-finder-django.onrender.com/api/](https://smart-finder-django.onrender.com/api/) |
| **Django Admin** | [https://smart-finder-django.onrender.com/admin/](https://smart-finder-django.onrender.com/admin/) |
| **FastAPI Docs** | [https://smart-finder-fastapi.onrender.com/docs](https://smart-finder-fastapi.onrender.com/docs) |

---

## 🔑 Test Account

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |

> ⚠️ The backend is hosted on Render's free tier. The first request after inactivity may take 30–60 seconds while the server wakes up.

---

## 👥 Team Members and Roles

| Name | Role |
|---|---|
| **Clint John Mila** | Project Lead & Full-Stack Developer — system architecture, service integration, deployment |
| **Daniel Luzaga** | Backend Developer — Django REST API, database models, authentication, business logic |
| **Vladimir Bautista** | Frontend Developer — React web admin UI, component design, CSS design system |
| **Joed Binson Rauto** | Mobile Developer & QA Tester — React Native mobile app, testing, bug reporting |

---

## ⚠️ Known Limitations

- **Render Free Tier Cold Start** — The Django and FastAPI backends may take 30–60 seconds to respond after a period of inactivity, as Render spins down free services when idle.
- **No Real-Time Updates** — The dashboard requires a manual page refresh to reflect changes made by other admins; no WebSocket or polling is implemented.
- **No Pagination on Item Lists** — All items are fetched in a single API call. Performance may degrade with a very large dataset.
- **No Email Notifications** — Notifications are in-app only; no email or SMS alerts are sent to users or claimants.
- **No Push Notifications (Web)** — Web Push API is not implemented; browser notifications are not supported.
- **Image Size Limit** — Uploaded images are not compressed client-side before upload; very large images may be slow to upload.
- **Single Admin Role** — There is no granular permission system; a user is either a full admin (`is_staff=True`) or a regular student.
- **`CORS_ALLOW_ALL_ORIGINS = True`** — Django currently allows all CORS origins, acceptable for development/demo but not production-hardened.

---

## 📸 Screenshots

> **Note to editor:** Replace the placeholders below with actual screenshots before submission.

| Screen | Description |
|---|---|
| `screenshot-login.png` | Login page |
| `screenshot-dashboard.png` | Admin dashboard with stat cards and pending items table |
| `screenshot-items.png` | Item Management page showing item list and add-item form |
| `screenshot-claims.png` | Claim Validation page with approve/reject/release workflow |
| `screenshot-reports.png` | Reports page with analytics charts |
| `screenshot-users.png` | User Management page (admin only) |
| `screenshot-notifications.png` | Notification bell with unread count |
| `screenshot-profile.png` | Profile page with edit and change password |

---

## 📁 Related Repositories

| Repo | Description |
|---|---|
| [smart-finder-backend](https://github.com/Cejj28/smart-finder-backend) | Django DRF primary backend |
| [smart-finder-fastapi](https://github.com/Cejj28/smart-finder-fastapi) | FastAPI analytics & ML service |
| [smart-finder-mobile](https://github.com/Cejj28/smart-finder-mobile) | React Native mobile app |

---

*IT323 — Application Development and Emerging Technologies | Final Project*
