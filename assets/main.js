// Reveal on scroll
// koroche-v43: без IntersectionObserver (старые браузеры) раньше падал
// весь main.js — меню, cookies, формы — а блоки .reveal так и оставались
// прозрачными. Теперь блоки просто показываются сразу. Если main.js не
// загрузился вовсе, их через 1,5 с показывает CSS (.reveal, анимация
// reveal-failsafe в style.css).
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('on'));
}

// Fallback
setTimeout(() => {
  document.querySelectorAll('.reveal:not(.on)').forEach(el => el.classList.add('on'));
}, 900);

// Pause marquee animation off-screen (saves battery/CPU while scrolled away)
const marqueeEls = document.querySelectorAll('.marquee-track');
if (marqueeEls.length && 'IntersectionObserver' in window) {
  const marqueeIO = new IntersectionObserver(es => {
    es.forEach(e => e.target.classList.toggle('paused', !e.isIntersecting));
  }, { threshold: 0 });
  marqueeEls.forEach(el => marqueeIO.observe(el));
}

// Mobile menu
// koroche-v43: было `let scrollY` — глобальная переменная с тем же
// именем, что window.scrollY, перекрывала его для всех скриптов страницы.
let menuScrollY = 0;

function toggleMenu(){
  const btn = document.querySelector('.burger');
  const menu = document.getElementById('mMenu');
  if(!btn||!menu) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', isOpen);

  if(isOpen){
    menuScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${menuScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  } else {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, menuScrollY);
  }
}

document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    const menu = document.getElementById('mMenu');
    if(menu && menu.classList.contains('open')){
      toggleMenu();
    }
  }
});

// localStorage может бросать исключение (приватный режим части браузеров,
// запрет сайтовых данных) — без обёртки падал бы весь main.js: меню,
// появление блоков, баннер (koroche-v38, AELITA pack-v460).
function safeGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
function safeSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }

// Счётчики — только после согласия на cookies (koroche-v38).
// До этой версии код Метрики стоял в <head> каждой страницы и
// запускался сразу, а баннер лишь прятался по «Принять». Теперь, как на
// сайте AELITA (pack-v460/v515): согласие уже есть — грузим сразу,
// нет — в момент нажатия «Принять», без перезагрузки, чтобы первый
// просмотр не терялся. Цели в analytics-events.js проверяют window.ym
// и без согласия молча ничего не делают.
var YM_ID = 110846274;
var VK_PIXEL_ID = 0; // заполнить после создания пикселя в ads.vk.com
var trackersLoaded = false;
function loadTrackers(){
  if (trackersLoaded) return;
  trackersLoaded = true;
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
  })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=' + YM_ID, 'ym');
  ym(YM_ID, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  // koroche-v44: параметр визита — открыт ли сайт как установленное
  // приложение (PWA, /app/). Иначе не узнать, пользуется ли им кто-то.
  try { if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ym(YM_ID, 'params', { app: 'standalone' }); } catch (e) {}
  if (VK_PIXEL_ID) {
    var _tmr = window._tmr = window._tmr || [];
    _tmr.push({id: VK_PIXEL_ID, type: "pageView", start: (new Date()).getTime()});
    var ts = document.createElement("script"); ts.async = true; ts.id = "topmailru-code";
    ts.src = "https://top-fwz1.mail.ru/js/code.js";
    document.head.appendChild(ts);
    window.KOROCHE_VK_PIXEL_ID = VK_PIXEL_ID;
  }
  if (window.KOROCHE_initOwnStats) window.KOROCHE_initOwnStats();
}

// Cookie banner
(function(){
  if(safeGet('cookies_accepted')){
    const b = document.getElementById('cookie-banner');
    if(b) b.style.display = 'none';
    loadTrackers();
  }
})();

// Пока баннер cookies не принят, он занимает нижнюю часть экрана и визуально
// перекрывает Telegram-виджет и кнопку «наверх» — не даём им появляться поверх
// него, а сразу показываем после принятия (см. updateFixedWidgets ниже).
function isCookieBannerOpen(){
  const b = document.getElementById('cookie-banner');
  return !!(b && b.style.display !== 'none' && !b.classList.contains('hidden'));
}

function acceptCookies(){
  safeSet('cookies_accepted', '1');
  const b = document.getElementById('cookie-banner');
  if(b){
    b.classList.add('hidden');
    setTimeout(() => { b.style.display = 'none'; }, 400);
  }
  loadTrackers();
  updateFixedWidgets();
}

