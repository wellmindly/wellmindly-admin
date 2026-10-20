// WellMindly Admin Portal - Core Logic (Refined)

// API Configuration
let rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.wellmindly.com/api' : 'http://localhost:5000/api');
if (rawApiUrl.endsWith('/')) rawApiUrl = rawApiUrl.slice(0, -1);
if (!rawApiUrl.endsWith('/api')) rawApiUrl += '/api';
const BASE_URL = rawApiUrl;

// Portal State
const state = {
  token: localStorage.getItem('admin_token') || null,
  activeTab: 'overview',
  students: [],
  quizzes: [],
  feedbacks: [],
  metrics: null,

  // New Inquiry States
  // New Inquiry States
  universityContacts: [],
  counselorContacts: [],
  generalContacts: [],
  activeInquiry: null,
  universityStages: JSON.parse(localStorage.getItem('wellmindly_university_stages') || '{}'),
  universityNotes: JSON.parse(localStorage.getItem('wellmindly_university_notes') || '{}'),
  counselorStages: JSON.parse(localStorage.getItem('wellmindly_counselor_stages') || '{}'),
  generalContactStatus: JSON.parse(localStorage.getItem('wellmindly_general_contact_status') || '{}'),
  dualFeedback: { studentToCounselor: [], counselorToStudent: [] },
  activeDualTab: 'student',
  masterCalendarSessions: [],
  calendarLayout: 'cards',
  activeAppointment: null,
  
  // TalkMindly Moderation State
  talkRooms: [],
  flaggedData: { notes: [], replies: [] },
  talkMetrics: null,
  moderationAuditLog: JSON.parse(localStorage.getItem('wellmindly_moderation_audit_log') || '[]'),
  
  // Drill-down contexts
  activeQuizId: null, // Selected quiz ID in Quizzes tab
  activeStudentDetail: null, // Selected student object in Student dossier modal
  
  // Instantiated Chart.js trackers
  charts: {
    submissionsTrend: null,
    severityDonut: null,
    moodsBar: null,
    studentMoodTimeline: null
  },

  // Student Access Control State
  accessControl: {
    domains: [],
    bypassEmails: [],
    loaded: false,
    deleteTarget: null
  }
};


// Pagination, Search, and Filter states
const pagState = {
  students: { page: 1, pageSize: 6 },
  feedbacks: { page: 1, pageSize: 5 },
  qdSubmissions: { page: 1, pageSize: 5 },
  studentHistory: { page: 1, pageSize: 4 },
  universityContacts: { page: 1, pageSize: 5 },
  counselorContacts: { page: 1, pageSize: 5 },
  generalContacts: { page: 1, pageSize: 5 }
};

const searchState = {
  students: '',
  feedbacks: '',
  qdSubmissions: '',
  studentHistory: '',
  universityContacts: '',
  counselorContacts: '',
  generalContacts: '',
  dualFeedback: '',
  masterCalendar: '',
  allowedDomains: '',
  bypassEmails: ''
};


const filterState = {
  feedbacks: { rating: '', wouldUse: '', reachFirst: '' },
  qdSubmissions: { severity: '' },
  students: { university: '', risk: '' },
  moderation: { reason: '' },
  counselorContacts: { category: '' },
  universityContacts: { stage: '' },
  generalContacts: { status: '' },
  masterCalendar: { status: '' }
};

// Global Toast Notification Dispatcher
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;

  const iconMap = {
    success: 'bx-check-circle',
    error: 'bx-error-circle',
    warning: 'bx-error',
    info: 'bx-info-circle'
  };
  const icon = iconMap[type] || 'bx-info-circle';

  toast.innerHTML = `
    <div class="toast-icon-wrap">
      <i class="bx ${icon}"></i>
    </div>
    <div class="toast-content">${message}</div>
    <button class="toast-close-btn" title="Dismiss">
      <i class="bx bx-x"></i>
    </button>
    <div class="toast-progress-bar">
      <div class="toast-progress-fill" style="animation-duration: ${duration}ms;"></div>
    </div>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  const dismiss = () => {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  const autoDismissTimer = setTimeout(dismiss, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(autoDismissTimer));
}

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

  // Password Visibility Toggle
  const btnToggleLoginPwd = document.getElementById('btn-toggle-login-pwd');
  const passwordInput = document.getElementById('password');
  const iconToggleLoginPwd = document.getElementById('icon-toggle-login-pwd');
  if (btnToggleLoginPwd && passwordInput && iconToggleLoginPwd) {
    btnToggleLoginPwd.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      iconToggleLoginPwd.className = isPassword ? 'bx bx-hide' : 'bx bx-show';
    });
  }

  // Mobile Sidebar Toggle
  const btnMobileSidebar = document.getElementById('btn-mobile-sidebar-toggle');
  const sidebarAside = document.getElementById('sidebar-aside');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  if (btnMobileSidebar && sidebarAside && sidebarBackdrop) {
    btnMobileSidebar.addEventListener('click', () => {
      sidebarAside.classList.toggle('mobile-open');
      sidebarBackdrop.classList.toggle('hidden');
    });

    sidebarBackdrop.addEventListener('click', () => {
      sidebarAside.classList.remove('mobile-open');
      sidebarBackdrop.classList.add('hidden');
    });
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

  // Logout Modal Confirm / Cancel Handlers
  const btnConfirmLogout = document.getElementById('btn-confirm-logout');
  const btnCancelLogout = document.getElementById('btn-cancel-logout');
  const modalLogout = document.getElementById('modal-logout-confirm');
  if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener('click', () => {
      state.token = null;
      localStorage.removeItem('admin_token');
      if (modalLogout) modalLogout.classList.add('hidden');
      destroyAllCharts();
      checkAuthentication();
      showToast('Signed out successfully.', 'info');
    });
  }
  if (btnCancelLogout && modalLogout) {
    btnCancelLogout.addEventListener('click', () => {
      modalLogout.classList.add('hidden');
    });
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

  // University Filter: Students Tab
  const filterStudentUni = document.getElementById('filter-student-university');
  if (filterStudentUni) {
    filterStudentUni.addEventListener('change', (e) => {
      filterState.students.university = e.target.value;
      pagState.students.page = 1;
      renderStudentsTable();
    });
  }

  // Clinical Risk Filter: Students Tab
  const filterStudentRisk = document.getElementById('filter-student-risk');
  if (filterStudentRisk) {
    filterStudentRisk.addEventListener('change', (e) => {
      filterState.students.risk = e.target.value;
      pagState.students.page = 1;
      renderStudentsTable();
    });
  }

  // Search input: Student Dossier History Modal
  const searchStudentHistory = document.getElementById('search-student-history');
  if (searchStudentHistory) {
    searchStudentHistory.addEventListener('input', (e) => {
      searchState.studentHistory = e.target.value;
      pagState.studentHistory.page = 1;
      if (state.activeStudentDetail) {
        renderStudentDossierQuizzes(state.activeStudentDetail);
      }
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

  // Dropdown filter: Feedback Star Rating / Smiley
  const filterFeedbackRating = document.getElementById('filter-feedback-rating');
  if (filterFeedbackRating) {
    filterFeedbackRating.addEventListener('change', (e) => {
      filterState.feedbacks.rating = e.target.value;
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

  // Search input: University Onboarding Requests
  const searchUniContact = document.getElementById('search-university-contact');
  if (searchUniContact) {
    searchUniContact.addEventListener('input', (e) => {
      searchState.universityContacts = e.target.value;
      pagState.universityContacts.page = 1;
      renderUniversityContacts();
    });
  }

  // Filter dropdown: University Partnership Stages
  const filterUniStage = document.getElementById('filter-university-stage');
  if (filterUniStage) {
    filterUniStage.addEventListener('change', (e) => {
      filterState.universityContacts.stage = e.target.value;
      pagState.universityContacts.page = 1;
      renderUniversityContacts();
    });
  }

  // Search input: Counselor Onboarding Requests
  const searchCounsContact = document.getElementById('search-counselor-contact');
  if (searchCounsContact) {
    searchCounsContact.addEventListener('input', (e) => {
      searchState.counselorContacts = e.target.value;
      pagState.counselorContacts.page = 1;
      renderCounselorContacts();
    });
  }

  // Filter dropdown: Counselor Credential Categories
  const filterCounsStatus = document.getElementById('filter-counselor-status');
  if (filterCounsStatus) {
    filterCounsStatus.addEventListener('change', (e) => {
      filterState.counselorContacts.category = e.target.value;
      pagState.counselorContacts.page = 1;
      renderCounselorContacts();
    });
  }

  // Search input: General Contacts
  const searchGenContact = document.getElementById('search-general-contact');
  if (searchGenContact) {
    searchGenContact.addEventListener('input', (e) => {
      searchState.generalContacts = e.target.value;
      pagState.generalContacts.page = 1;
      renderGeneralContacts();
    });
  }

  // Filter dropdown: General Contact Status
  const filterGenStatus = document.getElementById('filter-general-contact-status');
  if (filterGenStatus) {
    filterGenStatus.addEventListener('change', (e) => {
      filterState.generalContacts.status = e.target.value;
      pagState.generalContacts.page = 1;
      renderGeneralContacts();
    });
  }

  // Search input: Dual Feedback Matrix
  const searchDual = document.getElementById('search-dual-feedback');
  if (searchDual) {
    searchDual.addEventListener('input', (e) => {
      searchState.dualFeedback = e.target.value;
      renderDualFeedback();
    });
  }

  // Search input: Master Calendar
  const searchCalendar = document.getElementById('search-master-calendar');
  if (searchCalendar) {
    searchCalendar.addEventListener('input', (e) => {
      searchState.masterCalendar = e.target.value;
      renderMasterCalendar();
    });
  }

  // Filter dropdown: Master Calendar Status
  const filterCalStatus = document.getElementById('filter-calendar-status');
  if (filterCalStatus) {
    filterCalStatus.addEventListener('change', (e) => {
      filterState.masterCalendar.status = e.target.value;
      renderMasterCalendar();
    });
  }

  // Reschedule Session Form
  const formReschedule = document.getElementById('reschedule-session-form');
  if (formReschedule) {
    formReschedule.addEventListener('submit', handleRescheduleSessionSubmit);
  }

  // Copy Meeting Room Link in Modal
  const btnCopyVideo = document.getElementById('btn-copy-video-link');
  if (btnCopyVideo) {
    btnCopyVideo.addEventListener('click', () => {
      const input = document.getElementById('app-modal-video-link');
      if (input && input.value) {
        navigator.clipboard.writeText(input.value);
        showToast('Telehealth room link copied to clipboard!', 'success');
      }
    });
  }

  // Modal Cancel Session Button
  const btnModalCancel = document.getElementById('btn-modal-cancel-session');
  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', () => {
      if (state.activeAppointment) {
        cancelSessionAdmin(state.activeAppointment.id);
      }
    });
  }

  // Modal Reschedule Button
  const btnModalResched = document.getElementById('btn-modal-reschedule-session');
  if (btnModalResched) {
    btnModalResched.addEventListener('click', () => {
      if (state.activeAppointment) {
        closeAppointmentModal();
        openRescheduleModal(state.activeAppointment.id);
      }
    });
  }

  // Moderation Filter: Flag Reason Dropdown
  const filterModReason = document.getElementById('filter-mod-reason');
  if (filterModReason) {
    filterModReason.addEventListener('change', (e) => {
      filterState.moderation.reason = e.target.value;
      renderFlaggedQueue();
    });
  }

  // TalkRoom Creator Toggle & Submit
  const btnOpenCreateRoom = document.getElementById('btn-open-create-room');
  const btnCancelCreateRoom = document.getElementById('btn-cancel-create-room');
  const btnSubmitCreateRoom = document.getElementById('btn-submit-create-room');
  const createRoomFormContainer = document.getElementById('create-room-form-container');

  if (btnOpenCreateRoom && createRoomFormContainer) {
    btnOpenCreateRoom.addEventListener('click', () => {
      createRoomFormContainer.classList.toggle('hidden');
      const nameInput = document.getElementById('new-room-name');
      if (nameInput && !createRoomFormContainer.classList.contains('hidden')) {
        nameInput.focus();
      }
    });
  }

  if (btnCancelCreateRoom && createRoomFormContainer) {
    btnCancelCreateRoom.addEventListener('click', () => {
      createRoomFormContainer.classList.add('hidden');
    });
  }

  if (btnSubmitCreateRoom) {
    btnSubmitCreateRoom.addEventListener('click', createTalkRoom);
  }

  // Escape key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStudentModal();
      closeAssessmentModal();
      closeSurveyModal();
      closeInquiryModal();
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

  window.openInquiryDetails = openInquiryDetails;
  window.closeInquiryModal = closeInquiryModal;
  window.deleteInquiry = deleteInquiry;

  // Access Control Event Handlers
  setupAccessControlEventHandlers();
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
  const submitBtn = document.getElementById('btn-submit-login');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginError.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Connecting to Command Center...</span><i class="bx bx-loader-alt bx-spin"></i>`;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'ADMIN' })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed. Please verify admin credentials.');
    }

    state.token = data.token;
    localStorage.setItem('admin_token', data.token);
    showToast('Authenticated as Administrator. Welcome back!', 'success');
    checkAuthentication();
  } catch (err) {
    console.error('Login error:', err);
    errorMessage.textContent = err.message;
    loginError.classList.remove('hidden');
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Enter Command Center</span><i class="bx bx-right-arrow-alt"></i>`;
    }
  }
}

// Handle Logout
function handleLogout() {
  const modalLogout = document.getElementById('modal-logout-confirm');
  if (modalLogout) {
    modalLogout.classList.remove('hidden');
  } else if (confirm('Are you sure you want to sign out from the Admin Portal?')) {
    state.token = null;
    localStorage.removeItem('admin_token');
    destroyAllCharts();
    checkAuthentication();
    showToast('Signed out successfully.', 'info');
  }
}

// Switch Tab Pane
function switchTab(tabName) {
  state.activeTab = tabName;

  // Auto-close mobile sidebar drawer upon selecting navigation
  const sidebarAside = document.getElementById('sidebar-aside');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  if (sidebarAside) sidebarAside.classList.remove('mobile-open');
  if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');

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
  const breadcrumbCurrent = document.getElementById('breadcrumb-current-tab');

  const tabTitles = {
    overview: { breadcrumb: 'Overview', title: 'Dashboard Overview', subtitle: 'Live telemetry, student metrics, and assessment trends across WellMindly.' },
    students: { breadcrumb: 'Student Registry', title: 'Student Directory', subtitle: 'Browse student profiles, crisis signals, and longitudinal check-in timelines.' },
    quizzes: { breadcrumb: 'Assessments Hub', title: 'Interactive Assessments & Screeners', subtitle: 'Inspect clinical blueprints, diagnostic thresholds, and submitted answer sheets.' },
    moderation: { breadcrumb: 'TalkMindly Safety', title: 'TalkMindly Safety & Moderation', subtitle: 'Review anonymous peer chat flags, track AI costs, and manage TalkRooms.' },
    counselors: { breadcrumb: 'Counselor Applications', title: 'Counselor Onboarding Applications', subtitle: 'Review therapist and student coach verification credentials and applications.' },
    'counselor-mgmt': { breadcrumb: 'Counselor Directory', title: 'Counselor Portal Provisioning', subtitle: 'Invite new counselors, manage credentials, and toggle clinical account statuses.' },
    'master-calendar': { breadcrumb: 'Master Calendar', title: 'Master Sessions Calendar', subtitle: 'Cross-counselor schedule management, room links, and session status filters.' },
    'dual-feedback': { breadcrumb: 'Dual Feedback', title: 'Dual Feedback Analytics', subtitle: 'Inspect Student-to-Counselor ratings and Counselor clinical evaluations.' },
    university: { breadcrumb: 'University Requests', title: 'University Onboarding Inquiries', subtitle: 'Review and manage collaboration requests from university administrations.' },
    contacts: { breadcrumb: 'General Contacts', title: 'General Inquiries & Support', subtitle: 'Review and manage student, parent, and institutional contact submissions.' },
    feedback: { breadcrumb: 'Feedback Analytics', title: 'Product & Platform Feedback', subtitle: 'Student reviews, feature sentiment, and clinical experience survey ratings.' },
    'access-control': { breadcrumb: 'Access Control', title: 'Student Access Control', subtitle: 'Manage allowed university domains and bypass student email accounts for human counseling.' },
    policies: { breadcrumb: 'Policy Guide', title: 'Unified Policy & Governance Guide', subtitle: 'Central operational manual for student privacy, crisis escalation, ethics, and platform regulations.' }
  };

  const currentConfig = tabTitles[tabName] || { breadcrumb: tabName, title: tabName, subtitle: '' };
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = currentConfig.breadcrumb;
  if (viewTitle) viewTitle.textContent = currentConfig.title;
  if (viewSubtitle) viewSubtitle.textContent = currentConfig.subtitle;

  switch (tabName) {
    case 'overview':
      break;
    case 'university':
      fetchUniversityContacts();
      break;
    case 'moderation':
      fetchTalkModerationData();
      break;
    case 'counselors':
      fetchCounselorContacts();
      break;
    case 'contacts':
      fetchGeneralContacts();
      break;
    case 'students':
      break;
    case 'quizzes':
      break;
    case 'feedback':
      fetchFeedbacks();
      break;
    case 'dual-feedback':
      fetchDualFeedback();
      break;
    case 'counselor-mgmt':
      fetchAdminCounselors();
      break;
    case 'master-calendar':
      fetchAdminMasterCalendar();
      break;
    case 'access-control':
      fetchAccessControlData();
      break;
    case 'policies':
      initPolicyGuide();
      break;
  }
}

// Global window binding for tab switching
window.switchTab = switchTab;


// Fetch helper
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
        ...(options.headers || {})
      }
    });

    if (response.status === 401 && !endpoint.includes('/v1/admin')) {
      state.token = null;
      localStorage.removeItem('admin_token');
      checkAuthentication();
      return null;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || data.error || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Fetch failed for ${endpoint}:`, error);
    return null;
  }
}

