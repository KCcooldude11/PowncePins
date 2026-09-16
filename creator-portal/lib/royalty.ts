export type OrderSale = {
  productId: string;
  totalPrice: number;
  fulfillmentStatus?: string;
};

export type RoyaltySummary = {
  grossSales: number;
  royaltyRate: number;
  pendingRoyalty: number;
  paidRoyalty: number;
  totalPaid: number;
  totalPending: number;
};

export function calculateCreatorRoyalty({
  orders,
  royaltyRate,
}: {
  orders: OrderSale[];
  royaltyRate: number;
}): RoyaltySummary {
  const grossSales = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const totalRoyalty = grossSales * royaltyRate;

  const pendingOrders = orders.filter((order) => order.fulfillmentStatus !== "FULFILLED");
  const paidOrders = orders.filter((order) => order.fulfillmentStatus === "FULFILLED");

  const pendingRoyalty = pendingOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0) * royaltyRate;
  const paidRoyalty = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0) * royaltyRate;

  return {
    grossSales,
    royaltyRate,
    pendingRoyalty,
    paidRoyalty,
    totalPaid: paidRoyalty,
    totalPending: pendingRoyalty,
  };
}
