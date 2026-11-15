/** Restaurant email prototype: no network request, storage or reservation confirmation. */
(() => {
  'use strict';
  // Reserved example domain: deliberately fictional, never a personal or live inbox.
  const DEMO_RECIPIENT = 'hello@restaurant.example';
  const form = document.querySelector('#booking-form');
  if (!form || form.dataset.emailReady) return;
  const button = form.querySelector('#generate-email');
  const status = form.querySelector('#enquiry-status');
  const preview = document.querySelector('#email-preview');
  const subjectField = preview.querySelector('#email-subject');
  const bodyField = preview.querySelector('#email-body');
  const openEmail = preview.querySelector('#open-email-app');
  const copyStatus = preview.querySelector('#copy-status');
  let generatedText = '';
  const controls = [...form.querySelectorAll('input, select, textarea')];
  const types = { booking: 'Booking enquiry', general: 'General enquiry', feedback: 'Feedback' };
  const errors = new Map();
  controls.forEach(control => {
    const error = document.createElement('p');
    error.id = `${control.id}-error`;
    error.className = 'enquiry-error';
    error.hidden = true;
    control.insertAdjacentElement('afterend', error);
    control.setAttribute('aria-describedby', [control.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    errors.set(control, error);
  });
  const clearError = control => {
    control.removeAttribute('aria-invalid');
    errors.get(control).hidden = true;
    errors.get(control).textContent = '';
  };
  form.addEventListener('input', event => {
    if (errors.has(event.target)) clearError(event.target);
    status.textContent = '';
    preview.hidden = true;
    generatedText = '';
    openEmail.removeAttribute('href');
  });
  form.addEventListener('change', event => {
    if (errors.has(event.target)) clearError(event.target);
    status.textContent = '';
    preview.hidden = true;
    generatedText = '';
    openEmail.removeAttribute('href');
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    preview.hidden = true;
    generatedText = '';
    openEmail.removeAttribute('href');
    let firstInvalid = null;
    controls.forEach(control => {
      clearError(control);
      let message = '';
      const value = control.value.trim();
      if (control.required && !value) message = 'Please complete this required field.';
      else if (control.id === 'booking-email' && !control.validity.valid) message = 'Enter a valid email address, such as name@example.com.';
      else if (control.id === 'enquiry-type' && !Object.hasOwn(types, value)) message = 'Choose Booking, General Enquiry or Feedback.';
      else if (control.id === 'booking-guests' && (control.validity.badInput || (value && (!Number.isSafeInteger(Number(value)) || Number(value) < 1)))) message = 'Enter a positive whole number of guests.';
      else if (!control.validity.valid) message = 'Check this value and use the requested format.';
      if (message) {
        control.setAttribute('aria-invalid', 'true');
        errors.get(control).textContent = message;
        errors.get(control).hidden = false;
        firstInvalid ||= control;
      }
    });
    if (firstInvalid) {
      status.textContent = 'Please correct the highlighted fields before preparing your email.';
      firstInvalid.focus();
      return;
    }
    const value = name => form.elements.namedItem(name).value.trim();
    const subject = `MAISON EMBER - ${types[value('enquiryType')]} - ${value('name')}`;
    const body = [
      'MAISON EMBER - fictional restaurant demonstration', '',
      `Enquiry type: ${types[value('enquiryType')]}`, `Full name: ${value('name')}`,
      `Email address: ${value('email')}`,
      `Preferred booking date: ${value('date') || 'Not specified'}`,
      `Preferred booking time: ${value('time') || 'Not specified'}`,
      `Number of guests: ${value('guests') || 'Not specified'}`, '',
      'Message:', value('message'), '',
      'This is an enquiry only, not a confirmed reservation.'
    ].join('\r\n');
    // Set values rather than HTML so user input stays literal, including markup and symbols.
    subjectField.value = subject;
    bodyField.value = body;
    generatedText = `To: ${DEMO_RECIPIENT}\r\nSubject: ${subject}\r\n\r\n${body}`;
    openEmail.href = `mailto:${DEMO_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    copyStatus.textContent = '';
    preview.hidden = false;
    status.textContent = 'Email draft generated below. No message has been sent and no reservation has been confirmed.';
    preview.querySelector('#preview-title').focus();
  });
  preview.querySelector('#copy-email').addEventListener('click', async () => {
    if (!generatedText) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(generatedText);
      copyStatus.textContent = 'Email copied, including recipient, subject and message.';
    } catch {
      // Keep a usable manual-copy fallback on restricted browsers and non-secure local previews.
      bodyField.focus();
      bodyField.select();
      copyStatus.textContent = 'Clipboard access is unavailable. The email body is selected: press Ctrl+C or Command+C to copy it. The subject and recipient are shown above.';
    }
  });
  form.noValidate = true;
  form.dataset.emailReady = 'true';
  button.disabled = false;
})();
