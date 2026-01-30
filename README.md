# ⚡ Shakti: Electricity Theft Detection System

**Shakti** is an advanced, AI-powered platform designed to help utility companies detect, visualize, and prevent electricity theft. By leveraging multi-layer anomaly detection algorithms, it identifies suspicious consumption patterns, visualizes geographic hotspots, and provides actionable insights to reduce non-technical losses.

![Shakti Dashboard Screen](src/assets/logo.png)

## 🚀 Key Features

*   **🔍 Multi-Layer Anomaly Detection**: Analyzes smart meter data using a sophisticated ML pipeline to detect theft, meter tampering, and irregularities.
*   **🌍 Interactive Geospatial Map**:
    *   Visualizes consumer locations on a **Google Map** (focused on India/Delhi).
    *   **Pins Critical Cases**: Automatically filters and highlights "Theft" or "Critical" cases in **Red** for immediate attention.
*   **📊 Comprehensive Dashboard**:
    *   Real-time Grid Health Score.
    *   Estimated Revenue Loss calculation.
    *   Critical case count and anomaly breakdown.
*   **📜 History & Storage**:
    *   Securely saves scan results using **Firebase Storage**.
    *   Retrievable history of past analyses for logged-in users.
*   **🔐 User Authentication**: Secure admin login via **Firebase Authentication**.
*   **🎨 Modern UI**: Fully responsive, dark-themed interface with glassmorphism effects.

---

## 🛠️ Tech Stack

### Frontend
*   **React** (Vite)
*   **Tailwind CSS** (Custom styling)
*   **Google Maps API** (via Requestly injection for dev / Native API)
*   **Lucide React** (Icons)
*   **Firebase SDK** (Auth, Firestore, Storage)

### Backend
*   **Python** (FastAPI)
*   **Pandas / NumPy** (Data Processing)
*   **Scikit-Learn / TensorFlow** (Anomaly Detection Models)

---

## ⚙️ Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/asrawst/Shakti.git
cd Shakti
```

### 2. Backend Setup (Python)
Navigate to the backend directory and set up the virtual environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Run the Backend Server:**
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be active at `http://localhost:8000`.

### 3. Frontend Setup (React)
Open a new terminal, navigate to the project root, and install dependencies.

```bash
# From the root directory 'Shakti'
npm install
```

**Firebase Configuration:**
Ensure you have a `src/firebaseConfig.js` file with your Firebase credentials:
```javascript
// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
// ... your config
```

**Run the Frontend:**
```bash
npm run dev
```
 The app will be accessible at `http://localhost:5173`.

---

## 🗺️ Google Maps Setup (Development)
This project uses the **Google Maps JavaScript API**. 
For development without a billing account, we recommend using **Requestly** to inject the necessary scripts.

1.  Install the **Requestly** browser extension.
2.  Create a new "Insert Script" rule.
3.  **URL Contains**: `localhost`
4.  **Script Source**: `https://maps.googleapis.com/maps/api/js?key=YOUR_OPTIONAL_KEY` (or standard dev loading).

---

## 📂 Project Structure

```
Shakti/
├── backend/                 # FastAPI Backend & ML Models
│   ├── app/
│   │   ├── main.py          # API Entry point
│   │   └── services/        # ML Engine & Logic
│   └── sample_data/         # Training/Test datasets
├── src/
│   ├── components/          # React Components (Map, Navbar, Results)
│   ├── assets/              # Images & Icons
│   ├── App.jsx              # Main Frontend Logic
│   └── firebaseConfig.js    # Firebase Setup
└── README.md                # Project Documentation
```

---

## 👥 Contributors
Developed by **Aditya** and team.
