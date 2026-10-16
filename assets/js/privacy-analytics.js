/*
 * Vien.noir - consent-gated GA4, 2026-10-16.
 * No gtag.js request before optional analytics consent (Basic Consent Mode).
 * Google Signals is separately opt-in; ad personalization stays disabled.
 * Cloudflare, forms, navigation and existing site scripts are not modified.
 * Account-side setup: tools/GA4-EINRICHTUNG.md
 */
(() => {
  'use strict';
  if (window.VNPrivacy) return;

  const MEASUREMENT_ID = 'G-WDV9MK1299';
  const POLICY_VERSION = '2026-10-16.1';
  const CHOICE_DAYS = 180;
  const DAY_MS = 86400000;
  const ownScript = document.currentScript;
  const siteRoot = new URL('../../', ownScript.src);
  const STORAGE_KEY = 'vn_consent_v1' + (siteRoot.pathname === '/' ? '' : ':' + siteRoot.pathname);
  const language = (document.documentElement.lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  const privacyURL = new URL(language === 'en' ? 'en/privacy/' : 'datenschutz/', siteRoot).href;
  const debug = new URL(location.href).searchParams.get('vn_debug') === '1';
  const isLocal = /^(localhost|127(?:\.\d+){3}|\[?::1\]?)$/.test(location.hostname);
  const measurementAvailable = /^https?:$/.test(location.protocol) && (!isLocal || debug);
  const disableKey = 'ga-disable-' + MEASUREMENT_ID;
  const SHOWS = {
    'ladies-of-bond-vienna': 'Ladies of Bond',
    'season-of-desire-vienna': 'Season of Desire',
    'santa-baby-dinner-show': 'Santa Baby'
  };
  // Generated from the supplied date rows, not guessed from Vindobona slugs.
  const TICKET_DESTINATIONS = {
  "https://vindobona.wien/events/ladies-of-bond": {
    "show_date": "2026-09-18",
    "show_name": "Ladies of Bond"
  },
  "https://vindobona.wien/events/ladies-of-bond-2": {
    "show_date": "2027-03-12",
    "show_name": "Ladies of Bond"
  },
  "https://vindobona.wien/events/ladies-of-bond-2-2": {
    "show_date": "2027-04-16",
    "show_name": "Ladies of Bond"
  },
  "https://vindobona.wien/events/ladies-of-bond-3": {
    "show_date": "2026-10-16",
    "show_name": "Season of Desire"
  },
  "https://vindobona.wien/events/ladies-of-bond-3-2": {
    "show_date": "2027-01-22",
    "show_name": "Season of Desire"
  },
  "https://vindobona.wien/events/ladies-of-bond-3-3": {
    "show_date": "2027-02-19",
    "show_name": "Season of Desire"
  },
  "https://vindobona.wien/events/santa-baby-die-suche-nach-mrs-claus": {
    "show_date": "2026-11-27",
    "show_name": "Santa Baby"
  },
  "https://vindobona.wien/events/santa-baby-die-suche-nach-mrs-claus-2": {
    "show_date": "2026-11-28",
    "show_name": "Santa Baby"
  },
  "https://vindobona.wien/events/santa-baby-die-suche-nach-mrs-claus-2-2": {
    "show_date": "2026-12-10",
    "show_name": "Santa Baby"
  },
  "https://vindobona.wien/events/santa-baby-die-suche-nach-mrs-claus-3": {
    "show_date": "2026-12-09",
    "show_name": "Santa Baby"
  }
};

  const messages = {
    de: {
      eyebrow: 'Ihre Privatsph\u00e4re', title: 'Sie entscheiden, was sichtbar wird.',
      intro: 'Mit Ihrer Zustimmung nutzen wir Google Analytics f\u00fcr Seitenaufrufe und Ticketklicks. Zus\u00e4tzlich k\u00f6nnen Google-Signale demografische Auswertungen erm\u00f6glichen. Dabei kann Google Nutzungsdaten mit Google-Konten und Werbe-Cookies verkn\u00fcpfen.',
      note: 'Ohne Zustimmung bleibt Google Analytics aus. Cloudflare Web Analytics l\u00e4uft wie bisher ohne Tracking-Cookies.',
      reject: 'Ablehnen', accept: 'Alle erlauben', settings: 'Einstellungen', privacy: 'Datenschutz',
      settingsTitle: 'Ihre Datenschutzeinstellungen',
      settingsIntro: 'Alle optionalen Funktionen sind zun\u00e4chst ausgeschaltet. Sie k\u00f6nnen Ihre Auswahl jederzeit im Footer \u00e4ndern.',
      necessary: 'Notwendige Speicherung', always: 'Immer aktiv',
      necessaryText: 'Wir speichern Ihre Auswahl f\u00fcr h\u00f6chstens 180 Tage in diesem Browser. So fragen wir nicht bei jedem Seitenaufruf erneut. Cloudflare bleibt davon unabh\u00e4ngig aktiv.',
      analytics: 'Statistik mit Google Analytics',
      analyticsText: 'Misst Seitenaufrufe, Herkunft und Klicks auf Ticketlinks. Google setzt daf\u00fcr Analyse-Cookies. Unsere Ereignisse enthalten keine Formulareingaben und keine best\u00e4tigten Ticketk\u00e4ufe.',
      audience: 'Demografie & Interessen',
      audienceText: 'Erlaubt zus\u00e4tzlich Google-Signale: Google kann Nutzungsdaten mit Informationen angemeldeter Google-Konten und Werbe-Cookies verkn\u00fcpfen. Wir erhalten zusammengefasste Angaben, etwa zu Alter, Geschlecht und Interessen, keine pers\u00f6nlichen Profile.',
      dependency: 'Ben\u00f6tigt die Zustimmung zu Statistik.',
      international: 'Anbieter: Google Ireland Limited. Eine Verarbeitung durch Google LLC in den USA ist m\u00f6glich. Personalisierte Werbung und Remarketing werden durch diese Integration nicht freigeschaltet.',
      reload: 'Wenn Sie eine bereits aktive Zustimmung einschr\u00e4nken, wird die Seite neu geladen. Noch nicht abgesendete Formulareingaben gehen dabei verloren.',
      save: 'Auswahl speichern', close: 'Schlie\u00dfen', saved: 'Ihre Datenschutzeinstellungen wurden gespeichert.',
      sessionOnly: 'Die Auswahl gilt f\u00fcr diese Seite. Ihr Browser erlaubt derzeit keine dauerhafte Speicherung.'
    },
    en: {
      eyebrow: 'Your privacy', title: 'You decide what we can see.',
      intro: 'With your consent, we use Google Analytics for page views and ticket-link clicks. Optional Google Signals can also provide demographic insights. This may allow Google to link usage data to Google accounts and advertising cookies.',
      note: 'Without consent, Google Analytics stays off. Cloudflare Web Analytics continues as before, without tracking cookies.',
      reject: 'Reject', accept: 'Allow all', settings: 'Settings', privacy: 'Privacy policy',
      settingsTitle: 'Your privacy settings',
      settingsIntro: 'All optional features are off by default. You can change your choice at any time using the link in the footer.',
      necessary: 'Necessary storage', always: 'Always active',
      necessaryText: 'We save your choice in this browser for up to 180 days so that we do not ask again on every page. Cloudflare remains active independently of this choice.',
      analytics: 'Google Analytics statistics',
      analyticsText: 'Measures page views, traffic sources and clicks on ticket links. Google uses analytics cookies for this. Our events do not include form entries or confirmed ticket purchases.',
      audience: 'Demographics & interests',
      audienceText: 'Also allows Google Signals: Google may link usage data to information from signed-in Google accounts and advertising cookies. We receive aggregated insights, such as age, gender and interests, not personal profiles.',
      dependency: 'Requires consent to statistics.',
      international: 'Provider: Google Ireland Limited. Processing by Google LLC in the USA is possible. This integration does not enable personalised advertising or remarketing.',
      reload: 'Reducing an active consent will reload the page. Any form entries you have not submitted will be lost.',
      save: 'Save selection', close: 'Close', saved: 'Your privacy settings have been saved.',
      sessionOnly: 'Your choice applies to this page. Your browser currently does not allow it to be saved for future visits.'
    }
  };
  const text = messages[language];
  let preference = readStoredChoice();
  let persistenceWorking = true;
  let scriptRequested = false;
  let reloadPending = false;
  let expiryTimer = null;
  let banner;
  let dialog;
  let analyticsInput;
  let audienceInput;
  let previousFocus;
  let fallbackInert = [];
  let channel = null;
  const lastActivation = new WeakMap();

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const gtag = function () { window.gtag.apply(window, arguments); };
  window[disableKey] = true;
  gtag('consent', 'default', consentState(null));
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  function validChoice(value) {
    return !!(value && value.version === POLICY_VERSION &&
      typeof value.analytics === 'boolean' && typeof value.audience === 'boolean' &&
      (!value.audience || value.analytics) && Number.isFinite(value.updatedAt) &&
      Number.isFinite(value.expiresAt) && value.updatedAt <= Date.now() + 60000 &&
      value.expiresAt > Date.now() && value.expiresAt > value.updatedAt &&
      value.expiresAt <= value.updatedAt + CHOICE_DAYS * DAY_MS);
  }

  function readStoredChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return validChoice(value) ? value : null;
    } catch (_) { return null; }
  }

  function canMeasure() {
    return measurementAvailable && !reloadPending && validChoice(preference) && preference.analytics;
  }

  function consentState(choice) {
    const analytics = validChoice(choice) && choice.analytics;
    const audience = analytics && choice.audience;
    return {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: audience ? 'granted' : 'denied',
      ad_user_data: audience ? 'granted' : 'denied',
      // Demographic reporting is separate from activating personalised ads.
      ad_personalization: 'denied'
    };
  }

  function showFromPath(path) {
    return Object.keys(SHOWS).find((slug) => path.split('/').includes(slug)) || '';
  }

  function safeURL(value, withCampaigns) {
    if (!value) return '';
    try {
      const original = new URL(value, location.href);
      if (!/^https?:$/.test(original.protocol)) return '';
      const clean = new URL(original.origin + original.pathname);
      clean.username = '';
      clean.password = '';
      if (withCampaigns) {
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'].forEach((key) => {
          const value = original.searchParams.get(key);
          // Only campaign slugs. Never preserve arbitrary query strings or hashes.
          if (value && /^[a-z0-9_.-]{1,100}$/i.test(value) && !/\d{7,}/.test(value)) {
            clean.searchParams.set(key, value);
          }
        });
      }
      return clean.href;
    } catch (_) { return ''; }
  }

  function pageParameters() {
    const body = document.body;
    const values = {
      page_location: safeURL(location.href, true),
      page_referrer: safeURL(document.referrer, false),
      page_title: document.title,
      page_language: language,
      page_type: body.dataset.vnPageType || 'content',
      content_group: body.dataset.vnShowName || body.dataset.vnPageType || 'content'
    };
    if (body.dataset.vnShowName) values.show_name = body.dataset.vnShowName;
    if (body.dataset.vnShowDate) values.show_date = body.dataset.vnShowDate;
    return values;
  }

  function event(name, parameters) {
    if (!canMeasure() || !scriptRequested || window[disableKey]) return;
    const payload = Object.assign({}, pageParameters(), parameters || {}, { send_to: MEASUREMENT_ID });
    if (debug) payload.debug_mode = true;
    gtag('event', name, payload);
  }

  function beginAnalytics() {
    if (!canMeasure() || scriptRequested) return;
    scriptRequested = true;
    window[disableKey] = false;
    gtag('consent', 'update', consentState(preference));
    gtag('js', new Date());
    const configuration = Object.assign({}, pageParameters(), {
      send_page_view: false,
      allow_google_signals: preference.audience,
      allow_ad_personalization_signals: false,
      cookie_domain: 'none',
      cookie_path: siteRoot.pathname,
      cookie_expires: CHOICE_DAYS * 86400,
      cookie_update: false,
      cookie_flags: location.protocol === 'https:' ? 'SameSite=Lax;Secure' : 'SameSite=Lax'
    });
    if (debug) configuration.debug_mode = true;
    gtag('config', MEASUREMENT_ID, configuration);
    event('page_view');
    if (document.body.dataset.vnShowName) event('show_view');

    const tag = document.createElement('script');
    tag.id = 'vn-ga4-tag';
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    // A blocker or a network failure must never break navigation or the banner.
    tag.onerror = () => { if (debug) console.info('[Vien.noir] GA4 was blocked or could not be loaded.'); };
    document.head.appendChild(tag);
  }

  function removeAnalyticsCookies() {
    // Only known first-party Google measurement cookies, not form/session cookies.
    let cookieString;
    try { cookieString = document.cookie; } catch (_) { return; }
    const names = cookieString.split(';').map((item) => item.trim().split('=')[0])
      .filter((name) => /^(?:_ga(?:_|$)|_gid$|_gat(?:_|$)|_gac_|_gcl_)/.test(name));
    const domains = ['', location.hostname, '.' + location.hostname];
    const labels = location.hostname.split('.');
    for (let i = 1; i < labels.length - 1; i += 1) {
      domains.push(labels.slice(i).join('.'), '.' + labels.slice(i).join('.'));
    }
    const paths = new Set(['/', siteRoot.pathname]);
    const parts = location.pathname.split('/');
    for (let i = 1; i < parts.length; i += 1) {
      const path = parts.slice(0, i).join('/') || '/';
      paths.add(path);
      paths.add(path.endsWith('/') ? path : path + '/');
    }
    names.forEach((name) => domains.forEach((domain) => paths.forEach((path) => {
      try {
        document.cookie = name + '=;Max-Age=0;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=' + path +
          (domain ? ';domain=' + domain : '') + ';SameSite=Lax';
      } catch (_) { /* Storage may be blocked or unavailable in a sandbox. */ }
    })));
  }

  function stopAnalyticsAndReload() {
    if (reloadPending) return;
    reloadPending = true;
    window[disableKey] = true;
    // The disable flag is set first. The fresh page then uses the saved choice
    // and does not load Google at all when analytics consent was withdrawn.
    gtag('consent', 'update', consentState(null));
    gtag('set', 'allow_google_signals', false);
    gtag('set', 'allow_ad_personalization_signals', false);
    const tag = document.getElementById('vn-ga4-tag');
    if (tag) tag.remove();
    removeAnalyticsCookies();
    location.reload();
  }

  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (!validChoice(preference)) return;
    const delay = Math.min(2147483000, Math.max(100, preference.expiresAt - Date.now() + 10));
    expiryTimer = setTimeout(() => {
      if (!validChoice(preference)) applyExternalChoice(null);
      else scheduleExpiry();
    }, delay);
  }

  function applyExternalChoice(next) {
    const previous = preference;
    preference = validChoice(next) ? next : null;
    const reduced = !preference || !preference.analytics ||
      (previous && previous.audience && !preference.audience);
    if (scriptRequested && reduced) {
      stopAnalyticsAndReload();
      return;
    }
    if (scriptRequested && preference && previous && preference.audience !== previous.audience) {
      gtag('consent', 'update', consentState(preference));
      gtag('config', MEASUREMENT_ID, { allow_google_signals: preference.audience,
        allow_ad_personalization_signals: false, send_page_view: false });
    } else beginAnalytics();
    if (!preference || !preference.analytics) removeAnalyticsCookies();
    if (banner) banner.hidden = !!preference;
    scheduleExpiry();
  }

  function saveChoice(analytics, audience) {
    const previous = preference;
    const now = Date.now();
    const next = { version: POLICY_VERSION, analytics: !!analytics, audience: !!analytics && !!audience,
      updatedAt: now, expiresAt: now + CHOICE_DAYS * DAY_MS };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      persistenceWorking = true;
    } catch (_) { persistenceWorking = false; }
    if (channel) { try { channel.postMessage(next); } catch (_) { /* storage event remains available */ } }
    closeSettings();
    banner.hidden = true;
    preference = next;
    const reduced = previous && previous.analytics &&
      (!next.analytics || (previous.audience && !next.audience));
    if (scriptRequested && reduced) {
      stopAnalyticsAndReload();
      return;
    }
    if (scriptRequested && previous && previous.audience !== next.audience) {
      gtag('consent', 'update', consentState(next));
      gtag('config', MEASUREMENT_ID, { allow_google_signals: next.audience,
        allow_ad_personalization_signals: false, send_page_view: false });
    } else beginAnalytics();
    if (!next.analytics) removeAnalyticsCookies();
    document.getElementById('vn-consent-status').textContent = persistenceWorking ? text.saved : text.sessionOnly;
    scheduleExpiry();
  }

  function updateInputs() {
    if (!analyticsInput.checked) audienceInput.checked = false;
    audienceInput.disabled = !analyticsInput.checked;
  }

  function openSettings(trigger) {
    previousFocus = trigger || document.activeElement;
    analyticsInput.checked = !!(validChoice(preference) && preference.analytics);
    audienceInput.checked = !!(validChoice(preference) && preference.audience);
    updateInputs();
    dialog.querySelector('[data-vn-reload-note]').hidden = !scriptRequested;
    banner.hidden = true;
    if (dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      dialog.setAttribute('open', '');
      dialog.classList.add('vn-consent-dialog--fallback');
      fallbackInert = [];
      Array.from(document.body.children).forEach((el) => {
        if (el !== dialog && !el.inert) { el.inert = true; fallbackInert.push(el); }
      });
    }
    // Avoid scrolling the document when focusing the overlay (notably iOS).
    dialog.querySelector('[data-vn-close]').focus({ preventScroll: true });
  }

  function closeSettings() {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); finishClose(); }
  }

  function finishClose() {
    fallbackInert.forEach((el) => { el.inert = false; });
    fallbackInert = [];
    if (banner) banner.hidden = !!preference;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  }

  function createUI() {
    banner = document.createElement('section');
    banner.className = 'vn-consent-banner';
    banner.id = 'vn-consent-banner';
    banner.hidden = true;
    banner.setAttribute('aria-labelledby', 'vn-consent-title');
    banner.innerHTML = `
      <div class="vn-consent-banner__copy">
        <p class="vn-consent-eyebrow">${text.eyebrow}</p>
        <h2 id="vn-consent-title">${text.title}</h2>
        <p class="vn-consent-intro">${text.intro}</p>
        <p class="vn-consent-note">${text.note} <a data-vn-policy-link></a></p>
      </div>
      <div class="vn-consent-actions">
        <button class="vn-consent-button" type="button" data-vn-reject>${text.reject}</button>
        <button class="vn-consent-button" type="button" data-vn-accept>${text.accept}</button>
        <button class="vn-consent-button vn-consent-button--settings" type="button" data-vn-open-settings aria-haspopup="dialog" aria-controls="vn-consent-dialog">${text.settings}</button>
      </div>`;

    dialog = document.createElement('dialog');
    dialog.id = 'vn-consent-dialog';
    dialog.className = 'vn-consent-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'vn-settings-title');
    dialog.setAttribute('aria-describedby', 'vn-settings-intro');
    dialog.innerHTML = `
      <div class="vn-consent-dialog__head">
        <div><p class="vn-consent-eyebrow">VIEN.NOIR</p><h2 id="vn-settings-title">${text.settingsTitle}</h2></div>
        <button class="vn-consent-close" type="button" aria-label="${text.close}" data-vn-close><svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
      </div>
      <div class="vn-consent-dialog__body">
        <p id="vn-settings-intro">${text.settingsIntro}</p>
        <div class="vn-consent-option">
          <div class="vn-consent-option__heading"><h3>${text.necessary}</h3><span class="vn-consent-badge">${text.always}</span></div>
          <p>${text.necessaryText}</p>
        </div>
        <div class="vn-consent-option">
          <div class="vn-consent-option__heading"><h3 id="vn-analytics-label">${text.analytics}</h3>
            <label class="vn-consent-switch"><input id="vn-consent-analytics" type="checkbox" aria-labelledby="vn-analytics-label" aria-describedby="vn-analytics-description"><span aria-hidden="true"></span></label></div>
          <p id="vn-analytics-description">${text.analyticsText}</p>
        </div>
        <div class="vn-consent-option">
          <div class="vn-consent-option__heading"><h3 id="vn-audience-label">${text.audience}</h3>
            <label class="vn-consent-switch"><input id="vn-consent-audience" type="checkbox" aria-labelledby="vn-audience-label" aria-describedby="vn-audience-description vn-audience-dependency"><span aria-hidden="true"></span></label></div>
          <p id="vn-audience-description">${text.audienceText}</p>
          <p class="vn-consent-dependency" id="vn-audience-dependency">${text.dependency}</p>
        </div>
        <p class="vn-consent-detail-note">${text.international} <a data-vn-policy-link></a></p>
        <p class="vn-consent-detail-note" data-vn-reload-note hidden>${text.reload}</p>
      </div>
      <div class="vn-consent-dialog__actions">
        <button type="button" class="vn-consent-button" data-vn-reject>${text.reject}</button>
        <button type="button" class="vn-consent-button" data-vn-save>${text.save}</button>
      </div>`;
    document.body.append(banner, dialog);
    [banner, dialog].forEach((part) => part.querySelectorAll('[data-vn-policy-link]').forEach((a) => {
      a.href = privacyURL + '#google-analytics';
      a.textContent = text.privacy;
    }));
    const status = document.createElement('div');
    status.id = 'vn-consent-status';
    status.className = 'vn-consent-sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.body.append(status);
    analyticsInput = dialog.querySelector('#vn-consent-analytics');
    audienceInput = dialog.querySelector('#vn-consent-audience');
    analyticsInput.addEventListener('change', updateInputs);
    dialog.addEventListener('close', finishClose);
    // Native Escape only closes the dialog; it does not grant consent.
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && typeof dialog.showModal !== 'function') { e.preventDefault(); closeSettings(); }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll('button, a[href], input:not(:disabled)'))
        .filter((el) => !el.hidden && el.getClientRects().length);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      const button = e.target.closest('[data-vn-reject], [data-vn-accept], [data-vn-save], [data-vn-close], [data-vn-open-settings], [data-vn-privacy-settings]');
      if (!button) return;
      e.preventDefault();
      if (button.hasAttribute('data-vn-reject')) saveChoice(false, false);
      else if (button.hasAttribute('data-vn-accept')) saveChoice(true, true);
      else if (button.hasAttribute('data-vn-save')) saveChoice(analyticsInput.checked, audienceInput.checked);
      else if (button.hasAttribute('data-vn-close')) closeSettings();
      else openSettings(button);
    });
    banner.hidden = !!preference;
  }

  function ticketTarget(url) {
    return ((url.hostname === 'vindobona.wien' || url.hostname === 'www.vindobona.wien') && /^\/events\//.test(url.pathname)) ||
      url.hostname === 'shop.eventjet.at';
  }

  function activation(e) {
    if (!canMeasure() || e.defaultPrevented || !(e.target instanceof Element)) return;
    if ((e.type === 'click' && e.button !== 0) || (e.type === 'auxclick' && e.button !== 1)) return;
    const link = e.target.closest('a[href]');
    if (!link || link.getAttribute('aria-disabled') === 'true' || link.hasAttribute('data-vn-ignore')) return;
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    const outbound = ticketTarget(url);
    const interest = !outbound && url.origin === location.origin && link.dataset.vnEvent === 'ticket_interest';
    if (!outbound && !interest) return;
    const now = Date.now();
    if (lastActivation.has(link) && now - lastActivation.get(link) < 500) return;
    lastActivation.set(link, now);
    const targetKey = url.origin + url.pathname.replace(/\/$/, '');
    const known = TICKET_DESTINATIONS[targetKey] || {};
    const row = link.closest('[data-event-start-at]');
    const routeShow = showFromPath(url.pathname) || showFromPath(location.pathname);
    const parameters = {
      show_name: known.show_name || link.dataset.vnShowName || (routeShow ? SHOWS[routeShow] : 'unknown'),
      button_position: link.dataset.vnPosition || (row ? 'date_list' : 'content'),
      link_domain: url.hostname,
      link_url: safeURL(url.href, false)
    };
    const date = (row && row.dataset.eventStartAt.slice(0, 10)) || known.show_date || link.dataset.vnShowDate;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) parameters.show_date = date;
    else delete parameters.show_date;
    event(outbound ? 'ticket_click' : 'ticket_interest', parameters);
    // Do not preventDefault, change URLs, or delay the user's ticket navigation.
  }

  document.addEventListener('click', activation);
  document.addEventListener('auxclick', activation);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) applyExternalChoice(readStoredChoice());
  });
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(STORAGE_KEY);
      channel.onmessage = (e) => applyExternalChoice(e.data);
    }
  } catch (_) { /* Disabled in some private browsing configurations. */ }
  function recheckChoice() {
    if (reloadPending) return;
    if (persistenceWorking) {
      const next = readStoredChoice();
      const changed = (!next !== !preference) || (next && preference &&
        (next.updatedAt !== preference.updatedAt || next.analytics !== preference.analytics || next.audience !== preference.audience));
      if (changed || (preference && !validChoice(preference))) applyExternalChoice(next);
    } else if (preference && !validChoice(preference)) applyExternalChoice(null);
  }
  window.addEventListener('pageshow', recheckChoice);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recheckChoice(); });

  window.VNPrivacy = Object.freeze({
    openSettings: () => openSettings(document.activeElement),
    getConsent: () => validChoice(preference) ? Object.assign({}, preference) : null,
    measurementId: MEASUREMENT_ID,
    storageKey: STORAGE_KEY,
    policyVersion: POLICY_VERSION
  });
  createUI();
  if (!preference || !preference.analytics) removeAnalyticsCookies();
  beginAnalytics();
  scheduleExpiry();
})();
