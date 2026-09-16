import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProjectSelector from "./ProjectSelector";

async function getSummary() {
  const token = (await cookies()).get("creator_session")?.value;

  if (!token) {
    redirect("/login");
  }

  const res = await fetch("/api/creator/summary", {
    headers: { Cookie: `creator_session=${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  return res.json();
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const summary = await getSummary().catch(() => null);
  const connectedProjects = (summary?.products ?? []).map((product: any) => ({
    id: product.shopify_product_id,
    title: product.product_title || "Untitled project",
    image: product.image_url || "",
    sales: formatCurrency(getProjectSales(summary?.royaltyDetails, product.shopify_product_id)),
    unitsSold: String(getProjectUnits(summary?.royaltyDetails, product.shopify_product_id)),
    inventory: String(product.inventory_count ?? 0),
    royalty: formatCurrency(getProjectRoyalty(summary?.royaltyDetails, product.shopify_product_id)),
    dropStatus: product.status || "Connected",
    connected: true,
  }));

  return (
    <main className="portal-shell" style={{ padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <span className="portal-badge">Creator Dashboard</span>
            <h1 style={{ marginTop: 14, fontSize: "clamp(2.2rem, 5vw, 4rem)", color: "#1a1a1f" }}>Welcome, {session.name}</h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="portal-btn">Log out</button>
          </form>
        </header>

        <ProjectSelector connectedProjects={connectedProjects} />

        <section style={{ marginBottom: 28 }}>
          <div className="portal-stat-grid">
            <Card title="Gross Sales" value={summary?.royalties?.grossSales ? `$${summary.royalties.grossSales.toFixed(2)}` : "$0.00"} />
            <Card title="Pending Royalty" value={summary?.royalties?.pendingRoyalty ? `$${summary.royalties.pendingRoyalty.toFixed(2)}` : "$0.00"} />
            <Card title="Paid Royalty" value={summary?.royalties?.paidRoyalty ? `$${summary.royalties.paidRoyalty.toFixed(2)}` : "$0.00"} />
            <Card title="Products" value={String(summary?.products?.length ?? 0)} />
          </div>
        </section>

        <section className="portal-panel" style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 16 }}>Your products</h2>
          <ul className="portal-list">
            {(summary?.products ?? []).map((product: any) => (
              <li key={product.shopify_product_id || product.id}>
                <strong>{product.product_title}</strong> — Inventory: {product.inventory_count} — Status: {product.status}
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-panel">
          <h2 style={{ marginBottom: 16 }}>Recent production + fulfillment</h2>
          <ul className="portal-list">
            {(summary?.production ?? []).map((entry: any, index: number) => (
              <li key={`${entry.shopify_product_id || entry.productId || "production"}-${index}`}>
                <strong>{entry.shopify_product_id || entry.productId}</strong> — {entry.stage} — {entry.notes}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="portal-stat">
      <div className="portal-stat-label">{title}</div>
      <div className="portal-stat-value">{value}</div>
    </div>
  );
}

function getProjectSales(rows: any[] | undefined, productId: string) {
  return (rows ?? [])
    .filter((row) => row.shopify_product_id === productId)
    .reduce((total, row) => total + Number(row.revenue || 0), 0);
}

function getProjectUnits(rows: any[] | undefined, productId: string) {
  return (rows ?? [])
    .filter((row) => row.shopify_product_id === productId)
    .reduce((total, row) => total + Number(row.units_sold || 0), 0);
}

function getProjectRoyalty(rows: any[] | undefined, productId: string) {
  return (rows ?? [])
    .filter((row) => row.shopify_product_id === productId)
    .reduce((total, row) => total + Number(row.royalty_amount || 0), 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
