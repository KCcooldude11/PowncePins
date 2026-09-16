function formatPortalCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function renderPortalSummary(summary) {
  const products = summary.products || [];
  const royalties = summary.royaltyDetails || [];
  const salesByProduct = new Map();

  royalties.forEach((row) => {
    const current = salesByProduct.get(row.shopify_product_id) || { units: 0, revenue: 0, royalty: 0 };
    current.units += Number(row.units_sold || 0);
    current.revenue += Number(row.revenue || 0);
    current.royalty += Number(row.royalty_amount || 0);
    salesByProduct.set(row.shopify_product_id, current);
  });

  const creatorSelect = document.querySelector('#creatorSelect');
  const campaignName = document.querySelector('#campaignName');
  const campaignWindow = document.querySelector('#campaignWindow');
  const analyticsCards = document.querySelector('#analyticsCards');
  const trendBars = document.querySelector('#trendBars');
  const requests = document.querySelector('#bringBackRequests');
  const productList = document.querySelector('#portalProductList');

  creatorSelect.innerHTML = products.map((product) => (
    `<option value="${product.shopify_product_id}">${product.product_title || 'Untitled product'}</option>`
  )).join('');

  const renderProduct = (productId) => {
    const product = products.find((item) => item.shopify_product_id === productId) || products[0];
    if (!product) return;
    const stats = salesByProduct.get(product.shopify_product_id) || { units: 0, revenue: 0, royalty: 0 };
    campaignName.textContent = product.product_title || 'Untitled product';
    campaignWindow.textContent = `${product.status || 'Active'} · ${product.inventory_count ?? 0} in inventory`;
    analyticsCards.innerHTML = `
      <article class="panel analytic-card"><p class="metric-label">Units Sold</p><h3>${stats.units}</h3></article>
      <article class="panel analytic-card"><p class="metric-label">Gross Sales</p><h3>${formatPortalCurrency(stats.revenue)}</h3></article>
      <article class="panel analytic-card"><p class="metric-label">Your Royalty</p><h3>${formatPortalCurrency(stats.royalty)}</h3></article>`;
    trendBars.innerHTML = '<p class="request-empty">Sales trend data will appear as orders are recorded.</p>';
  };

  creatorSelect.addEventListener('change', () => renderProduct(creatorSelect.value));
  renderProduct(creatorSelect.value);
  requests.innerHTML = '<p class="request-empty">No bring-back requests are connected to the creator dashboard yet.</p>';
  productList.innerHTML = products.map((product) => (
    `<li><strong>${product.product_title || 'Untitled product'}</strong> - Inventory: ${product.inventory_count ?? 0} - Status: ${product.status || 'Active'}</li>`
  )).join('') || '<li>No products are connected yet.</li>';
  document.querySelector('#portalStatus').textContent = `Welcome, ${summary.creator.name}. Data is loaded from Supabase.`;
  document.querySelector('#creatorPortalApp').hidden = false;
}

async function loadCreatorPortal() {
  const status = document.querySelector('#portalStatus');
  const sessionResult = await window.supabase.auth.getSession();
  const session = sessionResult.data.session;
  if (!session) {
    window.location.replace('login-signup.html');
    return;
  }

  const response = await fetch('/api/creator/summary', {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    status.textContent = 'Creator access has not been configured for this account.';
    document.querySelector('#creatorPortalApp').hidden = false;
    return;
  }

  renderPortalSummary(await response.json());
}

window.addEventListener('load', () => loadCreatorPortal().catch(() => {
  document.querySelector('#portalStatus').textContent = 'The creator portal could not load right now.';
  document.querySelector('#creatorPortalApp').hidden = false;
}));