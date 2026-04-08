import { db } from './db';

const api = {
  get: async (url) => {
    if (url === '/products') {
      const products = await db.products.toArray();
      // Ensure unit field exists for all products
      const withUnits = products.map(p => ({ ...p, unit: p.unit || 'pcs' }));
      return { data: withUnits };
    }
    
    if (url === '/customers') {
      const customers = await db.customers.toArray();
      return { data: customers };
    }

    const customerOrdersMatch = url.match(/^\/customers\/(\d+)\/orders$/);
    if (customerOrdersMatch) {
      const customerId = parseInt(customerOrdersMatch[1]);
      const orders = await db.orders.where('customerId').equals(customerId).reverse().sortBy('saleDate');
      const result = [];
      for (let o of orders) {
        const items = await db.orderItems.where('orderId').equals(o.id).toArray();
        const itemDetails = await Promise.all(items.map(async i => {
          const product = await db.products.get(i.productId);
          return {
            productName: product ? product.name : "Unknown Product",
            quantity: i.quantitySold,
            price: i.actualSellingPrice
          };
        }));
        result.push({
          id: o.id,
          date: o.saleDate,
          totalValue: o.totalOrderValue,
          paidUpfront: o.amountPaidUpfront,
          balanceAdded: o.balanceAdded,
          items: itemDetails
        });
      }
      return { data: result };
    }

    if (url === '/reports/daily') {
      const orders = await db.orders.toArray();
      const orderItems = await db.orderItems.toArray();

      const processDate = (isoString) => isoString.split('T')[0];
      const dailyData = {};
      
      for (const order of orders) {
        const d = processDate(order.saleDate);
        if (!dailyData[d]) dailyData[d] = { date: d, revenue: 0, profit: 0, orderCount: 0 };
        
        dailyData[d].revenue += order.totalOrderValue;
        dailyData[d].orderCount += 1;
        
        const items = orderItems.filter(oi => oi.orderId === order.id);
        const orderProfit = items.reduce((sum, oi) => sum + ((oi.actualSellingPrice - oi.unitCostAtSale) * oi.quantitySold), 0);
        dailyData[d].profit += orderProfit;
      }
      
      const result = Object.values(dailyData).sort((a, b) => new Date(b.date) - new Date(a.date));
      return { data: result };
    }

    if (url === '/dashboard') {
      const products = await db.products.toArray();
      const orders = await db.orders.toArray();
      const customers = await db.customers.toArray();
      const orderItems = await db.orderItems.toArray();

      let totalInvestment = 0;
      let lowStockCount = 0;
      products.forEach(p => {
        totalInvestment += (p.purchaseCost * p.currentStock);
        if (p.currentStock <= 5) lowStockCount++;
      });
      
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalOrderValue, 0);
      const totalCredit = customers.reduce((sum, c) => sum + c.totalOutstandingBalance, 0);
      const totalProfit = orderItems.reduce((sum, oi) => sum + ((oi.actualSellingPrice - oi.unitCostAtSale) * oi.quantitySold), 0);

      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      
      const todaysOrders = orders.filter(o => new Date(o.saleDate) >= todayStart);
      const todayRevenue = todaysOrders.reduce((sum, o) => sum + o.totalOrderValue, 0);
      const todaysOrderIds = todaysOrders.map(o => o.id);
      const todaysItems = orderItems.filter(oi => todaysOrderIds.includes(oi.orderId));
      const todayProfit = todaysItems.reduce((sum, oi) => sum + ((oi.actualSellingPrice - oi.unitCostAtSale) * oi.quantitySold), 0);

      return { data: {
        totalInvestment, totalRevenue, totalProfit, totalOutstandingCredit: totalCredit,
        lowStockCount, todayRevenue, todayProfit
      }};
    }
  },

  post: async (url, data) => {
    if (url === '/products') {
      data.purchaseCost = Number(data.purchaseCost);
      data.defaultSellingPrice = Number(data.defaultSellingPrice);
      data.currentStock = Number(data.currentStock);
      data.unit = data.unit || 'pcs';
      const id = await db.products.add(data);
      return { data: { id } };
    }
    
    if (url === '/customers') {
      data.totalOutstandingBalance = Number(data.totalOutstandingBalance || 0);
      data.phone = data.phone || '';
      data.address = data.address || '';
      const id = await db.customers.add(data);
      return { data: { id } };
    }

    if (url === '/orders') {
      return await db.transaction('rw', db.products, db.orders, db.orderItems, db.customers, async () => {
        let totalValue = 0;
        let balanceAdded = 0;
        let amountPaid = Number(data.amountPaidUpfront || 0);
        let itemsToAdd = [];

        for (let item of data.items) {
          const product = await db.products.get(item.productId);
          if (!product || product.currentStock < item.quantity) throw new Error("Insufficient stock for " + (product?.name || "item"));
          
          await db.products.update(product.id, { currentStock: product.currentStock - item.quantity });
          totalValue += (Number(item.actualSellingPrice) * item.quantity);
          itemsToAdd.push({
            productId: product.id,
            quantitySold: Number(item.quantity),
            actualSellingPrice: Number(item.actualSellingPrice),
            unitCostAtSale: product.purchaseCost
          });
        }
        
        balanceAdded = Math.max(0, totalValue - amountPaid);
        const orderId = await db.orders.add({
          customerId: data.customerId,
          saleDate: new Date().toISOString(),
          totalOrderValue: totalValue,
          amountPaidUpfront: amountPaid,
          balanceAdded: balanceAdded
        });

        for (let oi of itemsToAdd) {
          oi.orderId = orderId;
          await db.orderItems.add(oi);
        }

        if (data.customerId && balanceAdded > 0) {
          const customer = await db.customers.get(data.customerId);
          await db.customers.update(data.customerId, { totalOutstandingBalance: customer.totalOutstandingBalance + balanceAdded });
        }
        return { data: { success: true, orderId } };
      });
    }

    const paymentMatch = url.match(/^\/customers\/(\d+)\/payment$/);
    if (paymentMatch) {
      const customerId = parseInt(paymentMatch[1]);
      const amount = Number(data.amount || 0);
      return await db.transaction('rw', db.customers, db.paymentLogs, async () => {
        const customer = await db.customers.get(customerId);
        if (!customer) throw new Error("Customer not found");
        await db.customers.update(customerId, { totalOutstandingBalance: customer.totalOutstandingBalance - amount });
        await db.paymentLogs.add({ customerId, paymentAmount: amount, paymentDate: new Date().toISOString(), notes: data.notes });
        return { data: { success: true } };
      });
    }

    if (url === '/factory-reset') {
      await Promise.all(db.tables.map(t => t.clear()));
      return { data: { success: true } };
    }
  },

  put: async (url, data) => {
    const productMatch = url.match(/^\/products\/(\d+)$/);
    if (productMatch) {
      const id = parseInt(productMatch[1]);
      if (data.purchaseCost !== undefined) data.purchaseCost = Number(data.purchaseCost);
      if (data.defaultSellingPrice !== undefined) data.defaultSellingPrice = Number(data.defaultSellingPrice);
      if (data.currentStock !== undefined) data.currentStock = Number(data.currentStock);
      if (data.unit === undefined) data.unit = 'pcs';
      // Remove the id from data if it exists so we don't try to update the primary key itself improperly
      const updateData = { ...data };
      delete updateData.id;
      
      await db.products.update(id, updateData);
      return { data: { success: true } };
    }
  },

  delete: async (url) => {
    const productMatch = url.match(/^\/products\/(\d+)$/);
    if (productMatch) {
      const id = parseInt(productMatch[1]);
      const hasOrders = await db.orderItems.where('productId').equals(id).count();
      if (hasOrders > 0) {
        throw { response: { data: { error: "Cannot delete product because it has past sales records." } } };
      }
      await db.products.delete(id);
      return { data: { success: true } };
    }
  }
};

export default api;
