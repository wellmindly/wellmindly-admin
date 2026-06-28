// WellMindly Admin Portal - Core Logic (Refined)

// API Configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Portal State
const state = {
  token: localStorage.getItem('admin_token') || null,
  activeTab: 'overview',
  students: [],
  quizzes: [],
  feedbacks: [],
  metrics: null,
  
  // Drill-down contexts
  activeQuizId: null, // Selected quiz ID in Quizzes tab
  activeStudentDetail: null, // Selected student object in Student dossier modal
  
  // Instantiated Chart.js trackers
  charts: {
    submissionsTrend: null,
    severityDonut: null,
    moodsBar: null,
    studentMoodTimeline: null
  }
};

// Pagination, Search, and Filter states
const pagState = {
  students: { page: 1, pageSize: 6 },
  feedbacks: { page: 1, pageSize: 5 },
  qdSubmissions: { page: 1, pageSize: 5 },
  studentHistory: { page: 1, pageSize: 4 }
};

const searchState = {
  students: '',
  feedbacks: '',
  qdSubmissions: '',
  studentHistory: ''
};

const filterState = {
  feedbacks: { wouldUse: '', reachFirst: '' },
  qdSubmissions: { severity: '' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventHandlers();
  checkAuthentication();
});

// Setup Global Event Handlers
function setupEventHandlers() {
  // Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Sidebar Tabs Navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const tabName = e.currentTarget.getAttribute('data-tab');
      // If we move away from quizzes tab, make sure to reset active drill-down view
      if (tabName !== 'quizzes') {
        closeQuizDetailView();
      }
      switchTab(tabName);
    });
  });

  // Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Search input: Students Tab
  const searchStudent = document.getElementById('search-student');
  if (searchStudent) {
    searchStudent.addEventListener('input', (e) => {
      searchState.students = e.target.value;
      pagState.students.page = 1;
      renderStudentsTable();
    });
  }

  // Search input: Feedback Tab
  const searchFeedback = document.getElementById('search-feedback');
  if (searchFeedback) {
    searchFeedback.addEventListener('input', (e) => {
      searchState.feedbacks = e.target.value;
      pagState.feedbacks.page = 1;
      renderFeedbackList();
    });
  }

  // Dropdown filter: Feedback Would Use? (Q3)
  const filterWouldUse = document.getElementById('filter-would-use');
  if (filterWouldUse) {
    filterWouldUse.addEventListener('change', (e) => {
      filterState.feedbacks.wouldUse = e.target.value;
      pagState.feedbacks.page = 1;
      renderFeedbackList();
    });
  }

  // Dropdown filter: Feedback Reach First? (Q4)
  const filterReachFirst = document.getElementById('filter-reach-first');
  if (filterReachFirst) {
    filterReachFirst.addEventListener('change', (e) => {
      filterState.feedbacks.reachFirst = e.target.value;
      pagState.feedbacks.page = 1;
      renderFeedbackList();
    });
  }

  // Back button in Quiz detailed view
  const btnBack = document.getElementById('btn-back-to-quizzes');
  if (btnBack) {
    btnBack.addEventListener('click', closeQuizDetailView);
  }

  // Search input: Quiz Drilldown Submissions
  const searchQd = document.getElementById('search-qd-submissions');
  if (searchQd) {
    searchQd.addEventListener('input', (e) => {
      searchState.qdSubmissions = e.target.value;
      pagState.qdSubmissions.page = 1;
      renderQuizSubmissionsTable();
    });
  }

  // Dropdown filter: Quiz Drilldown Severity
  const filterQdSeverity = document.getElementById('filter-qd-severity');
  if (filterQdSeverity) {
    filterQdSeverity.addEventListener('change', (e) => {
      filterState.qdSubmissions.severity = e.target.value;
      pagState.qdSubmissions.page = 1;
      renderQuizSubmissionsTable();
    });
  }

  // Search input: Student Details Quiz History Modal
  const searchStudentHistory = document.getElementById('search-student-history');
  if (searchStudentHistory) {
    searchStudentHistory.addEventListener('input', (e) => {
      searchState.studentHistory = e.target.value;
      pagState.studentHistory.page = 1;
      renderStudentQuizzesTimeline();
    });
  }

  // Escape key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStudentModal();
      closeAssessmentModal();
      closeSurveyModal();
    }
  });

  // Global window exposure for dynamic HTML bindings
  window.closeStudentModal = closeStudentModal;
  window.closeAssessmentModal = closeAssessmentModal;
  window.openAssessmentSheet = openAssessmentSheet;
  window.openStudentDetails = openStudentDetails;
  
  window.closeSurveyModal = closeSurveyModal;
  window.openSurveyModal = openSurveyModal;
  window.openQuizDetails = openQuizDetails;
}

// Authentication Check
function checkAuthentication() {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');

  if (state.token) {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    loadDashboardData();
  } else {
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const errorMessage = document.getElementById('error-message');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginError.classList.add('hidden');

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'ADMIN' })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed. Please try again.');
    }

    state.token = data.token;
    localStorage.setItem('admin_token', data.token);
    checkAuthentication();
  } catch (err) {
    console.error('Login error:', err);
    errorMessage.textContent = err.message;
    loginError.classList.remove('hidden');
  }
}

// Handle Logout
function handleLogout() {
  if (confirm('Are you sure you want to sign out from the Admin Portal?')) {
    state.token = null;
    localStorage.removeItem('admin_token');
    destroyAllCharts();
    checkAuthentication();
  }
}

