# BizManager - Project Analysis

## 📋 Executive Summary

**BizManager** is a comprehensive business management application designed for small to medium-sized businesses. It provides inventory management, point-of-sale (POS), customer relationship management, financial reporting, and multi-user support with role-based access control.

The application is built as a **full-stack solution** with a Python/Flask backend and a React frontend that runs on desktop (via Electron), web, and mobile (via Capacitor) platforms.

---

## 🏗️ Architecture Overview

### High-Level Structure
```
BizManager/
├── Backend (Flask API)         → HTTP REST API on port 5000
├── Frontend (React + Vite)     → Web UI, packaged for desktop & mobile
└── Multi-platform:
    ├── Desktop (Electron)      → Standalone Windows app
    ├── Web                     → Browser-based
    └── Mobile (Capacitor)      → Android/iOS native apps
```

### Communication Flow
```
Frontend Client
    ↓ (HTTP REST)
Flask Backend API
    ↓ (SQLAlchemy ORM)
SQLite Database (business.db)
```

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask 3.1.1
- **ORM**: SQLAlchemy 2.0.41
- **Authentication**: Flask-JWT-Extended 4.7.1
- **Security**: bcrypt 4.3.0 (password hashing)
- **Email**: Python's smtplib (Gmail SMTP support)
- **Database**: SQLite (local file-based)
- **CORS**: Flask-CORS 5.0.1
- **Configuration**: python-dotenv 1.1.0

### Frontend
- **Framework**: React 19.2.4
- **Build Tool**: Vite
- **Routing**: react-router-dom 7.13.2
- **HTTP Client**: Axios 1.14.0
- **Local Storage**: Dexie 4.4.1 (IndexedDB wrapper)
- **UI Icons**: lucide-react 1.7.0
- **Styling**: CSS (custom, not frameworks like Bootstrap)

### Desktop/Mobile
- **Desktop**: Electron 41.1.0 (Windows packaging)
- **Mobile**: Capacitor 8.3.0 (Android & iOS)
- **Packaging**: electron-builder 26.8.1

### Development Tools
- **Code Quality**: ESLint 9.39.4
- **Version Control**: Git

---

## 📊 Database Schema

### Core Tables

#### 1. **Business**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| name | String | Business name |
| created_at | DateTime | Creation timestamp |

*Relationships*: Has many Users, Products, Customers, Orders, Invites

#### 2. **User**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| email | String | Unique, indexed |
| password_hash | String | Bcrypt hash |
| name | String | User's name |
| role | String | 'owner' or 'employee' |
| business_id | Integer | Foreign Key → Business |
| created_at | DateTime | Creation timestamp |

*Role-Based Access*:
- **Owner**: Full access (Dashboard, Reports, Inventory, Customers, POS)
- **Employee**: Limited access (Inventory, Customers, POS only)

#### 3. **Product**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| business_id | Integer | Foreign Key → Business |
| name | String | Product name, indexed |
| category | String | Product category, indexed |
| purchaseCost | Float | Cost to purchase |
| defaultSellingPrice | Float | Retail price |
| currentStock | Float | Current inventory level |
| unit | String | Unit of measurement (default: 'pcs') |

#### 4. **Customer**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| business_id | Integer | Foreign Key → Business |
| name | String | Customer name, indexed |
| phone | String | Phone number, indexed |
| address | String | Address |
| totalOutstandingBalance | Float | Credit owed by customer |

#### 5. **Order**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| business_id | Integer | Foreign Key → Business |
| customerId | Integer | Foreign Key → Customer (nullable) |
| saleDate | DateTime | When sale occurred |
| totalOrderValue | Float | Total sale amount |
| amountPaidUpfront | Float | Amount paid at time of sale |
| balanceAdded | Float | Credit extended to customer |

#### 6. **OrderItem**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| orderId | Integer | Foreign Key → Order |
| productId | Integer | Foreign Key → Product |
| quantitySold | Float | Quantity sold |
| actualSellingPrice | Float | Price charged |
| unitCostAtSale | Float | Product cost at time of sale |