// Back to top button + Telegram widget + мобильный CTA-бар (единый scroll listener)
function updateFixedWidgets(){
  const pastThreshold = window.scrollY > 400;
  const bannerOpen = isCookieBannerOpen();

  const btn = document.getElementById('back-to-top');
  if(btn) btn.classList.toggle('visible', pastThreshold && !bannerOpen);

  const tgWidget = document.getElementById('tg-widget');
  if(tgWidget){
    if(pastThreshold && !bannerOpen){
      if(!tgWidget.classList.contains('visible')){
        tgWidget.classList.add('visible');
        const bubble = document.getElementById('tg-bubble');
        if(bubble && !bubble.dataset.shown){
          bubble.dataset.shown = '1';
          setTimeout(() => {
            bubble.classList.add('visible');
            setTimeout(() => { bubble.classList.remove('visible'); }, 4000);
          }, 1000);
        }
      }
    } else {
      tgWidget.classList.remove('visible');
    }
  }

  // Мобильный CTA-бар — прячем, пока cookies не приняты, и когда рядом
  // уже видна hero-секция страницы (там есть своя кнопка) или футер
  const ctaBar = document.getElementById('mob-cta');
  if(ctaBar){
    const cookiesAccepted = !!safeGet('cookies_accepted');
    let nearOwnCta = false;
    document.querySelectorAll('.hero, .piece-hero, footer').forEach(el => {
      const r = el.getBoundingClientRect();
      if(r.top < window.innerHeight && r.bottom > 0) nearOwnCta = true;
    });
    ctaBar.classList.toggle('hidden', !cookiesAccepted || bannerOpen || nearOwnCta);
  }
}
window.addEventListener('scroll', updateFixedWidgets);
window.addEventListener('resize', updateFixedWidgets);
updateFixedWidgets();

// Плавающие «↑» и «Написать нам» уходят, пока страницу листают вниз, и
// возвращаются при прокрутке вверх или через 0,7 с после остановки —
// не закрывают текст при чтении (koroche-v38, AELITA pack-v522 п. 7).
(function(){
  var lastY = window.scrollY, timer = null;
  function els(){ return [document.getElementById('back-to-top'), document.getElementById('tg-widget')].filter(Boolean); }
  function show(){ els().forEach(function(e){ e.classList.remove('scroll-hide'); }); }
  window.addEventListener('scroll', function(){
    var y = window.scrollY, dy = y - lastY; lastY = y;
    if (dy > 6) els().forEach(function(e){ e.classList.add('scroll-hide'); });
    else if (dy < -6) show();
    clearTimeout(timer); timer = setTimeout(show, 700);
  }, { passive: true });
})();

// Переключатель звука для hero-видео (используется на страницах спектаклей с видео-фоном)
function toggleTeaserSound(btn) {
  const video = document.getElementById('hero-video');
  if (!video) return;
  const isOn = btn.classList.toggle('on');
  video.muted = !isOn;
  const label = btn.querySelector('span');
  if (label) label.textContent = isOn ? 'Без звука' : 'Звук';
}

// Отслеживание конверсионных действий вынесено в assets/analytics-events.js —
// подключается отдельным тегом на каждой странице, правки применяются сразу
// везде без необходимости редактировать main.js.

// Service Worker — офлайн-доступ и кэширование основных страниц (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── Заявки с форм сайта (koroche-v41, порт AELITA pack-v469/v526/v535) ──
// Раньше /tickets/ держал инлайн-копию sendTelegram/sendFormspree: ошибки
// глотались, и «Готово» показывалось, даже если заявка не ушла никуда.
// Теперь успех — только если ХОТЯ БЫ ОДИН канал ответил 2xx; иначе
// сообщение у формы, поля не очищаются. Тексты — парой RU/EN: строки
// внутри JS сборщик EN не переводит, язык берётся из <html lang>.
var KOROCHE_LEAD = {
  tg: 'https://withered-glade-64b6.kostyamoshnikov.workers.dev',
  formspree: 'https://formspree.io/f/meeyowpw',
};
function korocheEscHtml(s) {
  return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
}
window.KOROCHE_sendLead = async function (formName, fields) {
  var keys = Object.keys(fields || {});
  var lines = ['[KOROCHE] ' + korocheEscHtml(formName), ''];
  keys.forEach(function (k) {
    var v = String(fields[k] || '').trim();
    if (v) lines.push('<b>' + korocheEscHtml(k) + ':</b> ' + korocheEscHtml(v));
  });
  lines.push('', new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));
  var fd = new FormData();
  fd.append('_subject', '[KOROCHE] ' + formName);
  keys.forEach(function (k) { fd.append(k, String(fields[k] || '').trim()); });
  var r = await Promise.allSettled([
    fetch(KOROCHE_LEAD.tg, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: lines.join('\n') }) }),
    fetch(KOROCHE_LEAD.formspree, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } }),
  ]);
  var tgOk = r[0].status === 'fulfilled' && !!r[0].value && r[0].value.ok;
  var fsOk = r[1].status === 'fulfilled' && !!r[1].value && r[1].value.ok;
  if (!tgOk || !fsOk) console.warn('Заявка ушла не во все каналы', { form: formName, telegram: tgOk, formspree: fsOk });
  return tgOk || fsOk;
};
var KOROCHE_LEAD_FAIL = {
  ru: 'Не получилось отправить — похоже, связь прервалась. Попробуйте ещё раз или напишите нам: aelita.production@yandex.ru',
  en: "Couldn't send — the connection seems to have dropped. Try again or write to us: aelita.production@yandex.ru",
};
window.KOROCHE_isEn = function () { return (document.documentElement.lang || '').indexOf('en') === 0; };
// Сообщение у формы вместо alert(): встаёт прямо перед anchorEl.
window.KOROCHE_formMessage = function (anchorEl, ru, en, kind) {
  if (!anchorEl || !anchorEl.parentNode) return;
  var text = window.KOROCHE_isEn() ? (en || ru) : ru;
  var id = (anchorEl.id || 'form') + '__msg';
  var p = document.getElementById(id);
  if (!p) {
    p = document.createElement('p');
    p.id = id;
    p.setAttribute('role', 'alert');
    anchorEl.parentNode.insertBefore(p, anchorEl);
  }
  p.className = 'form-msg form-msg-' + (kind || 'error');
  p.textContent = text || '';
  p.hidden = !text;
};
// Номер считается введённым, если в нём не меньше 10 цифр.
window.KOROCHE_phoneOk = function (v) { return String(v || '').replace(/\D/g, '').length >= 10; };

