const PRODUCTS = [
  {
    id: 'p001',
    name: 'Limited Edition Orange Enamel Pin',
    category: 'Character Pins',
    price: 18,
    stock: 22,
    image: 'assets/pins/orange.png',
    featured: true,
    description: '',
    newDrop: true
  },
  {
    id: 'p002',
    name: 'Limited Edition Orchard Enamel Pin',
    category: 'Character Pins',
    price: 18,
    stock: 30,
    image: 'assets/pins/orchard.png',
    featured: true,
    description: '',
    newDrop: true
  },
  {
    id: 'p003',
    name: 'Limited Edition Salem Enamel Pin',
    category: 'Character Pins',
    price: 18,
    stock: 18,
    image: 'assets/pins/salem.png',
    description: '',
    featured: true,
    newDrop: true
  },
  {
    id: 'p004',
    name: 'Limited Edition Apple Enamel Pin',
    category: 'Character Pins',
    price: 18,
    stock: 20,
    image: 'assets/pins/apple.png',
    featured: true,
    description: '',
    newDrop: true
  }
];

const HOMEPAGE_TIERS = [
  { price: 475, unit: '$9.50 per pin', quantity: '50 custom pins', cta: 'Request Project' },
  { price: 600, unit: '$8.00 per pin', quantity: '75 custom pins', cta: 'Request Project' },
  { price: 700, unit: '$7.00 per pin', quantity: '100 custom pins', cta: 'Request Project' },
  { price: 995, unit: '$4.98 per pin', quantity: '200 custom pins', cta: 'Request Project' }
];

const CUSTOM_QUOTES = [
  {
    text: '“Our convention run sold out in one weekend — packaging and quality were incredible.”',
    by: '— Event Organizer, Midwest Fandom Expo'
  },
  {
    text: '“The quote process was clear, fast, and we got exactly the style we wanted.”',
    by: '— Indie Creator, NeonByte Studio'
  },
  {
    text: '“From sketch review to delivery, every step felt professional and easy.”',
    by: '— Community Lead, Pixel Guild'
  }
];

const ETSY_REVIEWS = [
  {
    author: 'Kiarra',
    date: 'Mar 2, 2026',
    rating: 5,
    text: 'Beautiful quality and got here SO fast!',
    item: 'Limited Edition Salem Enamel Pin Rankless Graphic Novel'
  },
  {
    author: 'TechnoGecko',
    date: 'Feb 28, 2026',
    rating: 5,
    text: 'A lovely little pin with very cute art!',
    item: 'Limited Edition Rose Gold Apple Enamel Pin Rankless Graphic Novel'
  },
  {
    author: 'Alex',
    date: 'Feb 24, 2026',
    rating: 5,
    text: 'I loved this pin, she is so precious.',
    item: 'Limited Edition Rose Gold Apple Enamel Pin Rankless Graphic Novel'
  },
  {
    author: 'Riley',
    date: 'Feb 22, 2026',
    rating: 5,
    text: "Quality is a chef's kiss! Mwa! Art is top tier! Everything about these pins and how quickly they were shipped is perfect.",
    item: 'Limited Edition Salem Enamel Pin Rankless Graphic Novel'
  },
  {
    author: 'Serenah',
    date: 'Feb 25, 2026',
    rating: 5,
    text: "I love this so much. So happy I ordered it. It's not a heavy sweater at all and I've gotten so many compliments.",
    item: 'Rankless dragon Crewneck Sweatshirt'
  },
  {
    author: 'Spirits',
    date: 'Feb 23, 2026',
    rating: 5,
    text: "Lovely quality, I've ordered pins before and they're always so nice!",
    item: 'Limited Edition Rose Gold Apple Enamel Pin Rankless Graphic Novel'
  }
];

