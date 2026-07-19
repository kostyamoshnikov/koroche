// Reveal on scroll
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Fallback
setTimeout(() => {
  document.querySelectorAll('.reveal:not(.on)').forEach(el => el.classList.add('on'));
}, 900);

// Mobile menu
let scrollY = 0;

function toggleMenu(){
  const btn = document.querySelector('.burger');
  const menu = document.getElementById('mMenu');
  if(!btn||!menu) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', isOpen);

  if(isOpen){
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  } else {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
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

// Cookie banner
(function(){
  if(localStorage.getItem('cookies_accepted')){
    const b = document.getElementById('cookie-banner');
    if(b) b.style.display = 'none';
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
  localStorage.setItem('cookies_accepted', '1');
  const b = document.getElementById('cookie-banner');
  if(b){
    b.classList.add('hidden');
    setTimeout(() => { b.style.display = 'none'; }, 400);
  }
  updateFixedWidgets();
}

// Back to top button + Telegram widget (единый scroll listener)
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
}
window.addEventListener('scroll', updateFixedWidgets);

// Переключатель звука для hero-видео (используется на страницах спектаклей с видео-фоном)
function toggleTeaserSound(btn) {
  const video = document.getElementById('hero-video');
  if (!video) return;
  const isOn = btn.classList.toggle('on');
  video.muted = !isOn;
  const label = btn.querySelector('span');
  if (label) label.textContent = isOn ? 'Без звука' : 'Звук';
}

// === Отслеживание конверсионных действий ===
// Событие идёт и в Яндекс.Метрику (reachGoal), и в dataLayer — чтобы GTM/GA4
// могли подхватить его без создания целей в интерфейсе заранее.
(function () {
  function track(goal, params) {
    params = params || {};
    if (window.ym) {
      try { window.ym(110846274, 'reachGoal', goal, params); } catch (e) {}
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: goal }, params));
  }

  // Клики по ссылкам: телефон, почта, Telegram-канал/бот, переход на билеты
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';

    if (href.indexOf('tel:') === 0) {
      track('phone_click', { link_url: href });
      return;
    }
    if (href.indexOf('mailto:') === 0) {
      track('email_click', { link_url: href });
      return;
    }
    if (href.indexOf('t.me/') !== -1) {
      track(href.indexOf('_bot') !== -1 ? 'telegram_bot_click' : 'telegram_channel_click', { link_url: href });
      return;
    }
    if (/\/tickets\/?($|[?#])/.test(href)) {
      track('tickets_page_click', { link_url: href });
    }
  }, true);

  // Клик по кнопке подписки на почту на странице /tickets/
  document.addEventListener('click', function (e) {
    if (e.target.closest('[onclick^="subscribeEmail"]')) {
      track('lead_email_subscribe_click');
    }
  }, true);

  // Включение звука на hero-видео — сигнал вовлечённости
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#teaser-sound-btn, .teaser-sound-btn');
    if (!btn) return;
    setTimeout(function () {
      if (btn.classList.contains('on')) {
        track('video_sound_on', { page: location.pathname });
      }
    }, 0);
  }, true);
})();
