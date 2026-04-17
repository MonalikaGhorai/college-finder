const API_BASE = 'http://localhost:3000/api';  

let currentPage = 1;
let currentFilters = { search: '', state: 'all', city: 'all', course: '' };
let totalColleges = 0;
let isLoading = false;

const DOM = {
  get heroSearch()    { return document.getElementById('heroSearch'); },
  get heroState()     { return document.getElementById('heroState'); },
  get mainSearch()    { return document.getElementById('mainSearch'); },
  get mainState()     { return document.getElementById('mainState'); },
  get mainCity()      { return document.getElementById('mainCity'); },
  get mainCourse()    { return document.getElementById('mainCourse'); },
  get collegesGrid()  { return document.getElementById('collegesGrid'); },
  get resultsCount()  { return document.getElementById('resultsCount'); },
  get pagination()    { return document.getElementById('pagination'); },
  get statsTotal()    { return document.getElementById('statTotal'); },
  get statsStates()   { return document.getElementById('statStates'); },
  get statsCities()   { return document.getElementById('statCities'); },
  get statesGrid()    { return document.getElementById('statesGrid'); },
  get stateSelect()   { return document.getElementById('stateSelect'); },
  get loadingOverlay(){ return document.getElementById('loadingOverlay'); },
};

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadStates();
  loadCourseFilters();
  loadFeaturedColleges();
  setupEventListeners();
  setupHamburger();
  animateOnScroll();
});

async function loadStats() {
  try {
    const res  = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    if (data.success) {
      animateCount(DOM.statsTotal,  data.data.totalColleges);
      animateCount(DOM.statsStates, data.data.totalStates);
      animateCount(DOM.statsCities, data.data.totalCities);
      ['statTotal2','statTotalPanel','statStatesPanel','statCitiesPanel'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) animateCount(el, [data.data.totalColleges, data.data.totalColleges, data.data.totalStates, data.data.totalCities][i]);
      });
    }
  } catch (err) { console.error('Stats error:', err); }
}

function animateCount(el, target) {
  if (!el) return;
  let count = 0;
  const step = Math.ceil(target / 60);
  const interval = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count.toLocaleString('en-IN');
    if (count >= target) clearInterval(interval);
  }, 25);
}

async function loadStates() {
  try {
    const res  = await fetch(`${API_BASE}/states`);
    const data = await res.json();
    if (data.success) {
      populateStateSelects(data.data);
      renderStatesGrid(data.data);
    }
  } catch (err) { console.error('States error:', err); }
}

function populateStateSelects(states) {
  [DOM.heroState, DOM.mainState, DOM.stateSelect].forEach(sel => {
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state; opt.textContent = state;
      sel.appendChild(opt);
    });
  });
}

const STATE_EMOJIS = {
  'Andhra Pradesh':'🏛️','Arunachal Pradesh':'🏔️','Assam':'🌿','Bihar':'🏺',
  'Chhattisgarh':'🌾','Goa':'🏖️','Gujarat':'🦁','Haryana':'🌾',
  'Himachal Pradesh':'❄️','Jharkhand':'⛏️','Karnataka':'🏰','Kerala':'🌴',
  'Madhya Pradesh':'🐯','Maharashtra':'🏙️','Manipur':'🌺','Meghalaya':'☁️',
  'Mizoram':'🌸','Nagaland':'🦅','Odisha':'🛕','Punjab':'🌾',
  'Rajasthan':'🏜️','Sikkim':'🏔️','Tamil Nadu':'🛕','Telangana':'🏛️',
  'Tripura':'🌿','Uttar Pradesh':'🕌','Uttarakhand':'⛰️','West Bengal':'🐯',
  'Chandigarh':'🌆','Delhi':'🗺️','Puducherry':'🏛️',
  'Dadra and Nagar Haveli and Daman and Diu':'🌊','Ladakh':'🏔️',
  'Jammu and Kashmir':'❄️'
};

