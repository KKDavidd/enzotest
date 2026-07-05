const GA_ID = 'G-DFPF2L0RM3';
const STORAGE_KEY = 'enzo-cookie-consent';

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;

gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});

let gaScriptInjected = false;

function injectGaScript() {
  if (gaScriptInjected) return;
  gaScriptInjected = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
}

function grantAnalyticsConsent() {
  gtag('consent', 'update', { analytics_storage: 'granted' });
  injectGaScript();
}

function revokeAnalyticsConsent() {
  gtag('consent', 'update', { analytics_storage: 'denied' });
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name.startsWith('_ga') || name.startsWith('_gid')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

function removeBanner() {
  const el = document.getElementById('cookie-consent');
  if (el) el.remove();
}

function renderBanner() {
  removeBanner();

  const wrapper = document.createElement('div');
  wrapper.className = 'cookie-consent';
  wrapper.id = 'cookie-consent';
  wrapper.setAttribute('role', 'dialog');
  wrapper.setAttribute('aria-live', 'polite');
  wrapper.setAttribute('aria-label', 'Süti hozzájárulás');

  wrapper.innerHTML = `
    <div class="cookie-consent__card">
      <div class="cookie-consent__text">
        <strong>Sütiket használunk</strong>
        Weboldalunk a látogatottság mérésére Google Analytics sütiket használ. Ezek csak akkor aktiválódnak,
        ha hozzájárulsz. A hozzájárulásod bármikor visszavonhatod a lábléc "Süti beállítások" linkjén.
        Részletek: <a href="adatkezeles.html">Adatkezelési tájékoztató</a>.
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="btn btn-primary" id="cookie-accept">Elfogadom</button>
        <button type="button" class="btn-reject" id="cookie-reject">Elutasítom</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    grantAnalyticsConsent();
    removeBanner();
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    revokeAnalyticsConsent();
    removeBanner();
  });
}

function applyStoredConsent() {
  const consent = localStorage.getItem(STORAGE_KEY);
  if (consent === 'accepted') {
    grantAnalyticsConsent();
  } else if (consent === 'rejected') {
    revokeAnalyticsConsent();
  } else {
    renderBanner();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyStoredConsent();

  const settingsLink = document.getElementById('cookie-settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      renderBanner();
    });
  }
});
