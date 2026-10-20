// Lightweight functional tests of dataLayer events without external dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {};
const windowHandlers = {};
class Element {
  constructor(link) { this.link = link; }
  closest(selector) { return selector === 'a[href]' ? this.link : null; }
}
const document = {
  title: 'LaCari',
  readyState: 'loading',
  addEventListener: (name, fn) => { handlers[name] = fn; },
  getElementById: () => null,
  createElement: () => ({}),
  head: { appendChild: () => {} }
};
const window = {
  location: { search: '?utm_source=teste', pathname: '/index.html', origin: 'https://clinicalacari.com.br' },
  addEventListener: (name, fn) => { windowHandlers[name] = fn; },
  dataLayer: []
};
const storage = new Map();
const sessionStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value)
};
vm.runInNewContext(fs.readFileSync('assets/js/tracking.js', 'utf8'), {
  window, document, Element, URL, URLSearchParams, sessionStorage, Date
}, { filename: 'tracking.js' });
function click(url, text = 'Agendar') {
  const parsed = new URL(url);
  const link = {
    origin: parsed.origin, pathname: parsed.pathname, hostname: parsed.hostname,
    protocol: parsed.protocol, href: parsed.href, textContent: text, dataset: {},
    closest: selector => selector === 'section' ? { id: 'contato' } : null
  };
  const target = new Element(link);
  handlers.click({ target });
  return window.dataLayer.filter(x => x && typeof x === 'object' && x.event).at(-1);
}
let event = click('https://wa.me/5511910435529?text=Ola');
assert.equal(event.event, 'whatsapp_click');
assert.equal(event.source_section, 'contato');
assert.equal(event.utm_source, 'teste');
assert.equal(event.contact_status, 'initiated');
const count = window.dataLayer.length;
click('https://example.org/?redirect=https://wa.me/5511910435529');
assert.equal(window.dataLayer.length, count, 'must not count fake WhatsApp URL');
event = click('tel:+5511999999999', 'Ligar');
assert.equal(event.event, 'phone_click');
assert.equal(event.link_url, 'tel:');
event = click('https://www.google.com/maps/dir/?api=1');
assert.equal(event.event, 'route_click');
const afterRoute = window.dataLayer.length;
click('https://notgoogle.com/maps/dir/');
assert.equal(window.dataLayer.length, afterRoute, 'must not count fake Maps URL');
windowHandlers['lacari:form_submit']({ detail: { formName: 'whatsapp_form', source_section: 'hero', contact_channel: 'whatsapp' } });
event = window.dataLayer.at(-1);
assert.equal(event.event, 'form_submit');
assert.equal(event.source_section, 'hero');
assert.equal(event.contact_status, 'initiated');
// Regression checks: reject lookalike domains and avoid recording contact numbers.
const beforeLookalikes = window.dataLayer.length;
click('https://wa.me.attacker.example/contact');
click('https://maps.google.com.attacker.example/maps/dir/');
assert.equal(window.dataLayer.length, beforeLookalikes, 'lookalike hosts must not generate events');
event = click('https://api.whatsapp.com/send?phone=5511999999999');
assert.equal(event.event, 'whatsapp_click');
assert.equal(event.link_url, 'https://api.whatsapp.com/send');
assert.equal(event.link_url.includes('5511999999999'), false, 'WhatsApp phone must not leak through query');
event = click('tel:+5511888888888');
assert.equal(event.link_url, 'tel:', 'telephone number must not be logged');
assert.equal(event.link_url.includes('88888888'), false);
console.log('Conversion tracking functional tests passed.');
