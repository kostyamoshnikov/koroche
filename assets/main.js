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
    const cookiesAccepted = !!localStorage.getItem('cookies_accepted');
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
