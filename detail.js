const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError('No college ID specified.');
    return;
  }

  loadCollegeDetail(id);
  setupHamburger();
});

async function loadCollegeDetail(id) {
  showSkeleton();
  try {
    const res = await fetch(`${API_BASE}/colleges/${id}`);
    const data = await res.json();

    if (!data.success) {
      showError('College not found.');
      return;
    }

    renderDetail(data.data);
    loadMoreColleges(data.data.state, id);
  } catch (err) {
    console.error('Detail load error:', err);
    showError('Connection error. Make sure backend is running on port 5000.');
  }
}

function renderDetail(college) {

  document.title = `${college.name} — India College Finder`;

  document.getElementById('bcCollegeName').textContent = truncate(college.name, 40);
  const bcState = document.getElementById('bcState');
  if (bcState) {
    bcState.textContent = college.state || '';
    bcState.href = `../index.html?state=${encodeURIComponent(college.state)}`;
  }

  document.getElementById('detailStateBadge').textContent =
    `${getEmoji(college.state)} ${college.state || 'India'}`;
  document.getElementById('detailCollegeName').textContent = college.name;
  document.getElementById('detailCity').textContent = college.city || 'N/A';
  document.getElementById('detailState').textContent = college.state || 'N/A';
  document.getElementById('detailAffiliation').textContent = college.affiliation || 'Autonomous';
  document.getElementById('detailYear').textContent = college.established_year || 'N/A';

  const websiteBtn = document.getElementById('btnWebsite');
  if (websiteBtn) {
    if (college.website) {
      let url = college.website;
      if (!url.startsWith('http')) url = 'https://' + url;
      websiteBtn.href = url;
      websiteBtn.target = '_blank';
      websiteBtn.style.display = 'flex';
    } else {
      websiteBtn.style.display = 'none';
    }
  }

  renderCourses(college.ug_courses, college.pg_courses);

  renderContact(college);

  const sc = document.getElementById('stripCity');
  const ss = document.getElementById('stripState');
  const sy = document.getElementById('stripYear');
  if (sc) sc.textContent = college.city || '—';
  if (ss) ss.textContent = college.state || '—';
  if (sy) sy.textContent = college.established_year || '—';

  const loc = [college.city, college.state].filter(Boolean).join(', ');
  const ov = id => document.getElementById(id);
  if (ov('overviewName'))        ov('overviewName').textContent        = college.name || '—';
  if (ov('overviewLocation'))    ov('overviewLocation').textContent    = loc || '—';
  if (ov('overviewAffiliation')) ov('overviewAffiliation').textContent = college.affiliation || 'Autonomous';
  if (ov('overviewYear'))        ov('overviewYear').textContent        = college.established_year || '—';

  document.getElementById('detailContent').style.display = 'block';
  document.getElementById('detailSkeleton').style.display = 'none';
}

function renderCourses(ugRaw, pgRaw) {
  const ugCourses = parseCourses(ugRaw);
  const pgCourses = parseCourses(pgRaw);
  const container = document.getElementById('coursesContainer');
  if (!container) return;

  let html = '';

  if (ugCourses.length > 0) {
    html += `
      <div class="courses-section">
        <div class="courses-section-title">
          <span class="courses-type-badge ug-badge">UG</span> Undergraduate Programmes
        </div>
        <div class="courses-list">
          ${ugCourses.map(c => `<span class="course-pill">${c.trim()}</span>`).join('')}
        </div>
      </div>`;
  }

  if (pgCourses.length > 0) {
    html += `
      <div class="courses-section" style="margin-top:22px;">
        <div class="courses-section-title">
          <span class="courses-type-badge pg-badge">PG</span> Postgraduate Programmes
        </div>
        <div class="courses-list">
          ${pgCourses.map(c => `<span class="course-pill pg-pill">${c.trim()}</span>`).join('')}
        </div>
      </div>`;
  }

  if (!html) {
    html = `<p style="color:var(--text-light);font-size:0.9rem;">Course information not available.</p>`;
  }

  container.innerHTML = html;
}

function renderContact(college) {

  const emailEl = document.getElementById('contactEmail');
  if (emailEl) {
    if (college.email) {
      emailEl.innerHTML = `<a href="mailto:${college.email}">${college.email}</a>`;
    } else {
      emailEl.textContent = 'Not available';
    }
  }

  const phoneEl = document.getElementById('contactPhone');
  if (phoneEl) {
    if (college.phone) {
      phoneEl.innerHTML = `<a href="tel:${college.phone}">${college.phone}</a>`;
    } else {
      phoneEl.textContent = 'Not available';
    }
  }

  const websiteEl = document.getElementById('contactWebsite');
  if (websiteEl) {
    if (college.website) {
      let url = college.website;
      if (!url.startsWith('http')) url = 'https://' + url;
      websiteEl.innerHTML = `<a href="${url}" target="_blank">${college.website}</a>`;
    } else {
      websiteEl.textContent = 'Not available';
    }
  }

  const addrEl = document.getElementById('contactAddress');
  if (addrEl) {
    const parts = [college.city, college.state].filter(Boolean);
    addrEl.textContent = parts.join(', ') || 'Not available';
  }

  const mapParts = [college.name, college.city, college.state, 'India'].filter(Boolean);
  const mapQuery = encodeURIComponent(mapParts.join(', '));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const mapLinkEl = document.getElementById('btnMapLink');
  const mapItem   = document.getElementById('locationMapItem');
  if (mapLinkEl && mapItem) {
    mapLinkEl.href = mapsUrl;
    mapItem.style.display = 'flex';
  }

  const mapBtn = document.getElementById('btnMap');
  if (mapBtn) {
    mapBtn.href = mapsUrl;
    mapBtn.style.display = 'flex';
  }

  const emailBtn = document.getElementById('btnEmail');
  if (emailBtn && college.email) {
    emailBtn.href = `mailto:${college.email}`;
  } else if (emailBtn) {
    emailBtn.style.opacity = '0.5';
    emailBtn.style.pointerEvents = 'none';
  }

  const phoneBtn = document.getElementById('btnPhone');
  if (phoneBtn && college.phone) {
    phoneBtn.href = `tel:${college.phone}`;
  } else if (phoneBtn) {
    phoneBtn.style.opacity = '0.5';
    phoneBtn.style.pointerEvents = 'none';
  }
}

