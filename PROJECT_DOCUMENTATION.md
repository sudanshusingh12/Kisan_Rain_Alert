# 🌧️ KISAN RAIN ALERT (किसान वर्षा चेतावनी)
### Hyperlocal Rainfall Early Warning & Live Doppler Radar System for Indian Farmers

---

## 🌾 1. Project Overview & Problem Statement

Indian agriculture faces severe economic losses every monsoon and post-monsoon season due to **sudden, localized unseasonal rainfall**. Standard generic weather applications offer coarse district-level forecasts that fail to warn farmers of localized convective downpours occurring over specific agricultural fields.

**Kisan Rain Alert** is a complete, full-stack, production-ready agricultural weather portal engineered specifically for Indian farmers. It continuously monitors exact field coordinates, combines satellite remote sensing and global numerical weather prediction models, evaluates observations against **official India Meteorological Department (IMD) deterministic rainfall thresholds**, and dispatches advance alerts via **Fast2SMS** and **Gmail SMTP**.

---

## ⭐ 2. Key Features & Highlights

- **100% React.js Single Page Application (React 18 + Vite):**
  - Modern, responsive AgriTech interface built entirely with JSX components and standard CSS.
  - Zero legacy static HTML pages; clean client-side routing via React Router DOM.
  - Mobile-first responsive drawer navigation, touch-friendly controls ($\ge 44$px), and zero horizontal overflow.
- **Esri World Imagery Satellite Field Pinning:**
  - High-resolution satellite tiles allowing farmers to identify their exact field boundaries.
  - Draggable map marker with automatic coordinate calculation.
  - One-tap **"Use My Current GPS"** locator using browser geolocation.
  - Streamlined data model: Field locations organized strictly by Farm Name, Village, Crop Type, Area in Acres, and GPS coordinates (no redundant state/district fields).
- **Live RainViewer Doppler Radar Loop:**
  - Real-time cloud reflectivity layer over satellite imagery with interactive Play / Pause animation, frame scrubber, and timestamps.
- **24-Hour Hourly Precipitation Curve:**
  - Interactive Chart.js graph plotting predicted rainfall (mm/h) hour-by-hour from Open-Meteo.
- **Official IMD Deterministic Rule Engine:**
  - Strictly explainable rule logic based on India Meteorological Department precipitation standards (Light, Moderate, Heavy, Very Heavy).
  - Crop-specific actionable farming advisories (halting chemical sprays, clearing drainage furrows, covering harvested grain heaps).
  - 3-hour alert cooldown window per plot to prevent notification fatigue during continuous rain.
- **Multi-Channel Notification Gateway:**
  - **Fast2SMS:** Direct Indian SMS gateway (`route: "q"`) without DLT template restrictions for high-priority mobile alerts.
  - **Gmail SMTP:** Rich HTML advisory emails delivered directly to inboxes.
  - **In-App Notification Audit Log:** Complete audit trail of dispatched alerts viewable on the portal.
- **Dual Database & Authentication Architecture:**
  - Supabase PostgreSQL database + Supabase Auth with automatic email confirmation.
  - Built-in session persistence and one-click instant demo farmer account for seamless evaluation.

---

## 🏗️ 3. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│               React 18 Single Page Application (frontend/)             │
│   • Landing Hero     • Farm Satellite Picker   • Live Doppler Radar    │
│   • Dashboard        • 24h Rain Chart (Chart.js)• Notification Logs    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Python Flask Backend (backend/)                    │
│   • REST Endpoints (/api/farms, /api/login, /api/alerts/test)         │
│   • Background Worker (APScheduler polling every 15 mins)              │
└─────────────┬─────────────────────┬────────────────────┬───────────────┘
              │                     │                    │
              ▼                     ▼                    ▼
     ┌─────────────────┐   ┌─────────────────┐  ┌─────────────────┐
     │  Open-Meteo API │   │ RainViewer API  │  │  Supabase Cloud │
     │  High-Res NWP   │   │ Doppler Radar   │  │  PostgreSQL/Auth│
     └────────┬────────┘   └────────┬────────┘  └─────────────────┘
              │                     │
              └──────────┬──────────┘
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│             IMD Deterministic Rule Engine (rainfall_engine.py)         │
│   • Classifies precipitation rate (Light, Moderate, Heavy, etc.)       │
│   • Evaluates 3-hour cooldown window                                   │
│   • Generates agricultural advisories (spraying, drainage, harvest)   │
└────────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│          Multi-Channel Notification Service (notification_service.py)  │
│   • Fast2SMS (Indian Mobile SMS)  • Gmail SMTP                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 4. Project Directory Structure

