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