function renderStatesGrid(states) {
  const grid = DOM.statesGrid;
  if (!grid) return;
  grid.innerHTML = states.map(state => `
    <div class="state-card" onclick="filterByState('${state}')">
      <div class="state-card-icon">${STATE_EMOJIS[state] || '🏫'}</div>
      <div class="state-card-info">
        <div class="state-card-name">${state}</div>
        <div class="state-card-count">Browse Colleges →</div>
      </div>
    </div>`).join('');
}

async function loadCitiesForState(state) {
  const citySelect = DOM.mainCity;
  if (!citySelect) return;
  citySelect.innerHTML = '<option value="all">All Cities</option>';
  if (!state || state === 'all') return;
  try {
    const res  = await fetch(`${API_BASE}/cities?state=${encodeURIComponent(state)}`);
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      data.data.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.textContent = city;
        citySelect.appendChild(opt);
      });
    }
  } catch (err) { console.error('Cities error:', err); }
}

function onStateChange(state) {
  currentFilters.state = state;
  currentFilters.city  = 'all';
  if (DOM.mainCity) DOM.mainCity.value = 'all';
  loadCitiesForState(state);
  searchColleges(1);
}

async function loadCourseFilters() {
  const wrap = document.getElementById('courseFiltersWrap');
  if (!wrap) return;
  const fallback = ['B.Tech','M.Tech','MBBS','MBA','MCA','BCA','BBA','B.Sc','B.Com','LLB','PGDM','B.Arch','B.Ed','B.Pharm'];
  try {
    const res  = await fetch(`${API_BASE}/courses`);
    const data = await res.json();
    renderCourseChips(wrap, (data.success && data.popular?.length > 0) ? data.popular : fallback);
  } catch (err) {
    renderCourseChips(wrap, fallback);
  }
}

function renderCourseChips(wrap, courses) {
  const chips = [{ label:'All Courses', value:'', icon:'📚' },
    ...courses.map(c => ({ label:c, value:c, icon:getCourseIcon(c) }))];

  wrap.innerHTML =
    `<div class="filter-header"><span class="filter-label">🎓 Filter by Course</span></div>
     <div class="filter-chips-row">
       ${chips.map((c,i) =>
         `<button class="filter-chip${i===0?' active':''}" data-course="${c.value}">
            <span class="chip-icon">${c.icon}</span>${c.label}
          </button>`).join('')}
     </div>`;

  wrap.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      wrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilters.course = chip.dataset.course || '';
      if (DOM.mainCourse) DOM.mainCourse.value = currentFilters.course;
      searchColleges(1);
    });
  });
}

function getCourseIcon(course) {
  const c = course.toUpperCase();
  if (c.includes('TECH') || c.includes('ENGG') || c.includes('B.E')) return '⚙️';
  if (c.includes('MBBS') || c.includes('BDS') || c.includes('BAMS')) return '🏥';
  if (c.includes('MBA') || c.includes('BBA') || c.includes('PGDM')) return '💼';
  if (c.includes('BCA') || c.includes('MCA')) return '💻';
  if (c.includes('B.SC') || c.includes('M.SC')) return '🔬';
  if (c.includes('B.COM') || c.includes('M.COM')) return '📊';
  if (c.includes('LLB') || c.includes('LLM')) return '⚖️';
  if (c.includes('B.ARCH') || c.includes('B.DES')) return '🏛️';
  if (c.includes('B.ED') || c.includes('M.ED')) return '📖';
  if (c.includes('B.PHARM') || c.includes('M.PHARM')) return '💊';
  return '📝';
}

async function loadFeaturedColleges() {
  try {
    showLoading(true);
    const res  = await fetch(`${API_BASE}/colleges?page=1&limit=12`);
    const data = await res.json();
    if (data.success) {
      renderColleges(data.data);
      renderPagination(data.pagination);
      updateResultsCount(data.pagination.total, data.pagination.page, data.pagination.limit);
    }
  } catch (err) { showConnectionError(); }
  finally { showLoading(false); }
}

