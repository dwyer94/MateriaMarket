
# Materia Market Dashboard

This project is a fullstack web app for viewing Final Fantasy XIV Materia market data.

## 🧱 Tech Stack

- **Frontend:** React + TypeScript + Lucide-React
- **Backend:** FastAPI (Python)
- **Data Sources:**
  - [XIVAPI](https://xivapi.com/) for Materia stats
  - [Universalis](https://universalis.app/) for market data

## 🛠 Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js + npm
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt  # manually install fastapi, uvicorn, requests
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Environment

Ensure CORS is allowed in backend and frontend points to correct `/materia` endpoint.

---

## 🧪 Development Features

- Stat grouping by color
- Pricing from Universalis
- Scrip exchange logic
- Sorting, filtering, tooltip UI
- Performance diagnostics via `/debug/timing`

---

## License

MIT
