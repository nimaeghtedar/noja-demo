let products = [];
let currentPage = 1;
const itemsPerPage = 12;

async function loadProducts() {
  showLoading(true);
  try {
    const response = await fetch('./assets/data/products.csv');
    const csvText = await response.text();

    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      complete: function (results) {
        products = results.data.filter((p) => p.id && p.titleFa);

        // Apply URL filters
        const urlParams = new URLSearchParams(window.location.search);
        const storeFilter = urlParams.get('store');
        const categoryFilter = urlParams.get('category');

        if (storeFilter) {
          products = products.filter((p) => p.store === storeFilter);
        }
        if (categoryFilter) {
          products = products.filter((p) => p.category === categoryFilter);
        }

        renderProducts();
        initializeFilters();
        showLoading(false);
      },
    });
  } catch (error) {
    console.error('Error:', error);
    showError('خطا در بارگذاری محصولات');
    showLoading(false);
  }
}

function renderProducts(filteredProducts = products) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  container.innerHTML = '';

  if (filteredProducts.length === 0) {
    document.getElementById('empty-state')?.classList.remove('d-none');
    document.getElementById('products-count').innerHTML =
      '<h5 class="mb-0">0 محصول</h5>';
    return;
  }

  document.getElementById('empty-state')?.classList.add('d-none');
  document.getElementById(
    'products-count'
  ).innerHTML = `<h5 class="mb-0">${filteredProducts.length} محصول</h5>`;

  filteredProducts.forEach((product) => {
    let specs;
    try {
      specs = JSON.parse(product.specs || '{}');
    } catch (e) {
      specs = {};
    }

    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';

    card.innerHTML = `
      <div class="dashboard-card product-card">
        <div class="product-image-wrapper">
          <img src="${product.imageUrl}" 
             class="product-image"
             alt="${product.titleFa}"
             loading="lazy"
             onerror="this.src='data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
               <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                 <rect width="200" height="200" fill="#f8f9fa"/>
                 <path d="M100 70 L130 120 L70 120 Z" fill="#dee2e6"/>
                 <circle cx="140" cy="60" r="10" fill="#dee2e6"/>
                 <text x="100" y="140" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="14">
                   تصویر محصول
                 </text>
               </svg>
             `)}'">
          <div class="product-badges">
          ${
            parseInt(product.stock) > 0
              ? '<span class="badge stock-badge"><i class="bi bi-check-circle-fill me-1"></i>موجود</span>'
              : '<span class="badge bg-danger"><i class="bi bi-x-circle-fill me-1"></i>ناموجود</span>'
          }
          <span class="badge category-badge"><i class="bi bi-tag-fill me-1"></i>${
            product.category
          }</span>
          </div>
        </div>
        <div class="card-body">
          <h5 class="card-title">${product.titleFa}</h5>
          
          <div class="price-rating-wrapper">
            <span class="price-tag">
              ${Number(product.price).toLocaleString()} تومان
            </span>
            <div class="rating-stars">
              ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(
      5 - Math.floor(product.rating)
    )}
              <small class="text-muted ms-1">(${product.reviews})</small>
            </div>
          </div>
          
          <p class="card-text text-muted">${
            product.descriptionFa.length > 100
              ? product.descriptionFa.substring(0, 100) + '...'
              : product.descriptionFa
          }</p>
          
          <div class="specs-badges">
            ${Object.entries(specs)
              .slice(0, 3)
              .map(
                ([key, value]) =>
                  `<span class="specs-badge"><i class="bi bi-info-circle me-1"></i>${key}: ${value}</span>`
              )
              .join('')}
          </div>
          
          <div class="mt-auto">
            <button class="btn btn-add-cart w-100 ${
              parseInt(product.stock) === 0 ? 'disabled' : ''
            }" 
                onclick="addToCart('${product.id}')"
                ${parseInt(product.stock) === 0 ? 'disabled' : ''}>
              <i class="bi bi-cart-plus-fill me-2"></i>
              ${
                parseInt(product.stock) === 0 ? 'ناموجود' : 'افزودن به سبد خرید'
              }
            </button>
          </div>
        </div>
      </div>`;

    container.appendChild(card);
  });
}

function initializeFilters() {
  // Sort select
  document.getElementById('sort-select')?.addEventListener('change', () => {
    renderProducts(filterProducts());
  });

  // Price filter
  document
    .getElementById('apply-price-filter')
    ?.addEventListener('click', () => {
      renderProducts(filterProducts());
    });

  // Stock filter
  document.getElementById('only-available')?.addEventListener('change', () => {
    renderProducts(filterProducts());
  });

  // Rating filter
  document.querySelectorAll('input[name="rating"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      renderProducts(filterProducts());
    });
  });

  // Clear filters
  document
    .getElementById('clear-filters')
    ?.addEventListener('click', clearFilters);
  document
    .getElementById('reset-filters')
    ?.addEventListener('click', clearFilters);
}

function filterProducts() {
  let filtered = [...products];

  // Price filter
  const minPrice = document.getElementById('price-min')?.value;
  const maxPrice = document.getElementById('price-max')?.value;
  if (minPrice)
    filtered = filtered.filter((p) => p.price >= parseFloat(minPrice));
  if (maxPrice)
    filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice));

  // Stock filter
  if (document.getElementById('only-available')?.checked) {
    filtered = filtered.filter((p) => parseInt(p.stock) > 0);
  }

  // Rating filter
  const selectedRating = document.querySelector(
    'input[name="rating"]:checked'
  )?.value;
  if (selectedRating) {
    filtered = filtered.filter((p) => p.rating >= parseFloat(selectedRating));
  }

  // Sorting
  const sortBy = document.getElementById('sort-select')?.value;
  switch (sortBy) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
  }

  return filtered;
}

function clearFilters() {
  document.getElementById('price-min').value = '';
  document.getElementById('price-max').value = '';
  document.getElementById('only-available').checked = false;
  document
    .querySelectorAll('input[name="rating"]')
    .forEach((radio) => (radio.checked = false));
  document.getElementById('sort-select').value = 'newest';
  renderProducts(products);
}

function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.toggle('d-none', !show);
  }
}

function showError(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger m-3';
  alert.textContent = message;
  document.body.insertBefore(alert, document.body.firstChild);
  setTimeout(() => alert.remove(), 3000);
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  let cart = JSON.parse(localStorage.getItem('noja_cart') || '{"items":{}}');

  if (cart.items[productId]) {
    cart.items[productId].quantity += 1;
  } else {
    cart.items[productId] = {
      id: product.id,
      name: product.titleFa,
      price: product.price,
      quantity: 1,
      image: product.imageUrl,
    };
  }

  localStorage.setItem('noja_cart', JSON.stringify(cart));
  updateCartBadge();
  showNotification('محصول به سبد خرید اضافه شد');
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('noja_cart') || '{"items":{}}');
  const itemCount = Object.keys(cart.items).length;
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = itemCount;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'dashboard-card position-fixed bottom-0 end-0 m-3';
  notification.innerHTML = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartBadge();
});