async function searchColleges(page = 1) {
  if (isLoading) return;
  isLoading = true; showLoading(true);
  currentPage = page;
  try {
    const params = new URLSearchParams({
      page, limit:12,
      search: currentFilters.search || '',
      state:  currentFilters.state  || 'all',
      city:   currentFilters.city   || 'all',
      course: currentFilters.course || ''
    });
    const res  = await fetch(`${API_BASE}/colleges?${params}`);
    const data = await res.json();
    if (data.success) {
      renderColleges(data.data);
      renderPagination(data.pagination);
      updateResultsCount(data.pagination.total, data.pagination.page, data.pagination.limit);
      document.getElementById('results-section')?.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  } catch (err) { showConnectionError(); }
  finally { isLoading = false; showLoading(false); }
}

function renderColleges(colleges) {
  const grid = DOM.collegesGrid;
  if (!grid) return;
  if (!colleges.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No Colleges Found</div>
      <div class="empty-desc">Try adjusting your search or filter criteria.</div></div>`;
    return;
  }
  grid.innerHTML = colleges.map(renderCollegeCard).join('');
  grid.querySelectorAll('.college-card').forEach((card, i) => {
    card.style.cssText = 'opacity:0;transform:translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1'; card.style.transform = 'translateY(0)';
    }, i * 60);
  });
}

function renderCollegeCard(college) {
  const ug = parseCourses(college.ug_courses);
  const pg = parseCourses(college.pg_courses);
  const dUG = ug.slice(0,3), dPG = pg.slice(0,2);
  const extra = (ug.length + pg.length) - dUG.length - dPG.length;
  return `
    <div class="college-card" onclick="openCollegeDetail(${college.id})">
      <div class="card-header">
        <div class="card-state-badge">${STATE_EMOJIS[college.state]||'🏫'} ${college.state||'India'}</div>
        <div class="card-college-name">${college.name}</div>
        <div class="card-city">📍 ${college.city||'N/A'}</div>
      </div>
      <div class="card-body">
        <div class="card-affiliation"><span>🎓</span><strong>${college.affiliation||'Autonomous'}</strong></div>
        <div class="card-courses">
          ${dUG.length?`<div class="courses-label">UG Courses</div><div class="course-tags">${dUG.map(c=>`<span class="course-tag">${c}</span>`).join('')}</div>`:''}
          ${dPG.length?`<div class="courses-label" style="margin-top:8px">PG Courses</div><div class="course-tags">${dPG.map(c=>`<span class="course-tag pg">${c}</span>`).join('')}</div>`:''}
          ${extra>0?`<span class="course-more">+${extra} more courses</span>`:''}
        </div>
        <div class="card-footer">
          <div class="card-year">Est. <strong>${college.established_year||'N/A'}</strong></div>
          <button class="btn-card-detail">View Details <span>→</span></button>
        </div>
      </div>
    </div>`;
}

function parseCourses(str) {
  if (!str || str === 'NULL') return [];
  const results = [];
  let norm = '', inB = 0;
  for (const ch of str) {
    if (ch==='(') { inB++; norm+=ch; }
    else if (ch===')') { inB--; norm+=ch; }
    else if (ch===';' && inB===0) norm+=',';
    else norm+=ch;
  }
  const parts = []; let cur = '', dep = 0;
  for (const ch of norm) {
    if (ch==='(') { dep++; cur+=ch; }
    else if (ch===')') { dep--; cur+=ch; }
    else if (ch===',' && dep===0) { if (cur.trim()) parts.push(cur.trim()); cur=''; }
    else cur+=ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  parts.forEach(p => {
    const m = p.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (m) {
      const deg = m[1].trim();
      const brs = m[2].split(/[;,]/).map(b=>b.trim()).filter(Boolean);
      if (brs.length>1) brs.forEach(b=>results.push(`${deg} - ${b}`));
      else results.push(`${deg} (${brs[0]})`);
    } else results.push(p);
  });
  return results;
}

function renderPagination(pagination) {
  const c = DOM.pagination;
  if (!c || pagination.totalPages <= 1) { if(c) c.innerHTML=''; return; }
  const { page, totalPages } = pagination;
  let html = `<button class="page-btn" onclick="searchColleges(${page-1})" ${page===1?'disabled':''}>‹</button>`;
  let start = Math.max(1, page-2), end = Math.min(totalPages, start+4);
  if (end-start<4) start = Math.max(1, end-4);
  if (start>1) html += `<button class="page-btn" onclick="searchColleges(1)">1</button><span class="page-btn" style="pointer-events:none">…</span>`;
  for (let i=start; i<=end; i++)
    html += `<button class="page-btn ${i===page?'active':''}" onclick="searchColleges(${i})">${i}</button>`;
  if (end<totalPages) html += `<span class="page-btn" style="pointer-events:none">…</span><button class="page-btn" onclick="searchColleges(${totalPages})">${totalPages}</button>`;
  html += `<button class="page-btn" onclick="searchColleges(${page+1})" ${page===totalPages?'disabled':''}>›</button>`;
  c.innerHTML = html;
}

function updateResultsCount(total, page, limit) {
  const el = DOM.resultsCount;
  if (!el) return;
  const from = (page-1)*limit+1, to = Math.min(page*limit, total);
  el.innerHTML = `Showing <strong>${from}–${to}</strong> of <strong>${total.toLocaleString('en-IN')}</strong> colleges`;
}

function openCollegeDetail(id) { window.location.href = `pages/college-detail.html?id=${id}`; }

function filterByState(state) {
  currentFilters = { search:'', state, city:'all', course:'' };
  if (DOM.mainState)  DOM.mainState.value  = state;
  if (DOM.mainSearch) DOM.mainSearch.value = '';
  loadCitiesForState(state);
  searchColleges(1);
  document.getElementById('search-section')?.scrollIntoView({ behavior:'smooth' });
}

function setupEventListeners() {
  document.getElementById('btnHeroSearch')?.addEventListener('click', () => {
    const search = DOM.heroSearch?.value||'', state = DOM.heroState?.value||'all';
    currentFilters = { search, state, city:'all', course:'' };
    if (DOM.mainSearch) DOM.mainSearch.value = search;
    if (DOM.mainState)  DOM.mainState.value  = state;
    loadCitiesForState(state);
    searchColleges(1);
    document.getElementById('search-section')?.scrollIntoView({ behavior:'smooth' });
  });
  DOM.heroSearch?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('btnHeroSearch')?.click(); });

  document.getElementById('btnMainSearch')?.addEventListener('click', () => {
    currentFilters = {
      search: DOM.mainSearch?.value||'',
      state:  DOM.mainState?.value||'all',
      city:   DOM.mainCity?.value||'all',
      course: DOM.mainCourse?.value||''
    };
    searchColleges(1);
  });
  DOM.mainSearch?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('btnMainSearch')?.click(); });

  document.getElementById('mainCity')?.addEventListener('change',  () => { currentFilters.city = DOM.mainCity?.value||'all'; searchColleges(1); });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      try {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const t = document.querySelector(href);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior:'smooth' }); }
      } catch(err) {}
    });
  });
}

function setupHamburger() {
  const h = document.getElementById('hamburger'), n = document.getElementById('navLinks');
  if (h&&n) h.addEventListener('click', () => n.classList.toggle('open'));
}

function showLoading(show) { if(DOM.loadingOverlay) DOM.loadingOverlay.classList.toggle('active', show); }

function showConnectionError() {
  const grid = DOM.collegesGrid;
  if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
    <div class="empty-icon">⚠️</div>
    <div class="empty-title">Connection Error</div>
    <div class="empty-desc">Backend chal nahi raha.<br><br>Run: <code>cd backend && node server.js</code></div></div>`;
}

function animateOnScroll() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity='1'; e.target.style.transform='translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold:0.1 });
  document.querySelectorAll('.feature-card, .state-card').forEach(el => {
    el.style.cssText='opacity:0;transform:translateY(20px);transition:opacity 0.5s ease,transform 0.5s ease';
    obs.observe(el);
  });
}