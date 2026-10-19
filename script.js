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
