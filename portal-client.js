function formatPortalCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function renderPortalSummary(summary) {
  const products = summary.products || [];
  const salesByProduct = new Map();

  (summary.royaltyDetails || []).forEach((row) => {
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
  const projectArt = document.querySelector('#projectArt');
  const projectArtPlaceholder = document.querySelector('#projectArtPlaceholder');
  const projectStatus = document.querySelector('#projectStatus');

  creatorSelect.innerHTML = products.map((product) => (
    `<option value="${product.shopify_product_id}">${product.product_title || 'Untitled product'}</option>`
  )).join('');

  const renderProduct = (productId) => {
    const product = products.find((item) => item.shopify_product_id === productId) || products[0];
    if (!product) {
      campaignName.textContent = 'No connected projects yet';
      campaignWindow.textContent = 'Your first collaboration will appear here.';
      analyticsCards.innerHTML = '';
      projectStatus.textContent = 'Not connected';
      projectArt.hidden = true;
      projectArtPlaceholder.hidden = false;
      return;
    }

    const stats = salesByProduct.get(product.shopify_product_id) || { units: 0, revenue: 0, royalty: 0 };
    campaignName.textContent = product.product_title || 'Untitled product';
    campaignWindow.textContent = `${product.status || 'Active'} · ${product.inventory_count ?? 0} in inventory`;
    projectStatus.textContent = product.status || 'Live';
    if (product.image_url) {
      projectArt.src = product.image_url;
      projectArt.alt = product.product_title || 'Creator project';
      projectArt.hidden = false;
      projectArtPlaceholder.hidden = true;
    } else {
      projectArt.hidden = true;
      projectArtPlaceholder.hidden = false;
    }
    analyticsCards.innerHTML = `
      <div class="project-metric"><span>Sales</span><strong>${formatPortalCurrency(stats.revenue)}</strong></div>
      <div class="project-metric"><span>Units sold</span><strong>${stats.units}</strong></div>
      <div class="project-metric"><span>Inventory</span><strong>${product.inventory_count ?? 0}</strong></div>
      <div class="project-metric"><span>Your royalty</span><strong>${formatPortalCurrency(stats.royalty)}</strong></div>`;
  };

  creatorSelect.addEventListener('change', () => renderProduct(creatorSelect.value));
  renderProduct(creatorSelect.value);
  document.querySelector('#grossSales').textContent = formatPortalCurrency(summary.royalties?.grossSales);
  document.querySelector('#pendingRoyalty').textContent = formatPortalCurrency(summary.royalties?.pendingRoyalty);
  document.querySelector('#paidRoyalty').textContent = formatPortalCurrency(summary.royalties?.paidRoyalty);
  document.querySelector('#productCount').textContent = String(products.length);
  document.querySelector('#portalProductList').innerHTML = products.map((product) => (
    `<li><strong>${product.product_title || 'Untitled product'}</strong> · Inventory: ${product.inventory_count ?? 0} · Status: ${product.status || 'Active'}</li>`
  )).join('') || '<li>No products are connected yet.</li>';
  document.querySelector('#productionList').innerHTML = (summary.production || []).map((entry) => (
    `<li><strong>${entry.shopify_product_id}</strong> · ${entry.stage} · ${entry.notes || entry.status || 'Updated'}</li>`
  )).join('') || '<li>No production updates yet.</li>';
  document.querySelector('#portalWelcome').textContent = `Welcome, ${summary.creator.name}`;
  document.querySelector('#portalStatus').textContent = 'Your latest sales and collaboration data from Supabase.';
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

document.querySelector('#portalLogout').addEventListener('click', async () => {
  await window.supabase.auth.signOut();
  window.location.replace('index.html');
});

window.addEventListener('load', () => loadCreatorPortal().catch(() => {
  document.querySelector('#portalStatus').textContent = 'The creator portal could not load right now.';
  document.querySelector('#creatorPortalApp').hidden = false;
}));