async function loadMoreColleges(state, currentId) {
  if (!state) return;
  try {
    const res = await fetch(`${API_BASE}/colleges?state=${encodeURIComponent(state)}&limit=4`);
    const data = await res.json();
    if (!data.success) return;

    const others = data.data.filter(c => c.id != currentId).slice(0, 3);
    const container = document.getElementById('moreCollegesGrid');
    const section = document.getElementById('moreCollegesSection');

    if (others.length === 0 || !container) return;
    if (section) section.style.display = 'block';

    container.innerHTML = others.map(c => renderMiniCard(c)).join('');
  } catch (err) {
    console.error('More colleges error:', err);
  }
}

function renderMiniCard(college) {
  const ugCourses = parseCourses(college.ug_courses).slice(0, 2);
  return `
    <div class="college-card" onclick="window.location.href='college-detail.html?id=${college.id}'" style="cursor:pointer;">
      <div class="card-header">
        <div class="card-state-badge">${getEmoji(college.state)} ${college.state || ''}</div>
        <div class="card-college-name">${college.name}</div>
        <div class="card-city">📍 ${college.city || ''}</div>
      </div>
      <div class="card-body">
        <div class="card-affiliation"><span>🎓</span><strong>${college.affiliation || 'Autonomous'}</strong></div>
        <div class="card-courses">
          <div class="course-tags">
            ${ugCourses.map(c => `<span class="course-tag">${c}</span>`).join('')}
          </div>
        </div>
        <div class="card-footer">
          <div class="card-year">Est. <strong>${college.established_year || 'N/A'}</strong></div>
          <button class="btn-card-detail">Details →</button>
        </div>
      </div>
    </div>
  `;
}

function showSkeleton() {
  const skeleton = document.getElementById('detailSkeleton');
  const content = document.getElementById('detailContent');
  if (skeleton) skeleton.style.display = 'block';
  if (content) content.style.display = 'none';
}

function showError(msg) {
  const skeleton = document.getElementById('detailSkeleton');
  if (skeleton) {
    skeleton.innerHTML = `
      <div style="text-align:center;padding:80px 20px;">
        <div style="font-size:3rem;margin-bottom:20px;">⚠️</div>
        <h2 style="font-family:var(--font-display);color:var(--text-dark);margin-bottom:10px;">Error Loading College</h2>
        <p style="color:var(--text-light);margin-bottom:20px;">${msg}</p>
        <a href="../index.html" class="btn-card-detail" style="display:inline-flex;text-decoration:none;">← Back to Search</a>
      </div>`;
    skeleton.style.display = 'block';
  }
}

function parseCourses(str) {
  if (!str || str === 'NULL') return [];

  const results = [];

  let normalized = '';
  let insideBracket = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') { insideBracket++; normalized += ch; }
    else if (ch === ')') { insideBracket--; normalized += ch; }
    else if (ch === ';' && insideBracket === 0) { normalized += ','; }
    else { normalized += ch; }
  }

  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '(') { depth++; current += ch; }
    else if (ch === ')') { depth--; current += ch; }
    else if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else { current += ch; }
  }
  if (current.trim()) parts.push(current.trim());

  parts.forEach(function(part) {
    const bracketMatch = part.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (bracketMatch) {
      const degree = bracketMatch[1].trim();
      const inner = bracketMatch[2];
      const branches = inner.split(/[;,]/).map(function(b) { return b.trim(); }).filter(Boolean);
      if (branches.length > 1) {
        branches.forEach(function(branch) {
          results.push(degree + ' - ' + branch);
        });
      } else {
        results.push(degree + ' (' + branches[0] + ')');
      }
    } else {
      results.push(part);
    }
  });

  return results;
}

function truncate(str, len) {
  return str && str.length > len ? str.substring(0, len) + '...' : str || '';
}

const STATE_EMOJIS = {
  'Andhra Pradesh': '🏛️', 'Arunachal Pradesh': '🏔️', 'Assam': '🌿', 'Bihar': '🏺',
  'Chhattisgarh': '🌾', 'Goa': '🏖️', 'Gujarat': '🦁', 'Haryana': '🌾',
  'Himachal Pradesh': '❄️', 'Jharkhand': '⛏️', 'Karnataka': '🏰', 'Kerala': '🌴',
  'Madhya Pradesh': '🐯', 'Maharashtra': '🏙️', 'Manipur': '🌺', 'Meghalaya': '☁️',
  'Mizoram': '🌸', 'Nagaland': '🦅', 'Odisha': '🛕', 'Punjab': '🌾',
  'Rajasthan': '🏜️', 'Sikkim': '🏔️', 'Tamil Nadu': '🛕', 'Telangana': '🏛️',
  'Tripura': '🌿', 'Uttar Pradesh': '🕌', 'Uttarakhand': '⛰️', 'West Bengal': '🐯',
  'Chandigarh': '🌆', 'Delhi': '🗺️', 'Puducherry': '🏛️',
  'Dadra and Nagar Haveli and Daman and Diu': '🌊', 'Ladakh': '🏔️',
  'Jammu and Kashmir': '❄️'
};

function getEmoji(state) {
  return STATE_EMOJIS[state] || '🏫';
}

function setupHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
}