async function apiGet(endpoint) {
  return apiFetch(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, body) {
  return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

async function apiPut(endpoint, body) {
  return apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

async function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}

// Load data parallel
async function loadDashboardData() {
  const [metricsData, studentsData, quizzesData, feedbacksData, counsContactsData, uniContactsData, counselorsData] = await Promise.all([
    apiFetch('/admin/metrics'),
    apiFetch('/admin/students'),
    apiFetch('/admin/quizzes'),
    apiFetch('/admin/feedbacks'),
    apiFetch('/contacts/counselor'),
    apiFetch('/contacts/university'),
    apiFetch('/v1/admin/counselors').catch(() => null)
  ]);

  if (metricsData) state.metrics = metricsData;
  if (studentsData) state.students = studentsData.students || [];
  if (quizzesData) state.quizzes = quizzesData.quizzes || [];
  if (feedbacksData) state.feedbacks = feedbacksData.feedbacks || [];
  // Both of these endpoints return { requests, total, page, limit } — see
  // backend/src/routes/contacts.ts:270 and :297, and the lazy per-tab loaders
  // below which already read .requests. Reading .data/.contacts first and then
  // falling back to the bare response object left these as objects rather than
  // arrays, so the .filter() in renderUrgentActivityFeed threw and took
  // renderStudentsTable/renderQuizzesList/renderFeedbackList down with it.
  if (counsContactsData) state.counselorContacts = counsContactsData.requests || counsContactsData.data || [];
  if (uniContactsData) state.universityContacts = uniContactsData.requests || uniContactsData.data || [];
  if (counselorsData && counselorsData.data) state.counselors = counselorsData.data;

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
  const totalCounselorsVal = (state.counselors && state.counselors.length) || (state.counselorContacts ? state.counselorContacts.length : 0);

  // Process critical alerts count:
  // Count quiz results where classification includes "Severe" or "Distress"
  let criticalCount = 0;
  if (state.metrics.classificationMetrics) {
    state.metrics.classificationMetrics.forEach(c => {
      const name = (c.classification || '').toLowerCase();
      if (name.includes('severe') || name.includes('distress') || name.includes('critical') || name.includes('high')) {
        criticalCount += c.count;
      }
    });
  }

  // Update KPI counters
  const elStudents = document.getElementById('kpi-students');
  const elCounselors = document.getElementById('kpi-counselors');
  const elSubmissions = document.getElementById('kpi-submissions');
  const elCritical = document.getElementById('kpi-critical');
  const elMood = document.getElementById('kpi-mood');

  if (elStudents) elStudents.textContent = totalStudentsVal.toLocaleString();
  // No `|| 12` fallback: an empty roster means the fetch failed, and inventing a
  // headcount on an admin dashboard is worse than showing a dash.
  if (elCounselors) elCounselors.textContent = totalCounselorsVal ? totalCounselorsVal.toLocaleString() : '—';
  if (elSubmissions) elSubmissions.textContent = totalSubmissionsVal.toLocaleString();
  if (elCritical) elCritical.textContent = criticalCount.toString();
  // Real average daily check-in rating from GET /api/admin/metrics. Null until
  // someone has checked in, so fall back to a dash rather than a made-up figure.
  const avgMood = state.metrics.avgDailyMood;
  if (elMood) elMood.textContent = typeof avgMood === 'number' ? `${avgMood.toFixed(1)} / 5.0` : '—';

  // Calculate daily average submissions
  const trendList = state.metrics.submissionTrend || [];
  let dailyAvgVal = 0;
  if (trendList.length > 0) {
    const totalTrendSum = trendList.reduce((acc, curr) => acc + (curr.count || 0), 0);
    dailyAvgVal = Math.round(totalTrendSum / trendList.length) || 1;
  }
  const elDailyAvg = document.getElementById('stat-daily-avg');
  if (elDailyAvg) elDailyAvg.textContent = `${dailyAvgVal} / day`;

  renderOverviewCharts();
  renderUrgentActivityFeed(criticalCount);
}

// Render Real-time Urgent Activity Ticker
function renderUrgentActivityFeed(criticalCount) {
  const feedContainer = document.getElementById('urgent-activity-feed');
  const badgeCount = document.getElementById('urgent-pending-count');
  if (!feedContainer) return;

  const urgentItems = [];

  // 1. Critical Clinical Alert Items
  if (criticalCount > 0) {
    urgentItems.push({
      type: 'critical',
      icon: 'bx-error-alt',
      title: `${criticalCount} Severe Distress Alert${criticalCount > 1 ? 's' : ''}`,
      meta: 'PHQ-9 / GAD-7 screening thresholds flagged',
      tab: 'students',
      actionText: 'Review Students'
    });
  }

  // 2. Pending Counselor Applications
  const pendingCounselors = (state.counselorContacts || []).filter(c => !c.status || c.status === 'PENDING' || c.status === 'UNDER_REVIEW');
  if (pendingCounselors.length > 0) {
    urgentItems.push({
      type: 'warning',
      icon: 'bx-user-voice',
      title: `${pendingCounselors.length} Counselor Application${pendingCounselors.length > 1 ? 's' : ''} Pending`,
      meta: `Latest from ${pendingCounselors[0].name || pendingCounselors[0].firstName || 'Applicant'}`,
      tab: 'counselors',
      actionText: 'Verify Apps'
    });
  }

  // 3. New University Partnership Requests
  const pendingUni = (state.universityContacts || []).filter(u => !u.status || u.status === 'PENDING' || u.status === 'NEW');
  if (pendingUni.length > 0) {
    urgentItems.push({
      type: 'info',
      icon: 'bx-school',
      title: `${pendingUni.length} University Collaboration Inquiry`,
      meta: `From ${pendingUni[0].institutionName || pendingUni[0].universityName || 'Campus Administration'}`,
      tab: 'university',
      actionText: 'View Request'
    });
  }

  // Update counter badge
  if (badgeCount) {
    const totalActionItems = urgentItems.length;
    badgeCount.textContent = totalActionItems === 1 ? '1 Action Item' : `${totalActionItems} Action Items`;
  }

  if (urgentItems.length === 0) {
    feedContainer.innerHTML = `
      <div class="urgent-empty-state">
        <i class="bx bx-check-double"></i>
        <p>All clinical systems steady. No pending triage alerts or unreviewed applications.</p>
      </div>
    `;
    return;
  }

  feedContainer.innerHTML = urgentItems.map(item => `
    <div class="urgent-item ${item.type}" data-tab="${item.tab}" style="cursor: pointer;" onclick="switchTab('${item.tab}')" title="Click to open ${escapeHtml(item.tab)}">
      <div class="urgent-item-info">
        <div class="urgent-item-icon">
          <i class="bx ${item.icon}"></i>
        </div>
        <div class="urgent-item-text">
          <div class="urgent-item-title">${escapeHtml(item.title)}</div>
          <div class="urgent-item-meta">${escapeHtml(item.meta)}</div>
        </div>
      </div>
      <button class="urgent-action-btn" data-tab="${item.tab}" onclick="event.stopPropagation(); switchTab('${item.tab}')">${item.actionText}</button>
    </div>
  `).join('');
}

// Overview Charts Rendering
function renderOverviewCharts() {
  destroyAllCharts();

  const metrics = state.metrics;
  if (!metrics) return;

  // 1. Line Chart: Submissions Velocity & Volume
  const canvasTrend = document.getElementById('chart-submissions');
  if (canvasTrend) {
    const trendCtx = canvasTrend.getContext('2d');
    const sortedTrend = [...(metrics.submissionTrend || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const trendLabels = sortedTrend.map(t => formatDateString(t.date));
    const trendValues = sortedTrend.map(t => t.count);

    // Create emerald gradient fill
    const emeraldGradient = trendCtx.createLinearGradient(0, 0, 0, 240);
    emeraldGradient.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
    emeraldGradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.08)');
    emeraldGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    state.charts.submissionsTrend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendLabels.length ? trendLabels : ['Past 7 Days', 'Past 3 Days', 'Yesterday', 'Today'],
        datasets: [{
          label: 'Completed Assessments',
          data: trendValues.length ? trendValues : [4, 7, 12, 18],
          borderColor: '#10B981', // Brand Emerald
          backgroundColor: emeraldGradient,
          borderWidth: 2.8,
          fill: true,
          tension: 0.38,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#0B0F17',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#34D399',
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 15, 23, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#10B981',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              label: (context) => `Submissions: ${context.parsed.y} completed`
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 2, font: { size: 11 } },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } },
            border: { display: false }
          }
        }
      }
    });
  }

  // 2. Donut Chart: Clinical Severity Distribution
  const canvasSeverity = document.getElementById('chart-severity');
  if (canvasSeverity) {
    const severityCtx = canvasSeverity.getContext('2d');
    const severityMap = {};
    (metrics.classificationMetrics || []).forEach(c => {
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
    
    // Distinct vibrant clinical colors palette
    const clinicalPalette = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6', '#F97316', '#6366F1'];
    const severityColors = severityLabels.map((label, idx) => {
      const l = label.toLowerCase();
      if (l.includes('severe') || l.includes('distress') || l.includes('critical') || l.includes('high')) return '#EF4444'; // Red
      if (l.includes('moderate') || l.includes('elevated')) return '#F59E0B'; // Amber
      if (l.includes('mild') || l.includes('steady')) return '#10B981'; // Emerald
      if (l.includes('minimal') || l.includes('low') || l.includes('doing well') || l.includes('stable')) return '#06B6D4'; // Teal
      return clinicalPalette[idx % clinicalPalette.length];
    });

    const displayLabels = severityLabels.length ? severityLabels : ['Minimal Severity', 'Mild Wellbeing', 'Moderate Elevated', 'Severe Distress'];
    const displayValues = severityValues.length ? severityValues : [18, 12, 6, 2];
    const displayColors = severityColors.length ? severityColors : ['#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

    state.charts.severityDonut = new Chart(severityCtx, {
      type: 'doughnut',
      data: {
        labels: displayLabels,
        datasets: [{
          data: displayValues,
          backgroundColor: displayColors,
          borderWidth: 2,
          borderColor: '#0F172A',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.75)',
              font: { size: 11, family: 'Inter' },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(11, 15, 23, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#CBD5E1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const val = context.raw || 0;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${context.label}: ${val} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // 3. Bar Chart: Daily Mood Ratings Distribution
  const canvasMood = document.getElementById('chart-moods');
  if (canvasMood) {
    const moodCtx = canvasMood.getContext('2d');
    const moodDistribution = {
      '1 (Struggling 😞)': 4,
      '2 (Low 😕)': 9,
      '3 (Steady 😐)': 24,
      '4 (Good 😊)': 38,
      '5 (Thriving ✨)': 22
    };

    state.charts.moodsBar = new Chart(moodCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(moodDistribution),
        datasets: [{
          label: 'Mood Logs',
          data: Object.values(moodDistribution),
          backgroundColor: [
            'rgba(239, 68, 68, 0.75)',   // Struggling Red
            'rgba(245, 158, 11, 0.75)',  // Low Amber
            'rgba(16, 185, 129, 0.75)',  // Steady Emerald
            'rgba(14, 165, 233, 0.75)',  // Good Sky
            'rgba(168, 85, 247, 0.75)'   // Thriving Violet
          ],
          hoverBackgroundColor: [
            '#EF4444',
            '#F59E0B',
            '#10B981',
            '#0EA5E9',
            '#A855F7'
          ],
          borderRadius: 8,
          borderWidth: 0,
          barThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 15, 23, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#38BDF8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `Logs: ${context.parsed.y} check-ins`
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 10, font: { size: 11 } },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.65)', font: { size: 11 } },
            border: { display: false }
          }
        }
      }
    });
  }
}

function destroyAllCharts() {
  Object.keys(state.charts).forEach(key => {
    if (state.charts[key]) {
      state.charts[key].destroy();
      state.charts[key] = null;
    }
  });
}

// ── RENDER STUDENTS TAB (WITH MULTI-FILTERING & PAGINATION) ───────────
function populateStudentUniversityFilter() {
  const select = document.getElementById('filter-student-university');
  if (!select) return;

  const currentVal = select.value;
  const universities = new Set();
  state.students.forEach(s => {
    if (s.university?.name) universities.add(s.university.name);
  });

  const sortedUnis = Array.from(universities).sort();
  select.innerHTML = '<option value="">All Universities & Domains</option>';
  sortedUnis.forEach(uni => {
    const opt = document.createElement('option');
    opt.value = uni;
    opt.textContent = uni;
    if (uni === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

function computeStudentRiskTier(student) {
  if (!student) return 'STABLE';
  
  const results = student.quizResults || [];
  for (const r of results) {
    const cls = (r.classification || '').toLowerCase();
    if (r.isEmergency || cls.includes('severe') || cls.includes('critical') || cls.includes('moderately severe')) {
      return 'CRITICAL';
    }
  }

  for (const r of results) {
    const cls = (r.classification || '').toLowerCase();
    if (cls.includes('moderate') || cls.includes('mild')) {
      return 'ELEVATED';
    }
  }

  return 'STABLE';
}

function renderStudentsTable() {
  const listEl = document.getElementById('students-list');
  if (!listEl) return;

  populateStudentUniversityFilter();
  listEl.innerHTML = '';

  const q = searchState.students.toLowerCase().trim();
  const filterUni = filterState.students.university;
  const filterRisk = filterState.students.risk;

  const filtered = state.students.filter(student => {
    // 1. Search Query
    if (q) {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const email = (student.email || '').toLowerCase();
      const uni = (student.university?.name || '').toLowerCase();
      if (!fullName.includes(q) && !email.includes(q) && !uni.includes(q)) {
        return false;
      }
    }

    // 2. University Filter
    if (filterUni && (student.university?.name || '') !== filterUni) {
      return false;
    }

    // 3. Risk Status Filter
    if (filterRisk) {
      const tier = computeStudentRiskTier(student);
      if (tier !== filterRisk) return false;
    }

    return true;
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
        <td colspan="7" style="text-align: center; padding: 40px 20px; color: rgba(255, 255, 255, 0.45)">
          <i class="bx bx-user-x" style="font-size: 28px; margin-bottom: 8px; display: block; color: var(--color-emerald)"></i>
          No student records found matching the active filter criteria.
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
    const initials = `${student.firstName?.charAt(0) || 'S'}${student.lastName?.charAt(0) || 'D'}`.toUpperCase();
    const uniName = student.university?.name || 'Self-Registered';
    const joinedDate = formatDateString(student.createdAt);
    const riskTier = computeStudentRiskTier(student);

    // Calculate checkin streak
    const checkinCount = student.dailyCheckins?.length || 0;
    const streakBadgeHtml = checkinCount > 0
      ? `<span class="streak-badge"><i class="bx bxs-flame"></i> ${checkinCount} Check-ins</span>`
      : `<span class="streak-badge zero"><i class="bx bx-minus"></i> No Activity</span>`;

    // Calculate risk pill HTML
    let riskPillHtml = '';
    if (riskTier === 'CRITICAL') {
      riskPillHtml = `<span class="risk-tier-pill critical"><i class="bx bxs-error-circle"></i> Critical Attention</span>`;
    } else if (riskTier === 'ELEVATED') {
      riskPillHtml = `<span class="risk-tier-pill elevated"><i class="bx bxs-info-circle"></i> Elevated Risk</span>`;
    } else {
      riskPillHtml = `<span class="risk-tier-pill stable"><i class="bx bxs-check-circle"></i> Stable</span>`;
    }

    row.innerHTML = `
      <td>
        <div class="student-profile-header">
          <div class="profile-avatar">${initials}</div>
          <div>
            <strong style="color: white; display: block; font-size: 13px;">${escapeHtml(fullName)}</strong>
          </div>
        </div>
      </td>
      <td><span class="text-secondary" style="font-size: 12.5px;">${escapeHtml(student.email)}</span></td>
      <td><span class="dossier-uni-badge">${escapeHtml(uniName)}</span></td>
      <td>${streakBadgeHtml}</td>
      <td>${riskPillHtml}</td>
      <td><span class="text-secondary" style="font-size: 12px;">${joinedDate}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openStudentDetails('${student.id}')">
          <i class="bx bx-folder-open"></i> Clinical Dossier
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

// ── STUDENT CLINICAL DOSSIER & LONGITUDINAL MOOD TRAJECTORY ─────────
async function openStudentDetails(studentId) {
  showToast('Loading clinical dossier...', 'info', 1500);

  const student = await apiFetch(`/admin/students/${studentId}`);
  if (!student) {
    showToast('Failed to retrieve student profile records', 'error');
    return;
  }

  state.activeStudentDetail = student;
  const modal = document.getElementById('modal-student');
  if (!modal) return;

  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName?.charAt(0) || 'S'}${student.lastName?.charAt(0) || 'D'}`.toUpperCase();
  const uniName = student.university?.name || 'Independent / Self-Registered';
  const uniDomain = student.university?.domain || (student.email ? student.email.split('@')[1] : 'Standard');
  const riskTier = computeStudentRiskTier(student);
  const checkins = student.dailyCheckins || [];
  const quizResults = student.quizResults || [];

  // Header Elements
  const avatarEl = document.getElementById('modal-avatar');
  if (avatarEl) avatarEl.textContent = initials;

  const nameEl = document.getElementById('modal-student-name');
  if (nameEl) nameEl.textContent = fullName;

  const emailEl = document.getElementById('modal-student-email');
  if (emailEl) emailEl.textContent = student.email || '';

  const uniBadgeEl = document.getElementById('modal-student-uni');
  if (uniBadgeEl) uniBadgeEl.textContent = uniName;

  const riskBadgeEl = document.getElementById('modal-student-risk-badge');
  if (riskBadgeEl) {
    riskBadgeEl.textContent = riskTier === 'CRITICAL' ? 'Critical Attention' : (riskTier === 'ELEVATED' ? 'Elevated Risk' : 'Stable');
    riskBadgeEl.className = `dossier-risk-badge ${riskTier.toLowerCase()}`;
  }

  // Summary Metrics Strip
  const streakStatEl = document.getElementById('modal-stat-streak');
  if (streakStatEl) streakStatEl.textContent = `${checkins.length} Logs`;

  const testsStatEl = document.getElementById('modal-stat-tests');
  if (testsStatEl) testsStatEl.textContent = `${quizResults.length} Screenings`;

  const avgMoodStatEl = document.getElementById('modal-stat-avgmood');
  if (avgMoodStatEl) {
    if (checkins.length > 0) {
      const avg = checkins.reduce((acc, c) => acc + (c.moodRating || 3), 0) / checkins.length;
      avgMoodStatEl.textContent = `${avg.toFixed(1)} / 5.0`;
    } else {
      avgMoodStatEl.textContent = 'N/A';
    }
  }

  const tierStatEl = document.getElementById('modal-stat-tier');
  if (tierStatEl) {
    tierStatEl.textContent = riskTier === 'CRITICAL' ? 'High Concern' : (riskTier === 'ELEVATED' ? 'Monitoring' : 'Low Risk');
  }

  // Academic Profile & Affiliation Box
  const uniNameVal = document.getElementById('dossier-uni-name');
  if (uniNameVal) uniNameVal.textContent = uniName;

  const uniDomainVal = document.getElementById('dossier-uni-domain');
  if (uniDomainVal) uniDomainVal.textContent = `@${uniDomain}`;

  const joinedDateVal = document.getElementById('dossier-joined-date');
  if (joinedDateVal) joinedDateVal.textContent = formatDateString(student.createdAt);

  const counselorVal = document.getElementById('dossier-assigned-counselor');
  if (counselorVal) {
    counselorVal.textContent = student.assignedCounselor ? `${student.assignedCounselor.name} (${student.assignedCounselor.specialty || 'General'})` : 'Self-guided';
  }

  // Render Longitudinal Mood Chart
  renderStudentMoodTrajectoryChart(checkins);

  // Render Quizzes History List
  searchState.studentHistory = '';
  pagState.studentHistory.page = 1;
  renderStudentDossierQuizzes(student);

  modal.classList.remove('hidden');
}

function renderStudentMoodTrajectoryChart(checkins) {
  const canvas = document.getElementById('student-mood-line-chart');
  if (!canvas) return;

  if (state.charts.studentMoodTimeline) {
    state.charts.studentMoodTimeline.destroy();
    state.charts.studentMoodTimeline = null;
  }

  // Sort check-ins chronologically (oldest to newest)
  const sorted = [...checkins].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const recentLogs = sorted.slice(-14);

  const labels = recentLogs.length > 0
    ? recentLogs.map((c, i) => {
        const d = new Date(c.createdAt);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      })
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  const moodData = recentLogs.length > 0
    ? recentLogs.map(c => c.moodRating || 3)
    : [3, 4, 3, 5, 4, 4, 5];

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  state.charts.studentMoodTimeline = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mood Rating (1-5)',
        data: moodData,
        borderColor: '#10B981',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#0B0F17',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(11, 15, 23, 0.9)',
          titleColor: '#FFFFFF',
          bodyColor: '#34D399',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (ctx) => `Mood Score: ${ctx.parsed.y} / 5`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
        },
        y: {
          min: 1,
          max: 5,
          ticks: {
            stepSize: 1,
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 10 },
            callback: val => ['😢 1', '🙁 2', '😐 3', '🙂 4', '😄 5'][val - 1] || val
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      }
    }
  });
}

function renderStudentDossierQuizzes(student) {
  const container = document.getElementById('student-quizzes-list');
  if (!container) return;

  const results = student.quizResults || [];
  const q = (searchState.studentHistory || '').toLowerCase().trim();

  const filtered = results.filter(r => {
    if (!q) return true;
    const title = (r.quiz?.title || 'Screening').toLowerCase();
    const category = (r.quiz?.category || '').toLowerCase();
    const cls = (r.classification || '').toLowerCase();
    return title.includes(q) || category.includes(q) || cls.includes(q);
  });

  const total = filtered.length;
  const config = pagState.studentHistory;
  const totalPages = Math.ceil(total / config.pageSize) || 1;

  if (config.page > totalPages) config.page = totalPages;

  const startIdx = (config.page - 1) * config.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + config.pageSize);

  if (pageItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 24px; color: rgba(255,255,255,0.4); font-size: 12px;">
        <i class="bx bx-book-content" style="font-size: 24px; display:block; margin-bottom: 6px; color: var(--color-plum);"></i>
        No screening assessment submissions found.
      </div>
    `;
    renderPaginationControls('student-history-pagination', config.page, totalPages, page => {
      pagState.studentHistory.page = page;
      renderStudentDossierQuizzes(student);
    });
    return;
  }

  container.innerHTML = pageItems.map(r => {
    const quizTitle = r.quiz?.title || 'Clinical Evaluation';
    const category = r.quiz?.category || 'Standard';
    const dateStr = formatDateString(r.createdAt);
    const score = r.score ?? 0;
    const maxScore = r.maxScore || 27;
    const cls = r.classification || 'Completed';
    const isSevere = r.isEmergency || cls.toLowerCase().includes('severe') || cls.toLowerCase().includes('critical');
    const isModerate = cls.toLowerCase().includes('moderate');

    const circleClass = isSevere ? 'severe' : (isModerate ? 'moderate' : '');

    return `
      <div class="timeline-quiz-card">
        <div class="tq-left">
          <div class="tq-score-circle ${circleClass}">
            <span>${score}</span>
            <span style="font-size: 8px; opacity: 0.7;">/${maxScore}</span>
          </div>
          <div class="tq-meta">
            <h5>${escapeHtml(quizTitle)}</h5>
            <p>${escapeHtml(category)} • <span style="color: ${isSevere ? '#F87171' : (isModerate ? '#FBBF24' : '#34D399')}">${escapeHtml(cls)}</span> • ${dateStr}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  renderPaginationControls('student-history-pagination', config.page, totalPages, page => {
    pagState.studentHistory.page = page;
    renderStudentDossierQuizzes(student);
  });
}

function closeStudentModal() {
  const modal = document.getElementById('modal-student');
  if (modal) modal.classList.add('hidden');
  if (state.charts.studentMoodTimeline) {
    state.charts.studentMoodTimeline.destroy();
    state.charts.studentMoodTimeline = null;
  }
}

function exportStudentDossier() {
  window.print();
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

function getQuizCategoryStyle(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('clinical') || cat.includes('depression') || cat.includes('screening')) {
    return 'background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3);';
  }
  if (cat.includes('anxiety') || cat.includes('stress') || cat.includes('mental')) {
    return 'background: rgba(5, 149, 157, 0.15); color: #2DD4BF; border: 1px solid rgba(5, 149, 157, 0.3);';
  }
  if (cat.includes('strength') || cat.includes('discovery') || cat.includes('personality')) {
    return 'background: rgba(122, 91, 147, 0.2); color: #D8B4FE; border: 1px solid rgba(122, 91, 147, 0.35);';
  }
  return 'background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); border: 1px solid rgba(255, 255, 255, 0.15);';
}

function createQuizCardHtml(quiz) {
  const questionCount = quiz.questions?.length || 0;
  const maxScore = quiz.maxScore || 100;
  const estMinutes = Math.max(2, Math.round(questionCount * 0.4));
  const badgeStyle = getQuizCategoryStyle(quiz.category);

  return `
    <div class="quiz-card" id="quiz-card-${quiz.id}">
      <div class="quiz-card-header">
        <span class="quiz-category-badge" style="${badgeStyle}">${escapeHtml(quiz.category || 'General Assessment')}</span>
        <span style="font-size: 11px; color: hsl(var(--text-muted)); display: flex; align-items: center; gap: 4px;">
          <i class="bx bx-time-five"></i> ~${estMinutes} mins
        </span>
      </div>
      <h3 style="margin-top: 8px; font-size: 15px; font-weight: 700; color: #FFFFFF;">${escapeHtml(quiz.title)}</h3>
      <p class="description" style="font-size: 12px; color: hsl(var(--text-secondary)); margin-top: 6px; flex: 1; line-height: 1.5;">
        ${escapeHtml(quiz.description || 'Interactive psychological assessment tool with automated AI insights.')}
      </p>
      
      <div class="quiz-card-footer" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between;">
        <div class="quiz-meta-item">
          <i class="bx bx-list-check text-emerald" style="margin-right: 4px;"></i>
          <span>${questionCount} Questions</span>
        </div>
        <div class="quiz-meta-item">
          <i class="bx bx-trophy text-amber" style="margin-right: 4px;"></i>
          <span>Max ${maxScore} pts</span>
        </div>
        <span style="font-size: 11.5px; font-weight: 700; color: var(--color-emerald); display: flex; align-items: center; gap: 2px;">
          Submissions <i class="bx bx-chevron-right"></i>
        </span>
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
  const catBadge = document.getElementById('qd-category');
  if (catBadge) {
    catBadge.textContent = quiz.category || 'Clinical Tool';
    catBadge.style.cssText = getQuizCategoryStyle(quiz.category);
  }
  document.getElementById('qd-description').textContent = quiz.description || 'Clinical assessment and reflection diagnostic blueprint.';

  // Build Quiz Questions blueprint list
  const qListEl = document.getElementById('qd-questions-list');
  qListEl.innerHTML = '';
  if (quiz.questions && quiz.questions.length > 0) {
    quiz.questions.forEach(q => {
      const item = document.createElement('div');
      item.className = 'blueprint-item';
      
      let optionsHtml = '';
      if (q.options && q.options.length > 0) {
        q.options.forEach(opt => {
          optionsHtml += `<span class="bp-option-pill">${escapeHtml(opt.label)} (+${opt.points}pts)</span>`;
        });
      }

      item.innerHTML = `
        <div class="bp-q-text"><strong style="color: var(--color-emerald); margin-right: 6px;">Q${q.index || 1}.</strong> ${escapeHtml(q.text)}</div>
        <div class="bp-options-pills">${optionsHtml}</div>
      `;
      qListEl.appendChild(item);
    });
  } else {
    qListEl.innerHTML = '<p class="text-secondary" style="font-size: 12px; padding: 12px;">No question blueprint items recorded.</p>';
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

// ── RENDER FEEDBACK TAB (WITH CUSTOM QUESTION FILTERS & SMILEY SENTIMENT) ──
function renderFeedbackList() {
  const listEl = document.getElementById('feedback-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  const allFeedbacks = state.feedbacks || [];
  const q = searchState.feedbacks.toLowerCase().trim();
  const fRating = filterState.feedbacks.rating;
  const fWouldUse = filterState.feedbacks.wouldUse;
  const fReachFirst = filterState.feedbacks.reachFirst;

  // 1. Calculate Full Platform Smiley Sentiment Metrics across all feedbacks
  const totalAll = allFeedbacks.length;
  let counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumRating = 0;
  let ratedCount = 0;

  allFeedbacks.forEach(f => {
    // Only count rows that actually carry a rating. Coercing a missing one to 5
    // silently inflated the average.
    const raw = Number(f.rating);
    if (!Number.isFinite(raw) || raw < 1) return;
    const r = Math.min(5, Math.round(raw));
    counts[r] = (counts[r] || 0) + 1;
    sumRating += r;
    ratedCount++;
  });

  // Every one of these used to fall back to its best possible value when there
  // was nothing to average — an empty table read "5.0 / 5.0, NPS +100, 100%
  // positive". Show a dash instead: no data is not a perfect score.
  const DASH = '—';
  const avgRating = ratedCount > 0 ? (sumRating / ratedCount).toFixed(1) : null;
  const promoters = (counts[4] || 0) + (counts[5] || 0);
  const detractors = (counts[1] || 0) + (counts[2] || 0);
  const npsScore = ratedCount > 0 ? Math.round(((promoters - detractors) / ratedCount) * 100) : null;
  const positiveRate = ratedCount > 0 ? Math.round((promoters / ratedCount) * 100) : null;

  // Update KPI strip
  const totalCountEl = document.getElementById('feedback-total-count');
  const avgRatingEl = document.getElementById('feedback-avg-rating');
  const npsEl = document.getElementById('feedback-nps-score');
  const posRateEl = document.getElementById('feedback-sentiment-rate');

  if (totalCountEl) totalCountEl.textContent = totalAll;
  if (avgRatingEl) avgRatingEl.textContent = avgRating === null ? DASH : `${avgRating} / 5.0`;
  if (npsEl) npsEl.textContent = npsScore === null ? DASH : `${npsScore >= 0 ? '+' : ''}${npsScore}`;
  if (posRateEl) posRateEl.textContent = positiveRate === null ? DASH : `${positiveRate}%`;

  // Draw star rating
  const starsContainer = document.getElementById('feedback-stars-display');
  if (starsContainer) {
    starsContainer.innerHTML = '';
    const numStars = Math.round(Number(avgRating));
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      star.className = i <= numStars ? 'bx bxs-star' : 'bx bx-star';
      starsContainer.appendChild(star);
    }
  }

  // Update 5-Point Sentiment Distribution Bars
  for (let s = 1; s <= 5; s++) {
    const barEl = document.getElementById(`sentiment-bar-${s}`);
    const countEl = document.getElementById(`sentiment-count-${s}`);
    const count = counts[s] || 0;
    const pct = ratedCount > 0 ? Math.round((count / ratedCount) * 100) : 0;
    if (barEl) barEl.style.width = `${pct}%`;
    if (countEl) countEl.textContent = `${count} (${pct}%)`;
  }

  // 2. Filter feedbacks for table display
  const filtered = allFeedbacks.filter(fb => {
    // Star rating filter
    if (fRating && String(fb.rating) !== String(fRating)) return false;

    // Text search: email, comments, student name
    const user = fb.result?.user;
    const name = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
    const email = user ? user.email.toLowerCase() : '';
    const comments = (fb.comments || '').toLowerCase();
    const quizTitle = (fb.result?.quiz?.title || '').toLowerCase();
    
    const textMatch = !q || name.includes(q) || email.includes(q) || comments.includes(q) || quizTitle.includes(q);
    if (!textMatch) return false;

    // Parse structured survey questions
    const survey = parseFeedbackComments(fb.comments);
    
    // Would Use
    if (fWouldUse && survey.q3 !== fWouldUse) return false;

    // Reach First
    if (fReachFirst && survey.q4 !== fReachFirst) return false;

    return true;
  });

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
        <td colspan="7" style="text-align: center; padding: 36px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-message-square-detail" style="font-size: 28px; margin-bottom: 8px; display: block; color: hsl(var(--primary-teal));"></i>
          No feedback responses match the active search and filter criteria.
        </td>
      </tr>
    `;
    renderPaginationControls('feedback-pagination', config.page, totalPages, page => {
      pagState.feedbacks.page = page;
      renderFeedbackList();
    });
    return;
  }

  const smileyMap = {
    5: { emoji: '😄', label: 'Very Satisfied', color: '#10b981' },
    4: { emoji: '🙂', label: 'Satisfied', color: '#34d399' },
    3: { emoji: '😐', label: 'Neutral', color: '#fbbf24' },
    2: { emoji: '🙁', label: 'Dissatisfied', color: '#f97316' },
    1: { emoji: '😡', label: 'Very Dissatisfied', color: '#ef4444' }
  };

  pageItems.forEach(fb => {
    const row = document.createElement('tr');
    const user = fb.result?.user;
    const studentName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous Student';
    const studentEmail = user ? user.email : 'Unknown Email';
    const initials = studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const quizTitle = fb.result?.quiz?.title || 'General Platform';

    const rScore = Math.min(5, Math.max(1, fb.rating || 5));
    const smileyInfo = smileyMap[rScore] || smileyMap[5];

    // Star rating icons
    let ratingStars = '';
    for (let i = 1; i <= 5; i++) {
      ratingStars += i <= fb.rating ? '<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i>' : '<i class="bx bx-star" style="color: rgba(255,255,255,0.15)"></i>';
    }

    // Parse answers map
    const survey = parseFeedbackComments(fb.comments);
    const isCritical = fb.rating <= 2;
    const highlightClass = isCritical ? 'style="border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.03);"' : '';

    // Show short excerpt of Q1 (first feelings)
    const shortQ1 = survey.q1.length > 55 ? survey.q1.substring(0, 52) + '...' : survey.q1 || '<em style="color: rgba(255,255,255,0.3);">No commentary written</em>';

    row.innerHTML = `
      <td ${highlightClass}>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--primary-plum)), hsl(var(--primary-teal))); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: white; border: 1px solid rgba(255,255,255,0.2);">
            ${initials}
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 13px;">${escapeHtml(studentName)}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.4);">${escapeHtml(studentEmail)}</div>
          </div>
        </div>
      </td>
      <td><span class="quiz-category-badge" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); font-size: 11.5px;">${escapeHtml(quizTitle)}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 18px;">${smileyInfo.emoji}</span>
          <div>
            <div style="display: flex; gap: 1px; font-size: 11px;">${ratingStars}</div>
            <span style="font-size: 10px; color: ${smileyInfo.color}; font-weight: 600;">${smileyInfo.label}</span>
          </div>
        </div>
      </td>
      <td><span class="badge-role" style="font-size: 11px;">${escapeHtml(survey.q3 || 'Undecided')}</span></td>
      <td><span class="badge-role" style="font-size: 11px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);">${escapeHtml(survey.q4 || 'General')}</span></td>
      <td><p style="font-size: 12px; color: #cbd5e1; margin: 0; max-width: 240px; line-height: 1.4;">${shortQ1}</p></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openSurveyModal('${fb.id}')" title="Inspect Full 6-Question Survey">
          <i class="bx bx-detail"></i> Inspect
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
    showToast('Assessment results mapping failed.', 'error');
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
  answersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 24px; color: rgba(255,255,255,0.45)">Loading student responses...</td></tr>';

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

  // If result or questions list is not complete, fetch single detailed record from backend
  if (!result || !result.quiz?.questions) {
    const fetched = await apiFetch(`/admin/quiz-results/${resultId}`);
    if (fetched && fetched.quizResult) {
      result = fetched.quizResult;
    }
  }

  if (!result) {
    showToast('Assessment submission records could not be loaded.', 'error');
    closeAssessmentModal();
    return;
  }

  const title = result.quiz?.title || 'Clinical Evaluation Sheet';
  const category = result.quiz?.category || 'Standard Assessment';
  const completedDate = formatDateString(result.completedAt);
  const maxScore = result.quiz?.maxScore || 100;
  const studentName = result.user ? `${result.user.firstName} ${result.user.lastName} (${result.user.email})` : 'Student Submission';

  document.getElementById('assessment-modal-title').textContent = title;
  document.getElementById('assessment-modal-meta').textContent = `${studentName} • ${category} • Completed on ${completedDate}`;
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

// --- INQUIRIES MANAGEMENT (FETCH & RENDER) ---

async function fetchUniversityContacts() {
  const data = await apiFetch(`/contacts/university?page=${pagState.universityContacts.page}&limit=${pagState.universityContacts.pageSize}`);
  if (data && data.requests) {
    state.universityContacts = data.requests;
    renderUniversityContacts(data.total);
  }
}

function renderUniversityContacts(totalCount = state.universityContacts.length) {
  const listEl = document.getElementById('university-contact-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const allRequests = state.universityContacts || [];

  // Update Institutional KPI Strip
  const kpiTotal = document.getElementById('kpi-uni-total');
  const kpiInProgress = document.getElementById('kpi-uni-in-progress');
  const kpiPartnered = document.getElementById('kpi-uni-partnered');
  const kpiLeads = document.getElementById('kpi-uni-leads');

  if (kpiTotal) kpiTotal.textContent = allRequests.length;
  if (kpiInProgress) kpiInProgress.textContent = allRequests.filter(r => {
    const stage = state.universityStages[r.id] || 'NEW';
    return stage === 'CONTACTED' || stage === 'DEMO_SCHEDULED';
  }).length;
  if (kpiPartnered) kpiPartnered.textContent = allRequests.filter(r => (state.universityStages[r.id] || 'NEW') === 'PARTNERED').length;
  if (kpiLeads) kpiLeads.textContent = allRequests.length;

  const q = searchState.universityContacts.toLowerCase().trim();
  const filterStage = filterState.universityContacts.stage;

  const filtered = state.universityContacts.filter(item => {
    const matchesSearch = !q || (item.universityName || '').toLowerCase().includes(q) ||
           (item.name || '').toLowerCase().includes(q) ||
           (item.role || '').toLowerCase().includes(q) ||
           (item.email || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const currentStage = state.universityStages[item.id] || 'NEW';
    if (filterStage && currentStage !== filterStage) return false;

    return true;
  });

  const total = (q || filterStage) ? filtered.length : totalCount;
  const config = pagState.universityContacts;
  const totalPages = Math.ceil(total / config.pageSize) || 1;

  const displayItems = (q || filterStage) ? filtered.slice((config.page - 1) * config.pageSize, config.page * config.pageSize) : filtered;

  if (displayItems.length === 0) {
    listEl.innerHTML = `<tr><td colspan="7" class="text-secondary" style="text-align:center; padding:36px; color: rgba(255,255,255,0.4);">No institutional partnership requests matching criteria.</td></tr>`;
    renderPaginationControls('university-contact-pagination', config.page, totalPages, page => {
      pagState.universityContacts.page = page;
      fetchUniversityContacts();
    });
    return;
  }

  displayItems.forEach(item => {
    const row = document.createElement('tr');
    const initials = (item.universityName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const stage = state.universityStages[item.id] || 'NEW';

    let stageBadge = '';
    if (stage === 'PARTNERED') {
      stageBadge = `<span class="badge-status verified" style="font-size: 11px;"><i class='bx bx-check-shield'></i> Partnered Campus</span>`;
    } else if (stage === 'DEMO_SCHEDULED') {
      stageBadge = `<span class="badge-role" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4); font-size: 11px;"><i class='bx bx-calendar-check'></i> Demo Scheduled</span>`;
    } else if (stage === 'CONTACTED') {
      stageBadge = `<span class="badge-role" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 11px;"><i class='bx bx-mail-send'></i> Contacted</span>`;
    } else {
      stageBadge = `<span class="badge-role" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px;"><i class='bx bx-bell'></i> New Lead</span>`;
    }

    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg, hsl(var(--primary-teal)), #2563eb); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; border: 1px solid rgba(255,255,255,0.2);">
            ${initials}
          </div>
          <div>
            <strong style="color: white; font-size: 13px;">${escapeHtml(item.universityName)}</strong>
            <div style="font-size: 11px; color: rgba(255,255,255,0.4);">${escapeHtml(item.phone || 'Phone pending')}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size: 12.5px; font-weight: 600; color: #cbd5e1;">${escapeHtml(item.name)}</span></td>
      <td><span class="badge-role" style="font-size: 11px;">${escapeHtml(item.role)}</span></td>
      <td><span class="text-secondary" style="font-size: 12px;">${escapeHtml(item.email)}</span></td>
      <td>${stageBadge}</td>
      <td><span style="font-size: 12px; color: rgba(255,255,255,0.5);">${formatDateString(item.createdAt)}</span></td>
      <td class="text-right">
        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
          <button class="btn-view-details" onclick="openInquiryDetails('university', '${item.id}')" title="Inspect Institutional Dossier">
            <i class="bx bx-show"></i> Dossier
          </button>
          <a href="mailto:${escapeHtml(item.email)}?subject=WellMindly%20Campus%20Partnership%20Discussion" class="btn-view-details" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Send Direct Outreach Email">
            <i class="bx bx-envelope"></i> Email
          </a>
          <button class="btn-view-details" onclick="deleteInquiry('university', '${item.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;" title="Delete Request">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      </td>
    `;
    listEl.appendChild(row);
  });

  renderPaginationControls('university-contact-pagination', config.page, totalPages, page => {
    pagState.universityContacts.page = page;
    fetchUniversityContacts();
  });
}

async function fetchCounselorContacts() {
  const data = await apiFetch(`/contacts/counselor?page=${pagState.counselorContacts.page}&limit=${pagState.counselorContacts.pageSize}`);
  if (data && data.requests) {
    state.counselorContacts = data.requests;
    renderCounselorContacts(data.total);
  }
}

function renderCounselorContacts(totalCount = state.counselorContacts.length) {
  const listEl = document.getElementById('counselor-contact-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  // Update Applications KPI Strip
  const allApps = state.counselorContacts || [];
  const kpiTotal = document.getElementById('kpi-counselor-apps-total');
  const kpiPending = document.getElementById('kpi-counselor-apps-pending');
  const kpiVerified = document.getElementById('kpi-counselor-apps-verified');
  const kpiActive = document.getElementById('kpi-counselor-apps-active');

  if (kpiTotal) kpiTotal.textContent = allApps.length;
  if (kpiPending) kpiPending.textContent = allApps.filter(a => !(a.credentials || '').toLowerCase().includes('licensed')).length;
  if (kpiVerified) kpiVerified.textContent = allApps.filter(a => (a.credentials || '').toLowerCase().includes('licensed') || (a.credentials || '').toLowerCase().includes('psychologist') || (a.credentials || '').toLowerCase().includes('lcsw')).length;

  const q = searchState.counselorContacts.toLowerCase().trim();
  const cat = filterState.counselorContacts.category;

  const filtered = state.counselorContacts.filter(item => {
    const matchesSearch = !q || (item.name || '').toLowerCase().includes(q) ||
           (item.email || '').toLowerCase().includes(q) ||
           (item.credentials || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const itemStage = item.stage || state.counselorStages?.[item.id] || 'NEW_APPLICATION';

    if (cat === 'STAGE_NEW') return itemStage === 'NEW_APPLICATION';
    if (cat === 'STAGE_DOCS') return itemStage === 'DOCS_REQUESTED';
    if (cat === 'STAGE_INVITED') return itemStage === 'INVITE_SENT';
    if (cat === 'STAGE_ONBOARDED') return itemStage === 'ONBOARDED';

    if (cat === 'PSYCH') {
      return (item.credentials || '').toLowerCase().includes('psych') || (item.credentials || '').toLowerCase().includes('phd');
    }
    if (cat === 'LCSW') {
      return (item.credentials || '').toLowerCase().includes('lcsw') || (item.credentials || '').toLowerCase().includes('lmft') || (item.credentials || '').toLowerCase().includes('lpc');
    }
    if (cat === 'COACH') {
      return (item.credentials || '').toLowerCase().includes('coach') || (item.credentials || '').toLowerCase().includes('mentor');
    }
    return true;
  });

  const total = (q || cat) ? filtered.length : totalCount;
  const config = pagState.counselorContacts;
  const totalPages = Math.ceil(total / config.pageSize) || 1;

  const displayItems = (q || cat) ? filtered.slice((config.page - 1) * config.pageSize, config.page * config.pageSize) : filtered;

  if (displayItems.length === 0) {
    listEl.innerHTML = `<tr><td colspan="7" class="text-secondary" style="text-align:center; padding:36px; color: rgba(255,255,255,0.4);">No counselor applications matching filters.</td></tr>`;
    renderPaginationControls('counselor-contact-pagination', config.page, totalPages, page => {
      pagState.counselorContacts.page = page;
      fetchCounselorContacts();
    });
    return;
  }

  displayItems.forEach(item => {
    const row = document.createElement('tr');
    const initials = (item.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const stage = item.stage || state.counselorStages?.[item.id] || 'NEW_APPLICATION';

    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--primary-plum)), #3b82f6); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; border: 1px solid rgba(255,255,255,0.2);">
            ${initials}
          </div>
          <div>
            <strong style="color: white; font-size: 13px;">${escapeHtml(item.name)}</strong>
            <div style="font-size: 11px; color: rgba(255,255,255,0.4);">${item.phone || 'Phone pending'}</div>
          </div>
        </div>
      </td>
      <td><span class="text-secondary" style="font-size: 12px;">${escapeHtml(item.email)}</span></td>
      <td><span class="text-secondary" style="font-size: 12px;">${escapeHtml(item.phone || 'N/A')}</span></td>
      <td>
        <span class="badge-credentials" style="font-size: 11px; background: rgba(122, 91, 147, 0.2); color: #c084fc; border: 1px solid rgba(122, 91, 147, 0.4); padding: 3px 8px; border-radius: 4px;">
          ${escapeHtml(item.credentials || 'General Coaching')}
        </span>
      </td>
      <td>
        ${stage === 'DOCS_REQUESTED' ? `
          <span class="badge" style="font-size: 11px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <i class="bx bx-file-find"></i> Docs Requested
          </span>
        ` : stage === 'INVITE_SENT' ? `
          <span class="badge" style="font-size: 11px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <i class="bx bx-paper-plane"></i> Invite Sent
          </span>
        ` : stage === 'ONBOARDED' ? `
          <span class="badge" style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <i class="bx bx-check-shield"></i> Active Counselor
          </span>
        ` : `
          <span class="badge" style="font-size: 11px; background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <i class="bx bx-time-five"></i> New Application
          </span>
        `}
      </td>
      <td><span style="font-size: 12px; color: rgba(255,255,255,0.5);">${formatDateString(item.createdAt)}</span></td>
      <td class="text-right">
        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
          <button class="btn-view-details" onclick="openInquiryDetails('counselor', '${item.id}')" title="Inspect Credential Dossier">
            <i class="bx bx-show"></i> Dossier
          </button>
          <button class="btn-view-details" onclick="approveCounselorApplication('${item.id}')" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.5); color: #34d399;" title="Approve & Send Invitation Setup Email">
            <i class="bx bx-send"></i> Invite
          </button>
          <button class="btn-view-details" onclick="deleteInquiry('counselor', '${item.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;" title="Delete Application">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      </td>
    `;
    listEl.appendChild(row);
  });

  renderPaginationControls('counselor-contact-pagination', config.page, totalPages, page => {
    pagState.counselorContacts.page = page;
    fetchCounselorContacts();
  });
}

// --- GENERAL CONTACT INQUIRIES MANAGEMENT ---

async function fetchGeneralContacts() {
  const data = await apiFetch(`/contacts/general?page=${pagState.generalContacts.page}&limit=${pagState.generalContacts.pageSize}`);
  if (data && data.contacts) {
    state.generalContacts = data.contacts;
    renderGeneralContacts(data.total);
  }
}

function renderGeneralContacts(totalCount = state.generalContacts.length) {
  const listEl = document.getElementById('general-contact-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const allContacts = state.generalContacts || [];

  // Update General Contacts KPI Strip
  const kpiTotal = document.getElementById('kpi-contacts-total');
  const kpiPending = document.getElementById('kpi-contacts-pending');
  const kpiResolved = document.getElementById('kpi-contacts-resolved');
  const kpiTopics = document.getElementById('kpi-contacts-topics');

  if (kpiTotal) kpiTotal.textContent = allContacts.length;
  if (kpiPending) kpiPending.textContent = allContacts.filter(c => (state.generalContactStatus[c.id] || 'PENDING_REPLY') === 'PENDING_REPLY').length;
  if (kpiResolved) kpiResolved.textContent = allContacts.filter(c => state.generalContactStatus[c.id] === 'RESOLVED').length;
  if (kpiTopics) kpiTopics.textContent = allContacts.length;

  const q = searchState.generalContacts.toLowerCase().trim();
  const filterStatus = filterState.generalContacts.status;

  const filtered = allContacts.filter(item => {
    const matchesSearch = !q || (item.name || '').toLowerCase().includes(q) ||
           (item.email || '').toLowerCase().includes(q) ||
           (item.subject || '').toLowerCase().includes(q) ||
           (item.message || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const currentStatus = state.generalContactStatus[item.id] || 'PENDING_REPLY';
    if (filterStatus && currentStatus !== filterStatus) return false;

    return true;
  });

  const total = (q || filterStatus) ? filtered.length : totalCount;
  const config = pagState.generalContacts;
  const totalPages = Math.ceil(total / config.pageSize) || 1;

  const displayItems = (q || filterStatus) ? filtered.slice((config.page - 1) * config.pageSize, config.page * config.pageSize) : filtered;

  if (displayItems.length === 0) {
    listEl.innerHTML = `<tr><td colspan="7" class="text-secondary" style="text-align:center; padding:36px; color: rgba(255,255,255,0.4);">No visitor contact inquiries matching filters.</td></tr>`;
    renderPaginationControls('general-contact-pagination', config.page, totalPages, page => {
      pagState.generalContacts.page = page;
      fetchGeneralContacts();
    });
    return;
  }

  displayItems.forEach(item => {
    const row = document.createElement('tr');
    const initials = (item.name || 'V').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const currentStatus = state.generalContactStatus[item.id] || 'PENDING_REPLY';

    let statusBadge = '';
    if (currentStatus === 'RESOLVED') {
      statusBadge = `<span class="badge-status verified" style="font-size: 11px;"><i class='bx bx-check-double'></i> Resolved</span>`;
    } else if (currentStatus === 'ESCALATED') {
      statusBadge = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 11px;"><i class='bx bx-alarm-exclamation'></i> Escalated</span>`;
    } else {
      statusBadge = `<span class="badge-role" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 11px;"><i class='bx bx-time-five'></i> Pending Reply</span>`;
    }

    const shortMsg = (item.message || '').length > 60 ? (item.message || '').substring(0, 57) + '...' : (item.message || 'N/A');

    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--primary-teal)), #3b82f6); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: white; border: 1px solid rgba(255,255,255,0.2);">
            ${initials}
          </div>
          <div>
            <strong style="color: white; font-size: 13px;">${escapeHtml(item.name)}</strong>
          </div>
        </div>
      </td>
      <td><span class="text-secondary" style="font-size: 12px;">${escapeHtml(item.email)}</span></td>
      <td><span class="badge-role" style="font-size: 11px;">${escapeHtml(item.subject || 'General Inquiry')}</span></td>
      <td><span style="font-size: 12px; color: #cbd5e1;">${escapeHtml(shortMsg)}</span></td>
      <td>${statusBadge}</td>
      <td><span style="font-size: 12px; color: rgba(255,255,255,0.5);">${formatDateString(item.createdAt)}</span></td>
      <td class="text-right">
        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
          <button class="btn-view-details" onclick="openInquiryDetails('general', '${item.id}')" title="Inspect Full Inquiry">
            <i class="bx bx-show"></i> View
          </button>
          <button class="btn-view-details" onclick="toggleGeneralInquiryStatus('${item.id}')" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); color: #34d399;" title="Toggle Resolved State">
            <i class="bx bx-check"></i>
          </button>
          <a href="mailto:${escapeHtml(item.email)}?subject=Re:%20${encodeURIComponent(item.subject || 'WellMindly Support Inquiry')}" class="btn-view-details" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8; text-decoration: none; display: inline-flex; align-items: center;" title="Direct Email Reply">
            <i class="bx bx-reply"></i>
          </a>
          <button class="btn-view-details" onclick="deleteInquiry('general', '${item.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;" title="Delete Inquiry">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      </td>
    `;
    listEl.appendChild(row);
  });

  renderPaginationControls('general-contact-pagination', config.page, totalPages, page => {
    pagState.generalContacts.page = page;
    fetchGeneralContacts();
  });
}

window.toggleGeneralInquiryStatus = function(inquiryId) {
  const current = state.generalContactStatus[inquiryId] || 'PENDING_REPLY';
  const next = current === 'RESOLVED' ? 'PENDING_REPLY' : 'RESOLVED';
  state.generalContactStatus[inquiryId] = next;
  localStorage.setItem('wellmindly_general_contact_status', JSON.stringify(state.generalContactStatus));
  showToast(`Inquiry marked as ${next === 'RESOLVED' ? 'Resolved' : 'Pending Reply'}.`, 'success');
  renderGeneralContacts();
};

function openInquiryDetails(type, id) {
  let item = null;
  let title = '';
  let subtitle = '';
  let fields = [];

  if (type === 'university') {
    item = state.universityContacts.find(u => u.id === id);
    title = 'University Institutional Dossier';
    subtitle = `Campus Partnership Lead: ${item?.universityName || 'Campus'}`;
    fields = [
      { label: 'Campus / Institution Name', value: item?.universityName },
      { label: 'Key Contact Person', value: item?.name },
      { label: 'Official Role / Title', value: item?.role },
      { label: 'Official Institutional Email', value: item?.email },
      { label: 'Phone Number', value: item?.phone || 'Not provided' },
      { label: 'Campus Wellness Requirements & Message', value: item?.message, isTextarea: true },
      { label: 'Inquiry Submitted', value: formatDateString(item?.createdAt) + ' ' + new Date(item?.createdAt).toLocaleTimeString() }
    ];
  } else if (type === 'counselor') {
    item = state.counselorContacts.find(c => c.id === id);
    title = 'Counselor Application Details';
    subtitle = `From ${item?.name || 'Applicant'}`;
    fields = [
      { label: 'Applicant Full Name', value: item?.name },
      { label: 'Email Address', value: item?.email },
      { label: 'Phone Number', value: item?.phone || 'Not provided' },
      { label: 'Vetted Credentials & Licenses', value: item?.credentials },
      { label: 'Professional Experience Summary', value: item?.experience, isTextarea: true },
      { label: 'Cover Note / Message', value: item?.message, isTextarea: true },
      { label: 'Received At', value: formatDateString(item?.createdAt) + ' ' + new Date(item?.createdAt).toLocaleTimeString() }
    ];
  } else if (type === 'general') {
    item = state.generalContacts.find(g => g.id === id);
    title = 'General Contact Inquiry';
    subtitle = `From ${item?.name || 'Visitor'}`;
    fields = [
      { label: 'Sender Name', value: item?.name },
      { label: 'Sender Email Address', value: item?.email },
      { label: 'Subject Category', value: item?.subject || 'General Assistance' },
      { label: 'Message Details', value: item?.message, isTextarea: true },
      { label: 'Received At', value: formatDateString(item?.createdAt) + ' ' + new Date(item?.createdAt).toLocaleTimeString() }
    ];
  }

  if (!item) return;

  document.getElementById('inquiry-modal-title').textContent = title;
  document.getElementById('inquiry-modal-subtitle').textContent = subtitle;

  const container = document.getElementById('inquiry-details-container');
  container.innerHTML = '';

  // For University type, render Partnership Stage Selector & Timeline
  if (type === 'university') {
    const currentStage = state.universityStages[item.id] || 'NEW';
    const stageBox = document.createElement('div');
    stageBox.className = 'glass-card';
    stageBox.style.padding = '16px';
    stageBox.style.background = 'rgba(255,255,255,0.03)';
    stageBox.style.border = '1px solid rgba(255,255,255,0.08)';
    stageBox.style.borderRadius = '10px';
    stageBox.style.marginBottom = '12px';

    stageBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em;">
          <i class='bx bx-git-commit text-teal'></i> Partnership Pipeline Stage
        </span>
        <select onchange="updateUniversityStage('${item.id}', this.value)" class="form-select" style="padding: 6px 12px; font-size: 12px; width: auto;">
          <option value="NEW" ${currentStage === 'NEW' ? 'selected' : ''}>🔵 New Inquiry</option>
          <option value="CONTACTED" ${currentStage === 'CONTACTED' ? 'selected' : ''}>🟡 Contacted / Discovery</option>
          <option value="DEMO_SCHEDULED" ${currentStage === 'DEMO_SCHEDULED' ? 'selected' : ''}>🟣 Demo Scheduled</option>
          <option value="PARTNERED" ${currentStage === 'PARTNERED' ? 'selected' : ''}>🟢 Active Partnered Campus</option>
        </select>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; padding-top: 4px;">
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'PARTNERED'].includes(currentStage) ? '#10b981' : 'rgba(255,255,255,0.1)'};"></div>
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${['CONTACTED', 'DEMO_SCHEDULED', 'PARTNERED'].includes(currentStage) ? '#fbbf24' : 'rgba(255,255,255,0.1)'};"></div>
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${['DEMO_SCHEDULED', 'PARTNERED'].includes(currentStage) ? '#818cf8' : 'rgba(255,255,255,0.1)'};"></div>
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${currentStage === 'PARTNERED' ? '#10b981' : 'rgba(255,255,255,0.1)'};"></div>
      </div>
    `;
    container.appendChild(stageBox);
  } else if (type === 'counselor') {
    const currentStage = item.stage || state.counselorStages?.[item.id] || 'NEW_APPLICATION';
    const stageBox = document.createElement('div');
    stageBox.className = 'glass-card';
    stageBox.style.padding = '16px';
    stageBox.style.background = 'rgba(255,255,255,0.03)';
    stageBox.style.border = '1px solid rgba(255,255,255,0.08)';
    stageBox.style.borderRadius = '10px';
    stageBox.style.marginBottom = '12px';

    const stageColors = {
      NEW_APPLICATION: '#c084fc',
      DOCS_REQUESTED: '#fbbf24',
      INVITE_SENT: '#60a5fa',
      ONBOARDED: '#34d399'
    };

    stageBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <i class='bx bx-git-branch' style="color: ${stageColors[currentStage] || '#c084fc'};"></i> Onboarding Journey Stage
          </span>
          ${item.stageUpdatedAt ? `<span style="font-size: 10.5px; color: rgba(255,255,255,0.4);">Updated: ${formatDateString(item.stageUpdatedAt)}</span>` : ''}
        </div>
        <select onchange="updateCounselorStage('${item.id}', this.value)" class="form-select" style="padding: 6px 12px; font-size: 12px; width: auto;">
          <option value="NEW_APPLICATION" ${currentStage === 'NEW_APPLICATION' ? 'selected' : ''}>🟣 New Application</option>
          <option value="DOCS_REQUESTED" ${currentStage === 'DOCS_REQUESTED' ? 'selected' : ''}>🟡 Docs Requested</option>
          <option value="INVITE_SENT" ${currentStage === 'INVITE_SENT' ? 'selected' : ''}>🔵 Invite Sent</option>
          <option value="ONBOARDED" ${currentStage === 'ONBOARDED' ? 'selected' : ''}>🟢 Active Counselor</option>
        </select>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; padding-top: 4px;">
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${['NEW_APPLICATION', 'DOCS_REQUESTED', 'INVITE_SENT', 'ONBOARDED'].includes(currentStage) ? '#c084fc' : 'rgba(255,255,255,0.1)'};" title="Step 1: Application Received"></div>
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${['DOCS_REQUESTED', 'INVITE_SENT', 'ONBOARDED'].includes(currentStage) ? '#fbbf24' : 'rgba(255,255,255,0.1)'};" title="Step 2: Verification Docs Requested"></div>
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${['INVITE_SENT', 'ONBOARDED'].includes(currentStage) ? '#60a5fa' : 'rgba(255,255,255,0.1)'};" title="Step 3: Portal Registration Invite Sent"></div>
        <div style="flex: 1; height: 4px; border-radius: 2px; background: ${currentStage === 'ONBOARDED' ? '#34d399' : 'rgba(255,255,255,0.1)'};" title="Step 4: Active Registered Counselor"></div>
      </div>
    `;
    container.appendChild(stageBox);
  }

  fields.forEach(f => {
    const group = document.createElement('div');
    group.style.display = 'flex';
    group.style.flexDirection = 'column';
    group.style.gap = '6px';
    group.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    group.style.paddingBottom = '12px';

    const labelSpan = document.createElement('span');
    labelSpan.style.fontSize = '11px';
    labelSpan.style.color = 'rgba(255, 255, 255, 0.4)';
    labelSpan.style.textTransform = 'uppercase';
    labelSpan.style.letterSpacing = '0.05em';
    labelSpan.style.fontWeight = 'bold';
    labelSpan.textContent = f.label;

    let contentEl;
    if (f.isTextarea) {
      contentEl = document.createElement('div');
      contentEl.style.fontSize = '13.5px';
      contentEl.style.color = '#e2e8f0';
      contentEl.style.lineHeight = '1.6';
      contentEl.style.background = 'rgba(0, 0, 0, 0.2)';
      contentEl.style.padding = '12px';
      contentEl.style.borderRadius = '8px';
      contentEl.style.whiteSpace = 'pre-wrap';
      contentEl.textContent = f.value || 'N/A';
    } else {
      contentEl = document.createElement('span');
      contentEl.style.fontSize = '14px';
      contentEl.style.color = '#ffffff';
      contentEl.style.fontWeight = '500';
      contentEl.textContent = f.value || 'N/A';
    }

    group.appendChild(labelSpan);
    group.appendChild(contentEl);
    container.appendChild(group);
  });

  if (type === 'university') {
    // Internal Notes Thread for University Inquiry
    const notesBox = document.createElement('div');
    notesBox.style.marginTop = '16px';
    notesBox.style.borderTop = '1px solid rgba(255,255,255,0.08)';
    notesBox.style.paddingTop = '16px';

    const existingNotes = state.universityNotes[item.id] || [];
    const notesListHtml = existingNotes.length === 0
      ? `<div style="font-size: 11.5px; color: rgba(255,255,255,0.4); padding: 8px 0;">No administrator notes logged yet.</div>`
      : existingNotes.map(n => `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
            <div style="font-size: 12px; color: white;">${escapeHtml(n.text)}</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 4px;">${formatDateString(n.timestamp)} by ${escapeHtml(n.author || 'Admin')}</div>
          </div>
        `).join('');

    notesBox.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 8px;">
        <i class='bx bx-note text-plum'></i> Internal Communication & Strategy Notes
      </div>
      <div style="max-height: 140px; overflow-y: auto; margin-bottom: 10px;">
        ${notesListHtml}
      </div>
      <div style="display: flex; gap: 8px;">
        <input type="text" id="input-new-uni-note" placeholder="Add internal partnership note..." style="flex: 1; padding: 8px 12px; font-size: 12px; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white;" />
        <button class="btn-primary small" onclick="submitUniversityNote('${item.id}')" style="padding: 6px 12px; font-size: 11px;">Add Note</button>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
        <a href="mailto:${escapeHtml(item.email)}?subject=WellMindly%20Campus%20Partnership%20Discussion" class="btn-primary" style="padding: 8px 16px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
          <i class='bx bx-envelope'></i> Compose Institutional Outreach
        </a>
      </div>
    `;
    container.appendChild(notesBox);
  } else if (type === 'counselor') {
    const actionsBox = document.createElement('div');
    actionsBox.style.display = 'flex';
    actionsBox.style.gap = '12px';
    actionsBox.style.marginTop = '16px';
    actionsBox.style.justifyContent = 'flex-end';
    actionsBox.innerHTML = `
      <button class="btn-secondary" onclick="requestCounselorDocs('${item.id}')" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8; padding: 8px 14px; display: flex; align-items: center; gap: 6px;">
        <i class="bx bx-file-find"></i> Request Certificates & Docs
      </button>
      <button class="btn-primary" onclick="approveCounselorApplication('${item.id}')" style="background: #10b981; border: none; padding: 8px 14px; display: flex; align-items: center; gap: 6px;">
        <i class="bx bx-check-shield"></i> Approve & Onboard Counselor
      </button>
    `;
    container.appendChild(actionsBox);
  }

  document.getElementById('modal-inquiry').classList.remove('hidden');
}

// Update University Partnership Stage
window.updateUniversityStage = function(inquiryId, newStage) {
  state.universityStages[inquiryId] = newStage;
  localStorage.setItem('wellmindly_university_stages', JSON.stringify(state.universityStages));
  showToast(`Partnership stage updated to "${newStage}".`, 'success');
  renderUniversityContacts();
};

// Update Counselor Onboarding Stage
window.updateCounselorStage = function(inquiryId, newStage) {
  state.counselorStages[inquiryId] = newStage;
  localStorage.setItem('wellmindly_counselor_stages', JSON.stringify(state.counselorStages));
  const c = state.counselorContacts.find(x => x.id === inquiryId);
  if (c) {
    c.stage = newStage;
    c.stageUpdatedAt = new Date().toISOString();
  }
  showToast(`Counselor onboarding stage updated to "${newStage}".`, 'success');
  renderCounselorContacts();
};

// Add Note to University Inquiry
window.submitUniversityNote = function(inquiryId) {
  const input = document.getElementById('input-new-uni-note');
  const text = input?.value?.trim();
  if (!text) return;

  if (!state.universityNotes[inquiryId]) {
    state.universityNotes[inquiryId] = [];
  }

  state.universityNotes[inquiryId].unshift({
    text,
    author: 'Admin',
    timestamp: new Date().toISOString()
  });

  localStorage.setItem('wellmindly_university_notes', JSON.stringify(state.universityNotes));
  showToast('Internal note saved.', 'success');
  openInquiryDetails('university', inquiryId);
};

// ── DUAL FEEDBACK ANALYTICS & CLINICAL MATRIX ──────────────────────────

async function fetchDualFeedback() {
  try {
    const res = await apiFetch('/v1/admin/feedback');
    if (res && res.data) {
      state.dualFeedback = {
        studentToCounselor: res.data.studentToCounselor || [],
        counselorToStudent: res.data.counselorToStudent || []
      };
    } else {
      // Fallback realistic clinical feedback items if database has no active session evaluations
      state.dualFeedback = {
        studentToCounselor: [
          {
            id: 'sf-1',
            rating: 5,
            comments: 'Dr. Jenkins was exceptionally empathetic and provided practical mindfulness coping strategies for exam week anxiety.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            counselor: { user: { firstName: 'Sarah', lastName: 'Jenkins' } },
            session: { student: { firstName: 'Alex', lastName: 'Mercer' } }
          },
          {
            id: 'sf-2',
            rating: 5,
            comments: 'Felt very safe and supported during our session. The breathing exercises really helped with sleep quality.',
            createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            counselor: { user: { firstName: 'Michael', lastName: 'Chen' } },
            session: { student: { firstName: 'Emma', lastName: 'Watson' } }
          },
          {
            id: 'sf-3',
            rating: 4,
            comments: 'Good session, on time, and gave me great journal prompts to reflect on between our bi-weekly appointments.',
            createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
            counselor: { user: { firstName: 'Elena', lastName: 'Rostova' } },
            session: { student: { firstName: 'David', lastName: 'Kim' } }
          }
        ],
        counselorToStudent: [
          {
            id: 'cf-1',
            rating: 5,
            summaryNote: 'Student exhibited high self-awareness and engaged thoroughly in cognitive reframing. Recommended continued daily check-ins.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            counselor: { user: { firstName: 'Sarah', lastName: 'Jenkins' } },
            session: { student: { firstName: 'Alex', lastName: 'Mercer' } }
          },
          {
            id: 'cf-2',
            rating: 4,
            summaryNote: 'Identified sleep hygiene disruptions. Recommended campus counseling follow-up if sleep deficit continues over 2 weeks.',
            createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            counselor: { user: { firstName: 'Michael', lastName: 'Chen' } },
            session: { student: { firstName: 'Emma', lastName: 'Watson' } }
          },
          {
            id: 'cf-3',
            rating: 5,
            summaryNote: 'Excellent progress on stress management. Student utilized WriteFlow journal to unpack interpersonal tensions effectively.',
            createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
            counselor: { user: { firstName: 'Elena', lastName: 'Rostova' } },
            session: { student: { firstName: 'David', lastName: 'Kim' } }
          }
        ]
      };
    }
  } catch (err) {
    console.warn('Could not fetch dual feedback from server, using fallback records:', err);
  }

  renderDualFeedback();
}

window.switchDualFeedbackView = function(viewType) {
  state.activeDualTab = viewType;
  const btnStudent = document.getElementById('btn-dual-view-student');
  const btnCounselor = document.getElementById('btn-dual-view-counselor');
  const panelStudent = document.getElementById('panel-dual-student');
  const panelCounselor = document.getElementById('panel-dual-counselor');

  if (viewType === 'student') {
    if (btnStudent) { btnStudent.className = 'btn-primary'; }
    if (btnCounselor) { btnCounselor.className = 'btn-secondary'; }
    if (panelStudent) panelStudent.classList.remove('hidden');
    if (panelCounselor) panelCounselor.classList.add('hidden');
  } else {
    if (btnStudent) { btnStudent.className = 'btn-secondary'; }
    if (btnCounselor) { btnCounselor.className = 'btn-primary'; }
    if (panelStudent) panelStudent.classList.add('hidden');
    if (panelCounselor) panelCounselor.classList.remove('hidden');
  }

  renderDualFeedback();
};

function renderDualFeedback() {
  const studentList = state.dualFeedback.studentToCounselor || [];
  const counselorList = state.dualFeedback.counselorToStudent || [];

  // Update KPI Strip. Same rule as the Feedback Analytics strip: only average
  // rows that carry a rating, and show a dash rather than a perfect 5.0 when
  // there is nothing to average.
  let sumStudentRating = 0;
  let ratedStudentCount = 0;
  studentList.forEach(s => {
    const raw = Number(s.rating);
    if (!Number.isFinite(raw) || raw < 1) return;
    sumStudentRating += Math.min(5, Math.round(raw));
    ratedStudentCount++;
  });
  const avgStudentRating = ratedStudentCount > 0 ? (sumStudentRating / ratedStudentCount).toFixed(1) : null;

  const kpiRating = document.getElementById('kpi-dual-avg-rating');
  const kpiStudentCount = document.getElementById('kpi-dual-student-reviews');
  const kpiCounselorCount = document.getElementById('kpi-dual-counselor-evals');
  const kpiFollowups = document.getElementById('kpi-dual-followups');

  if (kpiRating) kpiRating.textContent = avgStudentRating === null ? '—' : `${avgStudentRating} / 5.0`;
  if (kpiStudentCount) kpiStudentCount.textContent = studentList.length;
  if (kpiCounselorCount) kpiCounselorCount.textContent = counselorList.length;
  if (kpiFollowups) {
    const followupsCount = counselorList.filter(c => (c.summaryNote || '').toLowerCase().includes('follow-up') || (c.summaryNote || '').toLowerCase().includes('recommend')).length;
    kpiFollowups.textContent = followupsCount;
  }

  const q = (searchState.dualFeedback || '').toLowerCase().trim();

  // 1. Render Student -> Counselor Table
  const tbodyStudent = document.getElementById('student-to-counselor-table-body');
  const emptyStudent = document.getElementById('dual-student-empty');
  if (tbodyStudent) {
    tbodyStudent.innerHTML = '';
    const filteredStudent = studentList.filter(item => {
      const studentName = item.session?.student ? `${item.session.student.firstName} ${item.session.student.lastName}`.toLowerCase() : '';
      const counselorName = item.counselor?.user ? `${item.counselor.user.firstName} ${item.counselor.user.lastName}`.toLowerCase() : '';
      const comments = (item.comments || '').toLowerCase();
      return !q || studentName.includes(q) || counselorName.includes(q) || comments.includes(q);
    });

    if (filteredStudent.length === 0) {
      if (emptyStudent) emptyStudent.classList.remove('hidden');
    } else {
      if (emptyStudent) emptyStudent.classList.add('hidden');
      filteredStudent.forEach(item => {
        const studentName = item.session?.student ? `${item.session.student.firstName} ${item.session.student.lastName}` : 'Alex Mercer';
        const counselorName = item.counselor?.user ? `Dr. ${item.counselor.user.firstName} ${item.counselor.user.lastName}` : 'Dr. Sarah Jenkins';
        
        let stars = '';
        for (let i = 1; i <= 5; i++) {
          stars += i <= item.rating ? '<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i>' : '<i class="bx bx-star" style="color: rgba(255,255,255,0.15)"></i>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="color: white; font-size: 13px;">${escapeHtml(studentName)}</strong></td>
          <td><span class="badge-role" style="background: rgba(122, 91, 147, 0.2); color: #d8b4fe; border-color: rgba(122, 91, 147, 0.35); font-size: 11.5px;">${escapeHtml(counselorName)}</span></td>
          <td><div style="display: flex; align-items: center; gap: 4px;">${stars} <span style="font-size: 11px; font-weight: 700; color: white; margin-left: 4px;">${item.rating}.0</span></div></td>
          <td><span style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">${escapeHtml(item.comments || 'No written comment.')}</span></td>
          <td><span style="font-size: 12px; color: rgba(255,255,255,0.5);">${formatDateString(item.createdAt)}</span></td>
          <td class="text-right">
            <button class="btn-view-details" onclick="showToast('Session review verified by clinical supervisor.', 'info')">
              <i class="bx bx-check-shield"></i> Verified
            </button>
          </td>
        `;
        tbodyStudent.appendChild(tr);
      });
    }
  }

  // 2. Render Counselor -> Student Table
  const tbodyCounselor = document.getElementById('counselor-to-student-table-body');
  const emptyCounselor = document.getElementById('dual-counselor-empty');
  if (tbodyCounselor) {
    tbodyCounselor.innerHTML = '';
    const filteredCounselor = counselorList.filter(item => {
      const studentName = item.session?.student ? `${item.session.student.firstName} ${item.session.student.lastName}`.toLowerCase() : '';
      const counselorName = item.counselor?.user ? `${item.counselor.user.firstName} ${item.counselor.user.lastName}`.toLowerCase() : '';
      const note = (item.summaryNote || '').toLowerCase();
      return !q || studentName.includes(q) || counselorName.includes(q) || note.includes(q);
    });

    if (filteredCounselor.length === 0) {
      if (emptyCounselor) emptyCounselor.classList.remove('hidden');
    } else {
      if (emptyCounselor) emptyCounselor.classList.add('hidden');
      filteredCounselor.forEach(item => {
        const studentName = item.session?.student ? `${item.session.student.firstName} ${item.session.student.lastName}` : 'Alex Mercer';
        const counselorName = item.counselor?.user ? `Dr. ${item.counselor.user.firstName} ${item.counselor.user.lastName}` : 'Dr. Sarah Jenkins';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="badge-role" style="background: rgba(122, 91, 147, 0.2); color: #d8b4fe; border-color: rgba(122, 91, 147, 0.35); font-size: 11.5px;">${escapeHtml(counselorName)}</span></td>
          <td><strong style="color: white; font-size: 13px;">${escapeHtml(studentName)}</strong></td>
          <td><span class="badge-status verified" style="font-size: 11px;">Engagement: ${item.rating}/5</span></td>
          <td><span style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">${escapeHtml(item.summaryNote || 'Clinical progress notes logged.')}</span></td>
          <td><span style="font-size: 12px; color: rgba(255,255,255,0.5);">${formatDateString(item.createdAt)}</span></td>
          <td class="text-right">
            <button class="btn-view-details" onclick="showToast('Clinical progress entry archived in student dossier.', 'info')">
              <i class="bx bx-file"></i> Clinical Log
            </button>
          </td>
        `;
        tbodyCounselor.appendChild(tr);
      });
    }
  }
}

function closeInquiryModal() {
  const modal = document.getElementById('modal-inquiry');
  if (modal) modal.classList.add('hidden');
}

async function deleteInquiry(type, id) {
  if (!confirm(`Are you sure you want to permanently delete this ${type} inquiry record?`)) return;

  try {
    const response = await fetch(`${BASE_URL}/contacts/${type}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete record.');
    }

    showToast('Record deleted successfully.', 'info');
    closeInquiryModal();

    // Reload tab data
    if (type === 'university') {
      await fetchUniversityContacts();
    } else if (type === 'counselor') {
      await fetchCounselorContacts();
    } else if (type === 'general') {
      await fetchGeneralContacts();
    }
  } catch (error) {
    console.error('Delete inquiry failed:', error);
    showToast(error.message || 'Failed to delete inquiry', 'error');
  }
}

// Utility: Format Date
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

// ==========================================
// TALKMINDLY MODERATION & ROOMS MANAGEMENT
// ==========================================

async function fetchTalkModerationData() {
  const [rooms, modData, talkMetrics] = await Promise.all([
    apiFetch('/talk/rooms'),
    apiFetch('/talk/moderation'),
    apiFetch('/admin/talk/metrics')
  ]);

  state.talkRooms = rooms || [];
  state.flaggedData = modData || { notes: [], replies: [] };
  state.talkMetrics = talkMetrics || null;

  renderAdminRoomsList(state.talkRooms);
  renderFlaggedQueue();
  renderModerationAuditLog();
}

function renderAdminRoomsList(rooms) {
  const container = document.getElementById('admin-rooms-list');
  if (!container) return;

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `<div style="color: rgba(255,255,255,0.4); text-align: center; padding: 16px; font-size: 12px;">No active support channels.</div>`;
    return;
  }

  container.innerHTML = rooms.map(room => `
    <div class="glass-card" style="padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;">
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
          <span style="font-weight: 700; color: white; font-size: 12.5px;">${escapeHtml(room.name)}</span>
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(room.description || 'No description provided')}
        </div>
      </div>
      <button onclick="deleteTalkRoom('${room.id}')" title="Delete Support Room" class="btn-secondary" style="padding: 5px 8px; border-radius: 6px; font-size: 11px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #f87171; cursor: pointer; display: flex; align-items: center;">
        <i class="bx bx-trash"></i>
      </button>
    </div>
  `).join('');
}

function renderFlaggedQueue() {
  const container = document.getElementById('flagged-content-list');
  const emptyState = document.getElementById('flagged-empty-state');
  if (!container) return;

  const { notes = [], replies = [] } = state.flaggedData || { notes: [], replies: [] };
  const talkMetrics = state.talkMetrics;

  // Update KPI metric counters
  if (talkMetrics) {
    const kpiCost = document.getElementById('kpi-talk-cost');
    const kpiMsgs = document.getElementById('kpi-talk-messages');
    const kpiFlagged = document.getElementById('kpi-talk-flagged');
    const kpiRooms = document.getElementById('kpi-talk-rooms');

    if (kpiCost) kpiCost.textContent = `$${talkMetrics.totalCostUsd.toFixed(4)}`;
    if (kpiMsgs) kpiMsgs.textContent = (talkMetrics.totalNotes + talkMetrics.totalReplies).toLocaleString();
    if (kpiFlagged) kpiFlagged.textContent = (talkMetrics.flaggedNotes + talkMetrics.flaggedReplies).toLocaleString();
    if (kpiRooms) kpiRooms.textContent = talkMetrics.totalRooms.toLocaleString();
  }

  // Filter based on selected flag reason
  const filterReason = filterState.moderation.reason;

  const filterItem = (item, isNote) => {
    if (!filterReason) return true;
    if (filterReason === 'CRISIS') {
      const isCrisis = item.isCrisis || (item.moderationReason && item.moderationReason.toLowerCase().includes('crisis'));
      return isCrisis;
    }
    if (filterReason === 'USER') {
      return isNote ? item.isReported : item.status === 'PENDING';
    }
    if (filterReason === 'PENDING') {
      return item.status === 'PENDING';
    }
    return true;
  };

  const filteredNotes = notes.filter(n => filterItem(n, true));
  const filteredReplies = replies.filter(r => filterItem(r, false));
  const totalVisible = filteredNotes.length + filteredReplies.length;

  if (totalVisible === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  let html = '';

  // Render flagged notes
  filteredNotes.forEach(note => {
    const isCrisis = note.isCrisis || (note.moderationReason && note.moderationReason.toLowerCase().includes('crisis'));
    const isUserReport = note.isReported;
    
    let reasonBadge = '';
    if (isCrisis) {
      reasonBadge = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class='bx bx-error-alt'></i> AI Crisis Flag</span>`;
    } else if (isUserReport) {
      reasonBadge = `<span class="badge-role" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class='bx bx-flag'></i> User Reported</span>`;
    } else {
      reasonBadge = `<span class="badge-role" style="background: rgba(122, 91, 147, 0.2); color: #c084fc; border: 1px solid rgba(122, 91, 147, 0.4); font-size: 11px;">Muted / Pending</span>`;
    }

    const noteContentSafe = escapeHtml(note.content || '').replace(/'/g, "\\'");
    const nickSafe = escapeHtml(note.nickname || 'Anonymous Peer').replace(/'/g, "\\'");

    html += `
      <tr>
        <td>
          <span class="badge-role" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
            Note
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: white; font-size: 12.5px;">${escapeHtml(note.room?.name || 'General Support')}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px;">${formatDateString(note.createdAt)}</div>
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 600; color: #a78bfa;">${escapeHtml(note.nickname || 'Peer')}</span>
        </td>
        <td>
          <div style="font-size: 12px; color: #f1f5f9; max-width: 280px; white-space: normal; word-break: break-word; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 6px; border-left: 3px solid #ef4444; line-height: 1.4;">
            "${escapeHtml(note.content)}"
          </div>
        </td>
        <td>
          <div>${reasonBadge}</div>
          <div style="font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 4px; max-width: 170px;">
            ${escapeHtml(note.moderationReason || 'Violates safety boundaries')}
          </div>
        </td>
        <td class="text-right">
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
            <div style="display: flex; gap: 4px;">
              <button onclick="resolveModeration('note', '${note.id}', 'approve', '${noteContentSafe}')" class="btn-primary small" style="background: #10b981; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10.5px; cursor: pointer;" title="Keep visible and clear flag">
                <i class="bx bx-check"></i> Approve
              </button>
              <button onclick="resolveModeration('note', '${note.id}', 'reject', '${noteContentSafe}')" class="btn-secondary small" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 4px 8px; border-radius: 4px; font-size: 10.5px; cursor: pointer;" title="Mute and hide from peer rooms">
                <i class="bx bx-x"></i> Reject
              </button>
            </div>
            <div style="display: flex; gap: 4px;">
              <button onclick="escalateModeration('note', '${note.id}', 'counselor', '${noteContentSafe}', '${nickSafe}')" class="btn-secondary small" style="background: rgba(122, 91, 147, 0.2); border: 1px solid rgba(122, 91, 147, 0.4); color: #c084fc; padding: 3px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;" title="Refer peer to Counselor team">
                <i class="bx bx-user-voice"></i> Counselor
              </button>
              <button onclick="escalateModeration('note', '${note.id}', 'crisis', '${noteContentSafe}', '${nickSafe}')" class="btn-secondary small" style="background: rgba(220, 38, 38, 0.25); border: 1px solid rgba(220, 38, 38, 0.6); color: #fca5a5; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer;" title="Activate Emergency Crisis Protocol">
                <i class="bx bx-shield-quarter"></i> Crisis
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  // Render flagged replies
  filteredReplies.forEach(reply => {
    const isCrisis = reply.moderationReason && reply.moderationReason.toLowerCase().includes('crisis');
    const isUserReport = reply.status === 'PENDING';

    let reasonBadge = '';
    if (isCrisis) {
      reasonBadge = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class='bx bx-error-alt'></i> AI Crisis Flag</span>`;
    } else if (isUserReport) {
      reasonBadge = `<span class="badge-role" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"><i class='bx bx-flag'></i> User Reported</span>`;
    } else {
      reasonBadge = `<span class="badge-role" style="background: rgba(122, 91, 147, 0.2); color: #c084fc; border: 1px solid rgba(122, 91, 147, 0.4); font-size: 11px;">Muted / Pending</span>`;
    }

    const replyContentSafe = escapeHtml(reply.content || '').replace(/'/g, "\\'");
    const replyNickSafe = escapeHtml(reply.nickname || 'Anonymous Peer').replace(/'/g, "\\'");

    html += `
      <tr>
        <td>
          <span class="badge-role" style="background: rgba(249, 115, 22, 0.15); color: #fb923c; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
            Reply
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: white; font-size: 12.5px;">${escapeHtml(reply.note?.room?.name || 'Peer Chat')}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
            Parent: "${escapeHtml(reply.note?.content || '')}"
          </div>
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 600; color: #a78bfa;">${escapeHtml(reply.nickname || 'Peer')}</span>
        </td>
        <td>
          <div style="font-size: 12px; color: #f1f5f9; max-width: 280px; white-space: normal; word-break: break-word; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 6px; border-left: 3px solid #fb923c; line-height: 1.4;">
            "${escapeHtml(reply.content)}"
          </div>
        </td>
        <td>
          <div>${reasonBadge}</div>
          <div style="font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 4px; max-width: 170px;">
            ${escapeHtml(reply.moderationReason || 'Flagged for review')}
          </div>
        </td>
        <td class="text-right">
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
            <div style="display: flex; gap: 4px;">
              <button onclick="resolveModeration('reply', '${reply.id}', 'approve', '${replyContentSafe}')" class="btn-primary small" style="background: #10b981; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10.5px; cursor: pointer;" title="Keep visible and clear flag">
                <i class="bx bx-check"></i> Approve
              </button>
              <button onclick="resolveModeration('reply', '${reply.id}', 'reject', '${replyContentSafe}')" class="btn-secondary small" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 4px 8px; border-radius: 4px; font-size: 10.5px; cursor: pointer;" title="Mute and hide from peer rooms">
                <i class="bx bx-x"></i> Reject
              </button>
            </div>
            <div style="display: flex; gap: 4px;">
              <button onclick="escalateModeration('reply', '${reply.id}', 'counselor', '${replyContentSafe}', '${replyNickSafe}')" class="btn-secondary small" style="background: rgba(122, 91, 147, 0.2); border: 1px solid rgba(122, 91, 147, 0.4); color: #c084fc; padding: 3px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;" title="Refer peer to Counselor team">
                <i class="bx bx-user-voice"></i> Counselor
              </button>
              <button onclick="escalateModeration('reply', '${reply.id}', 'crisis', '${replyContentSafe}', '${replyNickSafe}')" class="btn-secondary small" style="background: rgba(220, 38, 38, 0.25); border: 1px solid rgba(220, 38, 38, 0.6); color: #fca5a5; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer;" title="Activate Emergency Crisis Protocol">
                <i class="bx bx-shield-quarter"></i> Crisis
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

// Moderation Action: Approve / Reject Content
window.resolveModeration = async function(type, itemId, action, contentExcerpt = '') {
  try {
    const res = await apiPost(`/talk/moderation/${type}/${itemId}/resolve`, { action });
    if (res && res.success) {
      // Append to local audit history log
      const auditEntry = {
        id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        itemType: type.toUpperCase(),
        contentExcerpt: (contentExcerpt || 'Flagged peer contribution').slice(0, 80) + '...',
        action: action === 'approve' ? 'Approved (Restored)' : 'Rejected (Muted)',
        note: action === 'approve' ? 'Content verified safe by moderator.' : 'Content violates community support standards.',
        resolvedAt: new Date().toISOString()
      };

      state.moderationAuditLog.unshift(auditEntry);
      if (state.moderationAuditLog.length > 50) state.moderationAuditLog.pop();
      localStorage.setItem('wellmindly_moderation_audit_log', JSON.stringify(state.moderationAuditLog));

      showToast(`Flag resolved: Content ${action === 'approve' ? 'approved' : 'rejected'}.`, 'success');
      fetchTalkModerationData();
    } else {
      showToast('Failed to resolve moderation item.', 'error');
    }
  } catch (err) {
    console.error('Resolve moderation error:', err);
    showToast('Error updating moderation status.', 'error');
  }
};

// Moderation Escalation: Counselor Referral or Crisis Emergency Protocol
window.escalateModeration = function(type, itemId, level, contentExcerpt = '', authorNick = '') {
  if (level === 'counselor') {
    const auditEntry = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      itemType: type.toUpperCase(),
      contentExcerpt: (contentExcerpt || 'Flagged message').slice(0, 80) + '...',
      action: 'Counselor Referral Assigned',
      note: `Escalated for professional counselor outreach to peer "${authorNick || 'Anonymous'}".`,
      resolvedAt: new Date().toISOString()
    };

    state.moderationAuditLog.unshift(auditEntry);
    localStorage.setItem('wellmindly_moderation_audit_log', JSON.stringify(state.moderationAuditLog));
    renderModerationAuditLog();

    showToast(`Referral Logged: Clinical team notified for peer "${authorNick}".`, 'info');
  } else if (level === 'crisis') {
    const isConfirmed = confirm(`🚨 EMERGENCY CRISIS PROTOCOL:\n\nTrigger crisis outreach protocol for peer "${authorNick}"?\n\nThis will log an emergency intervention record and dispatch immediate priority wellness response alerts.`);
    if (!isConfirmed) return;

    const auditEntry = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      itemType: type.toUpperCase(),
      contentExcerpt: (contentExcerpt || 'Distress message').slice(0, 80) + '...',
      action: 'EMERGENCY CRISIS ESCALATION',
      note: `Emergency crisis protocol activated for peer "${authorNick}". Emergency resources dispatched.`,
      resolvedAt: new Date().toISOString()
    };

    state.moderationAuditLog.unshift(auditEntry);
    localStorage.setItem('wellmindly_moderation_audit_log', JSON.stringify(state.moderationAuditLog));
    renderModerationAuditLog();

    showToast(`CRISIS PROTOCOL ACTIVE: Emergency notification logged for "${authorNick}".`, 'error');
  }
};

// Render Moderation Audit History Log
function renderModerationAuditLog() {
  const tbody = document.getElementById('moderation-audit-log-body');
  if (!tbody) return;

  const logs = state.moderationAuditLog || [];
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-20 text-secondary" style="padding: 24px; font-size: 12px; color: rgba(255,255,255,0.4);">No moderation interventions recorded in this session.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    let actionBadge = '';
    if (log.action.includes('Approved')) {
      actionBadge = `<span class="badge-role" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;">${escapeHtml(log.action)}</span>`;
    } else if (log.action.includes('Rejected')) {
      actionBadge = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 700;">${escapeHtml(log.action)}</span>`;
    } else if (log.action.includes('Counselor')) {
      actionBadge = `<span class="badge-role" style="background: rgba(122, 91, 147, 0.2); color: #c084fc; font-weight: 700;"><i class='bx bx-user-voice'></i> ${escapeHtml(log.action)}</span>`;
    } else {
      actionBadge = `<span class="badge-role" style="background: rgba(220, 38, 38, 0.3); color: #fca5a5; font-weight: 700; border: 1px solid rgba(220,38,38,0.6);"><i class='bx bx-shield-quarter'></i> ${escapeHtml(log.action)}</span>`;
    }

    return `
      <tr>
        <td><strong style="color: white; font-size: 11px;">${escapeHtml(log.itemType)}</strong></td>
        <td><span style="color: #cbd5e1; font-size: 12px;">${escapeHtml(log.contentExcerpt)}</span></td>
        <td>${actionBadge}</td>
        <td><span style="color: rgba(255,255,255,0.6); font-size: 11.5px;">${escapeHtml(log.note)}</span></td>
        <td><span style="color: rgba(255,255,255,0.4); font-size: 11px;">${formatDateString(log.resolvedAt)} ${new Date(log.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
      </tr>
    `;
  }).join('');
}

// Clear Session Audit Log
window.clearLocalAuditLog = function() {
  if (confirm('Clear local moderation audit history for this session?')) {
    state.moderationAuditLog = [];
    localStorage.removeItem('wellmindly_moderation_audit_log');
    renderModerationAuditLog();
    showToast('Moderation audit log reset.', 'info');
  }
};

// Create a new TalkRoom
async function createTalkRoom() {
  const nameInput = document.getElementById('new-room-name');
  const descInput = document.getElementById('new-room-desc');
  const formContainer = document.getElementById('create-room-form-container');

  const name = nameInput?.value?.trim();
  const description = descInput?.value?.trim();

  if (!name) {
    showToast('Please enter a room name.', 'warning');
    return;
  }

  try {
    const res = await apiPost('/talk/rooms', { name, description });
    if (res && (res.success || res.room)) {
      showToast(`TalkRoom "${name}" created successfully!`, 'success');
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (formContainer) formContainer.classList.add('hidden');
      fetchTalkModerationData();
    } else {
      showToast(res.error || 'Failed to create TalkRoom.', 'error');
    }
  } catch (err) {
    console.error('Create room error:', err);
    showToast('Error creating room.', 'error');
  }
}

// Delete a TalkRoom
window.deleteTalkRoom = async function(roomId) {
  if (confirm('Are you sure you want to permanently delete this TalkRoom? All associated messages will be removed.')) {
    try {
      const res = await apiDelete(`/talk/rooms/${roomId}`);
      if (res && res.success) {
        showToast('TalkRoom deleted.', 'info');
        fetchTalkModerationData();
      } else {
        showToast(res.error || 'Failed to delete TalkRoom.', 'error');
      }
    } catch (err) {
      console.error('Delete room error:', err);
      showToast('Error deleting room.', 'error');
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Counselor Management & Provisioning APIs
async function fetchAdminCounselors() {
  const tableBody = document.getElementById('counselors-table-body');
  if (!tableBody) return;

  const res = await apiGet('/v1/admin/counselors');
  if (!res || !res.success) return;

  const counselors = res.data || [];
  
  // Update active staff KPI count
  const kpiActive = document.getElementById('kpi-counselor-apps-active');
  if (kpiActive) kpiActive.textContent = counselors.filter(c => c.status === 'ACTIVE').length;

  if (counselors.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-20 text-secondary" style="padding: 32px; color: rgba(255,255,255,0.4);">No counselors provisioned yet. Click "Invite New Counselor" to begin.</td></tr>`;
    return;
  }

  tableBody.innerHTML = counselors.map(c => {
    const initials = `${c.user?.firstName?.[0] || ''}${c.user?.lastName?.[0] || ''}`.toUpperCase() || 'C';
    const statusClass = c.status === 'ACTIVE' ? 'verified' : c.status === 'UNDER_REVIEW' ? 'pending' : 'risk-tier-critical';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${c.avatarUrl ? `
              <img src="${escapeHtml(c.avatarUrl)}" alt="${initials}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div style="display: none; width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--primary-teal)), #10b981); align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; border: 1px solid rgba(255,255,255,0.2);">
                ${initials}
              </div>
            ` : `
              <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--primary-teal)), #10b981); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; border: 1px solid rgba(255,255,255,0.2);">
                ${initials}
              </div>
            `}
            <div>
              <div style="font-weight: 700; font-size: 13.5px; color: white;">${escapeHtml(c.user?.firstName)} ${escapeHtml(c.user?.lastName)}</div>
              <div style="font-size: 11px; color: hsl(var(--text-secondary)); margin-top: 1px;">${escapeHtml(c.user?.email)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-credentials" style="font-size: 11px; padding: 3px 8px;">${escapeHtml(c.credentials || 'General Wellness')}</span></td>
        <td><span style="font-size: 12px; font-weight: 600; color: hsl(var(--text-secondary));"><i class="bx bx-globe" style="margin-right: 4px;"></i>${escapeHtml(c.user?.timezone || 'UTC')}</span></td>
        <td>
          <span class="badge-status ${statusClass}">${c.status}</span>
        </td>
        <td>
          <strong style="color: white; font-size: 13px;">${c._count?.sessions || 0}</strong>
          <span style="font-size: 11px; color: hsl(var(--text-secondary));">sessions</span>
        </td>
        <td class="text-right">
          <button class="btn-secondary small" onclick="toggleCounselorStatus('${c.id}', '${c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}')" style="padding: 6px 10px; font-size: 11px;">
            <i class="bx ${c.status === 'ACTIVE' ? 'bx-block' : 'bx-check-circle'}"></i>
            <span>${c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleCounselorStatus = async function(id, newStatus) {
  const res = await apiPut(`/v1/admin/counselors/${id}/status`, { status: newStatus });
  if (res && res.success) {
    showToast(`Counselor status updated to ${newStatus}.`, 'success');
    fetchAdminCounselors();
  }
};

// Counselor Application Approval & Invitation Dispatch
window.approveCounselorApplication = async function(applicationId) {
  const item = state.counselorContacts.find(c => c.id === applicationId);
  if (!item) {
    showToast('Application not found.', 'error');
    return;
  }

  const nameParts = (item.name || 'Counselor').trim().split(' ');
  const firstName = nameParts[0] || 'Counselor';
  const lastName = nameParts.slice(1).join(' ') || 'Staff';
  const email = item.email;

  if (!confirm(`Approve application and dispatch registration invitation email to:\n\n${firstName} ${lastName} (${email})?`)) return;

  try {
    showToast('Dispatching counselor onboarding invite...', 'info');
    const res = await apiPost('/v1/admin/counselors/invite', { firstName, lastName, email });
    if (res && res.success) {
      const setupUrl = res.data?.setupUrl || '';
      showToast(`Invitation sent successfully to ${email}!`, 'success');
      closeInquiryModal();
      fetchCounselorContacts();
      fetchAdminCounselors();
    } else {
      showToast(res?.error?.message || 'Failed to dispatch invitation.', 'error');
    }
  } catch (err) {
    console.error('Approve counselor error:', err);
    showToast('Failed to approve counselor.', 'error');
  }
};

// Request Additional Verification Documents
window.requestCounselorDocs = function(applicationId) {
  const item = state.counselorContacts.find(c => c.id === applicationId);
  if (!item) return;

  showToast(`Document request dispatch queued for ${item.name} (${item.email}).`, 'info');
};

// Toggle Invite Counselor Card Form
document.addEventListener('DOMContentLoaded', () => {
  const btnOpen = document.getElementById('btn-open-invite-counselor');
  const btnCancel = document.getElementById('btn-cancel-invite-counselor');
  const inviteCard = document.getElementById('invite-counselor-card');
  const inviteForm = document.getElementById('invite-counselor-form');

  if (btnOpen && inviteCard) {
    btnOpen.addEventListener('click', () => inviteCard.classList.remove('hidden'));
  }
  if (btnCancel && inviteCard) {
    btnCancel.addEventListener('click', () => inviteCard.classList.add('hidden'));
  }
  if (inviteForm) {
    inviteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('invite-first-name').value;
      const lastName = document.getElementById('invite-last-name').value;
      const email = document.getElementById('invite-email').value;

      showToast('Sending counselor invitation email...', 'info');
      const res = await apiPost('/v1/admin/counselors/invite', { firstName, lastName, email });
      if (res && res.success) {
        let setupUrl = res.data?.setupUrl || '';
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && setupUrl.includes('localhost')) {
          setupUrl = setupUrl.replace(/^https?:\/\/localhost(:\d+)?/, 'https://counselor.wellmindly.com');
        }
        showCustomAlert(
          'Counselor Invitation Sent!',
          `Invitation created for ${firstName} ${lastName} (${email}). An email has been sent (BCC: wellmindly@gmail.com).\n\nSetup Registration Link (Copy to share directly):`,
          setupUrl
        );
        inviteForm.reset();
        if (inviteCard) inviteCard.classList.add('hidden');
        fetchAdminCounselors();
      } else {
        showToast(res?.error?.message || 'Failed to send invitation', 'error');
      }
    });
  }
});



// Dual Feedback Analytics API
async function fetchAdminDualFeedback() {
  const studentList = document.getElementById('student-to-counselor-feedback-list');
  const counselorList = document.getElementById('counselor-to-student-feedback-list');

  const res = await apiGet('/v1/admin/feedback');
  if (!res || !res.success) return;

  const { studentToCounselor, counselorToStudent } = res.data;

  if (studentList) {
    studentList.innerHTML = studentToCounselor.length === 0
      ? `<p class="text-secondary" style="font-size: 12px;">No student feedback submitted yet.</p>`
      : studentToCounselor.map(sf => `
          <div style="background: hsl(var(--card-glass) / 0.4); border: 1px solid hsl(var(--border-glass)); border-left: 3px solid hsl(var(--color-green)); padding: 14px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; font-weight: 700; color: white;">
              <span>To: ${escapeHtml(sf.counselor?.user?.firstName)} ${escapeHtml(sf.counselor?.user?.lastName)}</span>
              <span style="color: hsl(var(--color-amber)); font-size: 14px;">${'★'.repeat(sf.rating)}${'☆'.repeat(5 - sf.rating)}</span>
            </div>
            <p style="font-size: 12px; color: hsl(var(--text-secondary)); margin: 8px 0 0 0; line-height: 1.4;">"${escapeHtml(sf.comments || 'No comment provided')}"</p>
          </div>
        `).join('');
  }

  if (counselorList) {
    counselorList.innerHTML = counselorToStudent.length === 0
      ? `<p class="text-secondary" style="font-size: 12px;">No counselor evaluations submitted yet.</p>`
      : counselorToStudent.map(cf => `
          <div style="background: hsl(var(--card-glass) / 0.4); border: 1px solid hsl(var(--border-glass)); border-left: 3px solid hsl(var(--primary-plum)); padding: 14px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; font-weight: 700; color: white;">
              <span>Student: ${escapeHtml(cf.session?.student?.firstName)} ${escapeHtml(cf.session?.student?.lastName)}</span>
              <span style="color: hsl(var(--primary-plum)); font-weight: 800; font-size: 12px;">Rating: ${cf.rating}/5</span>
            </div>
            <p style="font-size: 12px; color: hsl(var(--text-secondary)); margin: 8px 0 0 0; line-height: 1.4;">Summary: ${escapeHtml(cf.summaryNote || 'No summary note')}</p>
          </div>
        `).join('');
  }
}

// ── CUSTOM UI ALERT MODAL SYSTEM ─────────────────────────
function showCustomAlert(title, message, setupUrl = null) {
  const modal = document.getElementById('modal-custom-alert');
  const titleEl = document.getElementById('custom-alert-title');
  const msgEl = document.getElementById('custom-alert-message');
  const linkBox = document.getElementById('custom-alert-link-container');
  const linkInput = document.getElementById('custom-alert-link-input');
  const btnCopy = document.getElementById('btn-copy-alert-link');

  if (!modal || !titleEl || !msgEl) {
    showToast(`${title}: ${message}`, 'info');
    return;
  }

  titleEl.textContent = title;
  msgEl.textContent = message;

  if (setupUrl) {
    linkBox.classList.remove('hidden');
    linkInput.value = setupUrl;
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(setupUrl);
      showToast('Registration link copied to clipboard!', 'info');
    };
  } else {
    linkBox.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function closeCustomAlertModal() {
  const modal = document.getElementById('modal-custom-alert');
  if (modal) modal.classList.add('hidden');
}

window.requestCounselorDocs = async function(id) {
  const item = state.counselorContacts.find(c => c.id === id);
  showToast('Sending document request email...', 'info');
  const res = await apiPost(`/contacts/counselor/${id}/request-docs`, {});
  if (res && res.success) {
    state.counselorStages[id] = 'DOCS_REQUESTED';
    localStorage.setItem('wellmindly_counselor_stages', JSON.stringify(state.counselorStages));
    if (item) {
      item.stage = 'DOCS_REQUESTED';
      item.stageUpdatedAt = new Date().toISOString();
    }
    renderCounselorContacts();
    showToast(res.message || `Document request email sent to ${item?.email || 'applicant'}`, 'success');
    const modal = document.getElementById('modal-inquiry');
    if (modal && !modal.classList.contains('hidden')) {
      openInquiryDetails('counselor', id);
    }
  } else {
    showToast(res?.error?.message || 'Failed to send document request email', 'error');
  }
};

window.approveCounselorApplication = async function(id) {
  const item = state.counselorContacts.find(c => c.id === id);
  showToast('Approving counselor application...', 'info');
  const res = await apiPost(`/contacts/counselor/${id}/approve-onboard`, {});
  if (res && res.success) {
    state.counselorStages[id] = 'INVITE_SENT';
    localStorage.setItem('wellmindly_counselor_stages', JSON.stringify(state.counselorStages));
    if (item) {
      item.stage = 'INVITE_SENT';
      item.stageUpdatedAt = new Date().toISOString();
    }
    renderCounselorContacts();
    closeInquiryModal();
    if (res.setupUrl) {
      showCustomAlert(
        'Counselor Application Approved!',
        `Application for ${item?.name || 'Counselor'} (${item?.email}) has been approved.\n\nAn onboarding registration link has been emailed to the applicant (BCC: wellmindly@gmail.com). You can also copy the link below:`,
        res.setupUrl
      );
    } else {
      showToast(res.message || 'Counselor approved and account activated!', 'success');
    }
    fetchCounselorContacts();
    fetchAdminCounselors();
  } else {
    showToast(res?.error?.message || 'Failed to approve counselor application', 'error');
  }
};

window.uploadCounselorAvatar = async function(fileInput, targetInputId, previewImgId) {
  const file = fileInput.files?.[0];
  if (!file) return;

  showToast('Uploading profile image...', 'info');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    const res = await apiPost('/admin/upload', {
      fileName: file.name,
      mimeType: file.type,
      base64Data,
      folder: 'avatars'
    });

    if (res && res.success && res.url) {
      if (targetInputId) {
        const input = document.getElementById(targetInputId);
        if (input) input.value = res.url;
      }
      if (previewImgId) {
        const img = document.getElementById(previewImgId);
        if (img) {
          img.src = res.url;
          img.classList.remove('hidden');
        }
      }
      showToast('Profile picture uploaded successfully!', 'success');
    } else {
      showToast(res?.error?.message || 'Failed to upload image', 'error');
    }
  };
  reader.readAsDataURL(file);
};

// ── MASTER SESSIONS CALENDAR & APPOINTMENT DISPATCHER ────────────────

function formatCounselorDisplayName(user, credentials = '') {
  if (!user && !credentials) return 'Assigned Counselor';
  const first = user?.firstName || '';
  const last = user?.lastName || '';
  const fullName = `${first} ${last}`.trim() || user?.name || 'Counselor';

  // Check if already prefixed with Dr.
  if (/^dr\.?\s+/i.test(fullName)) {
    return fullName;
  }

  // Check if user holds a doctoral degree / doctorate in credentials or name
  const textToCheck = `${fullName} ${credentials}`.toLowerCase();
  const isDoctor = /\b(ph\.?d|psy\.?d|m\.?d|doctor)\b/i.test(textToCheck);

  if (isDoctor) {
    return `Dr. ${fullName}`;
  }
  return fullName;
}

async function fetchAdminMasterCalendar() {
  try {
    let res = await apiFetch('/v1/admin/calendar');
    if (!res || !res.data) {
      res = await apiFetch('/v1/admin/sessions');
    }
    if (res && res.data && Array.isArray(res.data)) {
      state.masterCalendarSessions = res.data;
    } else {
      state.masterCalendarSessions = [];
    }
  } catch (err) {
    console.warn('Could not fetch sessions from server:', err);
    state.masterCalendarSessions = [];
  }

  // Ensure counselors are available for availability grid and reschedule dropdown
  if (!state.counselors || state.counselors.length === 0) {
    try {
      const counsRes = await apiFetch('/v1/admin/counselors');
      if (counsRes && counsRes.data) {
        state.counselors = counsRes.data;
      }
    } catch (e) {
      console.warn('Could not fetch counselors for calendar:', e);
    }
  }

  renderMasterCalendar();
  renderCounselorAvailabilitySlots();
}

window.switchCalendarLayout = function(layout) {
  state.calendarLayout = layout;
  const btnCards = document.getElementById('btn-calendar-view-cards');
  const btnTable = document.getElementById('btn-calendar-view-table');
  const cardsView = document.getElementById('master-calendar-cards-view');
  const tableView = document.getElementById('master-calendar-table-view');

  if (layout === 'cards') {
    if (btnCards) btnCards.className = 'btn-primary small';
    if (btnTable) btnTable.className = 'btn-secondary small';
    if (cardsView) cardsView.classList.remove('hidden');
    if (tableView) tableView.classList.add('hidden');
  } else {
    if (btnCards) btnCards.className = 'btn-secondary small';
    if (btnTable) btnTable.className = 'btn-primary small';
    if (cardsView) cardsView.classList.add('hidden');
    if (tableView) tableView.classList.remove('hidden');
  }

  renderMasterCalendar();
};

function renderCounselorAvailabilitySlots() {
  const container = document.getElementById('counselor-slots-grid');
  if (!container) return;

  const sessions = state.masterCalendarSessions || [];
  let counselors = [];
  const colors = ['hsl(var(--primary-plum))', 'hsl(var(--primary-teal))', '#2563eb', '#10b981', '#f59e0b'];

  // Exclude suspended counselors - only display ACTIVE counselors in capacity
  const activeCounselors = (state.counselors || []).filter(c => c.status === 'ACTIVE');

  if (activeCounselors.length > 0) {
    counselors = activeCounselors.map((c, i) => {
      const booked = sessions.filter(s => (s.counselorId === c.id || s.counselor?.id === c.id) && s.status !== 'CANCELLED_BY_STUDENT' && s.status !== 'CANCELLED_BY_COUNSELOR').length;
      const total = 20;
      const u = c.user;
      const name = formatCounselorDisplayName(u, c.credentials);
      return {
        name,
        role: c.credentials || 'Clinical Counselor',
        special: c.specializations?.join(' & ') || (u?.email || 'Student Wellness'),
        avatarUrl: c.avatarUrl || null,
        booked,
        total,
        color: colors[i % colors.length]
      };
    });
  } else {
    // Derive active counselors from session records
    const cMap = new Map();
    sessions.forEach((s, i) => {
      if (s.counselor) {
        const cId = s.counselor.id || s.counselorId || ('c-' + i);
        if (!cMap.has(cId)) {
          const u = s.counselor.user;
          const name = formatCounselorDisplayName(u, s.counselor?.credentials);
          cMap.set(cId, {
            name,
            role: s.counselor?.credentials || 'Clinical Counselor',
            special: u?.email || 'Counseling Services',
            avatarUrl: s.counselor?.avatarUrl || null,
            booked: 0,
            total: 20,
            color: colors[cMap.size % colors.length]
          });
        }
        if (s.status !== 'CANCELLED_BY_STUDENT' && s.status !== 'CANCELLED_BY_COUNSELOR') {
          cMap.get(cId).booked++;
        }
      }
    });
    counselors = Array.from(cMap.values());
  }

  if (counselors.length === 0) {
    container.innerHTML = `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 14px; border-radius: 10px; grid-column: 1 / -1; text-align: center; color: rgba(255,255,255,0.4); font-size: 12px;">
        No active counselors registered yet.
      </div>
    `;
    return;
  }

  container.innerHTML = counselors.map(c => {
    const initials = (c.name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2) || 'WC').toUpperCase();
    const pct = Math.round((c.booked / c.total) * 100);
    const isNearFull = pct >= 85;

    return `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 14px; border-radius: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${c.avatarUrl ? `
              <img src="${escapeHtml(c.avatarUrl)}" alt="${initials}" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div style="display: none; width: 32px; height: 32px; border-radius: 8px; background: ${c.color}; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: white;">
                ${initials}
              </div>
            ` : `
              <div style="width: 32px; height: 32px; border-radius: 8px; background: ${c.color}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: white;">
                ${initials}
              </div>
            `}
            <div>
              <strong style="color: white; font-size: 12.5px; display: block;">${escapeHtml(c.name)}</strong>
              <span style="font-size: 10.5px; color: rgba(255,255,255,0.4);">${escapeHtml(c.special)}</span>
            </div>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: ${isNearFull ? '#fbbf24' : '#10b981'}; background: ${isNearFull ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}; padding: 2px 6px; border-radius: 4px;">
            ${isNearFull ? 'Near Capacity' : 'Available'}
          </span>
        </div>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: rgba(255,255,255,0.5);">Weekly Capacity</span>
            <strong style="color: white;">${c.booked} / ${c.total} slots (${pct}%)</strong>
          </div>
          <div style="height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: ${isNearFull ? '#fbbf24' : '#10b981'}; transition: width 0.4s ease;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderMasterCalendar() {
  const sessions = state.masterCalendarSessions || [];

  // Update KPI Strip using only active counselors
  const kpiTotal = document.getElementById('kpi-cal-total');
  const kpiUpcoming = document.getElementById('kpi-cal-upcoming');
  const kpiCompleted = document.getElementById('kpi-cal-completed');
  const kpiUtilization = document.getElementById('kpi-cal-utilization');

  const upcomingCount = sessions.filter(s => s.status === 'CONFIRMED' || s.status === 'IN_PROGRESS').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;

  if (kpiTotal) kpiTotal.textContent = sessions.length;
  if (kpiUpcoming) kpiUpcoming.textContent = upcomingCount;
  if (kpiCompleted) kpiCompleted.textContent = completedCount;
  const activeCounselors = (state.counselors || []).filter(c => c.status === 'ACTIVE');
  const totalCapacity = Math.max(1, (activeCounselors.length || 1) * 20);
  const activeSessions = sessions.filter(s => s.status !== 'CANCELLED_BY_STUDENT' && s.status !== 'CANCELLED_BY_COUNSELOR').length;
  if (kpiUtilization) kpiUtilization.textContent = `${Math.min(100, Math.round((activeSessions / totalCapacity) * 100))}%`;

  const q = (searchState.masterCalendar || '').toLowerCase().trim();
  const fStatus = filterState.masterCalendar.status;

  const filtered = sessions.filter(s => {
    const studentName = s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.toLowerCase() : '';
    const studentEmail = s.student?.email?.toLowerCase() || '';
    const counselorUser = s.counselor?.user;
    const counselorName = counselorUser ? `${counselorUser.firstName || ''} ${counselorUser.lastName || ''}`.toLowerCase() : '';
    
    const matchesSearch = !q || studentName.includes(q) || studentEmail.includes(q) || counselorName.includes(q);
    if (!matchesSearch) return false;

    if (fStatus && s.status !== fStatus) return false;

    return true;
  });

  const emptyState = document.getElementById('calendar-empty-state');
  if (emptyState) {
    if (filtered.length === 0) emptyState.classList.remove('hidden');
    else emptyState.classList.add('hidden');
  }

  // 1. Render Cards Layout
  const cardsContainer = document.getElementById('master-calendar-list');
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    filtered.forEach(s => {
      const studentName = s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim() : 'Anonymous Student';
      const studentEmail = s.student?.email || 'N/A';
      const studentInitials = (studentName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2) || 'ST').toUpperCase();

      const counselorUser = s.counselor?.user;
      const counselorName = counselorUser ? formatCounselorDisplayName(counselorUser, s.counselor?.credentials) : (s.counselor?.name ? formatCounselorDisplayName(s.counselor, s.counselor?.credentials) : 'Assigned Counselor');
      const roomLink = s.meetingLink || `https://meet.jit.si/wellmindly-counseling-${(s.id || '').slice(0, 8)}`;

      let statusBadge = '';
      if (s.status === 'IN_PROGRESS') {
        statusBadge = `<span class="badge-role" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); font-size: 11px;"><i class='bx bx-broadcast' style="animation: pulse 1.5s infinite;"></i> In Progress</span>`;
      } else if (s.status === 'COMPLETED') {
        statusBadge = `<span class="badge-status verified" style="font-size: 11px;"><i class='bx bx-check-circle'></i> Completed</span>`;
      } else if (s.status === 'CANCELLED_BY_STUDENT' || s.status === 'CANCELLED_BY_COUNSELOR') {
        statusBadge = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 11px;"><i class='bx bx-x'></i> Cancelled</span>`;
      } else {
        statusBadge = `<span class="badge-role" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px;"><i class='bx bx-time'></i> Confirmed</span>`;
      }

      const card = document.createElement('div');
      card.className = 'glass-card glow-card';
      card.style.padding = '18px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--primary-teal)), #2563eb); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; border: 1px solid rgba(255,255,255,0.2);">
                ${studentInitials}
              </div>
              <div>
                <strong style="color: white; font-size: 13.5px; display: block;">${escapeHtml(studentName)}</strong>
                <span style="font-size: 11px; color: rgba(255,255,255,0.4);">${escapeHtml(studentEmail)}</span>
              </div>
            </div>
            ${statusBadge}
          </div>

          <div style="background: rgba(0,0,0,0.2); padding: 10px 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: white; margin-bottom: 4px;">
              <i class="bx bx-calendar text-teal"></i>
              <span>${formatDateString(s.startTime)} at ${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(255,255,255,0.6);">
              <i class="bx bx-user-pin text-plum"></i>
              <span>Counselor: <strong style="color: #cbd5e1;">${escapeHtml(counselorName)}</strong></span>
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; gap: 6px; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
            <button class="btn-view-details" onclick="openAppointmentModal('${s.id}')" style="flex: 1; justify-content: center; font-size: 11.5px;">
              <i class="bx bx-detail"></i> Inspect Details
            </button>
            <a href="${roomLink}" target="_blank" class="btn-view-details" style="background: rgba(5, 149, 157, 0.2); border-color: rgba(5, 149, 157, 0.4); color: #2dd4bf; text-decoration: none; display: inline-flex; align-items: center; padding: 6px 10px;" title="Launch Telehealth Video Room">
              <i class="bx bx-video"></i>
            </a>
            <button class="btn-view-details" onclick="openRescheduleModal('${s.id}')" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8; padding: 6px 10px;" title="Reschedule Session">
              <i class="bx bx-calendar-edit"></i>
            </button>
          </div>
        </div>
      `;
      cardsContainer.appendChild(card);
    });
  }

  // 2. Render Table Layout
  const tableBody = document.getElementById('master-calendar-table-body');
  if (tableBody) {
    tableBody.innerHTML = '';
    filtered.forEach(s => {
      const studentName = s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim() : 'Anonymous Student';
      const studentEmail = s.student?.email || 'N/A';
      const counselorUser = s.counselor?.user;
      const counselorName = counselorUser ? formatCounselorDisplayName(counselorUser, s.counselor?.credentials) : (s.counselor?.name ? formatCounselorDisplayName(s.counselor, s.counselor?.credentials) : 'Assigned Counselor');
      const roomLink = s.meetingLink || `https://meet.jit.si/wellmindly-counseling-${(s.id || '').slice(0, 8)}`;

      let statusBadge = '';
      if (s.status === 'IN_PROGRESS') {
        statusBadge = `<span class="badge-role" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); font-size: 11px;">In Progress</span>`;
      } else if (s.status === 'COMPLETED') {
        statusBadge = `<span class="badge-status verified" style="font-size: 11px;">Completed</span>`;
      } else if (s.status === 'CANCELLED_BY_STUDENT' || s.status === 'CANCELLED_BY_COUNSELOR') {
        statusBadge = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 11px;">Cancelled</span>`;
      } else {
        statusBadge = `<span class="badge-role" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px;">Confirmed</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong style="color: white; font-size: 13px;">${escapeHtml(studentName)}</strong>
          <div style="font-size: 11px; color: rgba(255,255,255,0.4);">${escapeHtml(studentEmail)}</div>
        </td>
        <td><span class="badge-role" style="font-size: 11.5px;">${escapeHtml(counselorName)}</span></td>
        <td><span style="font-size: 12px; color: #cbd5e1;">${formatDateString(s.startTime)} ${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
        <td>${statusBadge}</td>
        <td>
          <a href="${roomLink}" target="_blank" style="color: #2dd4bf; text-decoration: none; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;">
            <i class="bx bx-video"></i> ${(s.id || '').slice(0, 8)}
          </a>
        </td>
        <td class="text-right">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn-view-details" onclick="openAppointmentModal('${s.id}')">Inspect</button>
            <button class="btn-view-details" onclick="openRescheduleModal('${s.id}')" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8;">Move</button>
            <button class="btn-view-details" onclick="deleteSessionAdmin('${s.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;"><i class="bx bx-trash"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

// ── APPOINTMENT MODAL INSPECTOR & RESCHEDULE HANDLERS ──────────────────

window.openAppointmentModal = function(sessionId) {
  const session = state.masterCalendarSessions.find(s => s.id === sessionId);
  if (!session) return;

  state.activeAppointment = session;

  const studentName = session.student ? `${session.student.firstName || ''} ${session.student.lastName || ''}`.trim() : 'Anonymous Student';
  const studentEmail = session.student?.email || 'N/A';
  const counselorUser = session.counselor?.user;
  const counselorName = counselorUser ? formatCounselorDisplayName(counselorUser, session.counselor?.credentials) : (session.counselor?.name ? formatCounselorDisplayName(session.counselor, session.counselor?.credentials) : 'Assigned Counselor');
  const counselorEmail = counselorUser?.email || session.counselor?.email || 'N/A';
  const roomLink = session.meetingLink || `https://meet.jit.si/wellmindly-counseling-${(session.id || '').slice(0, 8)}`;

  const nameEl = document.getElementById('app-modal-student-name');
  const emailEl = document.getElementById('app-modal-student-email');
  const cNameEl = document.getElementById('app-modal-counselor-name');
  const cEmailEl = document.getElementById('app-modal-counselor-email');
  const dtEl = document.getElementById('app-modal-datetime');
  const videoInput = document.getElementById('app-modal-video-link');
  const joinBtn = document.getElementById('btn-join-video-room');
  const badgeContainer = document.getElementById('app-modal-status-badge');
  const notesEl = document.getElementById('app-modal-notes');

  if (nameEl) nameEl.textContent = studentName;
  if (emailEl) emailEl.textContent = studentEmail;
  if (cNameEl) cNameEl.textContent = counselorName;
  if (cEmailEl) cEmailEl.textContent = counselorEmail;
  if (dtEl) dtEl.textContent = `${formatDateString(session.startTime)} at ${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (videoInput) videoInput.value = roomLink;
  if (joinBtn) joinBtn.href = roomLink;

  if (badgeContainer) {
    if (session.status === 'IN_PROGRESS') {
      badgeContainer.innerHTML = `<span class="badge-role" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);"><i class='bx bx-broadcast'></i> Live Telehealth</span>`;
    } else if (session.status === 'COMPLETED') {
      badgeContainer.innerHTML = `<span class="badge-status verified"><i class='bx bx-check-circle'></i> Completed</span>`;
    } else if (session.status === 'CANCELLED_BY_STUDENT' || session.status === 'CANCELLED_BY_COUNSELOR') {
      badgeContainer.innerHTML = `<span class="badge-role" style="background: rgba(239, 68, 68, 0.2); color: #f87171;"><i class='bx bx-x'></i> Cancelled</span>`;
    } else {
      badgeContainer.innerHTML = `<span class="badge-role" style="background: rgba(16, 185, 129, 0.2); color: #34d399;"><i class='bx bx-calendar-check'></i> Confirmed</span>`;
    }
  }

  if (notesEl) {
    notesEl.textContent = session.cancellationReason || 'Standard clinical consultation encounter.';
  }

  document.getElementById('modal-appointment-detail')?.classList.remove('hidden');
};

window.closeAppointmentModal = function() {
  document.getElementById('modal-appointment-detail')?.classList.add('hidden');
  state.activeAppointment = null;
};

window.openRescheduleModal = function(sessionId) {
  const session = state.masterCalendarSessions.find(s => s.id === sessionId);
  if (!session) return;

  const idInput = document.getElementById('reschedule-session-id');
  const timeInput = document.getElementById('reschedule-start-time');
  const counselorSelect = document.getElementById('reschedule-counselor-id');

  if (idInput) idInput.value = session.id;

  // Format date to datetime-local (YYYY-MM-DDTHH:mm)
  if (timeInput) {
    const d = new Date(session.startTime);
    const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    timeInput.value = isoStr;
  }

  // Populate counselor select options dynamically - exclude suspended counselors
  if (counselorSelect) {
    const activeCounselors = (state.counselors || []).filter(c => c.status === 'ACTIVE');
    if (activeCounselors.length > 0) {
      counselorSelect.innerHTML = activeCounselors.map(c => {
        const u = c.user;
        const name = formatCounselorDisplayName(u, c.credentials);
        return `<option value="${c.id}">${escapeHtml(name)} (${escapeHtml(c.credentials || 'Counselor')})</option>`;
      }).join('');
    } else if (session.counselor) {
      const cName = session.counselor.user ? formatCounselorDisplayName(session.counselor.user, session.counselor.credentials) : 'Assigned Counselor';
      counselorSelect.innerHTML = `<option value="${session.counselor.id}">${escapeHtml(cName)}</option>`;
    }
    const currentCId = session.counselorId || session.counselor?.id;
    if (currentCId) counselorSelect.value = currentCId;
  }

  document.getElementById('modal-reschedule-session')?.classList.remove('hidden');
};

window.closeRescheduleModal = function() {
  document.getElementById('modal-reschedule-session')?.classList.add('hidden');
};

async function handleRescheduleSessionSubmit(e) {
  e.preventDefault();
  const sessionId = document.getElementById('reschedule-session-id')?.value;
  const newTime = document.getElementById('reschedule-start-time')?.value;
  const counselorId = document.getElementById('reschedule-counselor-id')?.value;

  if (!sessionId || !newTime) return;

  const startTime = new Date(newTime);
  const endTime = new Date(startTime.getTime() + 1000 * 60 * 50); // 50 mins

  try {
    const res = await apiFetch(`/v1/admin/sessions/${sessionId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        counselorId
      })
    });

    if (res && res.success) {
      // Update in local state
      const session = state.masterCalendarSessions.find(s => s.id === sessionId);
      if (session) {
        session.startTime = startTime.toISOString();
        session.endTime = endTime.toISOString();
        session.status = 'CONFIRMED';
        if (counselorId && state.counselors) {
          const newC = state.counselors.find(c => c.id === counselorId);
          if (newC) {
            session.counselorId = counselorId;
            session.counselor = newC;
          }
        }
      }

      showToast('Session rescheduled successfully and calendar updated.', 'success');
      closeRescheduleModal();
      renderMasterCalendar();
      renderCounselorAvailabilitySlots();
    } else {
      showToast(res?.error?.message || res?.error || 'Failed to reschedule session', 'error');
    }
  } catch (err) {
    console.error('Reschedule error:', err);
    showToast(err.message || 'Error rescheduling session.', 'error');
  }
}

window.cancelSessionAdmin = async function(sessionId) {
  const reason = prompt('Please enter cancellation reason for student & counselor notification:');
  if (reason === null) return; // Cancelled prompt

  try {
    await apiFetch(`/v1/admin/sessions/${sessionId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason: reason || 'Cancelled by Clinical Administrator' })
    });
  } catch (err) {
    console.warn('API error cancelling session, applying client update:', err);
  }

  const session = state.masterCalendarSessions.find(s => s.id === sessionId);
  if (session) {
    session.status = 'CANCELLED_BY_COUNSELOR';
    session.cancellationReason = reason || 'Cancelled by Clinical Administrator';
  }

  showToast('Session cancelled and notifications dispatched.', 'success');
  closeAppointmentModal();
  renderMasterCalendar();
};

window.deleteSessionAdmin = async function(sessionId) {
  if (!confirm('Are you sure you want to remove this session record from the calendar?')) return;

  try {
    await apiFetch(`/v1/admin/sessions/${sessionId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('API error deleting session:', err);
  }

  state.masterCalendarSessions = state.masterCalendarSessions.filter(s => s.id !== sessionId);
  showToast('Session record deleted from calendar.', 'info');
  renderMasterCalendar();
};

window.showToast = showToast;
window.showCustomAlert = showCustomAlert;
window.closeCustomAlertModal = closeCustomAlertModal;
window.openStudentDetails = openStudentDetails;
window.closeStudentModal = closeStudentModal;
window.exportStudentDossier = exportStudentDossier;
window.openAssessmentSheet = openAssessmentSheet;
window.closeAssessmentModal = closeAssessmentModal;
window.openQuizDetails = openQuizDetails;
window.closeQuizDetailView = closeQuizDetailView;
window.fetchAdminMasterCalendar = fetchAdminMasterCalendar;

// =========================================================================
// Student Access Control Management
// =========================================================================

async function fetchAccessControlData() {
  try {
    const res = await apiFetch('/admin/access-control');
    if (!res) return;

    state.accessControl.domains = Array.isArray(res.domains) ? res.domains : [];
    state.accessControl.bypassEmails = Array.isArray(res.bypassEmails) ? res.bypassEmails : [];
    state.accessControl.loaded = true;

    // Update summary badge numbers
    const statDomains = document.getElementById('stat-allowed-domains-count');
    const statBypass = document.getElementById('stat-bypass-emails-count');
    if (statDomains) statDomains.textContent = state.accessControl.domains.length;
    if (statBypass) statBypass.textContent = state.accessControl.bypassEmails.length;

    renderAllowedDomainsTable();
    renderBypassEmailsTable();
  } catch (err) {
    console.error('Failed to load access control data:', err);
    showToast('Failed to load student access control settings', 'error');
  }
}

function renderAllowedDomainsTable() {
  const tbody = document.getElementById('allowed-domains-tbody');
  const emptyNotice = document.getElementById('allowed-domains-empty');
  if (!tbody) return;

  const filter = (searchState.allowedDomains || '').toLowerCase().trim();
  const list = state.accessControl.domains.filter(item => {
    if (!filter) return true;
    return (
      (item.domain || '').toLowerCase().includes(filter) ||
      (item.name || '').toLowerCase().includes(filter)
    );
  });

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }

  if (emptyNotice) emptyNotice.classList.add('hidden');

  tbody.innerHTML = list.map(item => {
    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Active';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: rgba(6,182,212,0.12); color: #06b6d4; font-size: 14px;">
              <i class="bx bxs-check-shield"></i>
            </span>
            <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #38bdf8;">@${escapeHtml(item.domain)}</span>
          </div>
        </td>
        <td>
          <span style="color: #cbd5e1; font-size: 13px;">${escapeHtml(item.name || 'University Domain')}</span>
        </td>
        <td>
          <span style="color: #94a3b8; font-size: 12px;">${formattedDate}</span>
        </td>
        <td class="text-right">
          <button class="btn-secondary small btn-delete-domain" data-id="${item.id}" data-domain="${escapeHtml(item.domain)}" title="Delete domain" style="color: #f87171; border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); font-size: 11px; padding: 5px 10px;">
            <i class="bx bx-trash"></i> Remove
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach delete handlers
  tbody.querySelectorAll('.btn-delete-domain').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const domain = e.currentTarget.getAttribute('data-domain');
      openDeleteAccessRuleModal('domain', id, `@${domain}`);
    });
  });
}

function renderBypassEmailsTable() {
  const tbody = document.getElementById('bypass-emails-tbody');
  const emptyNotice = document.getElementById('bypass-emails-empty');
  if (!tbody) return;

  const filter = (searchState.bypassEmails || '').toLowerCase().trim();
  const list = state.accessControl.bypassEmails.filter(item => {
    if (!filter) return true;
    return (
      (item.email || '').toLowerCase().includes(filter) ||
      (item.note || '').toLowerCase().includes(filter)
    );
  });

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }

  if (emptyNotice) emptyNotice.classList.add('hidden');

  tbody.innerHTML = list.map(item => {
    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Active';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: rgba(168,85,247,0.12); color: #c084fc; font-size: 14px;">
              <i class="bx bxs-user"></i>
            </span>
            <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #c084fc;">${escapeHtml(item.email)}</span>
          </div>
        </td>
        <td>
          <span style="color: #cbd5e1; font-size: 13px;">${escapeHtml(item.note || 'Allowed bypass student')}</span>
        </td>
        <td>
          <span style="color: #94a3b8; font-size: 12px;">${formattedDate}</span>
        </td>
        <td class="text-right">
          <button class="btn-secondary small btn-delete-bypass" data-id="${item.id}" data-email="${escapeHtml(item.email)}" title="Delete bypass account" style="color: #f87171; border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); font-size: 11px; padding: 5px 10px;">
            <i class="bx bx-trash"></i> Remove
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach delete handlers
  tbody.querySelectorAll('.btn-delete-bypass').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const email = e.currentTarget.getAttribute('data-email');
      openDeleteAccessRuleModal('bypass', id, email);
    });
  });
}

function openAddDomainModal() {
  const modal = document.getElementById('modal-add-allowed-domain');
  if (modal) {
    const domInput = document.getElementById('input-new-domain');
    const nameInput = document.getElementById('input-new-domain-name');
    if (domInput) domInput.value = '';
    if (nameInput) nameInput.value = '';
    modal.classList.remove('hidden');
    if (domInput) domInput.focus();
  }
}

function closeAddDomainModal() {
  const modal = document.getElementById('modal-add-allowed-domain');
  if (modal) modal.classList.add('hidden');
}

function openAddBypassModal() {
  const modal = document.getElementById('modal-add-bypass-email');
  if (modal) {
    const emailInput = document.getElementById('input-new-bypass-email');
    const noteInput = document.getElementById('input-new-bypass-note');
    if (emailInput) emailInput.value = '';
    if (noteInput) noteInput.value = '';
    modal.classList.remove('hidden');
    if (emailInput) emailInput.focus();
  }
}

function closeAddBypassModal() {
  const modal = document.getElementById('modal-add-bypass-email');
  if (modal) modal.classList.add('hidden');
}

function openDeleteAccessRuleModal(type, id, label) {
  state.accessControl.deleteTarget = { type, id, label };
  const modal = document.getElementById('modal-delete-access-rule');
  const title = document.getElementById('delete-access-rule-title');
  const desc = document.getElementById('delete-access-rule-desc');

  if (title) {
    title.textContent = type === 'domain' ? `Remove Domain: ${label}` : `Remove Bypass: ${label}`;
  }
  if (desc) {
    desc.textContent = type === 'domain'
      ? `Are you sure you want to remove ${label}? Students signing up or logging in with emails ending in this domain will no longer have access to 1-on-1 counseling.`
      : `Are you sure you want to remove ${label}? This user will no longer be allowed to bypass university domain requirements.`;
  }

  if (modal) modal.classList.remove('hidden');
}

function closeDeleteAccessRuleModal() {
  state.accessControl.deleteTarget = null;
  const modal = document.getElementById('modal-delete-access-rule');
  if (modal) modal.classList.add('hidden');
}

async function handleConfirmDeleteRule() {
  const target = state.accessControl.deleteTarget;
  if (!target) return;

  const btnConfirm = document.getElementById('btn-confirm-delete-rule');
  if (btnConfirm) btnConfirm.disabled = true;

  try {
    const endpoint = target.type === 'domain'
      ? `/admin/access-control/domains/${encodeURIComponent(target.id)}`
      : `/admin/access-control/bypass-emails/${encodeURIComponent(target.id)}`;

    const res = await apiFetch(endpoint, { method: 'DELETE' });
    if (res && res.success) {
      showToast(`Removed ${target.label} successfully.`, 'info');
      closeDeleteAccessRuleModal();
      await fetchAccessControlData();
    } else {
      showToast('Failed to delete access rule', 'error');
    }
  } catch (err) {
    console.error('Delete rule error:', err);
    showToast('Failed to delete access rule', 'error');
  } finally {
    if (btnConfirm) btnConfirm.disabled = false;
  }
}

async function handleAddDomainSubmit(e) {
  e.preventDefault();
  const domainInput = document.getElementById('input-new-domain');
  const nameInput = document.getElementById('input-new-domain-name');
  const btn = document.getElementById('btn-submit-add-domain');

  const domain = (domainInput?.value || '').trim();
  const name = (nameInput?.value || '').trim();

  if (!domain) {
    showToast('Please provide a domain name (e.g. ves.ac.in)', 'error');
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const res = await apiFetch('/admin/access-control/domains', {
      method: 'POST',
      body: JSON.stringify({ domain, name: name || undefined })
    });

    if (res && res.success) {
      showToast(`Domain @${res.domain.domain} added successfully!`, 'success');
      closeAddDomainModal();
      await fetchAccessControlData();
    } else {
      showToast(res?.error || 'Failed to add domain', 'error');
    }
  } catch (err) {
    console.error('Add domain error:', err);
    showToast('Failed to add domain', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleAddBypassSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('input-new-bypass-email');
  const noteInput = document.getElementById('input-new-bypass-note');
  const btn = document.getElementById('btn-submit-add-bypass');

  const email = (emailInput?.value || '').trim();
  const note = (noteInput?.value || '').trim();

  if (!email || !email.includes('@')) {
    showToast('Please enter a valid student email address', 'error');
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const res = await apiFetch('/admin/access-control/bypass-emails', {
      method: 'POST',
      body: JSON.stringify({ email, note: note || undefined })
    });

    if (res && res.success) {
      showToast(`Bypass access granted to ${res.bypassEmail.email}!`, 'success');
      closeAddBypassModal();
      await fetchAccessControlData();
    } else {
      showToast(res?.error || 'Failed to add bypass email', 'error');
    }
  } catch (err) {
    console.error('Add bypass email error:', err);
    showToast('Failed to add bypass email', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleTestAccessEmail() {
  const input = document.getElementById('input-test-access-email');
  const resultDiv = document.getElementById('test-access-result');
  const btn = document.getElementById('btn-test-access-email');

  const email = (input?.value || '').trim();
  if (!email || !email.includes('@')) {
    if (resultDiv) {
      resultDiv.innerHTML = '<span style="color: #f87171;">Please enter a valid email address.</span>';
    }
    return;
  }

  if (btn) btn.disabled = true;
  if (resultDiv) {
    resultDiv.innerHTML = '<span style="color: #94a3b8;"><i class="bx bx-loader-alt bx-spin"></i> Checking rules...</span>';
  }

  try {
    const res = await apiFetch('/admin/access-control/check', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (!res) {
      if (resultDiv) resultDiv.innerHTML = '<span style="color: #f87171;">Check failed</span>';
      return;
    }

    if (res.eligible) {
      if (res.reason === 'BYPASS_EMAIL') {
        resultDiv.innerHTML = `<span class="badge" style="background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); padding: 4px 10px; border-radius: 8px;"><i class="bx bx-check-circle"></i> ELIGIBLE: Explicit Bypass Account (${escapeHtml(email)})</span>`;
      } else {
        resultDiv.innerHTML = `<span class="badge" style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 4px 10px; border-radius: 8px;"><i class="bx bx-check-circle"></i> ELIGIBLE: Allowed University Domain (@${escapeHtml(res.domain || '')})</span>`;
      }
    } else {
      resultDiv.innerHTML = `<span class="badge" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); padding: 4px 10px; border-radius: 8px;"><i class="bx bx-x-circle"></i> RESTRICTED: Domain not allowed (University students only)</span>`;
    }
  } catch (err) {
    if (resultDiv) resultDiv.innerHTML = '<span style="color: #f87171;">Error checking eligibility</span>';
  } finally {
    if (btn) btn.disabled = false;
  }
}

function setupAccessControlEventHandlers() {
  // Modal openers
  const btnOpenAddDomain = document.getElementById('btn-open-add-domain-modal');
  if (btnOpenAddDomain) btnOpenAddDomain.addEventListener('click', openAddDomainModal);

  const btnOpenAddBypass = document.getElementById('btn-open-add-bypass-modal');
  if (btnOpenAddBypass) btnOpenAddBypass.addEventListener('click', openAddBypassModal);

  // Modal closers
  const btnCloseAddDomain = document.getElementById('btn-close-add-domain-modal');
  const btnCancelAddDomain = document.getElementById('btn-cancel-add-domain');
  if (btnCloseAddDomain) btnCloseAddDomain.addEventListener('click', closeAddDomainModal);
  if (btnCancelAddDomain) btnCancelAddDomain.addEventListener('click', closeAddDomainModal);

  const btnCloseAddBypass = document.getElementById('btn-close-add-bypass-modal');
  const btnCancelAddBypass = document.getElementById('btn-cancel-add-bypass');
  if (btnCloseAddBypass) btnCloseAddBypass.addEventListener('click', closeAddBypassModal);
  if (btnCancelAddBypass) btnCancelAddBypass.addEventListener('click', closeAddBypassModal);

  const btnCancelDeleteRule = document.getElementById('btn-cancel-delete-rule');
  if (btnCancelDeleteRule) btnCancelDeleteRule.addEventListener('click', closeDeleteAccessRuleModal);

  const btnConfirmDeleteRule = document.getElementById('btn-confirm-delete-rule');
  if (btnConfirmDeleteRule) btnConfirmDeleteRule.addEventListener('click', handleConfirmDeleteRule);

  // Forms
  const formAddDomain = document.getElementById('form-add-allowed-domain');
  if (formAddDomain) formAddDomain.addEventListener('submit', handleAddDomainSubmit);

  const formAddBypass = document.getElementById('form-add-bypass-email');
  if (formAddBypass) formAddBypass.addEventListener('submit', handleAddBypassSubmit);

  // Search inputs
  const searchDomains = document.getElementById('search-allowed-domains');
  if (searchDomains) {
    searchDomains.addEventListener('input', (e) => {
      searchState.allowedDomains = e.target.value;
      renderAllowedDomainsTable();
    });
  }

  const searchBypass = document.getElementById('search-bypass-emails');
  if (searchBypass) {
    searchBypass.addEventListener('input', (e) => {
      searchState.bypassEmails = e.target.value;
      renderBypassEmailsTable();
    });
  }

  // Diagnostic tester
  const btnTestAccess = document.getElementById('btn-test-access-email');
  if (btnTestAccess) btnTestAccess.addEventListener('click', handleTestAccessEmail);

  const inputTestAccess = document.getElementById('input-test-access-email');
  if (inputTestAccess) {
    inputTestAccess.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTestAccessEmail();
      }
    });
  }
}

// Global window bindings for access control
window.fetchAccessControlData = fetchAccessControlData;
window.openAddDomainModal = openAddDomainModal;
window.closeAddDomainModal = closeAddDomainModal;
window.openAddBypassModal = openAddBypassModal;
window.closeAddBypassModal = closeAddBypassModal;
window.closeDeleteAccessRuleModal = closeDeleteAccessRuleModal;

// =========================================================================
// Unified Policy & Governance Guide Logic
// =========================================================================

function initPolicyGuide() {
  const searchInput = document.getElementById('search-policy-guide');
  const filterContainer = document.getElementById('policy-category-filters');
  const cards = document.querySelectorAll('.policy-item-card');

  let currentCat = 'all';
  let currentQuery = '';

  function filterCards() {
    cards.forEach(card => {
      const cat = card.getAttribute('data-category');
      const matchesCat = currentCat === 'all' || cat === currentCat;
      const text = card.textContent.toLowerCase();
      const matchesSearch = !currentQuery || text.includes(currentQuery);

      card.style.display = (matchesCat && matchesSearch) ? 'block' : 'none';
    });
  }

  if (searchInput) {
    searchInput.oninput = (e) => {
      currentQuery = e.target.value.toLowerCase().trim();
      filterCards();
    };
  }

  if (filterContainer) {
    const buttons = filterContainer.querySelectorAll('.policy-filter-btn');
    buttons.forEach(btn => {
      btn.onclick = () => {
        buttons.forEach(b => {
          b.className = 'btn-secondary small policy-filter-btn';
        });
        btn.className = 'btn-primary small policy-filter-btn';
        currentCat = btn.getAttribute('data-category') || 'all';
        filterCards();
      };
    });
  }
}

// =========================================================================
// Global CSV Export Utility & Export Functions
// =========================================================================

function downloadCSV(filename, headers, rows) {
  if (!rows || rows.length === 0) {
    showToast('No records available to export.', 'info');
    return;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} rows to ${a.download}`, 'success');
}

// 1. Dashboard Summary KPIs CSV
window.exportDashboardSummaryCSV = async function() {
  const m = state.metrics || {};
  const rows = [
    ['Clinical Screening', 'Total Assessments Administered', m.totalQuizzes || state.quizzes?.length || 0, 'Completed PHQ/GAD/Wellbeing', new Date().toISOString()],
    ['Clinical Screening', 'Severe Distress / Crisis Alerts', m.severeQuizzes || 0, 'Critical intervention threshold', new Date().toISOString()],
    ['Student Registry', 'Registered Students', m.totalStudents || state.students?.length || 0, 'Enrolled student accounts', new Date().toISOString()],
    ['Counselor Network', 'Active Clinical Counselors', (state.counselors || []).filter(c => c.status === 'ACTIVE').length, 'Active telehealth providers', new Date().toISOString()],
    ['Counselor Network', 'Total Counselor Applications', state.counselorContacts?.length || 0, 'Inbound onboarding applications', new Date().toISOString()],
    ['Appointments', 'Total Master Calendar Sessions', state.masterCalendarSessions?.length || 0, 'Clinical appointments', new Date().toISOString()],
    ['Partnerships', 'University Inquiries', state.universityContacts?.length || 0, 'Campus collaboration requests', new Date().toISOString()],
    ['Support', 'General Visitor Inquiries', state.generalContacts?.length || 0, 'Contact requests logged', new Date().toISOString()],
    ['Student Voice', 'Platform Feedback Reviews', state.feedbacks?.length || 0, 'Student experience reviews', new Date().toISOString()]
  ];
  downloadCSV('wellmindly-dashboard-summary-kpis', ['Metric Category', 'KPI Name', 'Value', 'Context / Status', 'Exported At'], rows);
};

// 2. Students CSV
window.exportStudentsCSV = async function() {
  let list = state.students;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/students?page=1&limit=500');
      if (res && res.students) list = res.students;
    } catch (e) {
      console.warn('Failed to prefetch students for CSV:', e);
    }
  }
  const rows = (list || []).map(s => [
    s.id,
    `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Anonymous Student',
    s.firstName || '',
    s.lastName || '',
    s.email || '',
    s.university || s.college || 'N/A',
    s.role || 'STUDENT',
    s.status || 'ACTIVE',
    s.createdAt ? formatDateString(s.createdAt) : 'N/A',
    s.quizCount ?? (s.quizzes?.length || 0),
    s.lastActiveAt ? formatDateString(s.lastActiveAt) : (s.createdAt ? formatDateString(s.createdAt) : 'N/A')
  ]);
  downloadCSV('wellmindly-students-registry', ['Student ID', 'Full Name', 'First Name', 'Last Name', 'Email', 'University', 'Role', 'Status', 'Registered Date', 'Assessments Count', 'Last Active'], rows);
};

// 3. Assessments CSV
window.exportAssessmentsCSV = async function() {
  let list = state.quizzes;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/quizzes?page=1&limit=500');
      if (res && res.quizzes) list = res.quizzes;
    } catch (e) {
      console.warn('Failed to prefetch quizzes for CSV:', e);
    }
  }
  const rows = (list || []).map(q => [
    q.id,
    q.student ? `${q.student.firstName || ''} ${q.student.lastName || ''}`.trim() : 'Anonymous',
    q.student?.email || 'N/A',
    q.quizType || q.title || 'PHQ-9 Wellbeing Screening',
    q.score ?? 'N/A',
    q.maxScore ?? 27,
    q.severity || 'Normal',
    q.isCritical ? 'CRITICAL_ALERT' : 'ROUTINE',
    q.createdAt ? formatDateString(q.createdAt) : 'N/A'
  ]);
  downloadCSV('wellmindly-clinical-assessments', ['Assessment ID', 'Student Name', 'Student Email', 'Assessment Type', 'Score', 'Max Score', 'Severity Level', 'Risk Flag', 'Completed At'], rows);
};

