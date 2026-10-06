const form = document.querySelector('#contact-form');
const fields = document.querySelector('#contact-fields');
const send = document.querySelector('#contact-send');
const failure = document.querySelector('#contact-failure');
const success = document.querySelector('#contact-success');
const panel = document.querySelector('#contact-panel');
let submitting = false;

form.addEventListener('input', event => event.target.setCustomValidity?.(''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || form.hidden) return;
  for (const id of ['contact-name', 'contact-email', 'contact-message']) {
    const field = document.getElementById(id);
    field.value = field.value.trim();
    field.setCustomValidity(field.value ? '' : 'Please fill out this field.');
  }
  if (!form.reportValidity()) return;
  failure.hidden = true;
  if (form.elements.botcheck.checked) { failure.hidden = false; return; }
  const payload = Object.fromEntries(new FormData(form));
  payload.subject = payload.subject.trim() || 'Contact from Lucid Confusion Creations';
  submitting = true;
  fields.disabled = true;
  send.disabled = true;
  send.textContent = 'TRANSMITTING…';
  form.setAttribute('aria-busy', 'true');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error('Transmission rejected');
    form.hidden = true;
    form.reset();
    success.hidden = false;
    if (panel.getClientRects().length) { panel.scrollTop = 0; success.focus({ preventScroll: true }); }
  } catch {
    failure.hidden = false;
    if (panel.getClientRects().length) failure.scrollIntoView({ block: 'nearest' });
  } finally {
    clearTimeout(timeout);
    submitting = false;
    fields.disabled = false;
    send.disabled = false;
    send.textContent = 'SEND MESSAGE';
    form.removeAttribute('aria-busy');
  }
});
document.querySelector('#contact-another').addEventListener('click', () => {
  if (submitting) return;
  success.hidden = true;
  failure.hidden = true;
  form.hidden = false;
  panel.scrollTop = 0;
  form.elements.name.focus({ preventScroll: true });
});
