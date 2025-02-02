document.addEventListener('DOMContentLoaded', function () {
  // Get base path
  const basePath = window.location.pathname.startsWith('/pages/') ? '/' : './';

  // Load components
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');

  if (header) {
    fetch(basePath + 'components/header.html')
      .then((response) => response.text())
      .then((html) => {
        header.innerHTML = html;
        initializeHeader();
      })
      .catch((error) => console.error('Error loading header:', error));
  }

  if (footer) {
    fetch(basePath + 'components/footer.html')
      .then((response) => response.text())
      .then((html) => {
        footer.innerHTML = html;
      })
      .catch((error) => console.error('Error loading footer:', error));
  }
});

function initializeHeader() {
  // Initialize cart
  updateCartBadge();

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
      const theme = document.body.getAttribute('data-theme');
      const newTheme = theme === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateCartBadge() {
  const cart = getCart();
  const itemCount = Object.keys(cart.items).length;
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.textContent = itemCount;
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem('noja_cart') || '{"items":{}}');
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'position-fixed bottom-0 end-0 p-3';
  notification.style.zIndex = '9999';

  notification.innerHTML = `
      <div class="dashboard-card">
          <div class="d-flex align-items-center">
              <i class="bi bi-check-circle text-success me-2"></i>
              ${message}
          </div>
      </div>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Make functions available globally
window.updateCartBadge = updateCartBadge;
window.getCart = getCart;
window.showNotification = showNotification;