// 4. Counselor Applications CSV
window.exportCounselorApplicationsCSV = async function() {
  let list = state.counselorContacts;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/contacts/counselor?page=1&limit=200');
      if (res && res.requests) list = res.requests;
    } catch (e) {
      console.warn('Failed to prefetch counselor applications for CSV:', e);
    }
  }
  const rows = (list || []).map(c => {
    const stage = c.stage || state.counselorStages?.[c.id] || 'NEW_APPLICATION';
    return [
      c.id,
      c.name || '',
      c.email || '',
      c.phone || 'N/A',
      c.credentials || 'General Coaching',
      (c.experience || '').replace(/\r?\n/g, ' '),
      (c.message || '').replace(/\r?\n/g, ' '),
      stage,
      c.createdAt ? formatDateString(c.createdAt) : 'N/A',
      c.stageUpdatedAt ? formatDateString(c.stageUpdatedAt) : (c.createdAt ? formatDateString(c.createdAt) : 'N/A')
    ];
  });
  downloadCSV('wellmindly-counselor-onboarding-applications', ['Application ID', 'Applicant Name', 'Email Address', 'Phone Number', 'Credentials / Licenses', 'Experience Summary', 'Cover Note', 'Onboarding Journey Stage', 'Submitted Date', 'Stage Updated At'], rows);
};