const FAQ_ITEMS = [
  {
    q: 'How long does a custom pin project take?',
    a: 'Most projects run about 4-6 months including design, sampling, and manufacturing windows.'
  },
  {
    q: 'Can I order fewer than 50 custom pins?',
    a: 'Our minimum project size is 50 units to keep production quality and unit cost consistent.'
  },
  {
    q: 'Do you offer pride and event-exclusive product lines?',
    a: 'Yes. We run seasonal categories, event exclusives, and identity-forward collections throughout the year.'
  },
  {
    q: 'What if my package is marked delivered but missing?',
    a: 'Contact us right away and we will help with a shipping investigation and next-step resolution options.'
  },
  {
    q: 'Do sold-out pins restock?',
    a: 'Core products may return, but most drop-based pins are limited runs and may not be reproduced.'
  }
];

const CREATOR_CAMPAIGNS = [
  {
    id: 'rachel-rankless',
    creatorName: 'Rachel • Rankless',
    pinName: 'Salem Limited Run',
    saleWindow: 'Feb 20, 2026 - Mar 20, 2026',
    unitsSold: 184,
    grossSales: 3312,
    conversionRate: 6.8,
    avgOrderValue: 21.7,
    repeatCustomers: 42,
    dailySales: [14, 22, 19, 28, 31, 35, 35]
  },
  {
    id: 'orchard-guild',
    creatorName: 'Orchard Guild',
    pinName: 'Orchard Character Drop',
    saleWindow: 'Feb 25, 2026 - Mar 18, 2026',
    unitsSold: 126,
    grossSales: 2268,
    conversionRate: 5.2,
    avgOrderValue: 19.9,
    repeatCustomers: 27,
    dailySales: [10, 14, 15, 20, 21, 23, 23]
  },
  {
    id: 'apple-core',
    creatorName: 'Apple Core Studio',
    pinName: 'Apple Rose Gold Pin',
    saleWindow: 'Feb 15, 2026 - Mar 15, 2026',
    unitsSold: 96,
    grossSales: 1728,
    conversionRate: 4.4,
    avgOrderValue: 18.6,
    repeatCustomers: 18,
    dailySales: [7, 9, 13, 14, 15, 18, 20]
  }
];

const QUOTE_STYLE_MODIFIERS = {
  'soft-enamel': 1,
  'hard-enamel': 1.08,
  glitter: 1.15,
  'screen-print': 1.12
};

const state = {
  filter: 'All',
  search: '',
  cart: JSON.parse(localStorage.getItem('pownce-cart') || '{}')
};

