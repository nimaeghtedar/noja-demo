// Initialize state
let products = [];
let filters = {
  sort: 'newest',
  priceMin: null,
  priceMax: null,
  onlyAvailable: false,
  minRating: 0,
};

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const productsCount = document.getElementById('products-count');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeFilters();
  loadProducts();
});

// Initialize filter event listeners
function initializeFilters() {
  // Sort select
  document.getElementById('sort-select').addEventListener('change', (e) => {
    filters.sort = e.target.value;
    applyFilters();
  });

  // Price filter
  document
    .getElementById('apply-price-filter')
    .addEventListener('click', () => {
      filters.priceMin =
        Number(document.getElementById('price-min').value) || null;
      filters.priceMax =
        Number(document.getElementById('price-max').value) || null;
      applyFilters();
    });

  // Stock filter
  document.getElementById('only-available').addEventListener('change', (e) => {
    filters.onlyAvailable = e.target.checked;
    applyFilters();
  });

  // Rating filter
  document.querySelectorAll('input[name="rating"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      filters.minRating = Number(e.target.value);
      applyFilters();
    });
  });

  // Clear filters
  document
    .getElementById('clear-filters')
    .addEventListener('click', resetFilters);
  document
    .getElementById('reset-filters')
    .addEventListener('click', resetFilters);
}

// Load products from CSV
async function loadProducts() {
  showLoading();

  try {
    const response = await fetch('assets/data/products.csv');
    const csvData = await response.text();

    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        products = results.data.map((product) => ({
          ...product,
          price: Number(product.price),
          stock: Number(product.stock),
          rating: Number(product.rating),
          reviews: Number(product.reviews),
          specs: JSON.parse(product.specs),
        }));
        applyFilters();
      },
    });
  } catch (error) {
    console.error('Error loading products:', error);
    showEmptyState();
  }
}

// Apply filters and sort
function applyFilters() {
  let filteredProducts = [...products];

  // Apply filters
  if (filters.onlyAvailable) {
    filteredProducts = filteredProducts.filter((p) => p.stock > 0);
  }

  if (filters.minRating) {
    filteredProducts = filteredProducts.filter(
      (p) => p.rating >= filters.minRating
    );
  }

  if (filters.priceMin) {
    filteredProducts = filteredProducts.filter(
      (p) => p.price >= filters.priceMin
    );
  }

  if (filters.priceMax) {
    filteredProducts = filteredProducts.filter(
      (p) => p.price <= filters.priceMax
    );
  }

  // Apply sorting
  switch (filters.sort) {
    case 'price-asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filteredProducts.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
    default:
      // Assume ID reflects chronological order
      filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
  }

  renderProducts(filteredProducts);
}

// Render products to grid
function renderProducts(filteredProducts) {
  if (filteredProducts.length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();
  productsCount.innerHTML = `<h5 class="mb-0">${filteredProducts.length} محصول</h5>`;

  productsGrid.innerHTML = filteredProducts
    .map(
      (product) => `
    <div class="col-md-6 col-lg-4" data-aos="fade-up">
      <div class="product-card card h-100">
        <div class="product-image-wrapper">
          <img src="${product.imageUrl}" class="product-image" alt="${
        product.titleFa
      }">
          <div class="product-badges">
            ${
              product.stock > 0
                ? '<span class="badge stock-badge">موجود</span>'
                : '<span class="badge bg-danger">ناموجود</span>'
            }
            <span class="badge category-badge">${product.category}</span>
          </div>
        </div>
        
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${product.titleFa}</h5>
          <p class="card-text text-secondary">${product.descriptionFa}</p>
          
          <div class="specs-badges">
            ${Object.entries(product.specs)
              .map(
                ([key, value]) => `<span class="specs-badge">${value}</span>`
              )
              .join('')}
          </div>
          
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="rating-wrapper">
                <div class="stars">${'★'.repeat(
                  Math.floor(product.rating)
                )}${'☆'.repeat(5 - Math.floor(product.rating))}</div>
                <small class="text-secondary">(${product.reviews})</small>
              </div>
              <strong class="price-tag">${new Intl.NumberFormat('fa-IR').format(
                product.price
              )} تومان</strong>
            </div>
            
            <div class="action-buttons">
              <button class="btn btn-add-cart w-100" onclick="addToCart('${
                product.id
              }')" ${product.stock === 0 ? 'disabled' : ''}>
                <i class="bi bi-cart-plus me-2"></i>افزودن به سبد
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

// UI State Management
function showLoading() {
  loadingSpinner.classList.remove('d-none');
  productsGrid.innerHTML = '';
  hideEmptyState();
}

function hideLoading() {
  loadingSpinner.classList.add('d-none');
}

function showEmptyState() {
  emptyState.classList.remove('d-none');
  productsGrid.innerHTML = '';
  productsCount.innerHTML = '<h5 class="mb-0">0 محصول</h5>';
}

function hideEmptyState() {
  emptyState.classList.add('d-none');
}

function resetFilters() {
  filters = {
    sort: 'newest',
    priceMin: null,
    priceMax: null,
    onlyAvailable: false,
    minRating: 0,
  };

  // Reset UI
  document.getElementById('sort-select').value = 'newest';
  document.getElementById('price-min').value = '';
  document.getElementById('price-max').value = '';
  document.getElementById('only-available').checked = false;
  document
    .querySelectorAll('input[name="rating"]')
    .forEach((radio) => (radio.checked = false));

  applyFilters();
}

// Cart functionality
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const cart = JSON.parse(localStorage.getItem('noja_cart') || '{"items":{}}');

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