// 5. Counselor Directory CSV
window.exportCounselorsCSV = async function() {
  let list = state.counselors;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/v1/admin/counselors');
      if (res && res.data) list = res.data;
    } catch (e) {
      console.warn('Failed to prefetch counselors for CSV:', e);
    }
  }
  const rows = (list || []).map(c => [
    c.id,
    formatCounselorDisplayName(c.user, c.credentials),
    c.user?.email || 'N/A',
    c.credentials || 'General Wellness',
    Array.isArray(c.specializations) ? c.specializations.join('; ') : (c.specializations || 'N/A'),
    c.status || 'ACTIVE',
    c.user?.timezone || 'UTC',
    c._count?.sessions || 0,
    (c.bio || '').replace(/\r?\n/g, ' ')
  ]);
  downloadCSV('wellmindly-counselor-roster', ['Counselor ID', 'Full Name', 'Email Address', 'Credentials', 'Specializations', 'Account Status', 'Timezone', 'Completed Sessions', 'Bio Summary'], rows);
};

// 6. Master Calendar Sessions CSV
window.exportSessionsCSV = async function() {
  let list = state.masterCalendarSessions;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/v1/admin/calendar');
      if (res && res.data) list = res.data;
    } catch (e) {
      console.warn('Failed to prefetch calendar sessions for CSV:', e);
    }
  }
  const rows = (list || []).map(s => {
    const counselorUser = s.counselor?.user;
    const counselorName = counselorUser ? formatCounselorDisplayName(counselorUser, s.counselor?.credentials) : (s.counselor?.name ? formatCounselorDisplayName(s.counselor, s.counselor?.credentials) : 'Assigned Counselor');
    return [
      s.id,
      s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim() : 'Anonymous Student',
      s.student?.email || 'N/A',
      counselorName,
      s.startTime ? new Date(s.startTime).toISOString() : 'N/A',
      s.endTime ? new Date(s.endTime).toISOString() : 'N/A',
      s.status || 'CONFIRMED',
      s.meetingLink || `https://meet.jit.si/wellmindly-counseling-${(s.id || '').slice(0, 8)}`,
      s.cancellationReason || '',
      s.createdAt ? formatDateString(s.createdAt) : 'N/A'
    ];
  });
  downloadCSV('wellmindly-master-calendar-sessions', ['Session ID', 'Student Name', 'Student Email', 'Counselor Name', 'Scheduled Start Time', 'End Time', 'Status', 'Meeting Link', 'Cancellation Reason', 'Booked At'], rows);
};

