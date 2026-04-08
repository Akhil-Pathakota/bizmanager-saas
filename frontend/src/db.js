import Dexie from 'dexie';

// Create a new Dexie database instance
// This completely replaces the Python SQLite database
export const db = new Dexie('BusinessManagerDB');

// Version 1: Original schema
db.version(1).stores({
  products: '++id, name, category, purchaseCost, defaultSellingPrice, currentStock',
  customers: '++id, name, phone, address, totalOutstandingBalance',
  orders: '++id, customerId, saleDate, totalOrderValue, amountPaidUpfront, balanceAdded',
  orderItems: '++id, orderId, productId, quantitySold, actualSellingPrice, unitCostAtSale',
  paymentLogs: '++id, customerId, paymentAmount, paymentDate, notes'
});

// Version 2: Add unit field to products
db.version(2).stores({
  products: '++id, name, category, purchaseCost, defaultSellingPrice, currentStock, unit',
  customers: '++id, name, phone, address, totalOutstandingBalance',
  orders: '++id, customerId, saleDate, totalOrderValue, amountPaidUpfront, balanceAdded',
  orderItems: '++id, orderId, productId, quantitySold, actualSellingPrice, unitCostAtSale',
  paymentLogs: '++id, customerId, paymentAmount, paymentDate, notes'
}).upgrade(tx => {
  // Set default unit for existing products
  return tx.table('products').toCollection().modify(product => {
    if (!product.unit) {
      product.unit = 'pcs';
    }
  });
});
