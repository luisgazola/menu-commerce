export const CART_STORAGE_KEY = 'menucommerce.cart.v0.4.1';

export type CartOption = {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  additionalPrice: number;
};

export type CartItem = {
  key: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  options: CartOption[];
};

export function createCartKey(productId: string, options: CartOption[], notes: string): string {
  const optionIds = options.map((option) => option.itemId).sort().join('-');
  return `${productId}:${optionIds}:${notes.trim().toLocaleLowerCase('pt-BR')}`;
}

export function itemUnitTotal(item: Pick<CartItem, 'unitPrice' | 'options'>): number {
  return item.unitPrice + item.options.reduce((sum, option) => sum + option.additionalPrice, 0);
}

export function itemTotal(item: CartItem): number {
  return itemUnitTotal(item) * item.quantity;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + itemTotal(item), 0);
}

export function cartQuantity(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