const urlSearch = new URLSearchParams(window.location.search);
const initialSearch = (urlSearch.get('search') || '').trim();
if (initialSearch) {
  state.search = initialSearch;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function saveCart() {
  localStorage.setItem('pownce-cart', JSON.stringify(state.cart));
}

function productCard(product) {
  return `
    <article class="card" data-product-id="${product.id}">
      <div class="art"><img src="${product.image}" alt="${product.name}" loading="lazy" /></div>
      <div class="card-body">
        <h3>${product.name}</h3>
        <p class="card-desc">${product.description}</p>
        <div class="meta">
          <span class="tag">${product.category}</span>
          <span class="price">${currency.format(product.price)}</span>
        </div>
        <p class="stock">Stock: ${product.stock}</p>
        <button class="btn btn-primary full" data-add="${product.id}">Add to Cart</button>
      </div>
    </article>
  `;
}

function getFilteredProducts() {
  return PRODUCTS.filter((product) => {
    const filterMatch = state.filter === 'All' || product.category === state.filter;
    const searchMatch = product.name.toLowerCase().includes(state.search.toLowerCase());
    return filterMatch && searchMatch;
  });
}

function renderHomeSections() {
  const featuredRoot = document.querySelector('#featuredGrid');
  const newestRoot = document.querySelector('#newGrid');
  const tiersRoot = document.querySelector('#tierGrid');
  const quoteRoot = document.querySelector('#quoteGrid');
  const reviewRoot = document.querySelector('#etsyReviewGrid');
  const featured = PRODUCTS.filter((item) => item.featured).slice(0, 4);
  const newest = PRODUCTS.filter((item) => item.newDrop).slice(0, 4);

  if (featuredRoot) {
    featuredRoot.innerHTML = featured.map(productCard).join('');
  }

  if (newestRoot) {
    newestRoot.innerHTML = newest.map(productCard).join('');
  }

  if (tiersRoot) {
    tiersRoot.innerHTML = HOMEPAGE_TIERS.map(
      (tier) => `
      <article class="panel">
        <h3>${currency.format(tier.price)} USD</h3>
        <p class="lead">${tier.unit}</p>
        <p>${tier.quantity}</p>
        <button class="btn btn-primary full" data-request="${tier.quantity}">${tier.cta}</button>
      </article>
    `
    ).join('');
  }

  if (quoteRoot) {
    quoteRoot.innerHTML = CUSTOM_QUOTES.map(
      (quote) => `
      <article class="panel">
        <p>${quote.text}</p>
        <h3>${quote.by}</h3>
      </article>
    `
    ).join('');
  }

  if (reviewRoot) {
    reviewRoot.innerHTML = ETSY_REVIEWS.map(
      (review) => `
      <article class="review-card">
        <div class="review-head">
          <h3>${review.author}</h3>
          <p>${review.date}</p>
        </div>
        <p class="review-stars" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
        <p>${review.text}</p>
        <p class="review-item">${review.item}</p>
      </article>
    `
    ).join('');
  }
}

function renderShop() {
  const gridRoot = document.querySelector('#shopGrid');
  const filtersRoot = document.querySelector('#filters');
  const searchInput = document.querySelector('#searchInput');
  if (!gridRoot || !filtersRoot || !searchInput) {
    return;
  }

  const categories = ['All', ...new Set(PRODUCTS.map((item) => item.category))];
  filtersRoot.innerHTML = categories
    .map((category) => `<button class="chip ${category === state.filter ? 'active' : ''}" data-filter="${category}">${category}</button>`)
    .join('');

  const rows = getFilteredProducts();
  gridRoot.innerHTML = rows.length ? rows.map(productCard).join('') : '<p class="empty">No products match your filters.</p>';

  searchInput.value = state.search;
}

function renderFaq() {
  const faqRoot = document.querySelector('#faqList');
  if (!faqRoot) {
    return;
  }

  faqRoot.innerHTML = FAQ_ITEMS.map(
    (item, index) => `
      <article class="faq-item ${index === 0 ? 'open' : ''}">
        <button class="faq-q" data-faq>${item.q}</button>
        <div class="faq-a"><p>${item.a}</p></div>
      </article>
    `
  ).join('');
}

function renderCollection() {
  const collectionRoot = document.querySelector('#collectionGrid');
  if (!collectionRoot) {
    return;
  }

  collectionRoot.innerHTML = PRODUCTS.map(
    (product, index) => `
      <article class="collection-card">
        <p class="collection-number">#${String(index + 1).padStart(2, '0')}</p>
        <div class="collection-art"><img src="${product.image}" alt="${product.name}" loading="lazy" /></div>
        <h3>${product.name}</h3>
        <p class="card-desc">${product.description}</p>
      </article>
    `
  ).join('');
}

function renderCreatorCampaign(campaign) {
  const campaignName = document.querySelector('#campaignName');
  const campaignWindow = document.querySelector('#campaignWindow');
  const analyticsCards = document.querySelector('#analyticsCards');
  const trendBars = document.querySelector('#trendBars');

  if (!campaignName || !campaignWindow || !analyticsCards || !trendBars) {
    return;
  }

  campaignName.textContent = `${campaign.creatorName} • ${campaign.pinName}`;
  campaignWindow.textContent = campaign.saleWindow;

  analyticsCards.innerHTML = `
    <article class="panel analytic-card">
      <p class="metric-label">Units Sold</p>
      <h3>${campaign.unitsSold}</h3>
    </article>
    <article class="panel analytic-card">
      <p class="metric-label">Gross Sales</p>
      <h3>${currency.format(campaign.grossSales)}</h3>
    </article>
    <article class="panel analytic-card">
      <p class="metric-label">Conversion</p>
      <h3>${campaign.conversionRate}%</h3>
    </article>
    <article class="panel analytic-card">
      <p class="metric-label">Avg Order Value</p>
      <h3>${currency.format(campaign.avgOrderValue)}</h3>
    </article>
    <article class="panel analytic-card">
      <p class="metric-label">Repeat Customers</p>
      <h3>${campaign.repeatCustomers}</h3>
    </article>
  `;

  const maxSales = Math.max(...campaign.dailySales, 1);
  trendBars.innerHTML = campaign.dailySales
    .map(
      (value, index) => `
      <article class="trend-bar-card">
        <p>D${index + 1}</p>
        <div class="trend-track">
          <span class="trend-fill" style="height:${Math.max(12, (value / maxSales) * 100)}%"></span>
        </div>
        <strong>${value}</strong>
      </article>
    `
    )
    .join('');
}

function renderCreatorPortal() {
  const creatorSelect = document.querySelector('#creatorSelect');
  if (!creatorSelect) {
    return;
  }

  creatorSelect.innerHTML = CREATOR_CAMPAIGNS.map(
    (campaign) => `<option value="${campaign.id}">${campaign.creatorName}</option>`
  ).join('');

  const initialCampaign = CREATOR_CAMPAIGNS[0];
  if (initialCampaign) {
    renderCreatorCampaign(initialCampaign);
  }

  creatorSelect.addEventListener('change', () => {
    const selectedCampaign = CREATOR_CAMPAIGNS.find((campaign) => campaign.id === creatorSelect.value);
    if (selectedCampaign) {
      renderCreatorCampaign(selectedCampaign);
    }
  });
}

function getUnitPrice(quantity) {
  if (quantity >= 200) {
    return 4.98;
  }
  if (quantity >= 100) {
    return 7;
  }
  if (quantity >= 75) {
    return 8;
  }
  return 9.5;
}

function updateQuoteSummary() {
  const qtyInput = document.querySelector('#quoteQty');
  const styleInput = document.querySelector('#quoteStyle');
  const summaryRoot = document.querySelector('#quoteSummary');
  if (!qtyInput || !styleInput || !summaryRoot) {
    return;
  }

  const quantity = Math.max(50, Number(qtyInput.value) || 50);
  const baseUnit = getUnitPrice(quantity);
  const styleMultiplier = QUOTE_STYLE_MODIFIERS[styleInput.value] || 1;
  const adjustedUnit = baseUnit * styleMultiplier;
  const setupFee = 80;
  const shippingEstimate = quantity >= 150 ? 0 : 24;
  const totalEstimate = adjustedUnit * quantity + setupFee + shippingEstimate;

  summaryRoot.innerHTML = `
    <article class="panel">
      <p class="metric-label">Quantity</p>
      <h3>${quantity} pins</h3>
    </article>
    <article class="panel">
      <p class="metric-label">Estimated Unit Price</p>
      <h3>${currency.format(adjustedUnit)}</h3>
    </article>
    <article class="panel">
      <p class="metric-label">Estimated Total</p>
      <h3>${currency.format(totalEstimate)}</h3>
      <p class="lead">Includes setup and estimated shipping.</p>
    </article>
  `;
}

function bindQuoteForm() {
  const quoteForm = document.querySelector('#quoteForm');
  const quoteQty = document.querySelector('#quoteQty');
  const quoteStyle = document.querySelector('#quoteStyle');
  const quoteMessage = document.querySelector('#quoteMessage');

  if (!quoteForm || !quoteQty || !quoteStyle || !quoteMessage) {
    return;
  }

  quoteQty.addEventListener('input', updateQuoteSummary);
  quoteStyle.addEventListener('change', updateQuoteSummary);
  updateQuoteSummary();

  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const quantity = Math.max(50, Number(quoteQty.value) || 50);
    quoteMessage.textContent = `Quote request received for ${quantity} pins. We will send your detailed proposal within 1 business day.`;
    quoteForm.reset();
    quoteQty.value = '100';
    quoteStyle.value = 'soft-enamel';
    updateQuoteSummary();
  });
}

