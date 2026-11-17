import { course } from './course.js';

const telegram = window.Telegram?.WebApp;
const insideTelegram = Boolean(telegram && telegram.platform !== 'unknown');

if (insideTelegram) {
  if (telegram.isVersionAtLeast('6.9')) {
    telegram.setHeaderColor('#f7f9ff');
    telegram.setBackgroundColor('#ffffff');
  }
  telegram.ready();
  telegram.expand();
}

const select = (selector) => document.querySelector(selector);
const textElement = (tag, value) => Object.assign(document.createElement(tag), { textContent: value });

if ('IntersectionObserver' in window) {
  const ambientObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      target.classList.toggle('is-in-view', isIntersecting);
    }
  });
  for (const background of document.querySelectorAll('.ambient-background')) ambientObserver.observe(background);

  const updatePageVisibility = () => document.documentElement.classList.toggle('page-hidden', document.hidden);
  document.addEventListener('visibilitychange', updatePageVisibility);
  updatePageVisibility();
}

function icon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const use = document.createElementNS(namespace, 'use');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  use.setAttribute('href', `#${name}`);
  svg.append(use);
  return svg;
}

document.title = course.title;
select('[data-intro]').textContent = course.intro;
select('[data-program-note]').textContent = course.programNote;

const topics = select('[data-topics]');
for (const topic of course.topics) {
  const item = document.createElement('li');
  const content = document.createElement('div');
  content.append(textElement('h3', topic.title), textElement('p', topic.description));
  item.append(content);
  topics.append(item);
}

const faq = select('[data-faq]');
for (const question of course.questions) {
  const item = document.createElement('details');
  const summary = textElement('summary', question.title);
  summary.append(icon('plus'));
  item.append(summary, textElement('p', question.description));
  faq.append(item);
}

const price = select('[data-price]');
price.textContent = course.price;
price.hidden = !course.price;

const paymentLink = select('[data-payment-link]');
const contactUnavailable = select('.contact-unavailable');
fetch('/api/payment-link')
  .then((response) => response.ok ? response.json() : null)
  .then((config) => {
    contactUnavailable.hidden = Boolean(config?.url);
    if (!config?.url) return;
    paymentLink.href = config.url;
    paymentLink.hidden = false;
  })
  .catch(() => { contactUnavailable.hidden = false; });

if (insideTelegram && typeof telegram.openTelegramLink === 'function') {
  paymentLink.addEventListener('click', (event) => {
    telegram.openTelegramLink(paymentLink.href);
    event.preventDefault();
  });
}

select('.header-cta').addEventListener('click', (event) => {
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    setMenu(false);
    select('#contact-title').focus({ preventScroll: true });
  }
});

const menu = select('.menu-toggle');
const navigation = select('.navigation');

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
  menu.querySelector('use').setAttribute('href', open ? '#close' : '#menu');
  navigation.classList.toggle('is-open', open);
}

menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a') && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    const section = select(event.target.closest('a').hash);
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
window.matchMedia('(max-width: 720px)').addEventListener('change', () => setMenu(false));

const demos = {
  mountain: { title: 'Qor chizig‘i', description: 'Qorli tog‘ sahnasidagi chuqurlik va kameraning sekin yaqinlashuvi.' },
};

const editorButton = select('.editor-image');
const preview = editorButton.querySelector('video');
const timeline = select('.timeline-control');
const timecode = select('.editor-timecode');

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const rest = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function seekPreview() {
  const time = timeline.valueAsNumber;
  timecode.textContent = formatTime(time);
  timeline.setAttribute('aria-valuetext', `${String(time).replace('.', ',')} soniya`);
  if (time === 0) {
    preview.hidden = true;
    return;
  }
  if (!preview.hasAttribute('src')) preview.src = `/assets/${editorButton.dataset.demo}.mp4`;
  if (preview.readyState >= HTMLMediaElement.HAVE_METADATA && preview.currentTime !== time) {
    preview.currentTime = time;
  } else if (!preview.seeking && preview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    preview.hidden = false;
  }
}

timeline.addEventListener('input', seekPreview);
preview.addEventListener('loadedmetadata', seekPreview);
preview.addEventListener('seeked', () => { preview.hidden = timeline.valueAsNumber === 0; });

const dialog = select('.demo-dialog');
const video = dialog.querySelector('video');
const demoError = dialog.querySelector('.demo-error');

for (const button of document.querySelectorAll('[data-demo]')) {
  button.addEventListener('click', () => {
    const key = button.dataset.demo;
    const demo = demos[key];
    select('#demo-title').textContent = demo.title;
    dialog.querySelector('.demo-description').textContent = demo.description;
    demoError.hidden = true;
    video.poster = `/assets/${key}.webp`;
    video.src = `/assets/${key}.mp4`;
    if (button === editorButton && !preview.hidden) video.currentTime = timeline.valueAsNumber;
    dialog.showModal();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
  });
}

video.addEventListener('error', () => { if (dialog.open) demoError.hidden = false; });
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
});
