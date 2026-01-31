# ⚡ Shakti: Electricity Theft Detection System

**Shakti** is an advanced AI-powered analytics platform designed to detect electricity theft, visualize grid health, and identify risky consumers using machine learning.

![Project Banner](public/vite.svg) *<!-- Replace with actual screenshot if available -->*

## 🚀 Features

### 🔍 Advanced Anomaly Detection
Uses a multi-layer risk assessment pipeline including:
-   **Behavioral Analysis:** Isolation Forest ML model to detect usage anomalies.
-   **Statistical Checks:** Z-Score & Peer Comparison.
-   **Transformer Loss:** Analysis of input vs. consumed energy.
-   **Voltage & Seasonal:** Power quality and seasonal usage patterns.

### 📊 Interactive Dashboard
-   **Grid Health Overview:** Real-time metrics on system status and estimated revenue loss.
-   **Risk Visualization:**
    -   **Transformer Stats:** Pie & Bar charts showing risk distribution per transformer.
    -   **Detailed Tables:** Segmented views for "Detected Anomalies" (High/Critical) and "Other Entries" (Mild/Normal).
-   **Geospatial Map:** Google Maps integration to pinpoint **High (Orange)** and **Critical (Red)** risk locations.

### 📑 Reporting
-   **PDF Export:** One-click generation of detailed audit reports (`electricity_theft_report.pdf`).
-   **Inspection Management:** "Select Status" workflow (Initiated, In Process, Completed) for field teams.

---

## 🛠️ Tech Stack

### Frontend
-   **React 18** (Vite)
-   **Recharts** for data visualization
-   **Lucide React** for UI icons
-   **Google Maps API** for geospatial data

### Backend
-   **FastAPI** (Python)
-   **Pandas & NumPy** for data processing
-   **Scikit-Learn** for Machine Learning models (Isolation Forest)

---

## ⚙️ Installation & Setup

### Prerequisites
-   Node.js (v16+)
-   Python (v3.8+)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/electricity-theft-detection.git
cd electricity-theft-detection
```

### 2. Backend Setup
Navigate to the backend folder and set up the Python environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Run the Backend Server:**
```bash
uvicorn app.main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`*

### 3. Frontend Setup
Open a new terminal, navigate to the project root, and install dependencies.

```bash
# Return to root if in backend
cd .. 

npm install
```

**Run the Frontend Development Server:**
```bash
npm run dev
```
*The application should now be running at `http://localhost:5173`*

---

## 📂 Project Structure

```
electricity-theft-detection/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── services/      # ML Engine & Logic
│   │   └── main.py        # API Entry point
│   └── requirements.txt
├── scripts/
│   └── electrical_bomb.py # Core Risk Calculation Pipeline
├── src/                    # React Frontend
│   ├── components/        # UI Components (Map, Results, Modal)
│   └── App.jsx            # Main App Component
├── public/                 # Static Assets
└── README.md               # You are here
```

## 📝 Usage

1.  Open the web app.
2.  **Upload Data:** Drag & drop your dataset (single merged CSV or 5 separate files).
3.  **Wait for Analysis:** The ML pipeline processes the data in real-time.
4.  **View Results:**
    -   Check the **Grid Health** score.
    -   Review **High/Critical** consumers in the Anomalies table.
    -   Click the **Pie Chart** icon on the "Est. Loss" card for detailed Transformer statistics.
    -   Use the **Map** to view geographic clusters of theft.
5.  **Export:** Click "Download PDF" to save the report.

---

## 🤝 Contribution

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License.