```text
KisanRain/
├── backend/
│   ├── app.py                     # Master Flask entrypoint & SPA routing
│   ├── config.py                  # Environment config and IMD thresholds
│   ├── database.py                # Supabase PostgreSQL client & local fallback
│   ├── notification_service.py    # Multi-channel dispatcher (Fast2SMS, SMTP)
│   ├── rainfall_engine.py         # Official IMD deterministic classification engine
│   ├── routes.py                  # API blueprint endpoints (/api/*)
│   ├── scheduler.py               # APScheduler periodic weather monitoring job
│   ├── setup_db.py                # Database verification & schema initializer
│   └── weather_service.py         # Open-Meteo API integration & normalizer
│
├── frontend/
│   ├── index.html                 # Vite HTML shell mount point (<div id="root">)
│   ├── package.json               # Node.js dependencies & build scripts
│   ├── vite.config.js             # Vite configuration with Flask API proxy
│   ├── dist/                      # Production compiled React SPA
│   │   ├── index.html
│   │   └── assets/                # Minified bundle (JS, CSS)
│   └── src/
│       ├── main.jsx               # React 18 DOM root mount
│       ├── App.jsx                # React Router SPA routes & route guards
│       ├── index.css              # AgriTech light theme & responsive CSS
│       ├── components/
│       │   ├── AppLayout.jsx      # Top header + responsive sidebar wrapper
│       │   ├── Navbar.jsx         # Public navigation with mobile hamburger drawer
│       │   └── Sidebar.jsx        # Farmer dashboard navigation drawer
│       ├── context/
│       │   └── AuthContext.jsx    # Supabase session, login, register, demo auth
│       ├── pages/
│       │   ├── LandingPage.jsx    # Hero, feature cards, workflow, and CTA
│       │   ├── LoginPage.jsx      # Farmer sign-in with instant demo access
│       │   ├── RegisterPage.jsx   # Farmer registration (No state/district fields)
│       │   ├── DashboardPage.jsx  # Overview metrics, farms list, alert simulator
│       │   ├── FarmsPage.jsx      # Esri World Imagery satellite map picker & GPS
│       │   ├── RadarAlertsPage.jsx# RainViewer radar loop & 24h Chart.js forecast
│       │   └── NotificationsPage.jsx # Preferences toggles & dispatch audit log
│       └── services/
│           └── api.js             # Unified promise-based API client
│
├── tests/
│   ├── test_api.py                # Endpoint validation & auth integration tests
│   ├── test_rainfall_engine.py    # IMD threshold, cooldown, and advisory tests
│   └── test_weather_service.py    # Weather code translation & error fallback tests
│
├── .env                           # Local environment secrets & API credentials
├── .env.example                   # Template configuration file
├── requirements.txt               # Python virtual environment dependencies
├── README.md                      # Project overview markdown
└── PROJECT_DOCUMENTATION.md       # Comprehensive system guide (This file)
```

---

## ⚙️ 5. Prerequisites

Before running the application, ensure you have the following installed on your system:
- **Python 3.10+** (Checked with Python 3.12)
- **Node.js v18+** & **npm** (Checked with Node v24 & npm 11)
- **Git** (Optional, for version control)

---

## 🚀 6. Step-by-Step Commands to Run the Project

### Step 1: Clone or Navigate to the Workspace
Open Windows PowerShell (or your terminal of choice) and navigate to the project directory:
```powershell
cd d:\Desktop\KisanRain
```

---

### Step 2: Set Up the Python Virtual Environment
If not already created, create and activate a Python virtual environment:

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

*(On Linux / macOS):*
```bash
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:
```powershell
pip install -r requirements.txt
```

---

### Step 3: Install Frontend Dependencies & Build React App
Navigate to the `frontend/` folder, install npm packages, and build the production bundle:
```powershell
cd frontend
npm install
npm run build
cd ..
```
*The build will output production files to `frontend/dist/`.*

---

### Step 4: Configure the Environment Variables (`.env`)
Create or verify your [`.env`](file:///d:/Desktop/KisanRain/.env) file in the root directory:
```ini
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=kisan_rain_alert_dev_key_2026_indian_farmers

# Supabase PostgreSQL & Auth Credentials
SUPABASE_URL=https://bsvurbbbbwmtdhiynqgh.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Fast2SMS (Indian Mobile SMS Gateway)
FAST2SMS_API_KEY=your_fast2sms_api_key_here

# Gmail SMTP Email Alerts (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password

# Background Monitoring & Simulation
WEATHER_POLL_INTERVAL_MINUTES=15
ALERT_COOLDOWN_HOURS=3
SIMULATION_MODE=false
```

---

### Step 5: Start the Full-Stack Application
Run the master Flask server from the project root:
```powershell
python backend/app.py
```

The server will start on port `5000`:
- **Console Output:**
  ```text
  ==================================================================
  KISAN RAIN ALERT - FULL STACK SERVER INITIALIZING
  Frontend Directory: D:\Desktop\KisanRain\frontend\dist
  Access Application at: http://127.0.0.1:5000
  ==================================================================
  * Running on http://127.0.0.1:5000
  ```

---

### Step 6: Access the Application in Your Browser
Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

- **Instant Demo Access:** Click **"Demo Access"** or **"Instant Demo Farmer Login"** to enter the portal immediately without entering manual credentials.

---

### (Alternative) Development Mode with Hot Reload
If you are actively developing frontend JSX components and want instant hot-module-replacement (HMR):
1. **Terminal 1 (Backend API):**
   ```powershell
   python backend/app.py
   ```
2. **Terminal 2 (Vite Dev Server):**
   ```powershell
   cd frontend
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)**. Requests to `/api/*` are automatically proxied to Flask on port 5000.