#### 7. **PaymentLog**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| customerId | Integer | Foreign Key → Customer |
| paymentAmount | Float | Amount paid |
| paymentDate | DateTime | Payment date |
| notes | String | Payment notes |

#### 8. **Invite**
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Primary Key |
| code | String | Unique invite code |
| email | String | Optional: restrict to email |
| business_id | Integer | Foreign Key → Business |
| used | Boolean | Has invite been used |
| created_at | DateTime | Creation timestamp |

---

## 🔌 API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create account & business | ❌ No |
| POST | `/auth/login` | User login | ❌ No |
| GET | `/auth/me` | Get current user profile | ✅ Yes |
| POST | `/auth/invite` | Create employee invite | ✅ Yes (Owner only) |
| POST | `/auth/forgot-password` | Request password reset email | ❌ No |
| POST | `/auth/reset-password` | Reset password with token | ❌ No |

### User Management (`/api/users/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users in business | ✅ Yes (Owner only) |

### Products (`/api/products/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | List all products | ✅ Yes |
| POST | `/products` | Create new product | ✅ Yes |
| PUT | `/products/<id>` | Update product | ✅ Yes |
| DELETE | `/products/<id>` | Delete product | ✅ Yes |

### Customers (`/api/customers/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/customers` | List all customers | ✅ Yes |
| POST | `/customers` | Create new customer | ✅ Yes |
| POST | `/customers/<id>/payment` | Record payment | ✅ Yes |
| GET | `/customers/<id>/orders` | Get customer's orders | ✅ Yes |

### Orders & Sales (`/api/orders/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Create new order (POS transaction) | ✅ Yes |

### Analytics (`/api/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Dashboard KPIs & metrics | ✅ Yes (Owner only) |
| GET | `/reports/daily` | Daily sales & analytics | ✅ Yes (Owner only) |
| GET | `/reports/export` | Export data to CSV | ✅ Yes (Owner only) |

### Admin (`/api/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/factory-reset` | Clear all data (CAUTION!) | ✅ Yes (Owner only) |
| GET | `/health` | Health check | ❌ No |

---

## 🎯 Frontend Features

### Pages/Views

#### 1. **Login Page** (`Login.jsx`)
- Email and password authentication
- Registration with business setup
- Password reset flow
- Invite code entry for employees

#### 2. **Dashboard** (`Dashboard.jsx`)
- **Owner Only**: Key metrics overview
- Business KPIs
- Sales trends
- Quick stats

#### 3. **Inventory** (`Inventory.jsx`)
- Product catalog management
- Add/edit/delete products
- Stock level tracking
- Category organization
- Purchase cost & selling price management

#### 4. **Customers** (`Customers.jsx`)
- Customer directory
- Contact information (name, phone, address)
- Outstanding balance tracking
- Payment history
- Order history per customer

#### 5. **POS & Cart** (`POS.jsx`)
- Point-of-sale terminal
- Shopping cart functionality
- Product search & selection
- Quantity management
- Payment processing (full/partial)
- Order confirmation
- Works offline (Dexie IndexedDB)

#### 6. **Reports** (`Reports.jsx`)
- **Owner Only**: Sales analytics
- Daily reports
- Export to CSV
- Performance metrics

### Core Components

#### **App.jsx** - Main Application Shell
- Theme toggle (Dark/Light mode)
- Sidebar navigation
- Route protection
- Role-based view control
- User profile display

#### **AuthContext.jsx** - Authentication Management
- JWT token storage
- User session management
- Login/Register flows
- Token validation
- Auto-logout on token expiry

#### **API Module** (`api.js`)
- Axios instance with base URL
- Automatic JWT token injection
- 401 error handling (auto-redirect to login)
- CORS support

### Styling
- CSS-based (no Bootstrap/Tailwind)
- Dark/Light theme support
- Responsive design for desktop, web, and mobile
- Custom theme variables

