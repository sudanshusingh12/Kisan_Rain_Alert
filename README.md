# 🌧️ KISAN RAIN ALERT (किसान वर्षा चेतावनी)
### Hyperlocal Rainfall Monitoring & Early Warning System for Indian Farmers

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-6.1-646cff.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests Passing](https://img.shields.io/badge/tests-12%2F12%20passed-brightgreen.svg)]()

> For complete in-depth documentation, system architecture diagrams, and REST API references, please see [**`PROJECT_DOCUMENTATION.md`**](file:///d:/Desktop/KisanRain/PROJECT_DOCUMENTATION.md).

---

## 🌾 Project Overview

**Kisan Rain Alert** is a complete, full-stack web application engineered to protect Indian farmers from unexpected rainfall during sensitive agricultural operations (harvesting, threshing, drying, and chemical spraying).

Unlike generic district-level weather apps, Kisan Rain Alert continuously monitors **exact farm coordinates**, analyzes incoming precipitation observations against **India Meteorological Department (IMD)** intensity standards using **deterministic, explainable rules** (strictly avoiding unexplainable AI/black-box models), and automatically dispatches location-specific alerts via **Fast2SMS** and **Gmail SMTP**.

---

## 🎨 Tech Stack & Highlights

- **Frontend:** Pure **React.js (React 18 + Vite)** Single Page Application, 100% JSX, React Router v6, Chart.js, Lucide-react, Inter typography.
- **Satellite Map Field Pinning:** **Esri World Imagery** high-resolution satellite tiles with draggable marker and one-tap browser GPS.
- **Live Radar:** Real-time **RainViewer Doppler radar reflectivity loop** with interactive animation player.
- **Backend:** **Python Flask** REST API with **APScheduler** background worker polling weather every 15 minutes.
- **Database & Auth:** **Supabase PostgreSQL** cloud database + Supabase Auth with session persistence and one-click instant demo access.
- **SMS Gateway:** **Fast2SMS** (direct Indian route without DLT template restrictions) for real-time mobile notifications.

---

## 🚀 Quick Start Commands

### 1. Set Up Python Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Build the React Frontend
```powershell
cd frontend
npm install
npm run build
cd ..
```

### 3. Run the Full-Stack Server
```powershell
python backend/app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser.

### 4. Run the Automated Test Suite
```powershell
.\venv\Scripts\pytest -v tests/
```

---

## 📊 IMD Deterministic Rainfall Scale

| Category | Hourly Rate (mm/h) | Agricultural Impact & Advisory |
| :--- | :--- | :--- |
| **No Rain** | `0.0 mm/h` | Normal operations. Suitable for drying and pesticide application. |
| **Light Rain** | `0.1 – 2.4 mm/h` | Mild drizzle. Monitor open crops and cotton bolls. |
| **Moderate Rain** | `2.5 – 7.5 mm/h` | **Alert Triggered.** Cover grain heaps; pause chemical spraying. |
| **Heavy Rain** | `7.6 – 15.0 mm/h` | **High Alert.** Clear field drainage furrows; tarp threshing floors. |
| **Very Heavy Rain** | `> 15.0 mm/h` | **Severe Alert.** Severe waterlogging risk. Halt fieldwork; safeguard produce. |

---

## 📜 Full Documentation
See [**`PROJECT_DOCUMENTATION.md`**](file:///d:/Desktop/KisanRain/PROJECT_DOCUMENTATION.md) for detailed configuration, architecture, and API details.