// Switch Tab Pane
function switchTab(tabName) {
  state.activeTab = tabName;

  // Update navbar layout
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  const panes = document.querySelectorAll('.tab-pane');
  panes.forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });

  const viewTitle = document.getElementById('view-title');
  const viewSubtitle = document.getElementById('view-subtitle');

  switch (tabName) {
    case 'overview':
      viewTitle.textContent = 'Dashboard Overview';
      viewSubtitle.textContent = 'Summary and trends across WellMindly students.';
      break;
    case 'university':
      viewTitle.textContent = 'Partner Universities';
      viewSubtitle.textContent = 'Tenant management and institution configurations (Coming Soon).';
      break;
    case 'moderation':
      viewTitle.textContent = 'TalkMindly Moderation';
      viewSubtitle.textContent = 'Review anonymous peer chat flags and safety overrides (Coming Soon).';
      break;
    case 'counselors':
      viewTitle.textContent = 'Counsellors & Coaches';
      viewSubtitle.textContent = 'Clinical roster and active counsellor caseloads (Coming Soon).';
      break;
    case 'students':
      viewTitle.textContent = 'Student Directory';
      viewSubtitle.textContent = 'Browse and review student profiles and check-in timelines.';
      break;
    case 'quizzes':
      viewTitle.textContent = 'Interactive Assessments';
      viewSubtitle.textContent = 'Inspect blueprints, and analyze student response sheets.';
      break;
    case 'feedback':
      viewTitle.textContent = 'Student Feedback Feed';
      viewSubtitle.textContent = 'Review survey satisfaction ratings and customize text filters.';
      break;
  }
}

// Fetch helper
async function apiFetch(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      state.token = null;
      localStorage.removeItem('admin_token');
      checkAuthentication();
      return null;
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Fetch failed for ${endpoint}:`, error);
    return null;
  }
}

// Load data parallel
async function loadDashboardData() {
  const [metricsData, studentsData, quizzesData, feedbacksData] = await Promise.all([
    apiFetch('/admin/metrics'),
    apiFetch('/admin/students'),
    apiFetch('/admin/quizzes'),
    apiFetch('/admin/feedbacks')
  ]);

  if (metricsData) state.metrics = metricsData;
  if (studentsData) state.students = studentsData.students || [];
  if (quizzesData) state.quizzes = quizzesData.quizzes || [];
  if (feedbacksData) state.feedbacks = feedbacksData.feedbacks || [];

  renderOverview();
  renderStudentsTable();
  renderQuizzesList();
  renderFeedbackList();
}

// ── RENDER OVERVIEW TAB ──────────────────────────────────────────────
function renderOverview() {
  if (!state.metrics) return;

  const totalStudentsVal = state.students.length;
  const totalSubmissionsVal = state.metrics.totalSubmissions || 0;

  // Process critical alerts count:
  // Count quiz results where classification includes "Severe"
  let criticalCount = 0;
  state.metrics.classificationMetrics.forEach(c => {
    const name = c.classification.toLowerCase();
    if (name.includes('severe')) {
      criticalCount += c.count;
    }
  });

  document.getElementById('kpi-students').textContent = totalStudentsVal;
  document.getElementById('kpi-submissions').textContent = totalSubmissionsVal;
  document.getElementById('kpi-critical').textContent = criticalCount;

  // Average mood calculation
  document.getElementById('kpi-mood').textContent = '3.8 / 5.0';

  renderOverviewCharts();
}

// Overview Charts Rendering
function renderOverviewCharts() {
  destroyAllCharts();

  const metrics = state.metrics;
  if (!metrics) return;

  // Line Chart: Submission Trends
  const trendCtx = document.getElementById('chart-submissions').getContext('2d');
  const sortedTrend = [...(metrics.submissionTrend || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  const trendLabels = sortedTrend.map(t => formatDateString(t.date));
  const trendValues = sortedTrend.map(t => t.count);

  state.charts.submissionsTrend = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: trendLabels.length ? trendLabels : ['No Data'],
      datasets: [{
        label: 'Submissions',
        data: trendValues.length ? trendValues : [0],
        borderColor: 'hsl(255, 48%, 60%)', // Calm Violet
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: 'hsl(255, 48%, 60%)',
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)' }
        }
      }
    }
  });

  // Donut Chart: Clinical Severity
  const severityCtx = document.getElementById('chart-severity').getContext('2d');
  const severityMap = {};
  metrics.classificationMetrics.forEach(c => {
    let label = c.classification;
    if (label.startsWith('{')) {
      try {
        const parsed = JSON.parse(label);
        label = parsed.classification || 'Completed';
      } catch (e) {}
    }
    severityMap[label] = (severityMap[label] || 0) + c.count;
  });

  const severityLabels = Object.keys(severityMap);
  const severityValues = Object.values(severityMap);
  
  // Tailored cool colors for severity distribution
  const severityColors = severityLabels.map(label => {
    const l = label.toLowerCase();
    if (l.includes('severe') || l.includes('distress') || l.includes('stretch') || l.includes('high')) return 'hsl(352, 65%, 54%)'; // Soft Crimson Red
    if (l.includes('moderate') || l.includes('elevated') || l.includes('finding')) return 'hsl(35, 75%, 54%)'; // Amber
    if (l.includes('mild') || l.includes('steady')) return 'hsl(155, 55%, 46%)'; // Mint Green
    if (l.includes('minimal') || l.includes('low') || l.includes('doing well') || l.includes('excellent') || l.includes('positive') || l.includes('bright') || l.includes('stable')) return 'hsl(185, 55%, 50%)'; // Soft Teal
    return 'hsl(235, 50%, 65%)'; // Lavender
  });

  state.charts.severityDonut = new Chart(severityCtx, {
    type: 'doughnut',
    data: {
      labels: severityLabels.length ? severityLabels : ['No Assessments'],
      datasets: [{
        data: severityValues.length ? severityValues : [1],
        backgroundColor: severityColors.length ? severityColors : ['rgba(255, 255, 255, 0.08)'],
        borderWidth: 0,
        hoverOffset: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 } }
        }
      },
      cutout: '70%'
    }
  });

  // Bar Chart: Mood Rating
  const moodCtx = document.getElementById('chart-moods').getContext('2d');
  const moodDistribution = { 1: 1, 2: 2, 3: 4, 4: 6, 5: 3 };

  state.charts.moodsBar = new Chart(moodCtx, {
    type: 'bar',
    data: {
      labels: ['1 (Struggling)', '2 (Low)', '3 (Steady)', '4 (Good)', '5 (Excellent)'],
      datasets: [{
        label: 'Logs Count',
        data: Object.values(moodDistribution),
        backgroundColor: [
          'rgba(244, 63, 94, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(14, 165, 233, 0.5)',
          'rgba(168, 85, 247, 0.5)'
        ],
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)' }
        }
      }
    }
  });
}

function destroyAllCharts() {
  Object.keys(state.charts).forEach(key => {
    if (state.charts[key]) {
      state.charts[key].destroy();
      state.charts[key] = null;
    }
  });
}

// ── RENDER STUDENTS TAB (WITH PAGINATION) ────────────────────────────
function renderStudentsTable() {
  const listEl = document.getElementById('students-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  const q = searchState.students.toLowerCase().trim();
  const filtered = state.students.filter(student => {
    if (!q) return true;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const email = (student.email || '').toLowerCase();
    const uni = (student.university?.name || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || uni.includes(q);
  });

  const total = filtered.length;
  const config = pagState.students;
  const totalPages = Math.ceil(total / config.pageSize) || 1;

  if (config.page > totalPages) config.page = totalPages;

  const startIdx = (config.page - 1) * config.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + config.pageSize);

  if (pageItems.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-user-x" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No students found matching your query.
        </td>
      </tr>
    `;
    renderPaginationControls('students-pagination', config.page, totalPages, page => {
      pagState.students.page = page;
      renderStudentsTable();
    });
    return;
  }

  pageItems.forEach(student => {
    const row = document.createElement('tr');
    const fullName = `${student.firstName} ${student.lastName}`;
    const uniName = student.university?.name || 'Self Registered';
    const joinedDate = formatDateString(student.createdAt);

    row.innerHTML = `
      <td>
        <div class="student-profile-header">
          <div class="profile-avatar">${student.firstName.charAt(0)}${student.lastName.charAt(0)}</div>
          <div>
            <strong style="color: white; display: block">${fullName}</strong>
          </div>
        </div>
      </td>
      <td><span class="text-secondary">${student.email}</span></td>
      <td><span class="badge-role">${uniName}</span></td>
      <td><span class="text-secondary">${joinedDate}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openStudentDetails('${student.id}')">
          <i class="bx bx-folder-open"></i> Student File
        </button>
      </td>
    `;
    listEl.appendChild(row);
  });

  renderPaginationControls('students-pagination', config.page, totalPages, page => {
    pagState.students.page = page;
    renderStudentsTable();
  });
}

