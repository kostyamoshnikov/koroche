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
function toggleMenu(){
  const btn = document.querySelector('.burger');
  const menu = document.getElementById('mMenu');
  if(!btn||!menu) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    const menu = document.getElementById('mMenu');
    const btn = document.querySelector('.burger');
    if(menu && menu.classList.contains('open')){
      menu.classList.remove('open');
      btn && btn.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
});
