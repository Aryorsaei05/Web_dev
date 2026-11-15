// Generate an inspectable email draft locally. No booking is sent or stored.
(() => {
  'use strict';
  const form = document.querySelector('#booking-form');
  if (!form) return;

  const preview = document.querySelector('#email-preview');
  const draftText = document.querySelector('#email-draft');
  const openEmail = document.querySelector('#open-email');
  const copyButton = document.querySelector('#copy-email');
  const status = document.querySelector('#draft-status');
  const date = form.elements.date;
  const recipient = form.dataset.recipient;
  const localDate = () => {
    const now = new Date();
    // Use the visitor's local calendar day rather than UTC near midnight.
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  date.min = localDate();

  // Suppress implicit GET submission until the generator is ready.
  const button = form.querySelector('[type="submit"]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    date.min = localDate();
    const name = form.elements.name;
    name.setCustomValidity(name.value.trim() ? '' : 'Enter your name.');
    date.setCustomValidity(date.value && date.value < localDate() ? 'Choose today or a future date.' : '');
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const subject = `Booking enquiry: ${values.get('date')} for ${values.get('guests')} guests`;
    const body = [
      'Hello Ember & Grain prototype team,', '',
      `Name: ${String(values.get('name')).trim()}`,
      `Email: ${String(values.get('email')).trim()}`,
      `Preferred date: ${values.get('date')}`,
      `Preferred time: ${values.get('time')}`,
      `Guests: ${values.get('guests')}`, '',
      'Message:', String(values.get('message')).trim() || 'No additional message.', '',
      'This is a portfolio prototype enquiry, not a confirmed reservation.',
    ].join('\r\n');

    // Encode each component, so &, +, Unicode and line breaks survive mailto.
    openEmail.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    draftText.value = `To: ${recipient}\r\nSubject: ${subject}\r\n\r\n${body}`;
    preview.hidden = false;
    status.textContent = 'Email draft ready. Review it below, then open your email app or copy the draft.';
    preview.querySelector('h3').focus();
  });

  // A changed field invalidates the old draft; never offer stale booking details.
  form.addEventListener('input', () => {
    form.elements.name.setCustomValidity('');
    date.setCustomValidity('');
    if (!preview.hidden) {
      preview.hidden = true;
      openEmail.removeAttribute('href');
      draftText.value = '';
      status.textContent = 'Details changed. Generate a new draft when ready.';
    }
  });

  copyButton.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draftText.value);
      status.textContent = 'Draft copied. Paste it into an email addressed to the prototype contact.';
    } catch {
      // Clipboard access may be unavailable on local files or restricted browsers.
      draftText.focus();
      draftText.select();
      status.textContent = 'Draft selected. Use your device’s Copy command, then paste it into your email app.';
    }
  });
  button.disabled = false;
})();