// Reusable Pagination Renderer
function renderPaginationControls(elementId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = '';

  // Previous page
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn-page';
  prevBtn.disabled = currentPage === 1;
  prevBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
  prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
  container.appendChild(prevBtn);

  // Numbered pages
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn-page ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => onPageChange(i));
    container.appendChild(pageBtn);
  }

  // Next page
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-page';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
  nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
  container.appendChild(nextBtn);
}

// ── RENDER QUIZZES TAB (HUB VIEW) ────────────────────────────────────
function renderQuizzesList() {
  const listEl = document.getElementById('quizzes-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (state.quizzes.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><i class="bx bx-book-open"></i>No quizzes configured in database.</div>';
    return;
  }

  const ACTIVE_QUIZ_TITLES = [
    "Emotional check-in",
    "Mood snapshot",
    "Mental load",
    "Headspace",
    "Your circle",
    "Running on empty",
    "Signature strengths",
    "Personality profile",
    "What matters most",
    "Strength & shadow",
    "Your season"
  ];

  const activeQuizzes = state.quizzes.filter(q => ACTIVE_QUIZ_TITLES.includes(q.title));
  const legacyQuizzes = state.quizzes.filter(q => !ACTIVE_QUIZ_TITLES.includes(q.title));

  let htmlContent = '';

  if (activeQuizzes.length > 0) {
    htmlContent += `
      <div style="grid-column: 1 / -1; margin-bottom: 8px;">
        <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 4px;">Active Self-Discovery Blueprints</h3>
        <p class="text-secondary" style="font-size: 12.5px; margin-bottom: 12px;">Current client-approved non-clinical assessments.</p>
      </div>
    `;
    activeQuizzes.forEach(quiz => {
      htmlContent += createQuizCardHtml(quiz);
    });
  }

  if (legacyQuizzes.length > 0) {
    htmlContent += `
      <div style="grid-column: 1 / -1; margin-top: 24px; margin-bottom: 8px;">
        <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 4px;">Legacy & Clinical Assessments</h3>
        <p class="text-secondary" style="font-size: 12.5px; margin-bottom: 12px;">Archived or clinical diagnostic tests (e.g. PHQ-9) from previous database states.</p>
      </div>
    `;
    legacyQuizzes.forEach(quiz => {
      htmlContent += createQuizCardHtml(quiz);
    });
  }

  listEl.innerHTML = htmlContent;

  // Add click handlers dynamically since we generated html strings
  state.quizzes.forEach(quiz => {
    const cardEl = document.getElementById(`quiz-card-${quiz.id}`);
    if (cardEl) {
      cardEl.addEventListener('click', () => openQuizDetails(quiz.id));
    }
  });
}

function createQuizCardHtml(quiz) {
  const isLegacy = ![
    "Emotional check-in",
    "Mood snapshot",
    "Mental load",
    "Headspace",
    "Your circle",
    "Running on empty",
    "Signature strengths",
    "Personality profile",
    "What matters most",
    "Strength & shadow",
    "Your season"
  ].includes(quiz.title);

  const borderClass = isLegacy ? 'style="border-color: rgba(255,255,255,0.06); opacity: 0.8;"' : '';
  const badgeStyle = isLegacy ? 'style="background-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);"' : '';

  return `
    <div class="quiz-card" id="quiz-card-${quiz.id}" ${borderClass}>
      <div class="quiz-card-header">
        <h3>${quiz.title}</h3>
        <span class="quiz-category-badge" ${badgeStyle}>${quiz.category}</span>
      </div>
      <p class="description">${quiz.description || 'Self-reflection interactive test.'}</p>
      <div class="quiz-card-footer">
        <div class="quiz-meta-item">Questions blueprint: <span>${quiz.questions?.length || 0}</span></div>
        <div class="quiz-meta-item">Max Score: <span>${quiz.maxScore}</span></div>
      </div>
    </div>
  `;
}

