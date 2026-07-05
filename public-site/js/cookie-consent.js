// Cookie consent banner — loads Google Analytics only after user accepts.
const GA_ID = 'G-DFPF2L0RM3';
const STORAGE_KEY = 'enzo-cookie-consent';

function loadGoogleAnalytics() {
  if (window.gaScriptLoaded) return;
  window.gaScriptLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}

function renderBanner() {
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
        Weboldalunk sütiket (cookie-kat) használ a jobb felhasználói élmény és a látogatottság mérése érdekében.
        A "Rendben" gombra kattintva hozzájárulsz ezek használatához.
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="btn btn-primary" id="cookie-accept">Rendben</button>
        <button type="button" class="btn-reject" id="cookie-reject">Elutasítom</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    loadGoogleAnalytics();
    wrapper.remove();
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    wrapper.remove();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const consent = localStorage.getItem(STORAGE_KEY);
  if (consent === 'accepted') {
    loadGoogleAnalytics();
  } else if (consent !== 'rejected') {
    renderBanner();
  }
});