function getCartEntries() {
  return Object.entries(state.cart)
    .map(([id, qty]) => {
      const product = PRODUCTS.find((item) => item.id === id);
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);
}

function renderCart() {
  const cartItems = document.querySelector('#cartItems');
  const cartTotal = document.querySelector('#cartTotal');
  const cartCount = document.querySelectorAll('#cartCount');
  if (!cartItems || !cartTotal || !cartCount.length) {
    return;
  }

  const entries = getCartEntries();
  const count = entries.reduce((sum, item) => sum + item.qty, 0);
  const total = entries.reduce((sum, item) => sum + item.qty * item.price, 0);

  cartCount.forEach((el) => {
    el.textContent = String(count);
  });
  cartTotal.textContent = currency.format(total);

  if (!entries.length) {
    cartItems.innerHTML = '<p class="empty">Your cart is empty.</p>';
    return;
  }

  cartItems.innerHTML = entries
    .map(
      (item) => `
      <div class="cart-item">
        <div class="cart-icon"><img src="${item.image}" alt="${item.name}" loading="lazy" /></div>
        <div>
          <h4>${item.name}</h4>
          <p>${currency.format(item.price)}</p>
          <button class="remove" data-remove="${item.id}">Remove</button>
        </div>
        <div class="qty">
          <button data-dec="${item.id}">-</button>
          <strong>${item.qty}</strong>
          <button data-inc="${item.id}">+</button>
        </div>
      </div>
    `
    )
    .join('');
}

function setCartOpen(nextState) {
  const drawer = document.querySelector('#cartDrawer');
  const backdrop = document.querySelector('#backdrop');
  if (!drawer || !backdrop) {
    return;
  }
  drawer.classList.toggle('open', nextState);
  drawer.setAttribute('aria-hidden', String(!nextState));
  backdrop.hidden = !nextState;
}

function addToCart(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  saveCart();
  renderCart();
}

function changeQty(productId, amount) {
  const next = (state.cart[productId] || 0) + amount;
  if (next <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = next;
  }
  saveCart();
  renderCart();
}

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    addToCart(addButton.dataset.add);
    setCartOpen(true);
  }

  const incButton = event.target.closest('[data-inc]');
  if (incButton) {
    changeQty(incButton.dataset.inc, 1);
  }

  const decButton = event.target.closest('[data-dec]');
  if (decButton) {
    changeQty(decButton.dataset.dec, -1);
  }

  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    delete state.cart[removeButton.dataset.remove];
    saveCart();
    renderCart();
  }

  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) {
    state.filter = filterButton.dataset.filter;
    renderShop();
  }

  const faqToggle = event.target.closest('[data-faq]');
  if (faqToggle) {
    faqToggle.parentElement.classList.toggle('open');
  }

  if (event.target.closest('#cartToggle')) {
    setCartOpen(true);
  }

  if (event.target.closest('#closeCart') || event.target.closest('#backdrop')) {
    setCartOpen(false);
  }
});

document.addEventListener('input', (event) => {
  if (event.target.matches('#searchInput')) {
    state.search = event.target.value;
    renderShop();
  }
});

const contactForm = document.querySelector('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const confirmation = document.querySelector('#contactMessage');
    if (confirmation) {
      confirmation.textContent = 'Message sent. We will reply within 1-2 business days.';
    }
    contactForm.reset();
  });
}

renderHomeSections();
renderShop();
renderFaq();
renderCollection();
renderCreatorPortal();
bindQuoteForm();
renderCart();