---

## 🔐 Authentication System

### Flow Diagram
```
User Input (email, password, business name)
    ↓
POST /auth/register or /auth/login
    ↓
Backend validates → bcrypt hash check
    ↓
JWT Token generated (7-day expiry)
    ↓
Token + User data stored in localStorage
    ↓
Axios interceptor attaches token to all requests
    ↓
On 401 response → Clear token, redirect to login
```

### Security Features
- ✅ Passwords hashed with bcrypt (not plain text)
- ✅ JWT tokens with 7-day expiration
- ✅ CORS enabled for cross-origin requests
- ✅ Role-based access control (Owner/Employee)
- ✅ Password reset via email with time-limited tokens
- ✅ Email verification via SMTP (Gmail integration)

### Configuration
- `JWT_SECRET_KEY`: Hardcoded (⚠️ Should be environment variable in production)
- `JWT_ACCESS_TOKEN_EXPIRES`: 7 days
- `SMTP_HOST`: Gmail (configurable via .env)
- `FRONTEND_URL`: Used in password reset emails

---

## 🚀 Deployment & Build

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py  # Runs on http://localhost:5000
```

**Port**: 5000
**Database**: SQLite (business.db in project root)

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173 with HMR
```

### Frontend Production Builds

#### Web/Vite
```bash
npm run build  # Creates optimized dist/ folder
npm run preview  # Preview production build
```

#### Desktop (Electron) - Windows
```bash
npm run package
# Outputs to: dist_electron/frontend-win32-x64/
# Creates executable installer
```

#### Mobile (Capacitor) - Android/iOS
```bash
npm install @capacitor/cli
npx cap add android
npx cap add ios
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

### Environment Variables

**Backend** (`.env`):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=BizManager
FRONTEND_URL=http://localhost:5173
JWT_SECRET_KEY=change-this-in-production
```

**Frontend** (`.env.local` or Vite):
```
VITE_API_URL=http://localhost:5000/api
```

---

## 👥 User Roles & Permissions

### Owner
- ✅ Dashboard access
- ✅ Reports & analytics
- ✅ Inventory management
- ✅ Customer management
- ✅ POS/Sales
- ✅ Create employee invites
- ✅ User management
- ✅ Factory reset

### Employee
- ❌ Dashboard (redirected to POS)
- ❌ Reports (no access)
- ✅ Inventory view
- ✅ Customers
- ✅ POS/Sales (primary role)
- ❌ User management
- ❌ Factory reset

---

## 📁 Project Structure

```
business_manager/
├── backend/
│   ├── app.py                  # Flask app & API routes
│   ├── models.py               # SQLAlchemy models
│   ├── database.py             # DB connection & setup
│   ├── requirements.txt         # Python dependencies
│   ├── .env                    # Environment variables (local)
│   ├── .env.example            # Template for .env
│   ├── business.db             # SQLite database (generated)
│   ├── test_email.py           # Email testing script
│   └── venv/                   # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx            # App entry point
│   │   ├── App.jsx             # Main app component & routing
│   │   ├── AuthContext.jsx     # Auth state management
│   │   ├── api.js              # Axios API configuration
│   │   ├── db.js               # Dexie local database setup
│   │   ├── App.css             # Global styles
│   │   ├── index.css           # Base styles
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── POS.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Login.jsx
│   │   └── assets/             # Images, icons, etc.
│   │
│   ├── electron/
│   │   └── main.js             # Electron main process
│   │
│   ├── public/                 # Static assets
│   ├── android/                # Capacitor Android config
│   ├── dist_electron/          # Built Electron app
│   │
│   ├── package.json
│   ├── vite.config.js          # Vite build configuration
│   ├── eslint.config.js
│   ├── capacitor.config.json
│   └── README.md
│
└── .git/                       # Git repository
```

---

## 🔍 Key Observations & Insights

