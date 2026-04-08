from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    purchaseCost = Column(Float, default=0.0)
    defaultSellingPrice = Column(Float, default=0.0)
    currentStock = Column(Integer, default=0)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True) # Assuming phone is unique identifier for simplicity
    address = Column(String, default="")
    totalOutstandingBalance = Column(Float, default=0.0)
    
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=True)
    saleDate = Column(DateTime, default=datetime.datetime.utcnow)
    totalOrderValue = Column(Float, default=0.0)
    amountPaidUpfront = Column(Float, default=0.0)
    balanceAdded = Column(Float, default=0.0)

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    orderId = Column(Integer, ForeignKey("orders.id"))
    productId = Column(Integer, ForeignKey("products.id"))
    quantitySold = Column(Integer, default=1)
    actualSellingPrice = Column(Float, default=0.0)
    unitCostAtSale = Column(Float, default=0.0)

class PaymentLog(Base):
    __tablename__ = "payment_logs"
    id = Column(Integer, primary_key=True, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"))
    paymentAmount = Column(Float, default=0.0)
    paymentDate = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String)
