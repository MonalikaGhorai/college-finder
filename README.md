# 🎓 India College Finder
### Full Stack Web Application — Internship Project 2026

> **Solving the unavailability of an efficient and user-friendly online platform for prospective students to search and discover colleges in India.**


## 📊 Platform Stats

| 🏫 Colleges | 🗺️ States & UTs | 🏙️ Cities |
|:-----------:|:---------------:|:---------:|
| **2,070+**  | **34**          | **629+**  |


## 🛠️ Technology Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (no frameworks) |
| Backend    | Node.js + Express.js                            |
| Database   | MySQL (via mysql2 npm package)                  |
| Server     | http://localhost:3000                           |

## 📁 Project Structure
```
college-finder/
│
├── 📂 backend/
│   ├── server.js          ← Express server + all API routes
│   ├── db.js              ← MySQL database connection
│   └── package.json       ← Node.js dependencies
│
├── 📂 frontend/
│   ├── index.html         ← Homepage (Hero, Search, Results, States)
│   ├── 📂 css/
│   │   ├── style.css      ← Main stylesheet
│   │   └── detail.css     ← College detail page styles
│   ├── 📂 js/
│   │   ├── main.js        ← Homepage JavaScript
│   │   └── detail.js      ← Detail page JavaScript
│   └── 📂 pages/
│       └── college-detail.html  ← College detail page
│
├── 📂 database/
│   └── college_db.sql     ← Full MySQL database export
│
├── README.md                  ← This file
```

### Step 1 — Install Dependencies
bash
cd backend
npm install


### Step 2 — Start Server
bash
node server.js

You should see:
✅ MySQL Database connected successfully!
🚀 College Finder running at: http://localhost:3000

### Step 3 — Open in Browser
http://localhost:3000

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
|  GET   | /api/stats|Total colleges, states, cities count |
|  GET   | /api/states| All unique state names |
|  GET   | /api/cities?state=X | Cities filtered by state |
|  GET   | /api/courses | Course list grouped by UG / PG |
|  GET   | /api/colleges| Search & filter colleges (paginated) |
|  GET   | /api/colleges/:id | Single college detail by ID |
|  GET   | /api/state/:state/colleges | All colleges in a state |
|  GET   | /api/featured | 6 random featured colleges |

**Example:**
GET /api/colleges?state=Maharashtra&city=Pune&course=B.Tech&page=1&limit=12

## ✨ Features

- 🔍 **Advanced Search** — by name, city, state, course
- 📍 **State + City Filters** — city dropdown auto-loads per state
- ⚙️ **Course Filter Chips** — B.Tech, MBA, MBBS etc. with icons
- 🃏 **College Cards** — UG/PG courses, year, affiliation
- 📄 **Detail Pages** — full info, contact, Google Maps link
- 📱 **Responsive** — mobile, tablet, desktop
- ⚡ **Skeleton Loading** — smooth perceived performance
- 🗺️ **Google Maps** — location link for every college

## 🗄️ Database Schema
sql
CREATE TABLE colleges (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255),
  city             VARCHAR(100),
  state            VARCHAR(100),
  affiliation      VARCHAR(255),
  established_year INT,
  ug_courses       TEXT,
  pg_courses       TEXT,
  website          VARCHAR(255),
  email            VARCHAR(100),
  phone            VARCHAR(50)
);

## 📝 Internship Notes

- ✅ Zero frontend frameworks — pure HTML, CSS, JavaScript
- ✅ Pure Node.js backend
- ✅ MySQL database
- ✅ RESTful API with JSON responses
- ✅ 2,070+ real college records across India
