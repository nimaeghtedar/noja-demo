class ProductLoader {
  constructor() {
    this.products = {
      amazon: {},
      trendyol: {},
      namshi: {},
    };
    this.filteredProducts = [];
    this.USD_TO_IRR = 520000;
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.viewMode = 'grid'; // grid or list
    this.filters = {
      priceMin: null,
      priceMax: null,
      onlyAvailable: false,
      minRating: 0,
      store: null,
      category: null,
      sortBy: 'newest',
    };
  }

  async init() {
    this.showLoading(true);
    await this.loadProducts();
    this.setupEventListeners();
    this.initializeFromURL();
    this.showLoading(false);
  }

  async loadProducts() {
    try {
      const response = await fetch('./assets/data/products.csv');
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          this.processProducts(results.data);
          this.applyFilters();
          this.renderProducts();
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          this.showError('خطا در بارگذاری محصولات');
        },
      });
    } catch (error) {
      console.error('Error loading products:', error);
      this.showError('خطا در بارگذاری فایل محصولات');
    }
  }

  processProducts(productsArray) {
    productsArray.forEach((product) => {
      // Parse specs from JSON string if it's a string
      if (typeof product.specs === 'string') {
        try {
          product.specs = JSON.parse(product.specs);
        } catch (e) {
          console.error('Error parsing specs for product:', product.id);
          product.specs = {};
        }
      }

      // Initialize category array if it doesn't exist
      if (!this.products[product.store][product.category]) {
        this.products[product.store][product.category] = [];
      }

      this.products[product.store][product.category].push(product);
    });
  }

  setupEventListeners() {
    // Sort dropdown
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      this.filters.sortBy = e.target.value;
      this.applyFilters();
    });

    // View toggle
    document.getElementById('view-toggle')?.addEventListener('click', () => {
      this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
      this.updateViewToggleButton();
      this.renderProducts();
    });

    // Price filter
    document
      .getElementById('apply-price-filter')
      ?.addEventListener('click', () => {
        const minInput = document.getElementById('price-min');
        const maxInput = document.getElementById('price-max');

        this.filters.priceMin = minInput.value
          ? parseFloat(minInput.value)
          : null;
        this.filters.priceMax = maxInput.value
          ? parseFloat(maxInput.value)
          : null;

        this.applyFilters();
      });

    // Stock filter
    document
      .getElementById('only-available')
      ?.addEventListener('change', (e) => {
        this.filters.onlyAvailable = e.target.checked;
        this.applyFilters();
      });

    // Rating filter
    document.querySelectorAll('input[name="rating"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.filters.minRating = parseFloat(e.target.value);
        this.applyFilters();
      });
    });

    // Clear filters
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.resetFilters();
    });

    // Pagination
    document.getElementById('pagination')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-link')) {
        e.preventDefault();
        const page = e.target.dataset.page;
        if (page) {
          this.currentPage = parseInt(page);
          this.renderProducts();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    this.filters.store = urlParams.get('store');
    this.filters.category = urlParams.get('category');

    // Update breadcrumb
    this.updateBreadcrumb();

    // Apply initial filters
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.getAllProducts();

    // Store and category filters
    if (this.filters.store) {
      filtered = filtered.filter((p) => p.store === this.filters.store);
    }
    if (this.filters.category) {
      filtered = filtered.filter((p) => p.category === this.filters.category);
    }

    // Price filters
    if (this.filters.priceMin) {
      filtered = filtered.filter((p) => p.price >= this.filters.priceMin);
    }
    if (this.filters.priceMax) {
      filtered = filtered.filter((p) => p.price <= this.filters.priceMax);
    }

    // Stock filter
    if (this.filters.onlyAvailable) {
      filtered = filtered.filter((p) => p.stock > 0);
    }

    // Rating filter
    if (this.filters.minRating > 0) {
      filtered = filtered.filter((p) => p.rating >= this.filters.minRating);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviews - a.reviews;
        default: // newest
          return b.id.localeCompare(a.id);
      }
    });

    this.filteredProducts = filtered;
    this.currentPage = 1;
    this.renderProducts();
    this.updateActiveFilters();
  }

  renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');

    if (!this.filteredProducts.length) {
      productsGrid.innerHTML = '';
      emptyState.classList.remove('d-none');
      return;
    }

    emptyState.classList.add('d-none');

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);

    productsGrid.className = this.viewMode === 'grid' ? 'row g-4' : 'list-view';
    productsGrid.innerHTML = paginatedProducts
      .map((product) =>
        this.viewMode === 'grid'
          ? this.createGridCard(product)
          : this.createListCard(product)
      )
      .join('');

    this.updatePagination();
    this.updateProductsCount();
  }

  createGridCard(product) {
    const irrPrice = this.calculateIRRPrice(product.price);
    return `
          <div class="col-md-6 col-lg-4">
              <div class="card product-card h-100">
                  <div class="position-relative">
                      <img src="${
                        product.imageUrl || '/assets/images/placeholder.jpg'
                      }" 
                           class="card-img-top p-3" 
                           alt="${product.titleFa}">
                      <span class="badge bg-primary position-absolute top-0 end-0 m-2">
                          ${product.store}
                      </span>
                  </div>
                  <div class="card-body d-flex flex-column">
                      <h5 class="card-title" title="${product.titleFa}">${
      product.titleFa
    }</h5>
                      <p class="card-text small text-secondary" title="${
                        product.title
                      }">${product.title}</p>
                      <div class="mt-auto">
                          <div class="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                  <div class="h6 mb-0">${this.formatCurrency(
                                    irrPrice,
                                    'IRR'
                                  )}</div>
                                  <small class="text-secondary">${this.formatCurrency(
                                    product.price,
                                    'USD'
                                  )}</small>
                              </div>
                              <div class="text-warning">
                                  ${this.createRatingStars(product.rating)}
                              </div>
                          </div>
                          <div class="d-flex justify-content-between align-items-center mb-2">
                              <span class="${
                                product.stock > 0
                                  ? 'text-success'
                                  : 'text-danger'
                              }">
                                  <i class="bi ${
                                    product.stock > 0
                                      ? 'bi-check-circle-fill'
                                      : 'bi-x-circle-fill'
                                  }"></i>
                                  ${product.stock > 0 ? 'موجود' : 'ناموجود'}
                              </span>
                              <small class="text-secondary">${
                                product.reviews
                              } دیدگاه</small>
                          </div>
                          <a href="/pages/product-detail.html?id=${product.id}" 
                             class="btn btn-primary w-100">مشاهده و خرید</a>
                      </div>
                  </div>
              </div>
          </div>
      `;
  }

  createListCard(product) {
    const irrPrice = this.calculateIRRPrice(product.price);
    return `
          <div class="card product-card mb-3">
              <div class="row g-0">
                  <div class="col-md-3">
                      <img src="${
                        product.imageUrl || '/assets/images/placeholder.jpg'
                      }" 
                           class="img-fluid rounded-start p-3" 
                           alt="${product.titleFa}">
                  </div>
                  <div class="col-md-9">
                      <div class="card-body h-100 d-flex flex-column">
                          <div class="d-flex justify-content-between">
                              <h5 class="card-title">${product.titleFa}</h5>
                              <span class="badge bg-primary">${
                                product.store
                              }</span>
                          </div>
                          <p class="card-text">${product.descriptionFa}</p>
                          <div class="mt-auto">
                              <div class="row align-items-center">
                                  <div class="col-md-4">
                                      <div class="h5 mb-0">${this.formatCurrency(
                                        irrPrice,
                                        'IRR'
                                      )}</div>
                                      <small class="text-secondary">${this.formatCurrency(
                                        product.price,
                                        'USD'
                                      )}</small>
                                  </div>
                                  <div class="col-md-4 text-center">
                                      <div class="text-warning mb-1">
                                          ${this.createRatingStars(
                                            product.rating
                                          )}
                                      </div>
                                      <small class="text-secondary">${
                                        product.reviews
                                      } دیدگاه</small>
                                  </div>
                                  <div class="col-md-4 text-end">
                                      <a href="/pages/product-detail.html?id=${
                                        product.id
                                      }" 
                                         class="btn btn-primary">مشاهده و خرید</a>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;
  }

  updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.itemsPerPage
    );

    let html = '';

    // Previous button
    html += `
          <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
              <a class="page-link" href="#" data-page="${
                this.currentPage - 1
              }">قبلی</a>
          </li>
      `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= this.currentPage - 2 && i <= this.currentPage + 2)
      ) {
        html += `
                  <li class="page-item ${
                    i === this.currentPage ? 'active' : ''
                  }">
                      <a class="page-link" href="#" data-page="${i}">${i}</a>
                  </li>
              `;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    // Next button
    html += `
          <li class="page-item ${
            this.currentPage === totalPages ? 'disabled' : ''
          }">
              <a class="page-link" href="#" data-page="${
                this.currentPage + 1
              }">بعدی</a>
          </li>
      `;

    pagination.innerHTML = html;
  }

  // Helper methods
  getAllProducts() {
    return Object.values(this.products)
      .flatMap((categories) => Object.values(categories))
      .flat();
  }

  calculateIRRPrice(usdPrice) {
    return Math.round(usdPrice * this.USD_TO_IRR);
  }

  formatCurrency(amount, currency = 'IRR') {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  createRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="bi bi-star-fill"></i>';
      } else if (i - rating < 1) {
        stars += '<i class="bi bi-star-half"></i>';
      } else {
        stars += '<i class="bi bi-star"></i>';
      }
    }
    return stars;
  }

  updateBreadcrumb() {
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    if (this.filters.store && this.filters.category) {
      breadcrumbCategory.textContent = `${this.filters.store} - ${this.filters.category}`;
    }
  }

  updateProductsCount() {
    const countElement = document.getElementById('products-count');
    const pageInfoElement = document.getElementById('page-info');

    const total = this.filteredProducts.length;
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, total);

    if (countElement) {
      countElement.innerHTML = `
              <strong>${total}</strong> محصول یافت شد
          `;
    }

    if (pageInfoElement) {
      pageInfoElement.innerHTML =
        total > 0 ? `نمایش ${start} تا ${end} از ${total}` : '';
    }
  }

  updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;

    let html = '';

    // Store and category filter
    if (this.filters.store || this.filters.category) {
      html += this.createActiveFilterBadge(
        'دسته‌بندی',
        `${this.filters.store || ''} ${this.filters.category || ''}`,
        'store-category'
      );
    }

    // Price range filter
    if (this.filters.priceMin || this.filters.priceMax) {
      const priceRange = `از ${this.formatCurrency(
        this.filters.priceMin || 0
      )} تا ${this.formatCurrency(this.filters.priceMax || '∞')}`;
      html += this.createActiveFilterBadge(
        'محدوده قیمت',
        priceRange,
        'price-range'
      );
    }

    // Stock filter
    if (this.filters.onlyAvailable) {
      html += this.createActiveFilterBadge(
        'موجودی',
        'فقط کالاهای موجود',
        'stock'
      );
    }

    // Rating filter
    if (this.filters.minRating > 0) {
      html += this.createActiveFilterBadge(
        'حداقل امتیاز',
        `${this.filters.minRating} ستاره`,
        'rating'
      );
    }

    activeFiltersContainer.innerHTML = html
      ? `
          <h6 class="mb-3">فیلترهای فعال:</h6>
          <div class="d-flex flex-wrap gap-2">${html}</div>
      `
      : '';
  }

  createActiveFilterBadge(title, value, type) {
    return `
          <span class="badge bg-primary d-flex align-items-center">
              <span class="me-1">${title}: ${value}</span>
              <button type="button" 
                      class="btn-close btn-close-white ms-2" 
                      aria-label="Remove filter"
                      data-filter-type="${type}">
              </button>
          </span>
      `;
  }

  resetFilters() {
    this.filters = {
      priceMin: null,
      priceMax: null,
      onlyAvailable: false,
      minRating: 0,
      store: this.filters.store, // Preserve store filter
      category: this.filters.category, // Preserve category filter
      sortBy: 'newest',
    };

    // Reset UI elements
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('only-available').checked = false;
    document
      .querySelectorAll('input[name="rating"]')
      .forEach((radio) => (radio.checked = false));
    document.getElementById('sort-select').value = 'newest';

    this.applyFilters();
  }

  updateViewToggleButton() {
    const button = document.getElementById('view-toggle');
    if (button) {
      button.innerHTML = `
              <i class="bi bi-${
                this.viewMode === 'grid' ? 'list' : 'grid'
              }"></i>
              ${this.viewMode === 'grid' ? 'نمایش لیستی' : 'نمایش شبکه‌ای'}
          `;
    }
  }

  showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    const productsGrid = document.getElementById('products-grid');
    if (spinner && productsGrid) {
      spinner.classList.toggle('d-none', !show);
      productsGrid.classList.toggle('d-none', show);
    }
  }

  showError(message) {
    // Create error alert if it doesn't exist
    let errorAlert = document.getElementById('error-alert');
    if (!errorAlert) {
      errorAlert = document.createElement('div');
      errorAlert.id = 'error-alert';
      errorAlert.className = 'alert alert-danger alert-dismissible fade show';
      errorAlert.role = 'alert';
      document.querySelector('main').prepend(errorAlert);
    }

    errorAlert.innerHTML = `
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.productLoader = new ProductLoader();
  productLoader.init();
});
