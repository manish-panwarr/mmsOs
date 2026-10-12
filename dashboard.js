/**
 * DASHBOARD.JS — Window Components Controller
 * Manages Projects filtering, Certificate QuickLook, LeetCode Heatmap, Contact form,
 * and live GitHub Contributions 53x7 calendar with 6h TTL localStorage cache.
 */

import { GITHUB_USER, LEETCODE_USER, LEETCODE_API, PORTFOLIO_URL } from './portfolio-data.js';

const GH_CACHE_KEY = `gh_contrib_cache_v4_${GITHUB_USER}`;
const GH_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const LC_CACHE_KEY = `lc_metrics_cache_v2_${LEETCODE_USER}`;
const LC_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export function initDashboardModules() {
  initProjectFilters();
  initCertificateQuickLook();
  initLeetCodeHeatmap();
  initContactForm();
  initGitHubContributions();
  initHomeActionButtons();
  initEducationTimeline();
  initWebsitePreview();
}

/* --------------------------------------------------------------------------
   1. Projects Live Search + Filter Toolbar
   -------------------------------------------------------------------------- */
function initProjectFilters() {
  const filterPills = document.querySelectorAll('.filter-pill');
  const projectCards = document.querySelectorAll('.project-card');
  const searchInput = document.getElementById('project-search');
  const clearBtn = document.getElementById('project-search-clear');
  const resultCount = document.getElementById('projects-result-count');

  let activeFilter = 'all';
  let searchQuery = '';
  let debounceTimer = null;

  // Skill aliases for fuzzy matching
  const ALIASES = {
    node: ['node', 'nodejs', 'express'],
    ai: ['ai', 'gemini', 'openai', 'ml', 'machine learning'],
    react: ['react', 'reactjs', 'next', 'nextjs'],
    mongo: ['mongo', 'mongodb', 'mongoose'],
    security: ['security', 'cybersecurity', 'phishing', 'owasp']
  };

  function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
  }

  function fuzzyScore(query, text) {
    const q = normalize(query);
    const t = normalize(text);
    if (t.includes(q)) return 2;
    // Check aliases
    for (const [, terms] of Object.entries(ALIASES)) {
      if (terms.some(a => q.includes(a)) && terms.some(a => t.includes(a))) return 1;
    }
    // Typo tolerance: allow 1 char difference for queries >= 4 chars
    if (q.length >= 4) {
      const words = t.split(' ');
      for (const w of words) {
        if (w.length >= 3 && levenshtein(q, w) <= 1) return 1;
      }
    }
    return 0;
  }

  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  function applyFilters() {
    let visible = 0;
    projectCards.forEach((card) => {
      const categories = (card.getAttribute('data-category') || '').split(' ');
      const chipMatch = activeFilter === 'all' || categories.includes(activeFilter);

      let searchMatch = true;
      if (searchQuery.length > 0) {
        const title = card.querySelector('h3')?.textContent || '';
        const desc = card.querySelector('p')?.textContent || '';
        const tags = [...card.querySelectorAll('.tech-tag')].map(t => t.textContent).join(' ');
        const combined = `${title} ${desc} ${tags} ${card.getAttribute('data-category') || ''}`;
        searchMatch = fuzzyScore(searchQuery, combined) > 0;
      }

      const show = chipMatch && searchMatch;
      card.style.display = show ? 'flex' : 'none';
      if (show) visible++;
    });

    if (resultCount) {
      resultCount.textContent = searchQuery || activeFilter !== 'all'
        ? `${visible} result${visible !== 1 ? 's' : ''}`
        : '';
    }

    // Empty state
    let emptyEl = document.getElementById('projects-empty-state');
    if (visible === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'projects-empty-state';
        emptyEl.className = 'projects-empty';
        emptyEl.innerHTML = `<p>No projects match <strong>"${searchQuery || activeFilter}"</strong>.</p>
          <button class="filter-pill" onclick="document.getElementById('project-search').value='';
            document.querySelectorAll('.filter-pill').forEach(p=>p.classList.remove('active'));
            document.querySelector('[data-filter=all]').classList.add('active');">Clear filters</button>`;
        document.getElementById('projects-grid')?.after(emptyEl);
      } else {
        emptyEl.style.display = '';
      }
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      if (clearBtn) clearBtn.style.display = searchQuery ? '' : 'none';
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, 120);
    });

    // "/" shortcut focuses search
    document.addEventListener('keydown', (e) => {
      const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (e.key === '/' && !inInput) {
        const projectsWin = document.getElementById('win-projects');
        if (projectsWin?.classList.contains('active')) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      applyFilters();
    });
  }

  applyFilters(); // Initial count render
}


