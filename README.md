# SHOPNEST — Full-Stack E-Commerce Platform

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=flat&logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Backend-Django%20REST%20Framework-092e20?style=flat&logo=django)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Build%20Tool-Vite-646cff?style=flat&logo=vite)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SHOPNEST** is a production-grade, full-stack e-commerce web application engineered with a **React 19** single-page frontend, a **Django REST Framework** backend, and a **PostgreSQL** relational database.

Built to enterprise standards, SHOPNEST implements server-side price calculation, atomic inventory decrements, database-level user isolation, persistent shopping carts, Cash on Delivery (COD) checkout, and automated inventory restoration upon order cancellation.

---

## Architecture Overview

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|                                                                         |
|   React SPA (Vite: http://localhost:5173)                               |
|   - React Router DOM v7 (Client-side routing & route guards)           |
|   - React Context API (AuthContext, CartContext)                        |
|   - Modern Nested CSS Design System (Warm neutral / Charcoal / Forest)  |
+------------------------------------^------------------------------------+
                                     |
                       JSON REST API Calls over HTTP
                       Header: Authorization: Token <key>
                                     |
+------------------------------------v------------------------------------+
|                         DJANGO REST API BACKEND                         |
|                       (http://localhost:8000/api/)                      |
|                                                                         |
|   - Django REST Framework (Serializers, Permissions, ViewSets)          |
|   - DRF TokenAuthentication & PBKDF2 Password Hashing                   |
|   - Atomic Database Transactions (@transaction.atomic)                  |
|   - Server-side price calculation & stock level validation              |
|   - Static file serving via WhiteNoise                                  |
+------------------------------------^------------------------------------+
                                     |
                             Django ORM Queries
                             (PostgreSQL Connection over Port 5432)
                                     |
+------------------------------------v------------------------------------+
|                          POSTGRESQL DATABASE                            |
|                            (DB: ecommerce)                              |
|                                                                         |
|   - store_category, store_product                                       |
|   - store_cartitem (Unique constraint on [user, product])               |
|   - store_order, store_orderitem (Frozen historical prices)             |
|   - auth_user, authtoken_token                                          |
+-------------------------------------------------------------------------+
```

---

## Core Features

### Customer Experience
- **Interactive Home Showcase**: Clean typography-based branding (`SHOPNEST.`), multi-category showcase, trust badges, and featured products loaded dynamically from the API.
- **Product Discovery & Search**: Full-text keyword search, category-based filtering, and price sorting (Low to High, High to Low, Newest).
- **Product Detail Pages**: Dynamic inventory status pills (`In Stock`, `Only X left`, `Out of Stock`), quantity selector, and category metadata.
- **Persistent Shopping Cart**: Database-backed cart tied to customer accounts; synchronizes real-time item counts with the navigation badge.
- **Cash on Delivery Checkout**: Delivery address capture with client & server-side validation and Cash on Delivery (COD) order placement.
- **Order Tracking & Details**: Status indicators (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) with complete price breakdowns.
- **Order Cancellation**: Customers can cancel eligible pending orders; product stock is automatically restored to the database.
- **Secure Authentication**: Customer registration, login, and logout powered by Django PBKDF2 password hashing and DRF Token Authentication.

### Administrative Management (Django Admin)
- Secure management interface at `http://localhost:8000/admin/`.
- Manage products, categories, stock levels, and upload images.
- Inline order item inspection and status progression (`Pending` &rarr; `Processing` &rarr; `Shipped` &rarr; `Delivered`).
- Strict permission controls preventing regular customers from accessing administrative views.

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, JavaScript (ES6+), Vite | SPA architecture with React Router DOM v7 and Context API |
| **Styling** | Modern Nested CSS | Clean retail typography, responsive grid & flexbox |
| **Backend** | Python 3.13, Django 6.x, Django REST Framework | Token authentication, ViewSets, serializers, atomic transactions |
| **Database** | PostgreSQL | Relational database with foreign keys, unique constraints, and indexes |
| **Production WSGI** | Gunicorn & WhiteNoise | Production WSGI server and compressed static file handling |
| **HTTP Client** | Axios | Interceptors for automated token injection and 401 handling |

---

## Project Structure

```
ECOMMERCE_PROJECT/
├── backend/
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py         # Production-ready Django configuration
│   │   ├── urls.py             # Root URL router
│   │   └── wsgi.py             # WSGI entry point for Gunicorn
│   ├── store/
│   │   ├── admin.py            # Custom Django Admin configuration
│   │   ├── models.py           # Category, Product, CartItem, Order, OrderItem
│   │   ├── serializers.py      # DRF serializers with validation
│   │   ├── urls.py             # Store API routing
│   │   ├── views.py            # API ViewSets & atomic checkout logic
│   │   └── tests.py            # 12 automated unit & integration tests
│   ├── build.sh                # Automated build script for Render
│   ├── manage.py
│   ├── requirements.txt        # Python dependencies
│   ├── test_workflow.py        # 15-step end-to-end integration test
│   └── .env.example            # Backend environment template
├── frontend/
│   ├── public/
│   │   ├── _redirects          # Netlify SPA redirect rule
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/axios.js        # Central Axios instance with baseURL env var
│   │   ├── components/         # Navbar, Footer, ProductCard, LoadingSpinner, ProtectedRoute
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/              # Home, Products, ProductDetail, Cart, Checkout, Orders, Login, Register
│   │   ├── App.jsx             # React Router route definitions
│   │   ├── index.css           # Nested CSS design system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example            # Frontend environment template
├── DOCUMENTATION/              # 11 comprehensive technical documentation guides
├── .gitignore                  # Excludes .env, node_modules, pycache, dist, media
├── LICENSE                     # MIT License
└── README.md
```

---

## Local Setup & Development

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is installed and running:
```powershell
psql -U postgres -c "CREATE DATABASE ecommerce;"
```

### 2. Backend Setup
Open **Terminal 1**:
```powershell
cd backend

# Copy environment variables template
cp .env.example .env
# Edit .env with your local PostgreSQL password

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create administrator account
python manage.py createsuperuser

# Seed sample categories and products
python manage.py load_sample_data

# Start Django development server
python manage.py runserver 8000
```
- API Base URL: `http://localhost:8000/api/`
- Django Admin: `http://localhost:8000/admin/`

### 3. Frontend Setup
Open **Terminal 2**:
```powershell
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Application: `http://localhost:5173/`

---

## Automated Testing & Verification

SHOPNEST includes both unit and end-to-end integration tests:

```powershell
cd backend

# Run Django test suite (12 tests)
python manage.py test store

# Run complete 15-step end-to-end workflow verification
python test_workflow.py
```

---

## Deployment Guide

### A. Deploy Backend to Render

1. Create a free account at [render.com](https://render.com).
2. **Create PostgreSQL Database on Render**:
   - Click **New** &rarr; **PostgreSQL**.
   - Name: `shopnest-db`.
   - Copy the **Internal Database URL** (or External URL).
3. **Create Web Service on Render**:
   - Click **New** &rarr; **Web Service**.
   - Connect your GitHub repository (`kiranan2004-lgtm/SHOPNEST`).
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`)
   - **Start Command**: `gunicorn backend.wsgi:application`
4. **Set Environment Variables in Render**:
   - `DATABASE_URL`: *(Your Render PostgreSQL database connection string)*
   - `SECRET_KEY`: *(A strong random secret key)*
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*` (or your Render service domain)
   - `CORS_ALLOWED_ORIGINS`: `https://your-netlify-app.netlify.app`
5. Click **Deploy Web Service**. Once deployed, copy your backend URL (e.g., `https://shopnest-backend.onrender.com`).
6. In the Render Shell tab, run:
   ```bash
   python manage.py load_sample_data
   python manage.py createsuperuser
   ```

### B. Deploy Frontend to Netlify

1. Create a free account at [netlify.com](https://netlify.com).
2. Click **Add new site** &rarr; **Import an existing project** &rarr; **GitHub**.
3. Select your repository: `kiranan2004-lgtm/SHOPNEST`.
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. In **Environment variables**, add:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api` (use your actual Render backend URL)
6. Click **Deploy site**.
7. Once your Netlify URL is generated (e.g. `https://shopnest-kiranan.netlify.app`), update the `CORS_ALLOWED_ORIGINS` environment variable in your Render backend settings to match it.

---

## Technical Documentation Suite

For comprehensive deep dives and interview preparation, consult the [`DOCUMENTATION/`](./DOCUMENTATION/) directory:

- [**01_PROJECT_OVERVIEW.md**](./DOCUMENTATION/01_PROJECT_OVERVIEW.md) — System architecture, technology choices, and business requirements.
- [**02_PROJECT_STRUCTURE.md**](./DOCUMENTATION/02_PROJECT_STRUCTURE.md) — File-by-file directory breakdown and responsibilities.
- [**03_DJANGO_EXPLANATION.md**](./DOCUMENTATION/03_DJANGO_EXPLANATION.md) — Models, serializers, atomic transactions, and stock validation.
- [**04_REACT_EXPLANATION.md**](./DOCUMENTATION/04_REACT_EXPLANATION.md) — Component architecture, hooks, contexts, and routing.
- [**05_POSTGRESQL_EXPLANATION.md**](./DOCUMENTATION/05_POSTGRESQL_EXPLANATION.md) — ER diagrams, schemas, foreign keys, and indexes.
- [**06_COMPLETE_USER_FLOWS.md**](./DOCUMENTATION/06_COMPLETE_USER_FLOWS.md) — End-to-end request/response execution traces.
- [**07_API_DOCUMENTATION.md**](./DOCUMENTATION/07_API_DOCUMENTATION.md) — REST API endpoint catalog with sample request/response payloads.
- [**08_SETUP_AND_RUN.md**](./DOCUMENTATION/08_SETUP_AND_RUN.md) — Step-by-step installation and local execution guide.
- [**09_COMMON_ERRORS.md**](./DOCUMENTATION/09_COMMON_ERRORS.md) — Diagnostic and resolution guide for CORS, database, and build issues.
- [**10_INTERVIEW_PREPARATION.md**](./DOCUMENTATION/10_INTERVIEW_PREPARATION.md) — 42 technical interview questions and structured answers.
- [**11_PROJECT_REVISION_GUIDE.md**](./DOCUMENTATION/11_PROJECT_REVISION_GUIDE.md) — 2-minute project pitch and technical cheat sheet.

---

## Author

**Kiran A N**
- GitHub: [@kiranan2004-lgtm](https://github.com/kiranan2004-lgtm)
- Repository: [SHOPNEST](https://github.com/kiranan2004-lgtm/SHOPNEST)

---

## License

This project is licensed under the [MIT License](LICENSE).
