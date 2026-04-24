# SRM Full Stack Engineering Challenge — Round 1

## 🚀 Live Links

| | URL |
|---|---|
| **Frontend** | https://srm-fullstack-challenge.vercel.app |
| **Backend API** | https://srm-backend.onrender.com/bfhl |

> Replace the above URLs with your actual deployed URLs after deployment.

---

## 📌 API Usage

**Endpoint:** `POST /bfhl`  
**Content-Type:** `application/json`

### Request
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Response
```json
{
  "user_id": "jalapativenkatasaidurgadineeshkumar_22052006",
  "email_id": "vj7128@srmist.edu.in",
  "college_roll_number": "RA2311056010058",
  "hierarchies": [...],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Vite
- **Hosting:** Render (API) + Vercel (Frontend)

---

## ▶️ Run Locally

### Backend
```bash
cd backend
npm install
node index.js
# Runs on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```
