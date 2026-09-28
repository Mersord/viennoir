/* Vien Noir contact form - Form.taxi, independent of the Brevo newsletter.
 * Documentation: https://docs.form.taxi/de/javascript
 * Public submission endpoint only. No API key, email credentials or storage.
 */
(() => {
  'use strict';

  // Progressive enhancement: without these APIs the normal HTML POST still works.
  if (!window.fetch || !window.FormData || !window.AbortController) return;

  const REQUEST_TIMEOUT_MS = 30000;
  const messages = {
    de: {
      sending: 'Wird gesendet \u2026',
      pending: 'Ihre Nachricht wird \u00fcbermittelt \u2026',
      success: 'Vielen Dank! Ihre Nachricht wurde \u00fcbermittelt. Wir melden uns so bald wie m\u00f6glich bei Ihnen.',
      rejected: 'Ihre Nachricht konnte nicht \u00fcbermittelt werden. Ihre Eingaben bleiben erhalten. Bitte versuchen Sie es sp\u00e4ter erneut oder schreiben Sie uns direkt per E-Mail.',
      uncertain: 'Die \u00dcbermittlung konnte nicht best\u00e4tigt werden. Ihre Eingaben bleiben erhalten. Bitte warten Sie kurz, bevor Sie es erneut versuchen, oder schreiben Sie uns direkt per E-Mail.',
      timeout: 'Die Antwort des Formulardienstes dauert zu lange. M\u00f6glicherweise wurde Ihre Nachricht bereits angenommen. Ihre Eingaben bleiben erhalten. Bitte warten Sie kurz, bevor Sie erneut senden.',
      rateLimit: 'Zurzeit sind zu viele Anfragen eingegangen. Bitte warten Sie einige Minuten oder schreiben Sie uns direkt per E-Mail. Ihre Eingaben bleiben erhalten.',
      empty: 'Bitte f\u00fcllen Sie dieses Feld aus.',
      subjectPrefix: 'Vien Noir | Kontaktanfrage'
    },
    en: {
      sending: 'Sending \u2026',
      pending: 'Your message is being submitted \u2026',
      success: 'Thank you! Your message has been submitted. We will get back to you as soon as possible.',
      rejected: 'Your message could not be submitted. Your entries have been kept. Please try again later or email us directly.',
      uncertain: 'We could not confirm your submission. Your entries have been kept. Please wait a little before trying again, or email us directly.',
      timeout: 'The form service is taking too long to respond. Your message may already have been accepted. Your entries have been kept. Please wait a little before sending again.',
      rateLimit: 'Too many requests have been received. Please wait a few minutes or email us directly. Your entries have been kept.',
      empty: 'Please fill out this field.',
      subjectPrefix: 'Vien Noir | Contact enquiry'
    }
  };

  document.querySelectorAll('form[data-contact-form]').forEach((form) => {
    if (form.dataset.contactReady === 'true') return;
    const language = form.dataset.contactLanguage === 'en' ? 'en' : 'de';
    const text = messages[language];
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = form.querySelector('[data-contact-button-label]');
    const status = form.querySelector('[data-contact-status]');
    const statusText = form.querySelector('[data-contact-status-text]');
    const fallback = form.querySelector('[data-contact-fallback]');
    if (!button || !buttonLabel || !status || !statusText) return;

    form.dataset.contactReady = 'true';
    const idleLabel = buttonLabel.textContent;
    const requiredFields = Array.from(form.querySelectorAll('input[required], textarea[required]'));
    let pending = false;
    let disabledStates = [];

    requiredFields.forEach((field) => {
      field.addEventListener('input', () => field.setCustomValidity(''));
    });

    function showStatus(state, message) {
      status.hidden = false;
      status.dataset.state = state;
      status.setAttribute('role', state === 'error' ? 'alert' : 'status');
      status.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
      // Never render a provider response with innerHTML.
      statusText.textContent = message;
      if (fallback) fallback.hidden = state !== 'error';
    }

    function setBusy(busy) {
      form.setAttribute('aria-busy', String(busy));
      form.classList.toggle('is-sending', busy);
      buttonLabel.textContent = busy ? text.sending : idleLabel;
      if (busy) {
        // FormData is captured before disabling controls, so all fields are sent.
        disabledStates = Array.from(form.elements).map((control) => [control, control.disabled]);
        disabledStates.forEach(([control]) => { control.disabled = true; });
      } else {
        disabledStates.forEach(([control, wasDisabled]) => { control.disabled = wasDisabled; });
        disabledStates = [];
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (pending) return;

      requiredFields.forEach((field) => {
        field.value = field.value.trim();
        field.setCustomValidity(field.value ? '' : text.empty);
      });
      if (!form.reportValidity()) return;

      // Only data in THIS form are sent; never read or submit the newsletter form.
      const data = new FormData(form);
      const email = String(data.get('email') || '').trim();
      const subject = String(data.get('subject') || '').replace(/[\r\n]/g, ' ').trim();
      data.set('_replyto', email);
      data.set('_subject', text.subjectPrefix + (subject ? ' - ' + subject : ''));
      data.set('_lang', language);

      pending = true;
      setBusy(true);
      showStatus('pending', text.pending);
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          signal: controller.signal
        });

        let result = null;
        try {
          result = await response.json();
        } catch (error) {
          if (error && error.name === 'AbortError') throw error;
          // HTML (e.g. a CAPTCHA page) is not proof of a successful submission.
        }

        // Match Form.taxi's documented success response, not just HTTP 200.
        if (response.ok && result && result.success === true) {
          form.reset();
          showStatus('success', text.success);
        } else if (response.status === 429) {
          showStatus('error', text.rateLimit);
        } else if (result && result.success === false && response.status < 500) {
          showStatus('error', text.rejected);
        } else {
          showStatus('error', text.uncertain);
        }
      } catch (error) {
        showStatus('error', error && error.name === 'AbortError' ? text.timeout : text.uncertain);
      } finally {
        window.clearTimeout(timer);
        pending = false;
        setBusy(false);
        status.focus({ preventScroll: true });
      }
      // No automatic retry: a network error can occur AFTER the service accepted it.
    });
  });
})();