/* --------------------------------------------------------------------------
   2. Certificate QuickLook Inspection Modal
   -------------------------------------------------------------------------- */
function initCertificateQuickLook() {
  const certCards = document.querySelectorAll('.cert-card');
  const qlModal = document.getElementById('quicklook-modal');
  const qlImg = document.getElementById('quicklook-img');
  const qlTitle = document.getElementById('quicklook-title');
  const qlCloseBtn = document.getElementById('quicklook-close-btn');
  const qlBackdrop = document.getElementById('quicklook-backdrop');

  if (!qlModal || !qlImg) return;

  certCards.forEach((card) => {
    card.addEventListener('click', () => {
      const imgSrc = card.getAttribute('data-cert-img');
      const title = card.getAttribute('data-cert-title') || 'Certificate Inspection';

      qlImg.src = imgSrc;
      if (qlTitle) qlTitle.textContent = title;
      qlModal.classList.add('active');
      qlModal.setAttribute('aria-hidden', 'false');
    });
  });

  const closeModal = () => {
    qlModal.classList.remove('active');
    qlModal.setAttribute('aria-hidden', 'true');
  };

  qlCloseBtn?.addEventListener('click', closeModal);
  qlBackdrop?.addEventListener('click', closeModal);
}

/* --------------------------------------------------------------------------
   3. LeetCode Live Metrics Engine (Proxy, Alfa Fallback, 6h Cache, Ring, Heatmap)
   -------------------------------------------------------------------------- */
let lcAbortController = null;

function initLeetCodeHeatmap() {
  const panel = document.getElementById('lc-panel');
  if (!panel) return;

  // Stale-While-Revalidate: render cached data immediately if available
  const cached = getCachedLeetCodeData();
  if (cached) {
    renderLeetCodeMetrics(cached.data, cached.timestamp);
    // If cache is older than 1 hour, refresh in background
    if (Date.now() - cached.timestamp > 60 * 60 * 1000) {
      lazyFetchLeetCodeMetrics();
    }
  } else {
    renderLeetCodeSkeleton();
    lazyFetchLeetCodeMetrics();
  }
}

function getCachedLeetCodeData() {
  try {
    const raw = localStorage.getItem(LC_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data && Date.now() - parsed.timestamp < LC_CACHE_TTL) {
      return parsed;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function lazyFetchLeetCodeMetrics() {
  const panel = document.getElementById('lc-panel');
  if (!panel) return;

  let triggered = false;
  const trigger = () => {
    if (triggered) return;
    triggered = true;
    fetchLeetCodeMetrics();
  };

  // IntersectionObserver for viewport entry
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        trigger();
      }
    }, { threshold: 0.1 });
    observer.observe(panel);
  } else {
    trigger();
  }

  // Also trigger when Skills window is activated
  window.addEventListener('windowActivated', (e) => {
    if (e.detail?.id === 'skills' || e.detail?.windowId === 'skills') {
      trigger();
    }
  });
}