// Подписка на новые даты (/tickets/, /en/tickets/): имя, телефон и
// согласие обязательны, почта — по желанию.
window.KOROCHE_subscribe = async function () {
  var $ = function (id) { return document.getElementById(id); };
  var ok = $('subOk');
  if (!ok) return false;
  var name = $('subName').value.trim();
  var phone = $('subPhone').value.trim();
  var email = $('subEmail') ? $('subEmail').value.trim() : '';
  ok.style.display = 'none';
  var err = function (ru, en) { window.KOROCHE_formMessage(ok, ru, en); return false; };
  // Honeypot: люди это поле не видят. Заполнено — бот: молча «успех».
  var hp = $('subWebsite');
  if (hp && hp.value) { ok.style.display = 'block'; return false; }
  // Time-trap: быстрее 1,5 с после загрузки форму заполняют только боты.
  var loaded = Number(($('subFormLoaded') && $('subFormLoaded').value) || 0);
  if (loaded && Date.now() - loaded < 1500) return false;
  if (!name) return err('Укажите имя.', 'Please enter your name.');
  if (!window.KOROCHE_phoneOk(phone)) return err('Укажите телефон.', 'Please enter your phone number.');
  if (email && email.indexOf('@') < 1) return err('Проверьте почту — в ней нет «@».', 'Please check your email address.');
  if (!$('subConsent').checked) return err('Отметьте согласие на обработку персональных данных.', 'Please tick the personal data consent box.');
  var btn = $('subBtn');
  if (btn) btn.disabled = true;
  var sent = await window.KOROCHE_sendLead('Билеты — подписка на новые даты', { 'Имя': name, 'Телефон': phone, 'Email': email, 'Язык страницы': window.KOROCHE_isEn() ? 'EN' : 'RU' });
  if (btn) btn.disabled = false;
  if (window.KOROCHE_track) window.KOROCHE_track(sent ? 'lead_subscribe_sent' : 'lead_subscribe_failed', { page: location.pathname });
  if (!sent) return err(KOROCHE_LEAD_FAIL.ru, KOROCHE_LEAD_FAIL.en);
  window.KOROCHE_formMessage(ok, '', '');
  ok.style.display = 'block';
  $('subName').value = ''; $('subPhone').value = '';
  if ($('subEmail')) $('subEmail').value = '';
  $('subConsent').checked = false;
  return true;
};
(function () {
  var el = document.getElementById('subFormLoaded');
  if (el) el.value = String(Date.now());
})();

// Поля телефона сразу заполнены «+7 » (AELITA pack-v526). Префикс можно
// стереть и ввести зарубежный номер. Пока в поле только префикс, value
// отдаёт пустую строку — проверки форм видят «не заполнено»; запись ''
// (сброс после отправки) возвращает префикс.
(function () {
  if (typeof HTMLInputElement === 'undefined') return;
  var PREFIX = '+7 ';
  var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  function raw(el) { return desc.get.call(el); }
  function enhance(el) {
    if (el.__korochePhone) return;
    el.__korochePhone = true;
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: function () { var v = raw(this); return (v === PREFIX || v === PREFIX.trim()) ? '' : v; },
      set: function (v) { desc.set.call(this, (v === '' || v == null) ? PREFIX : v); },
    });
    if (/^\s*\+?7?\s*$/.test(raw(el))) desc.set.call(el, PREFIX);
    el.addEventListener('focus', function () {
      var v = raw(el);
      if (v === PREFIX) setTimeout(function () { try { el.setSelectionRange(v.length, v.length); } catch (e) {} }, 0);
    });
  }
  document.querySelectorAll('input[type="tel"]').forEach(enhance);
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el && el.tagName === 'INPUT' && el.type === 'tel') enhance(el);
  });
})();
