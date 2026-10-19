const bubbleButton = document.querySelector('#bubbleButton');
const bubbleMenu = document.querySelector('#bubbleMenu');
const toast = document.querySelector('#toast');
const newProjectButton = document.querySelector('#newProject');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

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

newProjectButton?.addEventListener('click', () => {
  showToast('Project creation is a preview. Connect Supabase to save real projects.');
});

document.querySelectorAll('.project-open').forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.closest('.project-row')?.querySelector('.project-info b')?.textContent || 'Project';
    showToast(`${name} is a sample project preview.`);
  });
});

document.querySelectorAll('a[href="#get-started"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Sign-in is the next step. Supabase Auth is not connected yet.');
  });
});

document.querySelectorAll('.hero-actions a[href="#workspace"], .closing a[href="#get-started"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (link.getAttribute('href') === '#workspace') {
      event.preventDefault();
      document.querySelector('#workspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Workspace preview — real projects will connect to Supabase.');
    }
  });
});
