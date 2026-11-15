/**
 * Ember & Grain booking enquiry (restaurant.html)
 * ------------------------------------------------
 * Turns the booking form into an email draft that the visitor reviews and
 * sends from their own email app. Nothing is sent or stored by the website.
 *
 * Design:
 * - One data object (OPENING_HOURS) is the single source of truth for the
 *   opening hours. It drives the "open now" line, today's highlight in the
 *   hours list and the 30-minute time slots offered for each date. The HTML
 *   hours list must be kept in step with it.
 * - All dates are worked out in the restaurant's time zone (Europe/London)
 *   with Intl.DateTimeFormat, so a visitor abroad or near midnight still
 *   sees the right "today". Calendar maths uses UTC dates built from
 *   YYYY-MM-DD strings, so clock changes (BST/GMT) cannot shift a day.
 * - The form uses novalidate; this script validates each field, shows an
 *   inline error linked with aria-describedby, sets aria-invalid and moves
 *   focus to the first problem. Native attributes (required, type, min, max)
 *   remain in the HTML for semantics.
 * - Any edit after a draft is generated hides the old draft, so stale
 *   booking details are never offered.
 * - Progressive enhancement: the submit button starts disabled and is only
 *   enabled once the handlers below are attached; a <noscript> mailto link
 *   covers visitors without JavaScript.
 */
