const bubbleButton = document.querySelector('#bubbleButton');
const bubbleMenu = document.querySelector('#bubbleMenu');

bubbleButton?.addEventListener('click', () => {
  const opening = bubbleMenu.hidden;
  bubbleMenu.hidden = !opening;
  bubbleButton.setAttribute('aria-expanded', String(opening));
});

document.addEventListener('click', (event) => {
  if (!bubbleMenu || bubbleMenu.hidden) return;
  if (!bubbleMenu.contains(event.target) && !bubbleButton.contains(event.target)) {
    bubbleMenu.hidden = true;
    bubbleButton.setAttribute('aria-expanded', 'false');
  }
});

bubbleMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    bubbleMenu.hidden = true;
    bubbleButton.setAttribute('aria-expanded', 'false');
  });
});

// Keep the landing-page preview controls interactive instead of leaving decorative dead buttons.
document.querySelectorAll('.project-open').forEach((button) => {
  button.addEventListener('click', () => {
    window.location.href = 'studio.html';
  });
});
document.querySelectorAll('.project-row').forEach((row) => {
  row.tabIndex = 0;
  row.setAttribute('role', 'link');
  row.setAttribute('aria-label', 'Open MetalGui workspace');
  const open = () => { window.location.href = 'studio.html'; };
  row.addEventListener('dblclick', open);
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });
});
window.addEventListener('error', (event) => {
  const toast = document.querySelector('#toast');
  if (toast && event.message) {
    toast.textContent = 'A page error occurred. Refresh the page; if it continues, check the browser console.';
    toast.classList.add('show');
  }
});

// Sticky topbar glass effect on scroll
const topbar = document.querySelector('.topbar');
if (topbar) {
  const onScroll = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
