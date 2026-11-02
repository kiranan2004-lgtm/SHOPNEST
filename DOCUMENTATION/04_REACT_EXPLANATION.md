# 04 - React Frontend Architecture Guide: SHOPNEST

This guide explains how the SHOPNEST React 19 frontend is structured, how data flows across components, how hooks and Context APIs are utilized, and how protected routes and Axios interact with the Django backend.

---

## 1. Frontend Core Principles & Structure

SHOPNEST uses modern React functional components with clean, unidirectional data flow:
1. **Component-Based UI**: Small, focused components (e.g., `ProductCard`, `Navbar`, `LoadingSpinner`) that can be reused throughout the application.
2. **Context for Global State**: Eliminates prop-drilling for session authentication (`AuthContext`) and cart items (`CartContext`).
3. **Declarative Routing**: `react-router-dom` provides declarative routing with browser history and route protection.
4. **Axios Centralization**: All HTTP requests are made through a single configured Axios instance with automatic request and response interceptors.

---

## 2. React Hooks in SHOPNEST

### A. `useState`
`useState` manages localized component state, such as form inputs, filter dropdowns, and button loading indicators.

Example from `ProductCard.jsx`:
```javascript
const [adding, setAdding] = useState(false);
const [feedback, setFeedback] = useState('');
```
- When a user clicks "Add to Cart", `adding` is set to `true` to disable the button and show a loading indicator.
- Once the API response returns, `feedback` is set to `'Added!'` and automatically reset after 1.8 seconds using `setTimeout`.

### B. `useEffect`
`useEffect` handles side-effects, such as fetching data from the API when a component mounts or when URL query parameters change.

Example from `ProductsPage.jsx`:
```javascript
useEffect(() => {
  fetchProducts();
}, [fetchProducts]);
```
- Whenever the search query, selected category, or sort order changes in the URL, `useEffect` triggers `fetchProducts()`, keeping the view synchronized with the URL.

### C. `useContext`
`useContext` allows any child component to consume values provided by a parent Context Provider without having to pass props down through multiple layers of the component tree.

Example:
```javascript
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  // Call addToCart directly from the global context
};
```

---

## 3. Global Context Providers

### A. `AuthContext.jsx` (Session Management)
The `AuthProvider` wraps the entire application in `App.jsx`. It manages:
- `user`: Object containing `id`, `username`, `email`, `first_name`, and `is_staff`.
- `token`: The DRF authentication token string.
- `isAuthenticated`: Boolean (`!!token && !!user`).
- `loading`: Boolean indicating whether the initial session verification is in progress.
- `login(username, password)`: Sends credentials to `/api/auth/login/`, saves the token to `localStorage`, and updates the user state.
- `logout()`: Informs Django to invalidate the token, clears `localStorage`, and resets application state.

```javascript
// On application load, verify existing stored token
useEffect(() => {
  const verifyAuth = async () => {
    const storedToken = localStorage.getItem('shopnest_token');
    if (storedToken) {
      try {
        const response = await api.get('/auth/profile/');
        setUser(response.data);
      } catch (error) {
        logout(); // Token expired or invalid
      }
    }
    setLoading(false);
  };
  verifyAuth();
}, []);
```

### B. `CartContext.jsx` (Cart State & Badge Synchronization)
Maintains shopping cart synchronization between React and PostgreSQL:
- Whenever the user logs in, `fetchCart()` is automatically triggered.
- `cart.total_items` powers the badge in the navigation header.
- `addToCart(productId, quantity)` calls the backend, re-fetches the updated cart, and returns clear feedback.
- `updateQuantity(itemId, quantity)` and `removeFromCart(itemId)` update the cart without requiring a full page refresh.

---

## 4. Protected Routes (`ProtectedRoute.jsx`)

Certain views—such as `/cart`, `/checkout`, `/orders`, and `/orders/:id`—require the customer to be logged in.

```javascript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    // Redirect to /login, remembering the page they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
```

#### Why `state={{ from: location }}` matters:
When an unauthenticated user attempts to access `/checkout`, they are redirected to `/login`. Once they log in successfully, `LoginPage` checks `location.state?.from?.pathname` and sends them straight to `/checkout` instead of kicking them back to the homepage!

---

## 5. Axios Centralization & Interceptors (`api/axios.js`)

Instead of writing `axios.get('http://localhost:8000/api/...')` in every component, we configure a single central client:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Injects auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopnest_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Response Interceptor: Cleans up invalid sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('shopnest_token');
      localStorage.removeItem('shopnest_user');
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 6. Component Hierarchy

```
<App>
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Navbar />               <-- Shows brand, search input, cart badge, auth status
        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />               <-- Shows trust perks, quick links, tech badges
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
</App>
```
