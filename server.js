const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/states', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT state FROM colleges WHERE state IS NOT NULL ORDER BY state ASC'
    );
    res.json({ success: true, data: rows.map(r => r.state) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const { state } = req.query;
    let query = 'SELECT DISTINCT city FROM colleges WHERE city IS NOT NULL';
    const params = [];
    if (state && state !== 'all') { query += ' AND state = ?'; params.push(state); }
    query += ' ORDER BY city ASC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows.map(r => r.city) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT ug_courses, pg_courses FROM colleges WHERE ug_courses IS NOT NULL OR pg_courses IS NOT NULL'
    );
    function parseCourseString(str) {
      if (!str || str === 'NULL' || str === 'N/A' || str === 'NA' || str === '--' || str === 'None') return [];
      const results = new Set();
      let norm = '', depth = 0;
      for (const ch of str) {
        if (ch === '(') { depth++; norm += ch; }
        else if (ch === ')') { depth--; norm += ch; }
        else if ((ch === ';' || ch === ',') && depth === 0) norm += '|';
        else norm += ch;
      }
      const parts = norm.split('|').map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        const base = part.replace(/\s*\(.*?\)\s*/g, '').replace(/[-–]\s*(CSE|IT|ECE|ME|CE|EE|EEE|AIML|AI|DS|ICT|Hons|Mech|Civil|Electrical|Computer|Information Technology|through affiliated colleges|multiple streams|applied streams|Dual Degree|various).*/gi, '').trim();
        if (base && base.length > 1 && base.length < 60) results.add(base);
      });
      return [...results];
    }

    const allCourses = new Set();
    rows.forEach(row => {
      [...parseCourseString(row.ug_courses), ...parseCourseString(row.pg_courses)]
        .forEach(c => allCourses.add(c));
    });

    const ugGroups = {
      'Engineering': ['B.Tech', 'B.E', 'B.E.', 'BE', 'B.Tech IT', 'B.Tech CSE', 'B.Tech Computer Science', 'B.Tech, Dual Degree B.Tech-M.Tech', 'BE/B.Tech', 'B.E/B.Tech', 'BTech'],
      'Management': ['BBA', 'Bachelor of Business Administration', 'BBA (DBE)', 'BBA (Agri Business)', 'BBA (Design & Business)', 'BBA (Maritime Management)', 'BBA (Industry Integrated)', 'BHMCT'],
      'Computer Apps': ['BCA', 'BSc Computer Science', 'B.Sc IT', 'B.Sc. Computer Science', 'BSc IT', 'B.Sc (IT)', 'B.Sc (Computer Science)'],
      'Science': ['B.Sc', 'B.Sc Agriculture', 'B.Sc Nursing', 'BPharm', 'B.Pharm', 'MBBS', 'BDS', 'BAMS', 'BHMS', 'BVSc & AH', 'B.Sc Horticulture'],
      'Commerce & Arts': ['B.Com', 'BA', 'B.A'],
      'Design & Architecture': ['B.Arch', 'B.Des', 'B.Des (Fashion Design', 'BArch', 'BDes', 'B.Plan'],
      'Law': ['LLB', 'LL.B', 'BA LLB', 'BA LLB (Hons)', 'BA LLB; LLB', 'BA; LLB'],
      'Education': ['B.Ed', 'B.El.Ed', 'D.El.Ed', 'BEd'],
      'Pharmacy & Health': ['B.Pharm', 'BPharm', 'D.Pharm', 'GNM Nursing', 'ANM Nursing'],
      'Diploma': ['Diploma in Civil Engineering', 'Diploma in Computer Engineering', 'Diploma in Mechanical Engineering'],
    };

    const pgGroups = {
      'Engineering (PG)': ['M.Tech', 'M.E', 'M.E.', 'ME', 'MTech', 'M.Tech (CSE)'],
      'Management (PG)': ['MBA', 'PGDM', 'Executive MBA', 'MBA (Agri Business)', 'MBA (Hospital & Health Management)', 'MBA (Design Management)', 'MBA (Maritime)', 'MBA (Hospitality)', 'MBA Hospitality'],
      'Computer Apps (PG)': ['MCA', 'MSc IT', 'M.Sc IT', 'M.Sc.IT', 'PGDCA'],
      'Science (PG)': ['M.Sc', 'MSc', 'M.Sc Nursing', 'M.Pharm', 'MPharm', 'MD', 'MS', 'MDS', 'MSc Nursing'],
      'Commerce & Arts (PG)': ['M.Com', 'MA', 'M.A'],
      'Law (PG)': ['LLM', 'LL.M'],
      'Education (PG)': ['M.Ed', 'MEd'],
      'Research': ['PhD', 'Ph.D', 'M.Phil', 'MPhil'],
      'Design (PG)': ['M.Des', 'M.Arch', 'MArch'],
    };

    const ugResult = [];
    const pgResult = [];

    Object.entries(ugGroups).forEach(([group, names]) => {
      const found = names.filter(n => allCourses.has(n));
      if (found.length > 0) ugResult.push({ group, courses: [...new Set(found)] });
    });

    Object.entries(pgGroups).forEach(([group, names]) => {
      const found = names.filter(n => allCourses.has(n));
      if (found.length > 0) pgResult.push({ group, courses: [...new Set(found)] });
    });

    const popularStandalone = ['B.Tech','BBA','BCA','B.Sc','B.Com','BA','MBBS','MBA','M.Tech','MCA','MBA','M.Sc','M.Com','LLB','B.Arch','B.Ed','B.Pharm','PGDM','BDS','BAMS'];

    res.json({ success: true, ug: ugResult, pg: pgResult, popular: popularStandalone });
  } catch (err) {
    console.error('Courses error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/colleges', async (req, res) => {
  try {
    const { state, city, search, course, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = [], params = [];

    if (state && state !== 'all') { conditions.push('state = ?'); params.push(state); }
    if (city && city !== 'all') { conditions.push('city = ?'); params.push(city); }
    if (search && search.trim()) {
      conditions.push('(name LIKE ? OR city LIKE ?)');
      const t = `%${search.trim()}%`;
      params.push(t, t);
    }
    if (course && course.trim()) {
      conditions.push('(ug_courses LIKE ? OR pg_courses LIKE ?)');
      const t = `%${course.trim()}%`;
      params.push(t, t);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM colleges ${where}`, params);
    const [rows] = await db.query(
      `SELECT * FROM colleges ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/colleges/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM colleges WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [[{ totalColleges }]] = await db.query('SELECT COUNT(*) as totalColleges FROM colleges');
    const [[{ totalStates }]] = await db.query('SELECT COUNT(DISTINCT state) as totalStates FROM colleges');
    const [[{ totalCities }]] = await db.query('SELECT COUNT(DISTINCT city) as totalCities FROM colleges');
    res.json({ success: true, data: { totalColleges, totalStates, totalCities } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/state/:state/colleges', async (req, res) => {
  try {
    const { state } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM colleges WHERE state = ?', [state]);
    const [rows] = await db.query('SELECT * FROM colleges WHERE state = ? ORDER BY name ASC LIMIT ? OFFSET ?', [state, parseInt(limit), offset]);
    res.json({ success: true, data: rows, state, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/featured', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM colleges ORDER BY RAND() LIMIT 6');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 College Finder running at: http://localhost:${PORT}`);
  console.log(`📡 API at: http://localhost:${PORT}/api\n`);
});