---

### Step 7: Run the Automated Test Suite
To verify that all database connections, IMD classification algorithms, alert cooldowns, and weather fallbacks are operating at 100%:
```powershell
.\venv\Scripts\pytest -v tests/
```
*Expected Result: 12 passed tests.*

---

## 📊 7. Official IMD Rainfall Classification Reference

Kisan Rain Alert strictly enforces the deterministic rainfall bands established by the **India Meteorological Department (IMD)**:

| Category | Hourly Rate | 24h Accumulation | Agricultural Impact & Advisory |
| :--- | :--- | :--- | :--- |
| **No Rain** | `0.0 mm/h` | `0.0 mm` | Ideal conditions for fertilizer broadcast, pesticide sprays, and harvesting. |
| **Light Rain** | `0.1 – 2.4 mm/h` | `2.5 – 15.5 mm` | Normal conditions. Monitor open cotton bolls and drying grain heaps. |
| **Moderate Rain** | `2.5 – 7.5 mm/h` | `15.6 – 64.4 mm` | **Alert Triggered.** Pause pesticide spraying (prevents chemical runoff). Cover harvested produce. |
| **Heavy Rain** | `7.6 – 15.0 mm/h` | `64.5 – 115.5 mm` | **High Alert.** High surface runoff risk. Clear field drainage furrows and secure threshing floors. |
| **Very Heavy Rain** | `> 15.0 mm/h` | `> 115.6 mm` | **Emergency Advisory.** Severe waterlogging risk. Halt fieldwork; shift movable equipment to high ground. |

---

## 🔌 8. REST API Reference

| Endpoint | Method | Description | Sample Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & system status | Returns `{ "status": "healthy" }` |
| `/api/register` | `POST` | Register a new farmer account | `{ "full_name": "...", "email": "...", "phone": "...", "password": "..." }` |
| `/api/login` | `POST` | Authenticate farmer credentials | `{ "email": "...", "password": "..." }` |
| `/api/farms` | `GET` | List all registered farms for user | `?user_id=<uuid>` |
| `/api/farms` | `POST` | Add a new farm field | `{ "user_id": "...", "farm_name": "...", "village": "...", "crop_type": "...", "latitude": 28.61, "longitude": 77.20 }` |
| `/api/farms/<id>` | `DELETE` | Remove a farm plot | Optional `?user_id=<uuid>` |
| `/api/farms/<id>/weather`| `GET` | Live weather & 24h forecast | `?lat=28.61&lon=77.20` |
| `/api/alerts/test` | `POST` | Simulate an IMD alert and dispatch SMS | `{ "user_id": "<uuid>", "phone": "+919797826029" }` |
| `/api/notifications` | `GET` | Fetch dispatch audit history | `?user_id=<uuid>` |
| `/api/notification-preferences` | `GET` / `PUT` | Read or update SMS/Email channels | `{ "user_id": "...", "sms_enabled": true, "min_severity": "moderate" }` |

---

## 🛡️ 9. Verification & Troubleshooting

### Q: Why do I get a 404 when refreshing `/dashboard` or `/farms`?
- **Resolved:** Flask's SPA router in `backend/app.py` has been configured with a catch-all route (`@app.route("/", defaults={"path": ""})` and `@app.route("/<path:path>")`) that serves `frontend/dist/index.html` for any client-side route while serving existing static assets directly.

### Q: How are SMS alerts sent to Indian mobile numbers?
- **Gateway:** The system uses **Fast2SMS** (`route: "q"`) which dispatches instant SMS alerts to 10-digit Indian mobile numbers without TRAI DLT template restrictions or carrier blocks.
- **Simulation Fallback:** If `FAST2SMS_API_KEY` is not provided or if the system runs in simulation mode, notifications are cleanly logged to the database and dashboard audit table without failing.

### Q: What if I don't have paid SMS credentials?
- Set `SIMULATION_MODE=true` in `.env`.
- The system will safely evaluate all IMD thresholds, generate realistic crop advisories, record the alert in the database, and display it in the **Dispatched Alerts History** on the web portal without attempting external API calls.

---

## 📜 10. License & Credits

- **Open-Meteo API:** High-resolution numerical weather models ([open-meteo.com](https://open-meteo.com)).
- **RainViewer API:** Live weather radar composite mosaics ([rainviewer.com](https://www.rainviewer.com)).
- **Esri World Imagery:** Satellite basemap tiles provided courtesy of Esri, USDA, USGS, and the GIS User Community.
- **IMD Criteria:** Rainfall classifications formulated under India Meteorological Department guidelines.
- **License:** MIT License. Built for Indian agricultural empowerment.