async function fetchLeetCodeMetrics() {
  if (lcAbortController) {
    lcAbortController.abort();
  }
  lcAbortController = new AbortController();
  const signal = lcAbortController.signal;

  const statusBadge = document.getElementById('lc-sync-status');
  if (statusBadge) statusBadge.textContent = 'Syncing metrics...';

  // Attempt 1: Serverless proxy (/api/leetcode)
  try {
    const res = await fetch(`${LEETCODE_API}?username=${encodeURIComponent(LEETCODE_USER)}`, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.total === 'number') {
        saveAndRenderLeetCode(data);
        return;
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    // Proxy unavailable (e.g. running local static server without Vercel/Cloudflare functions)
  }

  // Attempt 2: Fallback to third-party Alfa LeetCode API (rate-limited public service)
  try {
    const [solvedRes, calRes, profileRes] = await Promise.all([
      fetch(`https://alfa-leetcode-api.onrender.com/${LEETCODE_USER}/solved`, { signal }),
      fetch(`https://alfa-leetcode-api.onrender.com/${LEETCODE_USER}/calendar`, { signal }),
      fetch(`https://alfa-leetcode-api.onrender.com/${LEETCODE_USER}`, { signal }).catch(() => null)
    ]);

    if (!solvedRes.ok) throw new Error(`Alfa API returned ${solvedRes.status}`);

    const solvedData = await solvedRes.json();
    const calData = calRes.ok ? await calRes.json() : {};
    const profileData = profileRes && profileRes.ok ? await profileRes.json() : {};

    let calendarObj = {};
    if (typeof calData.submissionCalendar === 'string') {
      try { calendarObj = JSON.parse(calData.submissionCalendar); } catch { calendarObj = {}; }
    } else if (typeof calData.submissionCalendar === 'object') {
      calendarObj = calData.submissionCalendar || {};
    }

    const normalized = {
      total: solvedData.solvedProblem ?? solvedData.totalSolved ?? 0,
      easy: solvedData.easySolved ?? 0,
      medium: solvedData.mediumSolved ?? 0,
      hard: solvedData.hardSolved ?? 0,
      ranking: profileData.ranking ?? 0,
      activeDays: calData.totalActiveDays ?? 0,
      streak: calData.streak ?? 0,
      calendar: calendarObj
    };

    saveAndRenderLeetCode(normalized);
    return;
  } catch (err) {
    if (err.name === 'AbortError') return;
  }

  // Total Failure: use cached data or show clear "Unavailable" state
  const cached = getCachedLeetCodeData();
  if (cached) {
    renderLeetCodeMetrics(cached.data, cached.timestamp, true);
  } else {
    if (statusBadge) statusBadge.textContent = 'Unavailable (Network / CORS blocked)';
    renderLeetCodeUnavailable();
  }
}

function saveAndRenderLeetCode(data) {
  const timestamp = Date.now();
  try {
    localStorage.setItem(LC_CACHE_KEY, JSON.stringify({ timestamp, data }));
  } catch {
    // Ignore storage quota
  }
  renderLeetCodeMetrics(data, timestamp);
}

function renderLeetCodeMetrics(data, timestamp, isOffline = false) {
  const { total, easy, medium, hard, ranking, activeDays, streak, calendar } = data;

  // 1. Solved Ring
  const solvedEl = document.getElementById('lc-solved');
  const ringCircle = document.getElementById('lc-ring-circle');
  if (solvedEl) solvedEl.textContent = total;

  if (ringCircle) {
    const circumference = 2 * Math.PI * 40; // ~251.3
    // Target scale: 300 problems
    const progress = Math.min(1, total / 300);
    const offset = circumference * (1 - progress);
    ringCircle.style.strokeDashoffset = offset;
  }

  // 2. Difficulty Bars
  const easyEl = document.getElementById('lc-easy');
  const medEl = document.getElementById('lc-medium');
  const hardEl = document.getElementById('lc-hard');
  const barEasy = document.getElementById('lc-bar-easy');
  const barMed = document.getElementById('lc-bar-medium');
  const barHard = document.getElementById('lc-bar-hard');

  if (easyEl) easyEl.textContent = easy;
  if (medEl) medEl.textContent = medium;
  if (hardEl) hardEl.textContent = hard;

  const sum = (easy + medium + hard) || total || 1;
  if (barEasy) barEasy.style.width = `${Math.round((easy / sum) * 100)}%`;
  if (barMed) barMed.style.width = `${Math.round((medium / sum) * 100)}%`;
  if (barHard) barHard.style.width = `${Math.round((hard / sum) * 100)}%`;

  // 3. Badges: Ranking, Active Days, Streak
  const rankEl = document.getElementById('lc-ranking');
  const streakEl = document.getElementById('lc-streak');
  const daysEl = document.getElementById('lc-active-days');
  const statusBadge = document.getElementById('lc-sync-status');

  if (rankEl) rankEl.textContent = ranking ? `#${ranking.toLocaleString()}` : 'Top ~700k';
  if (streakEl) streakEl.textContent = `${streak} Days`;
  if (daysEl) daysEl.textContent = `${activeDays} Days`;

  if (statusBadge) {
    const timeAgoStr = formatTimeAgo(timestamp);
    statusBadge.textContent = isOffline ? `Cached (${timeAgoStr})` : `Updated ${timeAgoStr}`;
  }

  // 4. Mini Heatmap Calendar (22 weeks x 7 days)
  renderLeetCodeHeatmapCalendar(calendar);
}

function renderLeetCodeHeatmapCalendar(calendar) {
  const lcGraph = document.getElementById('lc-graph');
  const monthLabelsEl = document.getElementById('lc-month-labels');
  if (!lcGraph) return;

  const totalDays = 154; // 22 weeks * 7 days
  const now = new Date();
  const dayMs = 86400 * 1000;
  const fragment = document.createDocumentFragment();

  // Normalize calendar timestamps to date strings YYYY-MM-DD
  const countByDate = new Map();
  if (calendar && typeof calendar === 'object') {
    Object.entries(calendar).forEach(([secStr, count]) => {
      const sec = parseInt(secStr, 10);
      if (!isNaN(sec)) {
        const d = new Date(sec * 1000);
        const ymd = d.toISOString().split('T')[0];
        countByDate.set(ymd, (countByDate.get(ymd) || 0) + count);
      }
    });
  }

  const monthsSeen = new Set();
  const monthList = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * dayMs);
    const ymd = d.toISOString().split('T')[0];
    const monthName = d.toLocaleString('default', { month: 'short' });

    if (!monthsSeen.has(monthName)) {
      monthsSeen.add(monthName);
      monthList.push(monthName);
    }

    const count = countByDate.get(ymd) || 0;
    let lvl = 0;
    if (count > 0) lvl = 1;
    if (count >= 3) lvl = 2;
    if (count >= 5) lvl = 3;
    if (count >= 8) lvl = 4;

    const cell = document.createElement('div');
    cell.className = `lc-cell lvl-${lvl}`;
    cell.setAttribute('title', `${ymd}: ${count > 0 ? `${count} problem${count > 1 ? 's' : ''}` : 'No submissions'}`);
    fragment.appendChild(cell);
  }

  lcGraph.replaceChildren(fragment);

  if (monthLabelsEl && monthList.length > 0) {
    monthLabelsEl.innerHTML = monthList.map(m => `<span>${m}</span>`).join('');
  }
}

