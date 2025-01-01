// Wait for document load
document.addEventListener('DOMContentLoaded', function () {
  // Load components
  loadComponents().then(() => {
    // Initialize theme after components are loaded
    initializeTheme();
  });
});

// Load header and footer
function loadComponents() {
  return Promise.all([
    fetch('/components/header.html').then((response) => response.text()),
    fetch('/components/footer.html').then((response) => response.text()),
  ]).then(([header, footer]) => {
    document.getElementById('header').innerHTML = header;
    document.getElementById('footer').innerHTML = footer;
  });
}

// Initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Add event listener to theme toggle after component is loaded
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Toggle theme function
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

// Update theme icon
function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'light' ? 'bi bi-moon' : 'bi bi-sun';
  }
}
