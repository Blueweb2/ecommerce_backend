export type CartLineItem = {
  price: number;
  quantity: number;
  gstPercentage?: number;
  gstAmount?: number;
};

export const calculateCartTotals = (items: CartLineItem[]) => {
  return items.reduce(
    (acc, item) => {
      const unitGst =
        (Number(item.price) * (Number(item.gstPercentage) || 0)) / 100;

      item.gstAmount = unitGst;

      return {
        totalPrice: acc.totalPrice + item.price * item.quantity,
        totalGstAmount: acc.totalGstAmount + unitGst * item.quantity,
        totalQuantity: acc.totalQuantity + item.quantity,
      };
    },
    { totalPrice: 0, totalGstAmount: 0, totalQuantity: 0 }
  );
};