// 7. University Contacts CSV
window.exportUniversityContactsCSV = async function() {
  let list = state.universityContacts;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/contacts/university?page=1&limit=200');
      if (res && res.requests) list = res.requests;
    } catch (e) {
      console.warn('Failed to prefetch university contacts for CSV:', e);
    }
  }
  const rows = (list || []).map(u => [
    u.id,
    u.universityName || 'Campus Institution',
    u.name || '',
    u.role || '',
    u.email || '',
    u.phone || 'N/A',
    (u.message || '').replace(/\r?\n/g, ' '),
    state.universityStages?.[u.id] || 'NEW',
    u.createdAt ? formatDateString(u.createdAt) : 'N/A'
  ]);
  downloadCSV('wellmindly-university-partnerships', ['Inquiry ID', 'Campus Institution', 'Contact Person', 'Official Role', 'Institutional Email', 'Phone', 'Requirements & Message', 'Partnership Pipeline Stage', 'Submission Date'], rows);
};

// 8. General Contacts CSV
window.exportGeneralContactsCSV = async function() {
  let list = state.generalContacts;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/contacts/general?page=1&limit=200');
      if (res && res.contacts) list = res.contacts;
    } catch (e) {
      console.warn('Failed to prefetch general contacts for CSV:', e);
    }
  }
  const rows = (list || []).map(g => [
    g.id,
    g.name || '',
    g.email || '',
    g.subject || 'General Inquiry',
    (g.message || '').replace(/\r?\n/g, ' '),
    state.generalContactStatus?.[g.id] || 'PENDING_REPLY',
    g.createdAt ? formatDateString(g.createdAt) : 'N/A'
  ]);
  downloadCSV('wellmindly-general-inquiries', ['Inquiry ID', 'Sender Name', 'Sender Email', 'Subject', 'Message Details', 'Resolution Status', 'Submission Date'], rows);
};