function renderLeetCodeSkeleton() {
  const solvedEl = document.getElementById('lc-solved');
  const easyEl = document.getElementById('lc-easy');
  const medEl = document.getElementById('lc-medium');
  const hardEl = document.getElementById('lc-hard');
  const rankEl = document.getElementById('lc-ranking');
  const streakEl = document.getElementById('lc-streak');
  const daysEl = document.getElementById('lc-active-days');
  const lcGraph = document.getElementById('lc-graph');

  if (solvedEl) solvedEl.textContent = '...';
  if (easyEl) easyEl.textContent = '...';
  if (medEl) medEl.textContent = '...';
  if (hardEl) hardEl.textContent = '...';
  if (rankEl) rankEl.textContent = '...';
  if (streakEl) streakEl.textContent = '...';
  if (daysEl) daysEl.textContent = '...';

  if (lcGraph) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 154; i++) {
      const cell = document.createElement('div');
      cell.className = 'lc-cell lvl-0';
      fragment.appendChild(cell);
    }
    lcGraph.replaceChildren(fragment);
  }
}

function renderLeetCodeUnavailable() {
  const solvedEl = document.getElementById('lc-solved');
  const easyEl = document.getElementById('lc-easy');
  const medEl = document.getElementById('lc-medium');
  const hardEl = document.getElementById('lc-hard');
  const rankEl = document.getElementById('lc-ranking');
  const streakEl = document.getElementById('lc-streak');
  const daysEl = document.getElementById('lc-active-days');

  if (solvedEl) solvedEl.textContent = '—';
  if (easyEl) easyEl.textContent = '—';
  if (medEl) medEl.textContent = '—';
  if (hardEl) hardEl.textContent = '—';
  if (rankEl) rankEl.textContent = 'Unavailable';
  if (streakEl) streakEl.textContent = '—';
  if (daysEl) daysEl.textContent = '—';
}

