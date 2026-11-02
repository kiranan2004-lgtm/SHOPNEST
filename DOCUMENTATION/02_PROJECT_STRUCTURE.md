# 02 - Project Structure: SHOPNEST

Below is the complete architectural layout of the **SHOPNEST** repository.

```
ECOMMERCE_PROJECT/
│
├── .gitignore                   # Root Git ignore rules (Python, Django, Node, envs)
├── README.md                    # Project overview, installation, and demonstration guide
│
├── DOCUMENTATION/               # Comprehensive developer and interview study guides
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_PROJECT_STRUCTURE.md
│   ├── 03_DJANGO_EXPLANATION.md
│   ├── 04_REACT_EXPLANATION.md
│   ├── 05_POSTGRESQL_EXPLANATION.md
│   ├── 06_COMPLETE_USER_FLOWS.md
│   ├── 07_API_DOCUMENTATION.md
│   ├── 08_SETUP_AND_RUN.md
│   ├── 09_COMMON_ERRORS.md
│   ├── 10_INTERVIEW_PREPARATION.md
│   └── 11_PROJECT_REVISION_GUIDE.md
│
├── backend/                     # Django REST Framework Backend
│   ├── manage.py                # Django CLI management entry point
│   ├── requirements.txt         # Pinned Python package dependencies
│   ├── .env                     # Local environment variables (DB credentials, secret key)
│   ├── .env.example             # Template for environment configuration
│   ├── test_workflow.py         # 15-step end-to-end automated verification script
│   │
│   ├── backend/                 # Django Project Configuration Directory
│   │   ├── __init__.py          # Marks folder as Python package
│   │   ├── settings.py          # Central Django configuration (DB, CORS, DRF, Media)
│   │   ├── urls.py              # Root routing table (routes /admin/ and /api/)
│   │   ├── asgi.py              # ASGI interface for asynchronous web servers
│   │   └── wsgi.py              # WSGI interface for standard production web servers
│   │
│   └── store/                   # Core E-Commerce Django Application
│       ├── __init__.py
│       ├── apps.py              # Application registry metadata
│       ├── models.py            # Relational database models (Category, Product, CartItem, Order, OrderItem)
│       ├── serializers.py       # DRF serializers for request validation and JSON transformation
│       ├── views.py             # API controllers (Auth, Catalog, Cart, Checkout, Order cancellation)
│       ├── urls.py              # API endpoint URL patterns (/api/auth/..., /api/products/..., etc.)
│       ├── admin.py             # Django Admin registration with customized filters, search, and inlines
│       ├── tests.py             # Automated unit and integration test suite
│       │
│       ├── migrations/          # Database schema migration files
│       │   ├── __init__.py
│       │   └── 0001_initial.py  # Initial schema migration applied to PostgreSQL
│       │
│       └── management/          # Custom Django management commands
│           ├── __init__.py
│           └── commands/
│               ├── __init__.py
│               └── load_sample_data.py  # Command: python manage.py load_sample_data
│
└── frontend/                    # React 19 Frontend (Vite)
    ├── package.json             # NPM package manifest (scripts and dependencies)
    ├── package-lock.json        # Deterministic lockfile for NPM dependencies
    ├── vite.config.js           # Vite development server and bundling configuration
    ├── index.html               # Main HTML entry point (font imports, viewport, root element)
    │
    ├── public/                  # Public static assets
    │   ├── favicon.svg          # Browser tab icon
    │   └── icons.svg            # SVG symbols
    │
    └── src/                     # React Application Source Code
        ├── main.jsx             # React root renderer (mounts <App /> into DOM #root)
        ├── App.jsx              # Central router configuration, layout shell, scroll-to-top
        ├── index.css            # Complete SHOPNEST design system, CSS variables, and responsive layout
        ├── App.css              # Application layout container utilities
        │
        ├── api/                 # API Client
        │   └── axios.js         # Central Axios instance with base URL & auth token interceptor
        │
        ├── context/             # Global React State Management
        │   ├── AuthContext.jsx  # Authentication state, login, registration, logout, session restore
        │   └── CartContext.jsx  # Shopping cart state, live item count, totals, cart CRUD actions
        │
        ├── components/          # Reusable UI Components
        │   ├── Navbar.jsx       # Header navigation, brand logo, search bar, cart badge, auth menu
        │   ├── Footer.jsx       # Global footer, trust badges, quick links, category shortcuts
        │   ├── ProductCard.jsx  # Product catalog item card (badges, image, price, Add to Cart)
        │   ├── LoadingSpinner.jsx # Accessible animated loading indicator
        │   ├── ErrorMessage.jsx # Standardized error alert with optional retry action
        │   └── ProtectedRoute.jsx # Route guard redirecting unauthenticated users to /login
        │
        └── pages/               # Application Route Views
            ├── HomePage.jsx         # Landing page with hero banner, categories, featured products, COD banner
            ├── ProductsPage.jsx     # Catalog with search, category filtering, and price sorting
            ├── ProductDetailPage.jsx# Product overview, gallery image, quantity stepper, stock check
            ├── CartPage.jsx         # Interactive cart item manager, subtotals, order summary
            ├── CheckoutPage.jsx     # Shipping information capture and Cash on Delivery placement
            ├── OrdersPage.jsx       # Customer order history with live status and cancellation triggers
            ├── OrderDetailsPage.jsx # Itemized order receipt, delivery details, and cancellation button
            ├── LoginPage.jsx        # Customer sign-in with password toggle and demo admin hint
            ├── RegisterPage.jsx     # Customer account registration with client/server validation
            └── NotFoundPage.jsx     # User-friendly 404 page with navigation links
```

---

## Where to Find Important Functionality

| What are you looking for? | File Location | Important Function / Model |
| :--- | :--- | :--- |
| **Database Models** | `backend/store/models.py` | `Category`, `Product`, `CartItem`, `Order`, `OrderItem` |
| **Atomic Checkout Logic** | `backend/store/views.py` | `checkout_view()` |
| **Order Cancellation** | `backend/store/views.py` | `order_cancel_view()` |
| **Input Validation** | `backend/store/serializers.py` | `CheckoutSerializer`, `UserRegistrationSerializer` |
| **Backend URL Routing** | `backend/store/urls.py` | REST patterns mapped to views |
| **Admin Portal Setup** | `backend/store/admin.py` | `ProductAdmin`, `OrderAdmin`, `OrderItemInline` |
| **Automated Backend Tests** | `backend/store/tests.py` | `ShopnestAPITests` |
| **Sample Data Seeder** | `backend/store/management/commands/load_sample_data.py` | `Command.handle()` |
| **Axios Token Interceptor** | `frontend/src/api/axios.js` | `api.interceptors.request.use()` |
| **Auth Context (Login/Token)** | `frontend/src/context/AuthContext.jsx` | `login()`, `register()`, `logout()` |
| **Cart Context (Totals)** | `frontend/src/context/CartContext.jsx` | `addToCart()`, `updateQuantity()` |
| **Protected Route Guard** | `frontend/src/components/ProtectedRoute.jsx` | `<ProtectedRoute>` |
| **Complete Design System** | `frontend/src/index.css` | CSS variables, Flexbox & Grid layouts |