### Strengths ✅
1. **Clean Architecture**: Clear separation between frontend and backend
2. **Multi-platform Support**: Desktop (Electron), web, mobile (Capacitor)
3. **Role-Based Access**: Owner/Employee distinction with different UIs
4. **JWT Authentication**: Secure token-based auth
5. **Offline Support**: Dexie for offline-first data storage
6. **Email Integration**: Password reset via Gmail SMTP
7. **Database Relationships**: Proper foreign keys and relationships
8. **Scalable**: Multi-user, multi-business support (via business_id)

### Areas for Improvement ⚠️
1. **Hardcoded JWT Secret**: Should be environment variable in production
2. **SQLite Limitation**: Fine for small teams, but not ideal for concurrent users
3. **No API Documentation**: Could use Swagger/OpenAPI
4. **Minimal Error Handling**: Limited try-catch blocks
5. **No Database Migrations**: Hard to version control schema changes
6. **No Input Validation**: Backend could validate request data more rigorously
7. **No Tests**: No test suite visible
8. **Logging**: Minimal logging for debugging

### Feature Completeness 📊
- ✅ Authentication & authorization
- ✅ Multi-user support
- ✅ Inventory management
- ✅ Sales/POS
- ✅ Customer management
- ✅ Financial tracking (balance, payments)
- ✅ Reports & export
- ⚠️ Limited: Analytics (basic metrics only)
- ❌ Missing: Email notifications, SMS, payment gateway, barcode scanning

---

## 🎮 Usage Flow

### First-Time Setup
```
1. Start backend:  python backend/app.py
2. Start frontend: npm run dev
3. Navigate to: http://localhost:5173
4. Register business & owner account
5. (Optional) Create employee invites
```

### Owner Workflow
```
Dashboard → View KPIs → Manage Inventory → View Reports
                     ↓
              Manage Customers
                     ↓
              Create Invites for Employees
```

### Employee Workflow
```
Login → POS → Create Orders → Manage Customers
          ↓
      Inventory (View)
```

---

## 📈 Scalability Considerations

| Factor | Current | Recommendation |
|--------|---------|-----------------|
| Database | SQLite (file-based) | PostgreSQL/MySQL for production |
| Users | Single thread Flask | Gunicorn/uWSGI + reverse proxy |
| Concurrency | Limited | Redis for caching, background tasks |
| Data Storage | Local file | Cloud storage (AWS S3, Azure) |
| Deployment | Desktop/Local | Docker containerization |

---

## 🛡️ Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| Password hashing | ✅ Done | bcrypt used |
| JWT tokens | ✅ Done | 7-day expiry |
| CORS enabled | ✅ Done | Should restrict origins in production |
| Email verification | ⚠️ Partial | Password reset only |
| SQL injection | ✅ Safe | SQLAlchemy ORM prevents this |
| HTTPS | ❌ Missing | Should use in production |
| Rate limiting | ❌ Missing | Could prevent brute force |
| Audit logging | ❌ Missing | No activity logs |

---

## 🎯 Next Steps / Recommendations

1. **Production Readiness**
   - Replace SQLite with PostgreSQL
   - Move to Gunicorn/uWSGI
   - Enable HTTPS
   - Implement rate limiting
   - Add comprehensive logging

2. **Feature Enhancements**
   - Add barcode scanning for POS
   - Implement payment gateway integration
   - Add SMS notifications
   - Create mobile app (Capacitor build)
   - Advanced reporting & analytics

3. **Code Quality**
   - Add unit & integration tests
   - Implement API documentation (Swagger)
   - Add database migrations (Alembic)
   - Code coverage analysis
   - CI/CD pipeline (GitHub Actions)

4. **User Experience**
   - Add more detailed error messages
   - Implement notifications/toasts
   - Add user preferences
   - Improve mobile responsiveness
   - Add keyboard shortcuts

---

**Analysis Date**: May 22, 2026  
**Project Status**: Functional prototype with all core features  
**Recommended Next Phase**: Production hardening & deployment