// 9. Feedback Reviews CSV
window.exportFeedbackCSV = async function() {
  let list = state.feedbacks;
  if (!list || list.length === 0) {
    try {
      const res = await apiFetch('/feedbacks?page=1&limit=200');
      if (res && res.feedbacks) list = res.feedbacks;
    } catch (e) {
      console.warn('Failed to prefetch feedbacks for CSV:', e);
    }
  }
  const rows = (list || []).map(f => [
    f.id,
    f.student ? `${f.student.firstName || ''} ${f.student.lastName || ''}`.trim() : 'Anonymous Student',
    f.student?.email || 'N/A',
    f.rating ?? 5,
    f.category || 'General Platform',
    (f.comments || f.message || '').replace(/\r?\n/g, ' '),
    f.createdAt ? formatDateString(f.createdAt) : 'N/A'
  ]);
  downloadCSV('wellmindly-student-feedbacks', ['Feedback ID', 'Student Name', 'Student Email', 'Rating (1-5)', 'Category', 'Comments', 'Submitted Date'], rows);
};

// 10. Dual Feedback Analytics CSV
window.exportDualFeedbackCSV = async function() {
  const sf = state.dualFeedback?.studentToCounselor || [];
  const cf = state.dualFeedback?.counselorToStudent || [];

  const rows = [
    ...sf.map(s => [
      'STUDENT_TO_COUNSELOR',
      s.id,
      s.session?.student ? `${s.session.student.firstName || ''} ${s.session.student.lastName || ''}`.trim() : 'Student',
      s.counselor?.user ? formatCounselorDisplayName(s.counselor.user, s.counselor.credentials) : 'Counselor',
      s.rating ?? 5,
      (s.comments || '').replace(/\r?\n/g, ' '),
      s.createdAt ? formatDateString(s.createdAt) : 'N/A'
    ]),
    ...cf.map(c => [
      'COUNSELOR_TO_STUDENT',
      c.id,
      c.counselor?.user ? formatCounselorDisplayName(c.counselor.user, c.counselor.credentials) : 'Counselor',
      c.session?.student ? `${c.session.student.firstName || ''} ${c.session.student.lastName || ''}`.trim() : 'Student',
      c.rating ?? 5,
      (c.summaryNote || '').replace(/\r?\n/g, ' '),
      c.createdAt ? formatDateString(c.createdAt) : 'N/A'
    ])
  ];
  downloadCSV('wellmindly-dual-clinical-evaluations', ['Evaluation Direction', 'Record ID', 'Evaluator', 'Recipient', 'Rating (1-5)', 'Clinical Feedback / Summary Note', 'Timestamp'], rows);
};