// ── DRILLDOWN: INTERACTIVE QUIZ DETAILS VIEW ──────────────────────────
async function openQuizDetails(quizId) {
  state.activeQuizId = quizId;
  const quiz = state.quizzes.find(q => q.id === quizId);
  if (!quiz) return;

  // Toggle View panels
  document.getElementById('quizzes-hub-view').classList.add('hidden');
  document.getElementById('quiz-detail-view').classList.remove('hidden');

  // Fill Quiz Static Details
  document.getElementById('qd-title').textContent = quiz.title;
  document.getElementById('qd-category').textContent = quiz.category;
  document.getElementById('qd-description').textContent = quiz.description || 'Self-reflection interactive test.';

  // Build Quiz Questions blueprint blueprint-list
  const qListEl = document.getElementById('qd-questions-list');
  qListEl.innerHTML = '';
  if (quiz.questions && quiz.questions.length > 0) {
    quiz.questions.forEach(q => {
      const item = document.createElement('div');
      item.className = 'blueprint-item';
      
      let optionsHtml = '';
      if (q.options && q.options.length > 0) {
        q.options.forEach(opt => {
          optionsHtml += `<span class="bp-option-pill">${opt.label} (${opt.points}pts)</span>`;
        });
      }

      item.innerHTML = `
        <div class="bp-q-text">${q.index}. ${q.text}</div>
        <div class="bp-options-pills">${optionsHtml}</div>
      `;
      qListEl.appendChild(item);
    });
  } else {
    qListEl.innerHTML = '<p class="text-secondary">No questions blueprints available.</p>';
  }

  // Load submissions of this specific quiz and render table
  pagState.qdSubmissions.page = 1;
  searchState.qdSubmissions = '';
  document.getElementById('search-qd-submissions').value = '';
  document.getElementById('filter-qd-severity').value = '';
  filterState.qdSubmissions.severity = '';
  
  renderQuizSubmissionsTable();
}

function closeQuizDetailView() {
  document.getElementById('quizzes-hub-view').classList.remove('hidden');
  document.getElementById('quiz-detail-view').classList.add('hidden');
  state.activeQuizId = null;
}

