# 01 - Project Overview: SHOPNEST

## 1. What is SHOPNEST?

**SHOPNEST** is a production-grade, full-stack e-commerce web application engineered with a **React** single-page application (SPA) frontend, a **Django REST Framework (DRF)** backend, and a **PostgreSQL** relational database.

The platform provides a complete customer shopping experience centered around realistic, dependable e-commerce operations with **Cash on Delivery (COD)** as the primary payment model.

---

## 2. Why was SHOPNEST Developed?

Many fresher developer portfolio projects rely on toy mockups, static hardcoded JSON, or fragile frontend-only state that falls apart during a real live demonstration.

SHOPNEST was developed with specific professional goals in mind:
1. **Real Architectural Separation**: Clear decoupled architecture where a React frontend communicates via authenticated REST APIs with a secure Django backend.
2. **Server-Side Data Integrity**: Product prices, order totals, and stock limits are calculated and strictly enforced on the server. The backend never trusts numbers sent by the client.
3. **Database Consistency & Concurrency**: Critical checkout workflows execute inside atomic database transactions (`@transaction.atomic`), ensuring that stock decrementing, order item creation, and cart clearance succeed as a single unit or safely rollback.
4. **Data Isolation**: Strict customer data isolation ensuring users can only view and mutate their own cart items and historical orders.
5. **Interview Ready**: Built with clean, readable code and clear patterns that a fresher developer can demonstrate and defend in technical interviews.

---

## 3. Technology Stack

| Layer | Technology | Version / Tooling | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | 19.x (Vite build tool) | Dynamic, component-driven user interface |
| **Routing** | React Router DOM | v7.x | Client-side page navigation & route protection |
| **HTTP Client** | Axios | 1.x | REST API calls with auth interceptors |
| **State Management** | React Context API | `AuthContext`, `CartContext` | Global session and shopping cart state |
| **Styling** | Modern Vanilla CSS | CSS variables, Flexbox, Grid | Clean, responsive UI with zero bloated UI libraries |
| **Backend** | Python & Django | Python 3.13 / Django 6.x | Robust web framework, ORM, and admin portal |
| **API Layer** | Django REST Framework | DRF 3.18.x | RESTful API endpoints, serializers, and permissions |
| **Authentication** | DRF Token Authentication | `rest_framework.authtoken` | Token-based stateless authentication |
| **Database** | PostgreSQL | PostgreSQL 16+ | Enterprise relational database |
| **Database Driver** | Psycopg2-binary | 2.9.x | High-performance Python-PostgreSQL adapter |

---

## 4. Main Application Features

### A. Customer Features
- **Hero & Curated Showcase**: Dynamic homepage featuring categories, top-rated products, and trust badges.
- **Customer Authentication**: Secure registration and login with PBKDF2 password hashing and token issuance.
- **Product Catalog**:
  - Live full-text search across product titles and descriptions.
  - Category-based filtering (Electronics, Fashion, Home & Kitchen, Books, Sports).
  - Price sorting (Newest, Price: Low to High, Price: High to Low).
- **Product Detail Experience**: Real-time stock status badges, dynamic quantity steppers, and clear price breakdowns.
- **Shopping Cart**:
  - Persistent user cart stored in PostgreSQL.
  - Instant quantity updates bounded by real-time inventory limits.
  - Single-item removal and one-click cart clearing.
  - Backend-calculated subtotals and totals.
- **Cash on Delivery Checkout**:
  - Complete customer contact and shipping address capture.
  - Validation ensuring phone numbers, names, and postal codes are sound.
  - Explicit Cash on Delivery designation (no fake card transactions).
- **Order Management & Cancellation**:
  - View all personal past orders with live status badges.
  - Detailed itemized receipt with locked historical prices.
  - **Eligible Cancellation**: Cancel orders currently in `Pending` or `Processing` status; product inventory is automatically restocked into the database.

### B. Administrative Features (Django Admin)
- Full administrative management at `/admin/`.
- Manage categories, add new products, and upload product imagery.
- Inline order item inspection and live status progression (`Pending` → `Processing` → `Shipped` → `Delivered` → `Cancelled`).
- Staff-only security isolation ensuring regular customers cannot access the administrative dashboard.

---

## 5. How Frontend, Backend, and Database Communicate

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|                                                                         |
|   React SPA (Vite Dev Server: http://localhost:5173)                   |
|   - React Router dispatches URLs (/products, /cart, /checkout, etc.)   |
|   - React Context maintains session token & cart item count             |
+------------------------------------^------------------------------------+
                                     |
                                JSON HTTP Requests / Responses
                                Header: Authorization: Token <key>
                                CORS Headers Enabled
                                     |
+------------------------------------v------------------------------------+
|                         DJANGO REST API BACKEND                         |
|                       (http://localhost:8000/api/)                      |
|                                                                         |
|   1. CORS Middleware & Security Check                                   |
|   2. TokenAuthentication validates Token from Authorization header      |
|   3. URL Dispatcher routes to API View (views.py)                       |
|   4. DRF Serializers validate request payloads                          |
|   5. Business logic verifies stock, calculates prices server-side       |
|   6. Atomic transactions (@transaction.atomic) coordinate updates        |
+------------------------------------^------------------------------------+
                                     |
                             Django ORM Queries
                             (SQL over TCP Port 5432)
                                     |
+------------------------------------v------------------------------------+
|                          POSTGRESQL DATABASE                            |
|                            (DB: ecommerce)                              |
|                                                                         |
|   - auth_user & authtoken_token                                         |
|   - store_category & store_product                                      |
|   - store_cartitem (Unique constraint on [user_id, product_id])         |
|   - store_order & store_orderitem (Frozen historical prices)            |
+-------------------------------------------------------------------------+
```

1. **User interacts with React UI**: The user adds an item or places an order.
2. **Axios Interceptor**: Axios reads the auth token from browser `localStorage` and appends `Authorization: Token <key>` to the HTTP request headers.
3. **Django REST Framework**:
   - `CorsMiddleware` checks that the origin `http://localhost:5173` is permitted.
   - `TokenAuthentication` queries the `authtoken_token` table in PostgreSQL to find the associated `auth_user`.
   - The view executes server-side validation and wraps critical mutations in an atomic transaction.
4. **PostgreSQL Execution**:
   - Django ORM translates Python queries into SQL statements executed on PostgreSQL.
   - The database updates rows and returns status.
5. **JSON Response**:
   - DRF serializes Python model objects into JSON.
   - React receives the JSON response and updates component state via `useState` / `useContext`.