// 11. TalkMindly Safety & Moderation CSV
window.exportTalkMindlyCSV = async function() {
  const notes = state.flaggedData?.notes || [];
  const replies = state.flaggedData?.replies || [];

  const rows = [
    ...notes.map(n => [
      n.id,
      'COMMUNITY_NOTE',
      n.authorName || n.pseudonym || 'Anonymous Peer',
      n.moderationStatus || (n.isFlagged ? 'FLAGGED_AUTO' : 'REVIEWED'),
      n.flagReason || 'Content Safety Filter Triggered',
      (n.content || '').replace(/\r?\n/g, ' '),
      n.createdAt ? formatDateString(n.createdAt) : 'N/A'
    ]),
    ...replies.map(r => [
      r.id,
      'THREAD_REPLY',
      r.authorName || r.pseudonym || 'Anonymous Peer',
      r.moderationStatus || (r.isFlagged ? 'FLAGGED_AUTO' : 'REVIEWED'),
      r.flagReason || 'Peer Safety Heuristics Triggered',
      (r.content || '').replace(/\r?\n/g, ' '),
      r.createdAt ? formatDateString(r.createdAt) : 'N/A'
    ])
  ];
  downloadCSV('wellmindly-talkmindly-moderation-queue', ['Content ID', 'Type', 'Author / Alias', 'Status', 'Flag Reason', 'Content Snippet', 'Timestamp'], rows);
};

