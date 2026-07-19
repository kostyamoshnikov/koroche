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
function acceptCookies(){
  localStorage.setItem('cookies_accepted', '1');
  const b = document.getElementById('cookie-banner');
  if(b){
    b.classList.add('hidden');
    setTimeout(() => { b.style.display = 'none'; }, 400);
  }
}

// Back to top button + Telegram widget (единый scroll listener)
window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  if(btn) btn.classList.toggle('visible', window.scrollY > 400);

  const tgWidget = document.getElementById('tg-widget');
  if(tgWidget && window.scrollY > 400 && !tgWidget.classList.contains('visible')){
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
});

// Переключатель звука для hero-видео (используется на страницах спектаклей с видео-фоном)
function toggleTeaserSound(btn) {
  const video = document.getElementById('hero-video');
  if (!video) return;
  const isOn = btn.classList.toggle('on');
  video.muted = !isOn;
  const label = btn.querySelector('span');
  if (label) label.textContent = isOn ? 'Без звука' : 'Звук';
}
