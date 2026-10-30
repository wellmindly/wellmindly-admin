/**
 * WellMindly Admin Platform Analytics & Consent Management
 * 
 * Strict Privacy Guarantees:
 * - Basic GA Consent Mode (no tag transmission before explicit consent).
 * - Microsoft Clarity recording is strictly DISABLED on the Admin Command Center
 *   to guarantee student registry records, crisis flags, and case notes are never captured.
 * - Cross-subdomain consent sharing (.wellmindly.com).
 * - Platform identifier: 'admin'.
 */

export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE_NAME = 'wm_consent_v1';
export const CONSENT_STORAGE_KEY = 'wellmindly_cookie_consent_v1';
export const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const SYNC_CHANNEL_NAME = 'wellmindly_consent_sync';

export const ALLOWED_EVENTS = new Set([
  'page_view',
  'cookie_consent_update',
  'admin_dashboard_viewed',
  'admin_tab_switched',
  'login_completed',
  'admin_logged_out',
  'consent_preferences_updated',
  'app_error_occurred',
]);

const PROHIBITED_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'jwt',
  'student_name',
  'student_email',
  'student_id',
  'diagnosis',
  'score',
  'case_notes',
  'flag_reason',
];

const listeners = new Set();
let broadcastChannel = null;
let gaLoaded = false;
let gaScriptAppended = false;
let currentGaId = null;

const envGaId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const activeConfig = {
  platform: 'admin',
  gaMeasurementId: envGaId.trim(),
  environment: import.meta.env.MODE || 'development',
  debug: import.meta.env.DEV,
};

// Initialize multi-tab consent sync
if (typeof window !== 'undefined') {
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'CONSENT_UPDATED') {
          notifyListeners(event.data.consent);
        }
      };
    } catch {
      broadcastChannel = null;
    }
  }

  window.addEventListener('storage', (e) => {
    if (e.key === CONSENT_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (isValidConsentRecord(parsed)) {
          notifyListeners(parsed);
        }
      } catch {
        // ignore
      }
    }
  });
}

function notifyListeners(record) {
  for (const listener of listeners) {
    try {
      listener(record);
    } catch (err) {
      console.warn('[Analytics:Admin] Listener error:', err);
    }
  }
}

export function getRootCookieDomain() {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'wellmindly.com' || hostname.endsWith('.wellmindly.com')) {
    return '.wellmindly.com';
  }
  return undefined;
}

export function isValidConsentRecord(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== CONSENT_VERSION) return false;
  if (typeof data.timestamp !== 'string' || typeof data.updatedAt !== 'string') return false;
  if (!['accepted_all', 'rejected_all', 'customized'].includes(data.decision)) return false;
  if (!data.categories || typeof data.categories !== 'object') return false;

  return (
    data.categories.strictly_necessary === true &&
    typeof data.categories.analytics === 'boolean' &&
    typeof data.categories.marketing === 'boolean'
  );
}

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function writeCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') return false;
  try {
    const domain = getRootCookieDomain();
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    if (domain) cookieStr += `; domain=${domain}`;
    if (isSecure) cookieStr += '; Secure';
    document.cookie = cookieStr;
    return true;
  } catch {
    return false;
  }
}

export function eraseCookie(name) {
  if (typeof document === 'undefined') return;
  const domain = getRootCookieDomain();
  const pastDate = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';

  document.cookie = `${name}=; ${pastDate}`;
  if (domain) {
    document.cookie = `${name}=; domain=${domain}; ${pastDate}`;
  }
}

export function getConsent() {
  if (typeof window === 'undefined') return null;

  const cookieVal = readCookie(CONSENT_COOKIE_NAME);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      if (isValidConsentRecord(parsed)) {
        const updatedMs = new Date(parsed.updatedAt || parsed.timestamp).getTime();
        if (Date.now() - updatedMs < CONSENT_MAX_AGE_SECONDS * 1000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidConsentRecord(parsed)) {
        const updatedMs = new Date(parsed.updatedAt || parsed.timestamp).getTime();
        if (Date.now() - updatedMs < CONSENT_MAX_AGE_SECONDS * 1000) {
          writeCookie(CONSENT_COOKIE_NAME, JSON.stringify(parsed), CONSENT_MAX_AGE_SECONDS);
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function hasAnalyticsConsent() {
  const record = getConsent();
  return Boolean(record && record.categories.analytics === true);
}

export function saveConsent(decision, categories) {
  const existing = getConsent();
  const now = new Date().toISOString();

  const record = {
    version: CONSENT_VERSION,
    timestamp: existing ? existing.timestamp : now,
    updatedAt: now,
    decision,
    categories: {
      strictly_necessary: true,
      analytics: Boolean(categories.analytics),
      marketing: false,
    },
  };

  const serialized = JSON.stringify(record);
  writeCookie(CONSENT_COOKIE_NAME, serialized, CONSENT_MAX_AGE_SECONDS);

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  } catch {
    // ignore
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'CONSENT_UPDATED', consent: record });
    } catch {
      // ignore
    }
  }

  notifyListeners(record);
  return record;
}