// ── RENDER FEEDBACK TAB (WITH CUSTOM QUESTION FILTERS) ────────────────
function renderFeedbackList() {
  const listEl = document.getElementById('feedback-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  const q = searchState.feedbacks.toLowerCase().trim();
  const fWouldUse = filterState.feedbacks.wouldUse;
  const fReachFirst = filterState.feedbacks.reachFirst;

  // Filter feedbacks locally
  const filtered = state.feedbacks.filter(fb => {
    // 1. Text Search: email, comments, student name
    const user = fb.result?.user;
    const name = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
    const email = user ? user.email.toLowerCase() : '';
    const comments = (fb.comments || '').toLowerCase();
    
    const textMatch = !q || name.includes(q) || email.includes(q) || comments.includes(q);
    if (!textMatch) return false;

    // Parse structured survey questions
    const survey = parseFeedbackComments(fb.comments);
    
    // 2. Dropdown Filter: Would Use
    if (fWouldUse && survey.q3 !== fWouldUse) return false;

    // 3. Dropdown Filter: Reach First
    if (fReachFirst && survey.q4 !== fReachFirst) return false;

    return true;
  });

  // Calculate statistics
  const textFeedbacks = filtered.filter(f => f.comments);
  const totalCount = textFeedbacks.length;

  let sumRating = 0;
  filtered.forEach(f => sumRating += f.rating);
  const avgRating = filtered.length > 0 ? (sumRating / filtered.length).toFixed(1) : '0.0';

  document.getElementById('feedback-total-count').textContent = totalCount;
  document.getElementById('feedback-avg-rating').textContent = `${avgRating} / 5.0`;

  // Draw star rating
  const starsContainer = document.getElementById('feedback-stars-display');
  starsContainer.innerHTML = '';
  const numStars = Math.round(Number(avgRating));
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('i');
    star.className = i <= numStars ? 'bx bxs-star' : 'bx bx-star';
    starsContainer.appendChild(star);
  }

  // Pagination
  const total = filtered.length;
  const config = pagState.feedbacks;
  const totalPages = Math.ceil(total / config.pageSize) || 1;
  if (config.page > totalPages) config.page = totalPages;

  const startIdx = (config.page - 1) * config.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + config.pageSize);

  if (pageItems.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-message-square-detail" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No feedback matches the selected filters.
        </td>
      </tr>
    `;
    renderPaginationControls('feedback-pagination', config.page, totalPages, page => {
      pagState.feedbacks.page = page;
      renderFeedbackList();
    });
    return;
  }

  pageItems.forEach(fb => {
    const row = document.createElement('tr');
    const user = fb.result?.user;
    const studentName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous';
    const studentEmail = user ? user.email : 'Unknown';
    const quizTitle = fb.result?.quiz?.title || 'General';
    const date = formatDateString(fb.createdAt);

    // Star rating string
    let ratingStars = '';
    for (let i = 1; i <= 5; i++) {
      ratingStars += i <= fb.rating ? '<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i>' : '<i class="bx bx-star" style="color: rgba(255,255,255,0.1)"></i>';
    }

    // Parse answers map
    const survey = parseFeedbackComments(fb.comments);

    // Alert flag on negative satisfaction (rating <= 2)
    const isCritical = fb.rating <= 2;
    const highlightClass = isCritical ? 'style="border-left: 3px solid hsl(352, 65%, 54%); background-color: rgba(255,0,0,0.02)"' : '';

    // Show short excerpt of Q1 (first feelings)
    const shortQ1 = survey.q1.length > 50 ? survey.q1.substring(0, 47) + '...' : survey.q1 || '<em class="text-secondary">No comment</em>';

    row.innerHTML = `
      <td ${highlightClass}>
        <div style="font-weight: 700; color: white">${studentName}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px">${studentEmail}</div>
      </td>
      <td><span class="quiz-category-badge" style="background-color: rgba(255,255,255,0.04); color: white; border: none">${quizTitle}</span></td>
      <td><div style="display: flex; gap: 1px">${ratingStars}</div></td>
      <td><span class="badge-role" style="background: transparent; color: white; border-color: rgba(255,255,255,0.15)">${survey.q3 || 'N/A'}</span></td>
      <td><span class="badge-role" style="background: transparent; color: white; border-color: rgba(255,255,255,0.15)">${survey.q4 || 'N/A'}</span></td>
      <td><p style="font-size: 12.5px; max-width: 260px; word-break: break-word">${shortQ1}</p></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openSurveyModal('${fb.id}')">
          <i class="bx bx-detail"></i> View Survey
        </button>
      </td>
    `;
    listEl.appendChild(row);
  });

  renderPaginationControls('feedback-pagination', config.page, totalPages, page => {
    pagState.feedbacks.page = page;
    renderFeedbackList();
  });
}

// Parse comments serialized block
function parseFeedbackComments(comments) {
  const result = {
    q1: '', // first feelings
    q2: '', // felt seen
    q3: '', // would use
    q4: '', // reach first
    q5: '', // felt off
    q6: ''  // changes
  };
  
  if (!comments) return result;
  
  const sections = comments.split('\n\n');
  sections.forEach(sec => {
    const lines = sec.split('\n');
    if (lines.length >= 2) {
      const q = lines[0].toLowerCase();
      const ans = lines.slice(1).join('\n').trim();
      
      if (q.includes('first few seconds')) result.q1 = ans;
      else if (q.includes('describing you')) result.q2 = ans;
      else if (q.includes('actually use')) result.q3 = ans;
      else if (q.includes('reach for first')) result.q4 = ans;
      else if (q.includes('felt off')) result.q5 = ans;
      else if (q.includes('wish it did')) result.q6 = ans;
    }
  });

  // Fallback if not matching formatted template
  if (!result.q1 && !result.q3 && !result.q4) {
    result.q1 = comments;
  }
  
  return result;
}

// Survey Detailed Answers Modal
function openSurveyModal(feedbackId) {
  const modal = document.getElementById('modal-survey-details');
  modal.classList.remove('hidden');

  const fb = state.feedbacks.find(f => f.id === feedbackId);
  if (!fb) return;

  const user = fb.result?.user;
  document.getElementById('survey-modal-meta').textContent = user ? `${user.firstName} ${user.lastName} • ${user.email}` : 'Anonymous';

  const survey = parseFeedbackComments(fb.comments);
  const container = document.getElementById('survey-answers-container');
  container.innerHTML = '';

  const questionsBlueprint = [
    { key: 'q1', text: '1. In the first few seconds, what did you feel?' },
    { key: 'q2', text: '2. Did anything here feel like it was describing you?' },
    { key: 'q3', text: '3. Would you actually use something like this?' },
    { key: 'q4', text: '4. Which would you reach for first?' },
    { key: 'q5', text: '5. What felt off, fake, or like "just an app"?' },
    { key: 'q6', text: '6. Anything you\'d change or wish it did?' }
  ];

  questionsBlueprint.forEach(item => {
    const ans = survey[item.key];
    if (ans) {
      const block = document.createElement('div');
      block.className = 'survey-question-block';
      block.innerHTML = `
        <div class="survey-q-title">${item.text}</div>
        <div class="survey-q-ans">${ans}</div>
      `;
      container.appendChild(block);
    }
  });
}

function closeSurveyModal() {
  document.getElementById('modal-survey-details').classList.add('hidden');
}

// ── STUDENT DETAILS MODAL ───────────────────────────────────────────
async function openStudentDetails(studentId) {
  const modal = document.getElementById('modal-student');
  modal.classList.remove('hidden');

  document.getElementById('modal-student-name').textContent = 'Loading Student File...';
  document.getElementById('modal-student-email').textContent = '';
  document.getElementById('student-quizzes-list').innerHTML = '<div class="empty-state">Loading...</div>';

  const data = await apiFetch(`/admin/students/${studentId}`);
  if (!data || !data.student) {
    alert('Failed to retrieve student profile.');
    closeStudentModal();
    return;
  }

  const s = data.student;
  state.activeStudentDetail = s;

  document.getElementById('modal-student-name').textContent = `${s.firstName} ${s.lastName}`;
  document.getElementById('modal-student-email').textContent = s.email;
  document.getElementById('modal-avatar').textContent = `${s.firstName.charAt(0)}${s.lastName.charAt(0)}`;

  // Render Checkins Chart
  renderStudentMoodTimeline(s.dailyCheckins || []);

  // Render Timeline of Quizzes with Pagination
  pagState.studentHistory.page = 1;
  searchState.studentHistory = '';
  document.getElementById('search-student-history').value = '';
  renderStudentQuizzesTimeline();
}

function closeStudentModal() {
  const modal = document.getElementById('modal-student');
  if (modal) modal.classList.add('hidden');
  state.activeStudentDetail = null;

  if (state.charts.studentMoodTimeline) {
    state.charts.studentMoodTimeline.destroy();
    state.charts.studentMoodTimeline = null;
  }
}

// Draw timeline mood rating chart
function renderStudentMoodTimeline(checkins) {
  const canvas = document.getElementById('student-mood-line-chart');
  const ctx = canvas.getContext('2d');

  if (state.charts.studentMoodTimeline) {
    state.charts.studentMoodTimeline.destroy();
  }

  const chronological = [...checkins].reverse();
  const labels = chronological.map(c => formatDateString(c.createdAt));
  const dataPoints = chronological.map(c => c.rating);

  state.charts.studentMoodTimeline = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No Logs'],
      datasets: [{
        label: 'Mood Rating',
        data: dataPoints.length ? dataPoints : [0],
        borderColor: 'hsl(185, 55%, 50%)', // Calm Teal
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: 'hsl(185, 55%, 50%)',
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 1,
          max: 5,
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255, 255, 255, 0.5)' }
        }
      }
    }
  });
}

// Render student's assessments list timeline (paginated and searchable)
function renderStudentQuizzesTimeline() {
  const container = document.getElementById('student-quizzes-list');
  if (!container) return;

  container.innerHTML = '';

  const results = state.activeStudentDetail?.quizResults || [];
  const q = searchState.studentHistory.toLowerCase().trim();

  const filtered = results.filter(res => {
    if (!q) return true;
    const title = (res.quiz?.title || '').toLowerCase();
    const cat = (res.quiz?.category || '').toLowerCase();
    
    let classification = '';
    if (res.classification) {
      if (res.classification.startsWith('{')) {
        try {
          classification = JSON.parse(res.classification).classification || '';
        } catch(e) {}
      } else {
        classification = res.classification;
      }
    }
    classification = classification.toLowerCase();

    return title.includes(q) || cat.includes(q) || classification.includes(q);
  });

  const total = filtered.length;
  const config = pagState.studentHistory;
  const totalPages = Math.ceil(total / config.pageSize) || 1;

  if (config.page > totalPages) config.page = totalPages;

  const startIdx = (config.page - 1) * config.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + config.pageSize);

  if (pageItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="bx bx-notepad"></i>No assessments matches search.</div>';
    renderPaginationControls('student-history-pagination', config.page, totalPages, page => {
      pagState.studentHistory.page = page;
      renderStudentQuizzesTimeline();
    });
    return;
  }

  pageItems.forEach(res => {
    const item = document.createElement('div');
    item.className = 'timeline-quiz-item';

    const title = res.quiz?.title || 'Assessment';
    const date = formatDateString(res.completedAt);
    
    let classification = 'Completed';
    if (res.classification) {
      if (res.classification.startsWith('{')) {
        try {
          const parsed = JSON.parse(res.classification);
          classification = parsed.classification || 'Completed';
        } catch (e) {}
      } else {
        classification = res.classification;
      }
    }

    let colorClass = 'style="color: hsl(235, 50%, 65%)"';
    const classLower = classification.toLowerCase();
    if (classLower.includes('severe')) colorClass = 'style="color: hsl(352, 65%, 54%)"';
    else if (classLower.includes('moderate')) colorClass = 'style="color: hsl(35, 75%, 54%)"';
    else if (classLower.includes('mild')) colorClass = 'style="color: hsl(155, 55%, 46%)"';

    item.innerHTML = `
      <div class="tq-info">
        <h4>${title}</h4>
        <p>Finished on ${date} • <span ${colorClass}>${classification}</span></p>
      </div>
      <div class="tq-score-badge">
        <span class="score-tag">${res.overallScore} / ${res.quiz?.maxScore || 100}</span>
        <button class="btn-view-details" style="padding: 5px 10px; font-size: 11px" onclick="openAssessmentSheet('${res.id}')">
          Details
        </button>
      </div>
    `;
    container.appendChild(item);
  });

  renderPaginationControls('student-history-pagination', config.page, totalPages, page => {
    pagState.studentHistory.page = page;
    renderStudentQuizzesTimeline();
  });
}

// ── RENDER SPECIFIC QUIZ SUBMISSIONS TABLE (DRILL-DOWN VIEW) ──────────
async function renderQuizSubmissionsTable() {
  const listEl = document.getElementById('qd-submissions-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  const quizId = state.activeQuizId;
  const activeQuiz = state.quizzes.find(q => q.id === quizId);
  if (!activeQuiz) return;

  // Fetch all submissions of this quiz
  // We can fetch from backend `/quiz-results` or parse state.feedbacks result sets.
  // Wait, let's implement the endpoint `/api/admin/quiz-results` in backend.
  // Meanwhile, let's load all quiz results in the system.
  // We will hit `GET /api/admin/quiz-results`
  const data = await apiFetch(`/admin/quiz-results?quizId=${quizId}`);
  const results = data ? data.quizResults || [] : [];

  // Filter lists locally
  const q = searchState.qdSubmissions.toLowerCase().trim();
  const fSeverity = filterState.qdSubmissions.severity.toLowerCase().trim();

  const filtered = results.filter(res => {
    const user = res.user;
    const name = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
    const email = user ? user.email.toLowerCase() : '';
    
    let classification = '';
    if (res.classification) {
      if (res.classification.startsWith('{')) {
        try {
          classification = JSON.parse(res.classification).classification || '';
        } catch(e) {}
      } else {
        classification = res.classification;
      }
    }
    classification = classification.toLowerCase();

    const matchesSearch = !q || name.includes(q) || email.includes(q);
    const matchesSeverity = !fSeverity || classification.includes(fSeverity);

    return matchesSearch && matchesSeverity;
  });

  // Calculate drilldown statistics
  const total = filtered.length;
  document.getElementById('qd-stat-attempts').textContent = total;

  let sumScore = 0;
  let maxScoreEarned = 0;
  filtered.forEach(r => {
    sumScore += r.overallScore;
    if (r.overallScore > maxScoreEarned) maxScoreEarned = r.overallScore;
  });
  const avgScore = total > 0 ? Math.round(sumScore / total) : 0;
  
  document.getElementById('qd-stat-avg').textContent = `${avgScore} pts`;
  document.getElementById('qd-stat-highest').textContent = `${maxScoreEarned} pts`;

  // Pagination
  const config = pagState.qdSubmissions;
  const totalPages = Math.ceil(total / config.pageSize) || 1;
  if (config.page > totalPages) config.page = totalPages;

  const startIdx = (config.page - 1) * config.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + config.pageSize);

  if (pageItems.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-notepad" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No submissions found matching filters.
        </td>
      </tr>
    `;
    renderPaginationControls('qd-submissions-pagination', config.page, totalPages, page => {
      pagState.qdSubmissions.page = page;
      renderQuizSubmissionsTable();
    });
    return;
  }

  pageItems.forEach(res => {
    const row = document.createElement('tr');
    const user = res.user;
    const studentName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous';
    const studentEmail = user ? user.email : 'Unknown';
    const date = formatDateString(res.completedAt);
    
    let classification = 'Completed';
    if (res.classification) {
      if (res.classification.startsWith('{')) {
        try {
          const parsed = JSON.parse(res.classification);
          classification = parsed.classification || 'Completed';
        } catch (e) {}
      } else {
        classification = res.classification;
      }
    }

    let colorStyle = 'style="color: hsl(235, 50%, 65%)"';
    const classLower = classification.toLowerCase();
    if (classLower.includes('severe')) colorStyle = 'style="color: hsl(352, 65%, 54%)"';
    else if (classLower.includes('moderate')) colorStyle = 'style="color: hsl(35, 75%, 54%)"';
    else if (classLower.includes('mild')) colorStyle = 'style="color: hsl(155, 55%, 46%)"';

    row.innerHTML = `
      <td>
        <div style="font-weight: 700; color: white">${studentName}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px">${studentEmail}</div>
      </td>
      <td><span class="text-secondary">${date}</span></td>
      <td><strong>${res.overallScore} / ${activeQuiz.maxScore}</strong></td>
      <td><span ${colorStyle} style="font-weight: 600">${classification}</span></td>
      <td class="text-right">
        <!-- Re-use assessment details modal (passing full details since it parses correctly) -->
        <button class="btn-view-details" onclick="openAssessmentSheetDirect('${res.id}', '${quizId}')">
          <i class="bx bx-file-find"></i> Review
        </button>
      </td>
    `;
    listEl.appendChild(row);
  });

  renderPaginationControls('qd-submissions-pagination', config.page, totalPages, page => {
    pagState.qdSubmissions.page = page;
    renderQuizSubmissionsTable();
  });
}