(() => {
  'use strict';

  /* ---------- Configuration ---------- */

  const TIME_ZONE = 'Europe/London';
  const BOOKING_WINDOW_DAYS = 90;   // furthest date that can be requested
  const SLOT_MINUTES = 30;          // interval between offered times
  const LAST_SEATING_MINUTES = 90;  // last table this long before closing
  const MAX_GUESTS = 20;
  const MAX_SAFE_MAILTO_LENGTH = 1800; // some email apps truncate longer links
  const MESSAGE_ANNOUNCE_DELAY = 900;  // ms pause before announcing the counter

  /**
   * Opening hours keyed by JavaScript day number (0 = Sunday … 6 = Saturday).
   * null means closed all day. Times are 24-hour "HH:MM" strings.
   */
  const OPENING_HOURS = Object.freeze({
    0: { open: '12:00', close: '20:00' },
    1: null,
    2: { open: '17:00', close: '22:00' },
    3: { open: '17:00', close: '22:00' },
    4: { open: '17:00', close: '22:00' },
    5: { open: '12:00', close: '23:00' },
    6: { open: '12:00', close: '23:00' },
  });

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  // A practical check rather than the full RFC: something@domain.tld,
  // no spaces, and at least one dot in the domain part.
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

  /* ---------- Date and time helpers ---------- */

  /**
   * Current date and time in the restaurant's time zone.
   * @returns {{isoDate: string, minutes: number, weekday: number}}
   *   isoDate as YYYY-MM-DD, minutes since midnight, and the day number.
   */
  function getLondonNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const part = (type) => parts.find((p) => p.type === type).value;
    const isoDate = `${part('year')}-${part('month')}-${part('day')}`;
    return {
      isoDate,
      minutes: Number(part('hour')) * 60 + Number(part('minute')),
      weekday: getWeekday(isoDate),
    };
  }

  /**
   * Parse a YYYY-MM-DD string into a UTC Date, rejecting impossible dates.
   * @param {string} iso
   * @returns {Date|null}
   */
  function parseIsoDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }

  /**
   * Format a UTC Date as YYYY-MM-DD.
   * @param {Date} date
   * @returns {string}
   */
  function toIsoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Add whole days to a YYYY-MM-DD date.
   * @param {string} iso
   * @param {number} days
   * @returns {string}
   */
  function addDays(iso, days) {
    const date = parseIsoDate(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return toIsoDate(date);
  }

  /**
   * Day of the week (0 = Sunday) for a YYYY-MM-DD date.
   * @param {string} iso
   * @returns {number}
   */
  function getWeekday(iso) {
    return parseIsoDate(iso).getUTCDay();
  }

  /**
   * Friendly British date, e.g. "Tuesday 17 November 2026".
   * Built by hand so the output does not depend on the browser's locale data.
   * @param {string} iso
   * @returns {string}
   */
  function formatFriendlyDate(iso) {
    const date = parseIsoDate(iso);
    return `${DAY_NAMES[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  /**
   * "HH:MM" to minutes since midnight.
   * @param {string} time
   * @returns {number}
   */
  function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Minutes since midnight to "HH:MM".
   * @param {number} total
   * @returns {string}
   */
  function fromMinutes(total) {
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  /**
   * "1 guest" / "4 guests".
   * @param {number} count
   * @returns {string}
   */
  function pluraliseGuests(count) {
    return `${count} ${count === 1 ? 'guest' : 'guests'}`;
  }

  /* ---------- Opening hours logic ---------- */

  /**
   * Bookable times for a date: every 30 minutes from opening until the last
   * seating. For today, times that have already passed are left out.
   * @param {string} iso - date as YYYY-MM-DD
   * @param {{isoDate: string, minutes: number}} now - from getLondonNow()
   * @returns {{closed: boolean, slots: string[]}}
   */
  function getSlotsForDate(iso, now) {
    const hours = OPENING_HOURS[getWeekday(iso)];
    if (!hours) return { closed: true, slots: [] };
    const lastSeating = toMinutes(hours.close) - LAST_SEATING_MINUTES;
    const earliest = iso === now.isoDate ? now.minutes + 1 : 0;
    const slots = [];
    for (let t = toMinutes(hours.open); t <= lastSeating; t += SLOT_MINUTES) {
      if (t >= earliest) slots.push(fromMinutes(t));
    }
    return { closed: false, slots };
  }

  /**
   * Describe whether the restaurant is open right now, in London time.
   * @param {{minutes: number, weekday: number}} now
   * @returns {string}
   */
  function describeOpenStatus(now) {
    const hours = OPENING_HOURS[now.weekday];
    if (hours && now.minutes >= toMinutes(hours.open) && now.minutes < toMinutes(hours.close)) {
      return `Open now, until ${hours.close} (UK time).`;
    }
    if (hours && now.minutes < toMinutes(hours.open)) {
      return `Closed now. Opens today at ${hours.open} (UK time).`;
    }
    // Find the next day with opening hours (at most a week away).
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = (now.weekday + offset) % 7;
      if (OPENING_HOURS[day]) {
        const when = offset === 1 ? 'tomorrow' : DAY_NAMES[day];
        return `Closed now. Opens ${when} at ${OPENING_HOURS[day].open} (UK time).`;
      }
    }
    return 'Closed now.';
  }

  /**
   * Show the open/closed line and mark today's row in the hours list.
   * @param {{minutes: number, weekday: number}} now
   */
  function renderOpenStatus(now) {
    const statusLine = document.querySelector('#open-status');
    if (statusLine) {
      statusLine.textContent = describeOpenStatus(now);
      statusLine.hidden = false;
    }
    document.querySelectorAll('.restaurant-hours [data-days]').forEach((cell) => {
      const isToday = cell.dataset.days.split(' ').map(Number).includes(now.weekday);
      cell.classList.toggle('is-today', isToday);
      // A text marker so the highlight is not conveyed by colour alone.
      if (isToday && cell.tagName === 'DT' && !cell.querySelector('.today-tag')) {
        cell.insertAdjacentHTML('beforeend', ' <span class="today-tag">(today)</span>');
      }
    });
  }

  /* ---------- Page wiring ---------- */

  const form = document.querySelector('#booking-form');
  if (!form) return;

  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    date: form.elements.date,
    time: form.elements.time,
    guests: form.elements.guests,
    message: form.elements.message,
  };
  const submitButton = form.querySelector('[type="submit"]');
  const timeHint = document.querySelector('#booking-time-hint');
  const messageCount = document.querySelector('#message-count');
  const messageCountLive = document.querySelector('#message-count-live');
  const status = document.querySelector('#draft-status');
  const preview = document.querySelector('#email-preview');
  const previewHeading = document.querySelector('#preview-title');
  const draftTo = document.querySelector('#draft-to');
  const draftSubject = document.querySelector('#email-subject');
  const draftBody = document.querySelector('#email-draft');
  const lengthNote = document.querySelector('#draft-length-note');
  const openEmail = document.querySelector('#open-email');
  const copyBodyButton = document.querySelector('#copy-email');
  const copySubjectButton = document.querySelector('#copy-subject');
  const recipient = form.dataset.recipient;
  const phone = form.dataset.phone;
  let announceTimer = 0;

  /**
   * Keep the date picker between today and 90 days ahead (London time).
   * Called on load and again before validation in case midnight has passed.
   * @returns {{isoDate: string, minutes: number, weekday: number}} the current time
   */
  function updateDateLimits() {
    const now = getLondonNow();
    fields.date.min = now.isoDate;
    fields.date.max = addDays(now.isoDate, BOOKING_WINDOW_DAYS);
    return now;
  }

  /**
   * Rebuild the time <select> for the chosen date. Keeps the visitor's
   * earlier choice when it is still available.
   */
  function populateTimeSlots() {
    const select = fields.time;
    const previous = select.value;
    const iso = fields.date.value;
    const now = updateDateLimits();

    select.replaceChildren();
    const addOption = (value, label) => select.append(new Option(label, value));

    if (!parseIsoDate(iso) || iso < fields.date.min || iso > fields.date.max) {
      addOption('', 'Choose a date first');
      select.disabled = true;
      timeHint.textContent = 'Available times appear once you choose a date.';
      return;
    }

    const { closed, slots } = getSlotsForDate(iso, now);
    if (closed || slots.length === 0) {
      addOption('', 'No times available');
      select.disabled = true;
      timeHint.textContent = closed
        ? `Sorry, we are closed on ${DAY_NAMES[getWeekday(iso)]}s. Please choose another date.`
        : 'There are no more tables today. Please choose another date.';
      return;
    }

    addOption('', 'Choose a time');
    slots.forEach((slot) => addOption(slot, slot));
    select.disabled = false;
    select.value = slots.includes(previous) ? previous : '';
    const hours = OPENING_HOURS[getWeekday(iso)];
    timeHint.textContent = `${formatFriendlyDate(iso)}: open ${hours.open}–${hours.close}. Last table at ${slots[slots.length - 1]}.`;
  }

  /* ---------- Validation ---------- */

  /**
   * Each validator returns an error message, or '' when the value is fine.
   * Messages say what to do, not just what is wrong.
   */
  const validators = {
    name(value) {
      return value.trim() ? '' : 'Enter your name.';
    },
    email(value) {
      const email = value.trim();
      if (!email) return 'Enter your email address so the restaurant can reply.';
      return EMAIL_PATTERN.test(email) ? '' : 'Enter an email address like name@example.com.';
    },
    date(value) {
      if (!value) return 'Choose a date.';
      if (!parseIsoDate(value)) return 'Enter a real date.';
      if (value < fields.date.min) return 'Choose today or a future date.';
      if (value > fields.date.max) return `Choose a date within the next ${BOOKING_WINDOW_DAYS} days.`;
      if (!OPENING_HOURS[getWeekday(value)]) {
        return `We are closed on ${DAY_NAMES[getWeekday(value)]}s. Choose another date.`;
      }
      if (getSlotsForDate(value, getLondonNow()).slots.length === 0) {
        return 'There are no more tables today. Choose another date.';
      }
      return '';
    },
    time(value) {
      if (fields.time.disabled) return ''; // the date error already explains why
      if (!value) return 'Choose a time.';
      // Re-check in case the slot has passed while the page was open.
      const { slots } = getSlotsForDate(fields.date.value, getLondonNow());
      return slots.includes(value) ? '' : 'That time is no longer available. Choose another time.';
    },
    guests(value) {
      if (!value.trim()) return 'Enter the number of guests.';
      const count = Number(value);
      if (!Number.isInteger(count) || count < 1) return 'Enter a whole number of guests, from 1 to 20.';
      if (count > MAX_GUESTS) return `For groups larger than ${MAX_GUESTS}, please call us on ${phone}.`;
      return '';
    },
    message() {
      return ''; // optional; length is limited by maxlength
    },
  };

  /**
   * Add or remove one id in an element's aria-describedby list,
   * keeping any other ids (such as hints) intact.
   * @param {HTMLElement} element
   * @param {string} id
   * @param {boolean} include
   */
  function toggleDescribedBy(element, id, include) {
    const ids = new Set((element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    if (include) ids.add(id); else ids.delete(id);
    if (ids.size) element.setAttribute('aria-describedby', [...ids].join(' '));
    else element.removeAttribute('aria-describedby');
  }

  /**
   * Show or clear the inline error for one field.
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
   * @param {string} message - empty string clears the error
   */
  function setFieldError(field, message) {
    const errorElement = document.querySelector(`#${field.id}-error`);
    if (!errorElement) return;
    errorElement.textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    toggleDescribedBy(field, errorElement.id, Boolean(message));
  }

  /**
   * Validate one field and update its error display.
   * @param {string} key - name of the field in `fields`
   * @returns {boolean} true when valid
   */
  function validateField(key) {
    const message = validators[key](fields[key].value);
    setFieldError(fields[key], message);
    return !message;
  }

  /**
   * Validate every field.
   * @returns {Array<HTMLElement>} invalid fields, in page order
   */
  function validateForm() {
    populateTimeSlots(); // refresh limits and slots in case time has moved on
    return Object.keys(fields).filter((key) => !validateField(key)).map((key) => fields[key]);
  }

  /* ---------- Email draft ---------- */

  /**
   * Read and tidy the form values.
   * @returns {{name: string, email: string, date: string, time: string, guests: number, message: string}}
   */
  function readEnquiry() {
    return {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      date: fields.date.value,
      time: fields.time.value,
      guests: Number(fields.guests.value),
      message: fields.message.value.trim(),
    };
  }

  /**
   * Build the subject line and body of the enquiry email.
   * CRLF line breaks are the standard for email bodies in mailto links.
   * @param {ReturnType<typeof readEnquiry>} enquiry
   * @returns {{subject: string, body: string}}
   */
  function buildEmail(enquiry) {
    const friendlyDate = formatFriendlyDate(enquiry.date);
    const party = pluraliseGuests(enquiry.guests);
    const subject = `Table enquiry: ${friendlyDate}, ${enquiry.time}, ${party}`;
    const body = [
      'Dear Ember & Grain bookings team,',
      '',
      'I would like to request a table with the following details:',
      '',
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Date: ${friendlyDate}`,
      `Time: ${enquiry.time}`,
      `Party size: ${party}`,
      '',
      'Additional information:',
      enquiry.message || 'None.',
      '',
      'I understand this is a request rather than a confirmed reservation. I look forward to hearing whether you can accommodate us.',
      '',
      'Kind regards,',
      enquiry.name,
    ].join('\r\n');
    return { subject, body };
  }

  /**
   * Build a mailto: URL. Each part is encoded so &, +, accents, emoji and
   * line breaks survive intact.
   * @param {{subject: string, body: string}} email
   * @returns {string}
   */
  function buildMailto(email) {
    return `mailto:${recipient}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  }

  /**
   * Fill and reveal the preview, then move focus to its heading.
   * @param {{subject: string, body: string}} email
   */
  function showPreview(email) {
    const href = buildMailto(email);
    openEmail.href = href;
    draftTo.textContent = recipient;
    draftSubject.value = email.subject;
    draftBody.value = email.body;

    const tooLong = href.length > MAX_SAFE_MAILTO_LENGTH;
    lengthNote.hidden = !tooLong;
    lengthNote.textContent = tooLong
      ? 'This draft is long, and some email apps cut off long messages opened from a link. If the message looks incomplete, use Copy subject and Copy message instead.'
      : '';

    preview.hidden = false;
    status.textContent = tooLong
      ? 'Email draft ready. It is long, so copying it may be more reliable than opening your email app.'
      : 'Email draft ready. Review it below, then open your email app or copy the draft.';
    previewHeading.focus();
  }

  /**
   * Hide the preview and forget the old draft (called when details change).
   */
  function clearPreview() {
    if (preview.hidden) return;
    preview.hidden = true;
    openEmail.removeAttribute('href');
    draftSubject.value = '';
    draftBody.value = '';
    lengthNote.hidden = true;
    status.textContent = 'Details changed. Generate a new draft when ready.';
  }

  /**
   * Copy text to the clipboard. If the Clipboard API is unavailable or
   * refused (e.g. on file:// pages), select the text so the visitor can
   * copy it with their device's own command.
   * @param {HTMLInputElement|HTMLTextAreaElement} source - read-only field holding the text
   * @param {string} label - what was copied, for the status message
   */
  async function copyFromField(source, label) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(source.value);
      status.textContent = `${label} copied. Paste it into a new email to ${recipient}.`;
    } catch {
      source.focus();
      source.select();
      status.textContent = `${label} selected. Use your device’s Copy command, then paste it into your email app.`;
    }
  }

  /* ---------- Message character counter ---------- */

  /**
   * Update the visible counter at once, and announce it to screen readers
   * only after the visitor pauses typing, so every keystroke is not read out.
   * @param {boolean} [announce=true] - false on page load, to stay silent
   */
  function updateCharacterCount(announce = true) {
    const max = fields.message.maxLength;
    const remaining = max - fields.message.value.length;
    const text = `${remaining} of ${max} characters remaining.`;
    messageCount.textContent = text;
    messageCount.classList.toggle('is-low', remaining <= 50);
    window.clearTimeout(announceTimer);
    if (!announce) return;
    announceTimer = window.setTimeout(() => {
      messageCountLive.textContent = text;
    }, MESSAGE_ANNOUNCE_DELAY);
  }

  /* ---------- Event handlers ---------- */

  /**
   * Submit: validate, then either focus the first problem or show the draft.
   * @param {SubmitEvent} event
   */
  function handleSubmit(event) {
    event.preventDefault(); // never submit the form to a server
    const invalid = validateForm();
    if (invalid.length) {
      clearPreview();
      status.textContent = invalid.length === 1
        ? 'Please correct the highlighted field.'
        : `Please correct the ${invalid.length} highlighted fields.`;
      invalid[0].focus();
      return;
    }
    showPreview(buildEmail(readEnquiry()));
  }

  /**
   * Any edit: drop a stale draft, and re-check a field that is already
   * showing an error so the message clears as soon as it is fixed.
   * @param {Event} event
   */
  function handleInput(event) {
    clearPreview();
    const key = Object.keys(fields).find((k) => fields[k] === event.target);
    if (key && event.target.getAttribute('aria-invalid') === 'true') validateField(key);
  }

  /**
   * Date chosen: rebuild the time list and clear an outdated time error.
   */
  function handleDateChange() {
    populateTimeSlots();
    if (fields.time.getAttribute('aria-invalid') === 'true') validateField('time');
  }

  /**
   * Leaving a field: once it has content, check it so errors appear early
   * but the visitor is not scolded for fields they have not reached yet.
   * @param {FocusEvent} event
   */
  function handleBlur(event) {
    const key = Object.keys(fields).find((k) => fields[k] === event.target);
    if (key && key !== 'time' && event.target.value) validateField(key);
  }

  /* ---------- Start-up ---------- */

  /**
   * Set date limits, render the hours status, attach handlers, then enable
   * the submit button.
   */
  function init() {
    const now = updateDateLimits();
    renderOpenStatus(now);
    populateTimeSlots(); // handles a date restored by the browser on reload
    updateCharacterCount(false);

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('input', handleInput);
    form.addEventListener('change', handleInput);
    form.addEventListener('focusout', handleBlur);
    fields.date.addEventListener('change', handleDateChange);
    fields.message.addEventListener('input', () => updateCharacterCount());
    copyBodyButton.addEventListener('click', () => copyFromField(draftBody, 'Message'));
    copySubjectButton.addEventListener('click', () => copyFromField(draftSubject, 'Subject'));

    // Everything is wired up: it is now safe to allow submission.
    submitButton.disabled = false;
  }

  init();
})();