export function acceptAllConsent() {
  return saveConsent('accepted_all', { analytics: true, marketing: false });
}

export function rejectAllConsent() {
  return saveConsent('rejected_all', { analytics: false, marketing: false });
}

export function withdrawConsent() {
  const record = rejectAllConsent();

  eraseCookie('_ga');
  eraseCookie('_gid');
  eraseCookie('_gat');

  if (typeof document !== 'undefined') {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith('_ga_')) {
          eraseCookie(name);
        }
      }
    } catch {
      // ignore
    }
  }

  return record;
}

export function subscribeConsent(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openConsentPreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wellmindly_open_consent_preferences'));
  }
}

export function sanitizeEventParams(params) {
  const clean = {
    platform: 'admin',
    environment: activeConfig.environment,
  };
  if (!params) return clean;

  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) continue;
    const lowerKey = key.toLowerCase();

    const isProhibited = PROHIBITED_KEYS.some((p) => lowerKey.includes(p));
    if (isProhibited) continue;

    if (lowerKey === 'email' && typeof val === 'string') {
      const parts = val.split('@');
      clean[key] = parts.length > 1 ? `...@${parts[1]}` : '[masked]';
      continue;
    }

    if (typeof val === 'number') {
      if (Number.isFinite(val)) clean[key] = val;
      continue;
    }

    if (typeof val === 'boolean') {
      clean[key] = val;
      continue;
    }

    if (typeof val === 'string') {
      clean[key] = val.length > 100 ? val.slice(0, 100) : val;
    }
  }

  return clean;
}

export function setupGaConsentDefaults() {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
}

export function loadGa4(measurementId, debug = false) {
  if (typeof window === 'undefined' || !measurementId) return;
  if (gaLoaded && currentGaId === measurementId) return;

  currentGaId = measurementId;
  setupGaConsentDefaults();

  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  window.gtag('js', new Date());

  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_flags: 'SameSite=Lax;Secure',
    debug_mode: debug,
  });

  if (!gaScriptAppended) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
      gaScriptAppended = true;
      gaLoaded = true;
    } catch (err) {
      console.warn('[Analytics:Admin] Failed to append gtag script:', err);
    }
  } else {
    gaLoaded = true;
  }
}

export function updateGa4Consent(granted) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;

  setupGaConsentDefaults();

  subscribeConsent((record) => {
    const isGranted = Boolean(record && record.categories.analytics);
    updateGa4Consent(isGranted);

    if (isGranted && activeConfig.gaMeasurementId) {
      loadGa4(activeConfig.gaMeasurementId, activeConfig.debug);
    }
  });

  if (hasAnalyticsConsent() && activeConfig.gaMeasurementId) {
    loadGa4(activeConfig.gaMeasurementId, activeConfig.debug);
  }

  // Render UI Banner & Modal
  initConsentUI();
}

export function trackPageView(path, title) {
  const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (activeConfig.debug) {
    console.debug(`[Analytics:admin:PageView] ${cleanPath} ("${pageTitle}")`);
  }

  if (!hasAnalyticsConsent()) return;

  if (window.gtag && gaLoaded) {
    window.gtag('event', 'page_view', {
      page_path: cleanPath,
      page_title: pageTitle.slice(0, 100),
      page_location: `${window.location.origin}${cleanPath}`,
      platform: 'admin',
      environment: activeConfig.environment,
    });
  }
}

export function trackEvent(eventName, params) {
  if (activeConfig.debug) {
    console.debug(`[Analytics:admin:Event] ${eventName}`, params);
  }

  if (activeConfig.debug && !ALLOWED_EVENTS.has(eventName)) {
    console.warn(`[Analytics:Admin] Unregistered event "${eventName}".`);
  }

  if (!hasAnalyticsConsent()) return;

  if (window.gtag && gaLoaded) {
    const cleanParams = sanitizeEventParams(params);
    window.gtag('event', eventName, cleanParams);
  }
}

