export const mockCreator = {
  creatorId: "creator_1001",
  name: "Maya Brooks",
  email: "maya@powncepins.com",
  productIds: ["p004", "p003"],
  royaltyRate: 0.15,
  stripeConnectAccountId: "acct_1234567890",
};

export const mockProducts = [
  {
    id: "p004",
    title: "Apple Enamel Pin",
    price: 18,
    image: "/images/apple-pin.png",
    inventory: 48,
    status: "active",
  },
  {
    id: "p003",
    title: "Salem Enamel Pin",
    price: 18,
    image: "/images/salem-pin.png",
    inventory: 22,
    status: "active",
  },
];

export const mockOrders = [
  { productId: "p004", totalPrice: 18, fulfillmentStatus: "FULFILLED" },
  { productId: "p004", totalPrice: 18, fulfillmentStatus: "IN_TRANSIT" },
  { productId: "p003", totalPrice: 18, fulfillmentStatus: "FULFILLED" },
  { productId: "p004", totalPrice: 18, fulfillmentStatus: "PENDING" },
];

export const mockPayouts = [
  { id: "po_001", amount: 30.6, status: "paid", created: "2026-09-01" },
  { id: "po_002", amount: 18.4, status: "pending", created: "2026-09-08" },
];

export const mockProduction = [
  { productId: "p004", stage: "Production", updatedAt: "2026-09-09", notes: "Sample approved and mold queued." },
  { productId: "p003", stage: "Packing", updatedAt: "2026-09-10", notes: "Packaging being prepared for fulfillment." },
];

export const mockDrops = [
  { productId: "p004", start: "2026-09-09T23:52:00Z", end: "2026-09-10T23:52:00Z" },
];

export function getMockCreatorSummary() {
  return {
    creator: mockCreator,
    products: mockProducts,
    orders: mockOrders,
    payouts: mockPayouts,
    production: mockProduction,
    drops: mockDrops,
    royalties: {
      grossSales: 72,
      pendingRoyalty: 10.8,
      paidRoyalty: 14.4,
      royaltyRate: 0.15,
    },
  };
}
