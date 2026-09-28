/* Load before Brevo's main.js. This file does not send email or create contacts.
   Subscription processing is performed by the official Brevo form script.
   The confirmation method and confirmation template are configured in Brevo,
   NOT here. The owner's simple-confirmation setting is intentionally unchanged. */
var AUTOHIDE = false;
(() => {
  'use strict';
  const host = document.querySelector('[data-vn-newsletter]');
  if (!host) return;
  const isEnglish = host.dataset.vnNewsletter === 'en';
  const text = isEnglish ? {
    code: 'Please select a country calling code.',
    invalid: 'The information provided is invalid. Please check the field format and try again.',
    required: 'This field cannot be left blank.',
    date: 'Please enter a valid date.',
    multiple: 'Please select at least one option.',
    consent: 'Please agree to receive the newsletter.',
    selectedList: '{quantity} list selected', selectedLists: '{quantity} lists selected',
    selectedOption: '{quantity} selected', selectedOptions: '{quantity} selected'
  } : {
    code: 'W\u00e4hle bitte eine L\u00e4ndervorwahl aus.',
    invalid: 'Die eingegebenen Informationen sind nicht g\u00fcltig. Bitte \u00fcberpr\u00fcfe das Feldformat und versuche es erneut.',
    required: 'Dieses Feld darf nicht leer sein.',
    date: 'Bitte gib ein g\u00fcltiges Datum ein.',
    multiple: 'W\u00e4hle bitte mindestens eine Option aus.',
    consent: 'Bitte stimme dem Erhalt des Newsletters zu.',
    selectedList: '{quantity} Liste ausgew\u00e4hlt', selectedLists: '{quantity} Listen ausgew\u00e4hlt',
    selectedOption: '{quantity} ausgew\u00e4hlt', selectedOptions: '{quantity} ausgew\u00e4hlt'
  };
  window.LOCALE = isEnglish ? 'en' : 'de';
  window.REQUIRED_CODE_ERROR_MESSAGE = text.code;
  window.EMAIL_INVALID_MESSAGE = text.invalid;
  window.SMS_INVALID_MESSAGE = text.invalid;
  window.REQUIRED_ERROR_MESSAGE = text.required;
  window.GENERIC_INVALID_MESSAGE = text.invalid;
  window.INVALID_NUMBER = text.invalid;
  window.INVALID_DATE = text.date;
  window.REQUIRED_MULTISELECT_MESSAGE = text.multiple;
  window.translation = { common: {
    selectedList: text.selectedList, selectedLists: text.selectedLists,
    selectedOption: text.selectedOption, selectedOptions: text.selectedOptions
  }};

  const form = host.querySelector('#sib-form');
  const consent = host.querySelector('#OPT_IN');
  const email = host.querySelector('#EMAIL');
  if (!form || !consent || !email) return;

  // Client-side validation is not a substitute for requiring OPT_IN in Brevo.
  const validateConsent = () => {
    consent.setCustomValidity(consent.checked ? '' : text.consent);
  };
  consent.addEventListener('change', validateConsent);
  consent.addEventListener('input', validateConsent);
  validateConsent();
  window.addEventListener('pageshow', validateConsent);
  form.addEventListener('reset', () => window.setTimeout(validateConsent, 0));

  // Runs before the vendor's normal submit handler. Never report fake success.
  form.addEventListener('submit', (event) => {
    email.value = email.value.trim();
    validateConsent();
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      form.reportValidity();
    }
  }, true);
})();