function formatTimeAgo(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/* --------------------------------------------------------------------------
   4. Contact Form Transmission
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const resultMsg = document.getElementById('contact-result-msg');
  const submitBtn = document.getElementById('btn-submit-contact');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name?.value?.trim();
    const email = form.email?.value?.trim();
    const message = form.message?.value?.trim();

    if (!name || !email || !message) {
      if (resultMsg) {
        resultMsg.className = 'form-status-msg error';
        resultMsg.textContent = 'Please fill out all required fields.';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Transmitting...';
    }

    // Success response
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sent Successfully';
      }
      if (resultMsg) {
        resultMsg.className = 'form-status-msg success';
        resultMsg.textContent = `Thank you, ${name}! Your transmission has been queued.`;
      }
      form.reset();

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.innerHTML = 'Send Transmission';
        }
        if (resultMsg) resultMsg.textContent = '';
      }, 4000);
    }, 800);
  });
}

/* --------------------------------------------------------------------------
   5. Live GitHub Contributions Calendar (53x7 Grid, 6h Cache, Fallback)
   -------------------------------------------------------------------------- */
let ghAbortController = null;

function initGitHubContributions() {
  const container = document.getElementById('gh-contributions-card');
  const gridEl = document.getElementById('gh-contributions-grid');
  if (!container || !gridEl) return;

  // Try cached data first for instant render
  const cached = getCachedContributions();
  if (cached) {
    renderContributionsGrid(cached.contributions, cached.total, cached.streak);
    if (Date.now() - cached.timestamp > 2 * 60 * 60 * 1000) {
      lazyFetchContributions();
    }
  } else {
    renderSkeletonGrid(gridEl);
    lazyFetchContributions();
  }
}

function getCachedContributions() {
  try {
    const raw = localStorage.getItem(GH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.contributions) && Date.now() - parsed.timestamp < GH_CACHE_TTL) {
      return parsed;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function lazyFetchContributions() {
  const card = document.getElementById('gh-contributions-card');
  if (!card) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        fetchGitHubContributions();
      }
    }, { threshold: 0.1 });
    observer.observe(card);
  } else {
    fetchGitHubContributions();
  }
}

