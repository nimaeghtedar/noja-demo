document.addEventListener('DOMContentLoaded', function () {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const store = urlParams.get('store');
  const category = urlParams.get('category');

  // Update breadcrumb based on parameters
  updateBreadcrumb(store, category);

  // Load products (for demo, we'll show placeholder products)
  loadProducts();
});

function updateBreadcrumb(store, category) {
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  if (store && category) {
    breadcrumbCategory.textContent = `${store} - ${category}`;
  }
}

function loadProducts() {
  const productsGrid = document.getElementById('products-grid');
  const loadingState = document.getElementById('loading-state');

  // Show loading state
  loadingState.style.display = 'block';

  // Simulate loading delay
  setTimeout(() => {
    // Hide loading state
    loadingState.style.display = 'none';

    // Add placeholder products
    for (let i = 1; i <= 12; i++) {
      productsGrid.innerHTML += `
              <div class="col-md-4">
                  <div class="card product-card h-100">
                      <div class="position-relative">
                          <img src="/api/placeholder/300/300" class="card-img-top" alt="Product ${i}">
                          <button class="btn btn-sm btn-primary position-absolute top-0 start-0 m-2">
                              <i class="bi bi-heart"></i>
                          </button>
                      </div>
                      <div class="card-body d-flex flex-column">
                          <h5 class="card-title">محصول ${i}</h5>
                          <p class="card-text text-secondary mb-3">توضیحات محصول ${i}</p>
                          <div class="mt-auto">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                  <span class="h5 mb-0">۲,۵۰۰,۰۰۰ تومان</span>
                                  <span class="text-success">
                                      <i class="bi bi-check-circle-fill"></i> موجود
                                  </span>
                              </div>
                              <button class="btn btn-primary w-100">
                                  افزودن به سبد خرید
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          `;
    }
  }, 1000);
}