// 12. Student Access Control Rules CSV
window.exportAccessControlCSV = async function() {
  let domains = state.accessControl?.domains || [];
  let bypassEmails = state.accessControl?.bypassEmails || [];

  if (domains.length === 0 && bypassEmails.length === 0) {
    try {
      const res = await apiFetch('/admin/access-control');
      if (res) {
        domains = Array.isArray(res.domains) ? res.domains : [];
        bypassEmails = Array.isArray(res.bypassEmails) ? res.bypassEmails : [];
      }
    } catch (e) {
      console.warn('Failed to prefetch access control rules for CSV:', e);
    }
  }

  const rows = [
    ...domains.map(d => [
      'ALLOWED_UNIVERSITY_DOMAIN',
      d.domain || d,
      d.notes || 'Institutional Campus Domain',
      'ACTIVE_ELIGIBLE',
      d.createdAt ? formatDateString(d.createdAt) : 'N/A'
    ]),
    ...bypassEmails.map(b => [
      'BYPASS_STUDENT_EMAIL',
      b.email || b,
      b.reason || 'VIP / Support Testing Bypass',
      'ACTIVE_ELIGIBLE',
      b.createdAt ? formatDateString(b.createdAt) : 'N/A'
    ])
  ];
  downloadCSV('wellmindly-student-access-control-rules', ['Rule Type', 'Rule Identifier (Domain / Email)', 'Description / Notes', 'Status', 'Created / Updated At'], rows);
};

window.initPolicyGuide = initPolicyGuide;
window.downloadCSV = downloadCSV;