/**
 * Injects and manages the accessible first-party cookie banner & preferences modal
 */
export function initConsentUI() {
  if (typeof document === 'undefined') return;

  // Create UI container if not exists
  let container = document.getElementById('wm-admin-consent-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'wm-admin-consent-root';
    document.body.appendChild(container);
  }

  const existingConsent = getConsent();
  const isDecided = Boolean(existingConsent);

  function render(showBanner, showModal) {
    const current = getConsent();
    const analyticsChecked = current ? current.categories.analytics : false;

    container.innerHTML = `
      ${showBanner ? `
        <div id="wm-consent-banner" role="region" aria-label="Cookie and Privacy Choices" style="
          position: fixed; bottom: 20px; left: 20px; right: 20px; max-width: 820px; margin: 0 auto;
          background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px); border-radius: 16px; padding: 20px 24px; z-index: 99999;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); color: white; font-family: 'Inter', sans-serif;
          display: flex; flex-direction: column; gap: 16px;
        ">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="background: rgba(16, 185, 129, 0.15); color: #10b981; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; shrink: 0;">
              🛡️
            </div>
            <div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: white;">Administrative Privacy & Operational Telemetry</h4>
              <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                We use strictly necessary cookies for administrative security and authentication. With your permission, aggregate telemetry helps us measure command center navigation. Microsoft Clarity session recordings are strictly excluded from admin areas to protect student registry privacy.
              </p>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
            <button id="wm-btn-customize" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Customize
            </button>
            <button id="wm-btn-reject" style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.85); padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Reject Optional
            </button>
            <button id="wm-btn-accept" style="background: #10b981; border: none; color: #022c22; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
              Accept All
            </button>
          </div>
        </div>
      ` : ''}

      ${showModal ? `
        <div id="wm-consent-modal-overlay" role="dialog" aria-modal="true" style="
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 16px;
        ">
          <div style="
            background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px;
            max-width: 540px; width: 100%; padding: 24px; color: white; font-family: 'Inter', sans-serif;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 14px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 700;">Admin Telemetry Preferences</h3>
              <button id="wm-modal-close" style="background: none; border: none; color: rgba(255, 255, 255, 0.5); font-size: 20px; cursor: pointer;">&times;</button>
            </div>
            
            <div style="padding: 16px 0; display: flex; flex-direction: column; gap: 14px;">
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); padding: 12px 14px; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 12px;">Strictly Necessary Cookies</strong>
                  <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px;">Always Active</span>
                </div>
                <p style="margin: 4px 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.6); line-height: 1.4;">
                  Required for super-admin session security, CSRF protection, and command center authorization.
                </p>
              </div>

              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); padding: 12px 14px; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 12px;">Operational Analytics (GA4)</strong>
                    <p style="margin: 4px 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.6); line-height: 1.4;">
                      Measures command center tab transitions and system performance without tracking sensitive clinical data.
                    </p>
                  </div>
                  <input type="checkbox" id="wm-opt-analytics" ${analyticsChecked ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981;" />
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 14px;">
              <button id="wm-modal-reject" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                Reject Optional
              </button>
              <button id="wm-modal-save" style="background: #10b981; border: none; color: #022c22; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
                Save Choices
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    // Wire up listeners
    const btnAccept = document.getElementById('wm-btn-accept');
    if (btnAccept) btnAccept.onclick = () => { acceptAllConsent(); render(false, false); };

    const btnReject = document.getElementById('wm-btn-reject');
    if (btnReject) btnReject.onclick = () => { rejectAllConsent(); render(false, false); };

    const btnCustomize = document.getElementById('wm-btn-customize');
    if (btnCustomize) btnCustomize.onclick = () => render(false, true);

    const modalClose = document.getElementById('wm-modal-close');
    if (modalClose) modalClose.onclick = () => render(!getConsent(), false);

    const modalReject = document.getElementById('wm-modal-reject');
    if (modalReject) modalReject.onclick = () => { rejectAllConsent(); render(false, false); };

    const modalSave = document.getElementById('wm-modal-save');
    if (modalSave) {
      modalSave.onclick = () => {
        const checkbox = document.getElementById('wm-opt-analytics');
        saveConsent('customized', { analytics: Boolean(checkbox?.checked), marketing: false });
        render(false, false);
      };
    }
  }

  // Initial render
  render(!isDecided, false);

  // Listen to open modal requests
  window.addEventListener('wellmindly_open_consent_preferences', () => {
    render(false, true);
  });
}