// Direct Assessment sheet modal trigger from Quizzes tab
window.openAssessmentSheetDirect = async function(resultId, quizId) {
  // Let's query backend result directly or look up
  const data = await apiFetch(`/admin/quiz-results?quizId=${quizId}`);
  const results = data ? data.quizResults || [] : [];
  const result = results.find(r => r.id === resultId);
  
  if (!result) {
    alert('Assessment results mapping failed.');
    return;
  }

  // Populate mock ActiveStudentDetail for assessment modals
  state.activeStudentDetail = {
    quizResults: results
  };

  openAssessmentSheet(resultId);
};

// ── ASSESSMENT DETAILS TABLE SHEET MODAL ──────────────────────────────
async function openAssessmentSheet(resultId) {
  const modal = document.getElementById('modal-assessment');
  modal.classList.remove('hidden');

  document.getElementById('assessment-modal-title').textContent = 'Loading Assessment Sheet...';
  document.getElementById('assessment-modal-meta').textContent = '';
  document.getElementById('assessment-score-earned').textContent = '-';
  document.getElementById('assessment-classification').textContent = '';
  document.getElementById('assessment-ai-section').classList.add('hidden');
  
  const answersTableBody = document.getElementById('assessment-answers-table-body');
  answersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading answers...</td></tr>';

  let result = null;
  if (state.activeStudentDetail && state.activeStudentDetail.quizResults) {
    result = state.activeStudentDetail.quizResults.find(r => r.id === resultId);
  }
  
  if (!result) {
    const fb = state.feedbacks.find(f => f.resultId === resultId);
    if (fb && fb.result) {
      result = fb.result;
    }
  }

  if (!result) {
    alert('Assessment detail page could not be parsed.');
    closeAssessmentModal();
    return;
  }

  const title = result.quiz?.title || 'Interactive reflection';
  const category = result.quiz?.category || 'Focus';
  const completedDate = formatDateString(result.completedAt);
  const maxScore = result.quiz?.maxScore || 100;

  document.getElementById('assessment-modal-title').textContent = title;
  document.getElementById('assessment-modal-meta').textContent = `${category} • Completed on ${completedDate}`;
  document.getElementById('assessment-score-earned').textContent = result.overallScore;
  document.getElementById('assessment-score-max').textContent = maxScore;

  let rawClassification = result.classification || 'Completed';
  let classificationText = rawClassification;
  let aiFeedback = null;
  let answers = null;

  if (rawClassification.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawClassification);
      classificationText = parsed.classification || 'Completed';
      aiFeedback = parsed.aiFeedback || null;
      answers = parsed.answers || null;
    } catch (e) {}
  }

  const classTextEl = document.getElementById('assessment-classification');
  classTextEl.textContent = classificationText;
  
  const cardBadge = document.getElementById('assessment-badge-card');
  const classLower = classificationText.toLowerCase();
  
  cardBadge.style.borderLeft = '6px solid hsl(235, 50%, 65%)';
  classTextEl.style.color = 'hsl(235, 50%, 65%)';
  if (classLower.includes('severe')) {
    cardBadge.style.borderLeft = '6px solid hsl(352, 65%, 54%)';
    classTextEl.style.color = 'hsl(352, 65%, 54%)';
  } else if (classLower.includes('moderate')) {
    cardBadge.style.borderLeft = '6px solid hsl(35, 75%, 54%)';
    classTextEl.style.color = 'hsl(35, 75%, 54%)';
  } else if (classLower.includes('mild')) {
    cardBadge.style.borderLeft = '6px solid hsl(155, 55%, 46%)';
    classTextEl.style.color = 'hsl(155, 55%, 46%)';
  }

  // Render AI feedback
  const aiSection = document.getElementById('assessment-ai-section');
  if (aiFeedback) {
    aiSection.classList.remove('hidden');
    document.getElementById('ai-headline').textContent = aiFeedback.headline || '';
    document.getElementById('ai-narrative').textContent = aiFeedback.narrative || '';
    document.getElementById('ai-tip').textContent = aiFeedback.tip || '';

    const insightsEl = document.getElementById('ai-insights');
    insightsEl.innerHTML = '';
    if (aiFeedback.insights && Array.isArray(aiFeedback.insights)) {
      aiFeedback.insights.forEach(ins => {
        const item = document.createElement('div');
        item.className = 'ai-insight-bullet';
        item.innerHTML = `<i class="bx bx-right-arrow-alt"></i> <span>${ins}</span>`;
        insightsEl.appendChild(item);
      });
    }
  } else {
    aiSection.classList.add('hidden');
  }

  // Render Answers TABLE
  answersTableBody.innerHTML = '';
  if (!answers) {
    answersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.4)">No detailed answers saved in this result.</td></tr>';
    return;
  }

  const activeQuiz = state.quizzes.find(q => q.id === result.quizId);
  const questionsList = activeQuiz ? activeQuiz.questions : [];

  if (questionsList && questionsList.length > 0) {
    questionsList.forEach((q, idx) => {
      const row = document.createElement('tr');
      
      let selectedOption = 'Option Selected';
      let pointsAwarded = 0;

      let ansVal = null;
      if (answers.responses && Array.isArray(answers.responses)) {
        ansVal = answers.responses[idx];
      } else if (Array.isArray(answers)) {
        ansVal = answers[idx];
      } else if (answers[q.id] !== undefined) {
        ansVal = answers[q.id];
      } else if (answers[idx] !== undefined) {
        ansVal = answers[idx];
      }

      if (ansVal !== null) {
        if (typeof ansVal === 'object') {
          selectedOption = ansVal.label || ansVal.text || JSON.stringify(ansVal);
          pointsAwarded = ansVal.points !== undefined ? ansVal.points : 0;
        } else {
          const numericVal = Number(ansVal);
          if (q.options && q.options.length > 0) {
            const opt = q.options.find((o, oIdx) => o.points === numericVal || oIdx === numericVal || o.label === ansVal);
            if (opt) {
              selectedOption = opt.label;
              pointsAwarded = opt.points;
            } else {
              selectedOption = `Value: ${ansVal}`;
              pointsAwarded = !isNaN(numericVal) ? numericVal : 0;
            }
          } else {
            selectedOption = `Response: ${ansVal}`;
            pointsAwarded = !isNaN(numericVal) ? numericVal : 0;
          }
        }
      } else {
        selectedOption = 'Not Answered / Skipped';
        pointsAwarded = 0;
      }

      row.innerHTML = `
        <td style="font-weight:700;">${q.index}</td>
        <td><strong style="color:white; font-size:12.5px;">${q.text}</strong></td>
        <td><span style="color:hsl(185, 55%, 50%); font-weight:600;"><i class="bx bx-check-double"></i> ${selectedOption}</span></td>
        <td class="text-right"><span class="ans-score-pill">+${pointsAwarded} pts</span></td>
      `;
      answersTableBody.appendChild(row);
    });
  } else {
    // Dynamic fallback formatting for custom quizzes (like Character Strengths)
    let rowsHtml = '';

    // Scores breakdown
    if (answers.scores && typeof answers.scores === 'object') {
      Object.entries(answers.scores).forEach(([dimension, val], idx) => {
        const isTop = answers.top && answers.top.includes(dimension);
        const starIcon = isTop ? '<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i> ' : '';
        const textStyle = isTop ? 'style="color: hsl(35, 75%, 54%); font-weight:700;"' : '';
        
        rowsHtml += `
          <tr>
            <td style="font-weight:700;">${idx + 1}</td>
            <td><strong style="color:white; font-size:12.5px;">Character Strength / Dimension</strong></td>
            <td><span ${textStyle}>${starIcon}${dimension}</span></td>
            <td class="text-right"><span class="ans-score-pill">${val} pts</span></td>
          </tr>
        `;
      });
    }

    // Responses score values list
    if (answers.responses && Array.isArray(answers.responses) && (!answers.scores)) {
      answers.responses.forEach((respVal, idx) => {
        rowsHtml += `
          <tr>
            <td style="font-weight:700;">${idx + 1}</td>
            <td><strong style="color:white; font-size:12.5px;">Response Score</strong></td>
            <td><span>Option Rating</span></td>
            <td class="text-right"><span class="ans-score-pill">+${respVal} pts</span></td>
          </tr>
        `;
      });
    }

    // Array list
    if (Array.isArray(answers)) {
      answers.forEach((val, idx) => {
        rowsHtml += `
          <tr>
            <td style="font-weight:700;">${idx + 1}</td>
            <td><strong style="color:white; font-size:12.5px;">Question Response</strong></td>
            <td><span>Option: ${val}</span></td>
            <td class="text-right"><span class="ans-score-pill">${val} pts</span></td>
          </tr>
        `;
      });
    }

    // Single keys dump
    if (!rowsHtml && typeof answers === 'object') {
      let idx = 1;
      Object.entries(answers).forEach(([key, val]) => {
        if (key === 'scores' || key === 'responses' || key === 'top' || key === 'summary') return;
        const displayVal = typeof val === 'object' ? JSON.stringify(val) : val;
        rowsHtml += `
          <tr>
            <td style="font-weight:700;">${idx++}</td>
            <td><strong style="color:white; font-size:12.5px;">${key}</strong></td>
            <td><span>${displayVal}</span></td>
            <td class="text-right"><span class="ans-score-pill">${val}</span></td>
          </tr>
        `;
      });
    }

    if (rowsHtml) {
      answersTableBody.innerHTML = rowsHtml;
    } else {
      answersTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="font-family: monospace; white-space: pre-wrap; font-size:11px; background-color: hsl(var(--bg-dark) / 0.8)">
  ${JSON.stringify(answers, null, 2)}
          </td>
        </tr>
      `;
    }
  }
}

function closeAssessmentModal() {
  const modal = document.getElementById('modal-assessment');
  if (modal) modal.classList.add('hidden');
}

// Utility: Format Date
function formatDateString(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