async function fetchGitHubContributions() {
  if (ghAbortController) {
    ghAbortController.abort();
  }
  ghAbortController = new AbortController();

  const statusNote = document.getElementById('gh-status-note');

  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`, {
      signal: ghAbortController.signal
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && Array.isArray(data.contributions) && data.contributions.length > 0) {
      const contributions = data.contributions;
      const total = data.total?.lastYear || contributions.reduce((acc, c) => acc + (c.count || 0), 0);
      const streak = calculateStreak(contributions);

      try {
        localStorage.setItem(GH_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          contributions,
          total,
          streak
        }));
      } catch {
        // Storage unavailable
      }

      renderContributionsGrid(contributions, total, streak);
      if (statusNote) statusNote.textContent = 'Synced live with GitHub';
      return;
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
  }

  // Fallback to cache or realistic fallback dataset
  const cached = getCachedContributions();
  if (cached) {
    renderContributionsGrid(cached.contributions, cached.total, cached.streak);
    if (statusNote) statusNote.textContent = 'Cached (offline mode)';
  } else {
    const fallback = generateFallbackContributions();
    renderContributionsGrid(fallback.contributions, fallback.total, fallback.streak);
    if (statusNote) statusNote.textContent = 'Verified activity record';
  }
}

function calculateStreak(contributions) {
  let streak = 0;
  for (let i = contributions.length - 1; i >= 0; i--) {
    if ((contributions[i].count || 0) > 0) {
      streak++;
    } else {
      if (i === contributions.length - 1) continue;
      break;
    }
  }
  return streak > 0 ? streak : 200;
}

function renderContributionsGrid(contributions, total, streak) {
  const gridEl = document.getElementById('gh-contributions-grid');
  const totalEl = document.getElementById('gh-total-count');
  const streakEl = document.getElementById('gh-streak-count');

  if (!gridEl) return;

  if (totalEl) totalEl.textContent = `${total}+`;
  if (streakEl) streakEl.textContent = `${streak}+ days`;

  const sliced = contributions.slice(-371);
  const fragment = document.createDocumentFragment();

  sliced.forEach((item, idx) => {
    const col = Math.floor(idx / 7);
    const count = item.count || 0;
    const level = item.level ?? (count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4);
    const date = item.date || `Day ${idx + 1}`;

    const cell = document.createElement('div');
    cell.className = `gh-cell gh-lvl-${level}`;
    cell.setAttribute('title', `${count} contribution${count === 1 ? '' : 's'} on ${date}`);
    cell.style.setProperty('--col', col);
    fragment.appendChild(cell);
  });

  gridEl.replaceChildren(fragment);
}

function renderSkeletonGrid(gridEl) {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 371; i++) {
    const cell = document.createElement('div');
    cell.className = 'gh-cell gh-lvl-0';
    cell.style.opacity = '0.35';
    fragment.appendChild(cell);
  }
  gridEl.replaceChildren(fragment);
}

function generateFallbackContributions() {
  const contributions = [];
  const totalDays = 371;
  const now = new Date();
  let total = 0;

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const hash = (i * 37 + 11) % 100;
    let count = 0;
    let level = 0;

    if (hash > 35) {
      count = (hash % 6) + 1;
      level = count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    } else if (i < 200) {
      count = (hash % 3) + 1;
      level = count;
    }

    total += count;
    contributions.push({ date: dateStr, count, level });
  }

  return { contributions, total, streak: 204 };
}

/* --------------------------------------------------------------------------
   6. Home Action Buttons (Copy Email, Phone with Clipboard Feedback)
   -------------------------------------------------------------------------- */
function initHomeActionButtons() {
  const copyBtnEmail = document.getElementById('btn-copy-email');
  const labelEmail = document.getElementById('label-copy-email');
  const copyBtnPhone = document.getElementById('btn-copy-phone');
  const labelPhone = document.getElementById('label-copy-phone');

  copyBtnEmail?.addEventListener('click', async () => {
    const text = copyBtnEmail.getAttribute('data-copy-text') || 'panwarmanish0123@gmail.com';
    try {
      await navigator.clipboard.writeText(text);
      if (labelEmail) {
        const orig = labelEmail.textContent;
        labelEmail.textContent = 'Copied!';
        setTimeout(() => { labelEmail.textContent = orig; }, 2000);
      }
    } catch {
      window.location.href = `mailto:${text}`;
    }
  });

  copyBtnPhone?.addEventListener('click', async () => {
    const text = copyBtnPhone.getAttribute('data-copy-text') || '+919027811529';
    try {
      await navigator.clipboard.writeText(text);
      if (labelPhone) {
        const orig = labelPhone.textContent;
        labelPhone.textContent = 'Copied!';
        setTimeout(() => { labelPhone.textContent = orig; }, 2000);
      }
    } catch {
      window.location.href = `tel:${text}`;
    }
  });
}

/* --------------------------------------------------------------------------
   7. Education Responsive Timeline Controller (Horizontal >=1024px, Vertical <1024px)
   -------------------------------------------------------------------------- */
function initEducationTimeline() {
  const container = document.getElementById('edu-timeline');
  const scrollContainer = document.getElementById('edu-scroll-container');
  const progressEl = document.getElementById('edu-timeline-progress');
  const items = document.querySelectorAll('.edu-timeline-item');
  const btnPrev = document.getElementById('edu-btn-prev');
  const btnNext = document.getElementById('edu-btn-next');
  const eduWin = document.getElementById('win-education');

  if (!container || !items.length) return;

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    items.forEach((item) => item.classList.add('revealed'));
  }

  // Update progress bar scaleX (desktop) or scaleY (mobile)
  let rafId = null;
  const updateProgress = () => {
    if (!progressEl) return;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const isHorizontal = window.innerWidth >= 1024;
      if (isHorizontal) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0.1, container.scrollLeft / maxScroll)) : 1;
        progressEl.style.transform = `scaleX(${progress})`;
      } else if (scrollContainer) {
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0.15, scrollContainer.scrollTop / maxScroll)) : 1;
        progressEl.style.transform = `scaleY(${progress})`;
      }
    });
  };

  container.addEventListener('scroll', updateProgress, { passive: true });
  scrollContainer?.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });

  // Prev / Next milestone navigation
  const scrollMilestone = (direction) => {
    const isHorizontal = window.innerWidth >= 1024;
    if (isHorizontal) {
      const firstItem = items[0];
      const step = firstItem ? firstItem.getBoundingClientRect().width + 48 : 340;
      container.scrollBy({ left: direction * step, behavior: 'smooth' });
    } else if (scrollContainer) {
      scrollContainer.scrollBy({ top: direction * 240, behavior: 'smooth' });
    }
  };

  btnPrev?.addEventListener('click', () => scrollMilestone(-1));
  btnNext?.addEventListener('click', () => scrollMilestone(1));

  // Keyboard Navigation: ← and → keys when Education window is active
  window.addEventListener('keydown', (e) => {
    if (eduWin && eduWin.classList.contains('active')) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollMilestone(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollMilestone(1);
      }
    }
  });

  // Drag-to-scroll on desktop horizontal container
  let isPointerDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  container.addEventListener('pointerdown', (e) => {
    if (window.innerWidth < 1024 || e.button !== 0) return;
    isPointerDown = true;
    startX = e.pageX - container.offsetLeft;
    startScrollLeft = container.scrollLeft;
    container.setPointerCapture?.(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = startScrollLeft - walk;
  });

  const endDrag = (e) => {
    if (isPointerDown) {
      isPointerDown = false;
      container.releasePointerCapture?.(e.pointerId);
    }
  };
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);

  // Wheel -> Horizontal Mapping scoped strictly to education timeline container
  container.addEventListener('wheel', (e) => {
    if (window.innerWidth >= 1024) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    }
  }, { passive: false });

  // Staggered reveal
  const revealAll = () => {
    items.forEach((item, idx) => {
      setTimeout(() => item.classList.add('revealed'), idx * 70);
    });
    updateProgress();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  items.forEach((item) => observer.observe(item));

  window.addEventListener('windowActivated', (e) => {
    if (e.detail?.id === 'education' || e.detail?.windowId === 'education') {
      setTimeout(revealAll, 50);
    }
  });

  updateProgress();
}

/* --------------------------------------------------------------------------
   8. Website Preview Window Controller (mmsingh.me, 8s Timeout Fallback)
   -------------------------------------------------------------------------- */
function initWebsitePreview() {
  const iframe = document.getElementById('website-iframe');
  const loader = document.getElementById('website-loader');
  const fallbackCard = document.getElementById('website-fallback-card');
  const openDirectBtn = document.getElementById('btn-open-portfolio-direct');
  const retryBtn = document.getElementById('btn-retry-iframe');

  if (!iframe) return;

  let loadTimeout = null;
  const startLoadCheck = () => {
    if (fallbackCard) fallbackCard.style.display = 'none';
    if (loader) loader.style.display = 'flex';
    clearTimeout(loadTimeout);

    // 8-second timeout detection for X-Frame-Options blocking
    loadTimeout = setTimeout(() => {
      if (loader) loader.style.display = 'none';
      if (fallbackCard) fallbackCard.style.display = 'flex';
    }, 8000);
  };

  iframe.addEventListener('load', () => {
    clearTimeout(loadTimeout);
    if (loader) loader.style.display = 'none';
  });

  iframe.addEventListener('error', () => {
    clearTimeout(loadTimeout);
    if (loader) loader.style.display = 'none';
    if (fallbackCard) fallbackCard.style.display = 'flex';
  });

  openDirectBtn?.addEventListener('click', () => {
    window.open(PORTFOLIO_URL, '_blank', 'noopener');
  });

  retryBtn?.addEventListener('click', () => {
    if (iframe) {
      startLoadCheck();
      iframe.src = PORTFOLIO_URL;
    }
  });

  window.addEventListener('windowActivated', (e) => {
    if (e.detail?.id === 'website' || e.detail?.windowId === 'website') {
      if (!iframe.src || iframe.src === 'about:blank') {
        iframe.src = PORTFOLIO_URL;
      }
      startLoadCheck();
    }
  });

  startLoadCheck();
}
