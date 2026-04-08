from flask import Flask, jsonify, request
from flask_cors import CORS
from database import engine, SessionLocal
import models
from sqlalchemy import func
import datetime

# Create all tables in the database
models.Base.metadata.create_all(bind=engine)

app = Flask(__name__)
CORS(app)

# Helper to execute DB actions
def run_db_query(callback):
    db = SessionLocal()
    try:
        return callback(db)
    finally:
        db.close()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

# ================================
# PRODUCTS
# ================================
@app.route('/api/products', methods=['GET'])
def get_products():
    def _query(db):
        products = db.query(models.Product).all()
        return [{"id": p.id, "name": p.name, "category": p.category, 
                 "purchaseCost": p.purchaseCost, "defaultSellingPrice": p.defaultSellingPrice,
                 "currentStock": p.currentStock} for p in products]
    return jsonify(run_db_query(_query)), 200

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    def _query(db):
        product = models.Product(
            name=data['name'], category=data.get('category', ''),
            purchaseCost=float(data.get('purchaseCost', 0)),
            defaultSellingPrice=float(data.get('defaultSellingPrice', 0)),
            currentStock=int(data.get('currentStock', 0))
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return {"id": product.id}
    return jsonify(run_db_query(_query)), 201

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    data = request.json
    def _query(db):
        product = db.query(models.Product).filter(models.Product.id == id).first()
        if not product: return {"error": "Not found"}
        if 'name' in data: product.name = data['name']
        if 'category' in data: product.category = data['category']
        if 'purchaseCost' in data: product.purchaseCost = float(data['purchaseCost'])
        if 'defaultSellingPrice' in data: product.defaultSellingPrice = float(data['defaultSellingPrice'])
        if 'currentStock' in data: product.currentStock = int(data['currentStock'])
        db.commit()
        return {"success": True}
    return jsonify(run_db_query(_query)), 200

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    def _query(db):
        product = db.query(models.Product).filter(models.Product.id == id).first()
        if product:
            has_orders = db.query(models.OrderItem).filter(models.OrderItem.productId == id).first()
            if has_orders:
                raise Exception("Cannot delete product because it has past sales records.")
            db.delete(product)
            db.commit()
        return {"success": True}
    try:
        return jsonify(run_db_query(_query)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ================================
# CUSTOMERS & PAYMENTS
# ================================
@app.route('/api/customers', methods=['GET'])
def get_customers():
    def _query(db):
        customers = db.query(models.Customer).all()
        return [{"id": c.id, "name": c.name, "phone": c.phone, "address": c.address,
                 "totalOutstandingBalance": c.totalOutstandingBalance} for c in customers]
    return jsonify(run_db_query(_query)), 200

@app.route('/api/customers', methods=['POST'])
def add_customer():
    data = request.json
    def _query(db):
        customer = models.Customer(
            name=data['name'], phone=data.get('phone', ''), address=data.get('address', ''),
            totalOutstandingBalance=float(data.get('totalOutstandingBalance', 0))
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return {"id": customer.id}
    return jsonify(run_db_query(_query)), 201

@app.route('/api/customers/<int:id>/payment', methods=['POST'])
def receive_payment(id):
    data = request.json
    amount = float(data.get('amount', 0))
    notes = data.get('notes', '')
    def _query(db):
        customer = db.query(models.Customer).filter(models.Customer.id == id).first()
        if not customer: return {"error": "Not found"}
        
        customer.totalOutstandingBalance -= amount
        payment = models.PaymentLog(
            customerId=id, paymentAmount=amount, notes=notes
        )
        db.add(payment)
        db.commit()
        return {"success": True, "newBalance": customer.totalOutstandingBalance}
    return jsonify(run_db_query(_query)), 200

@app.route('/api/customers/<int:id>/orders', methods=['GET'])
def get_customer_orders(id):
    def _query(db):
        orders = db.query(models.Order).filter(models.Order.customerId == id).order_by(models.Order.saleDate.desc()).all()
        result = []
        for o in orders:
            items = db.query(models.OrderItem).filter(models.OrderItem.orderId == o.id).all()
            item_details = []
            for i in items:
                product = db.query(models.Product).filter(models.Product.id == i.productId).first()
                item_details.append({
                    "productName": product.name if product else "Unknown Product",
                    "quantity": i.quantitySold,
                    "price": i.actualSellingPrice
                })
            result.append({
                "id": o.id,
                "date": o.saleDate.isoformat(),
                "totalValue": o.totalOrderValue,
                "paidUpfront": o.amountPaidUpfront,
                "balanceAdded": o.balanceAdded,
                "items": item_details
            })
        return result
    return jsonify(run_db_query(_query)), 200

# ================================
# POS & ORDERS
# ================================
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    # Expected: { customerId: int, amountPaidUpfront: float, items: [{productId: int, quantity: int, actualSellingPrice: float}] }
    def _query(db):
        customer_id = data.get('customerId')
        amount_paid = float(data.get('amountPaidUpfront', 0))
        items = data.get('items', [])
        
        total_value = 0.0
        order_items_to_add = []
        
        for item in items:
            product = db.query(models.Product).filter(models.Product.id == item['productId']).first()
            if not product:
                return {"error": "Product not found"}
            if product.currentStock < int(item['quantity']):
                return {"error": f"Insufficient stock for {product.name}"}
            
            qty = int(item['quantity'])
            price = float(item['actualSellingPrice'])
            
            # Deduct stock
            product.currentStock -= qty
            
            total_value += (price * qty)
            order_items_to_add.append(models.OrderItem(
                productId=product.id,
                quantitySold=qty,
                actualSellingPrice=price,
                unitCostAtSale=product.purchaseCost
            ))
            
        balance_added = total_value - amount_paid
        
        # Create order
        order = models.Order(
            customerId=customer_id,
            totalOrderValue=total_value,
            amountPaidUpfront=amount_paid,
            balanceAdded=max(0, balance_added)
        )
        db.add(order)
        db.flush() # get order id
        
        # Add order items
        for oi in order_items_to_add:
            oi.orderId = order.id
            db.add(oi)
            
        # Update customer balance if applicable
        if customer_id and balance_added > 0:
            customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
            if customer:
                customer.totalOutstandingBalance += balance_added
                
        db.commit()
        return {"success": True, "orderId": order.id, "balanceAdded": balance_added}
        
    return jsonify(run_db_query(_query)), 200

# ================================
# DASHBOARD ANALYTICS
# ================================
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    def _query(db):
        # 1. Total Investment (Total value of currently stocked items)
        total_investment = db.query(func.sum(models.Product.purchaseCost * models.Product.currentStock)).scalar() or 0.0
        
        # 2. Total Revenue (Sum of all totalOrderValues)
        total_revenue = db.query(func.sum(models.Order.totalOrderValue)).scalar() or 0.0
        
        # 3. Total Outstanding Credits (Sum of customer balances)
        total_credit = db.query(func.sum(models.Customer.totalOutstandingBalance)).scalar() or 0.0
        
        # 4. Total Profit
        # Profit = Sum of (actualSellingPrice - unitCostAtSale) * quantitySold from all OrderItems
        order_items = db.query(models.OrderItem).all()
        total_profit = sum((oi.actualSellingPrice - oi.unitCostAtSale) * oi.quantitySold for oi in order_items)
        
        # 5. Low Stock Alerts (< 5 items)
        low_stock_items = db.query(models.Product).filter(models.Product.currentStock <= 5).count()
        
        # 6. Today's metrics
        today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        todays_orders = db.query(models.Order).filter(models.Order.saleDate >= today_start).all()
        today_revenue = sum(o.totalOrderValue for o in todays_orders)
        
        todays_order_ids = [o.id for o in todays_orders]
        todays_order_items = db.query(models.OrderItem).filter(models.OrderItem.orderId.in_(todays_order_ids)).all() if todays_order_ids else []
        today_profit = sum((oi.actualSellingPrice - oi.unitCostAtSale) * oi.quantitySold for oi in todays_order_items)
        
        return {
            "totalInvestment": total_investment,
            "totalRevenue": total_revenue,
            "totalProfit": total_profit,
            "totalOutstandingCredit": total_credit,
            "lowStockCount": low_stock_items,
            "todayRevenue": today_revenue,
            "todayProfit": today_profit
        }
    return jsonify(run_db_query(_query)), 200

@app.route('/api/factory-reset', methods=['POST'])
def factory_reset():
    try:
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
