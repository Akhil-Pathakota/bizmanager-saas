from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Business(Base):
    __tablename__ = "businesses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="business")
    products = relationship("Product", back_populates="business")
    customers = relationship("Customer", back_populates="business")
    orders = relationship("Order", back_populates="business")
    invites = relationship("Invite", back_populates="business")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="employee")  # 'owner' or 'employee'
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="users")


class Invite(Base):
    __tablename__ = "invites"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)  # Optional: restrict invite to specific email
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="invites")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    name = Column(String, index=True)
    category = Column(String, index=True)
    purchaseCost = Column(Float, default=0.0)
    defaultSellingPrice = Column(Float, default=0.0)
    currentStock = Column(Float, default=0)
    unit = Column(String, default="pcs")
    image_url = Column(String, nullable=True, default=None)

    business = relationship("Business", back_populates="products")


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    name = Column(String, index=True)
    phone = Column(String, index=True)
    address = Column(String, default="")
    totalOutstandingBalance = Column(Float, default=0.0)

    business = relationship("Business", back_populates="customers")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=True)
    saleDate = Column(DateTime, default=datetime.datetime.utcnow)
    totalOrderValue = Column(Float, default=0.0)
    amountPaidUpfront = Column(Float, default=0.0)
    balanceAdded = Column(Float, default=0.0)

    business = relationship("Business", back_populates="orders")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    orderId = Column(Integer, ForeignKey("orders.id"))
    productId = Column(Integer, ForeignKey("products.id"))
    quantitySold = Column(Float, default=1)
    actualSellingPrice = Column(Float, default=0.0)
    unitCostAtSale = Column(Float, default=0.0)


class PaymentLog(Base):
    __tablename__ = "payment_logs"
    id = Column(Integer, primary_key=True, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"))
    paymentAmount = Column(Float, default=0.0)
    paymentDate = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    name = Column(String, nullable=False)
    contact_phone = Column(String, default="")
    contact_email = Column(String, default="")
    lead_time_days = Column(Integer, default=3)

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    date_received = Column(DateTime, default=datetime.datetime.utcnow)
    invoice_number = Column(String, default="")
    total_cost = Column(Float, default=0.0)
    notes = Column(String, default="")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity_received = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)