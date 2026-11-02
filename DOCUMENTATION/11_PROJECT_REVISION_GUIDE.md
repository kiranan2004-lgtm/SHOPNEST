# 11 - Project Revision & Cheat Sheet: SHOPNEST

Use this quick-reference guide to refresh your understanding of the project before an interview or demonstration.

---

## The 2-Minute Elevator Pitch

> "SHOPNEST is a full-stack e-commerce application built with a React frontend, a Django REST Framework backend, and a PostgreSQL database. It features dynamic product exploration with category filtering, full-text search, and price sorting.
>
> On the backend, we enforce strict data integrity: prices and stock checks are calculated server-side, and checkout operations execute inside atomic database transactions (`@transaction.atomic`). This ensures product inventory is safely decremented and carts are cleared in an all-or-nothing operation.
>
> Authentication uses token-based authentication with PBKDF2 password hashing. In the frontend, React Context manages session state and real-time cart badge counts, while protected routes guard access to checkout, cart, and order history.
>
> The application supports Cash on Delivery as the payment method, and customers can cancel pending orders in one click, which automatically restores reserved stock in the database. Product catalog and orders are managed through a customized Django Admin portal."

---

## Top 5 Files to Review Before an Interview

1. **`backend/store/models.py`**:
   - `Category`, `Product`, `CartItem`, `Order`, `OrderItem`.
   - Review `DecimalField`, `unique_together`, `on_delete=models.SET_NULL`, and `@property can_cancel`.
2. **`backend/store/views.py`**:
   - `checkout_view`: Atomic transaction, stock validation, server-side pricing.
   - `order_cancel_view`: Stock restoration logic.
   - `cart_view` & `cart_item_detail_view`: Cart CRUD operations.
3. **`backend/store/serializers.py`**:
   - `UserRegistrationSerializer`: `create_user` password hashing.
   - `ProductSerializer`, `OrderSerializer`, `CheckoutSerializer`.
4. **`frontend/src/context/AuthContext.jsx` & `CartContext.jsx`**:
   - Token lifecycle, session restoration on mount, global cart item count.
5. **`frontend/src/api/axios.js`**:
   - Request interceptor attaching `Authorization: Token <key>`.

---

## Important Endpoints & Status Codes

| Endpoint | Method | Status Code | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/auth/register/` | `POST` | `201 Created` | Create new customer, issue auth token |
| `/api/auth/login/` | `POST` | `200 OK` | Authenticate customer, return auth token |
| `/api/products/` | `GET` | `200 OK` | Browse products (search, filter, sort) |
| `/api/cart/` | `GET` | `200 OK` | Fetch user's cart and backend totals |
| `/api/cart/add/` | `POST` | `200 OK / 201 Created` | Add item or increment quantity |
| `/api/orders/checkout/` | `POST` | `201 Created` | Atomic Cash on Delivery checkout |
| `/api/orders/` | `GET` | `200 OK` | User order history (isolated per user) |
| `/api/orders/<id>/cancel/` | `POST` | `200 OK` | Cancel eligible order & restore stock |

---

## Key Django Patterns Used

- **`@transaction.atomic`**: Wraps checkout and cancellation so database mutations either fully commit or fully roll back.
- **`select_related`**: Optimizes single-valued ForeignKeys with SQL joins.
- **`prefetch_related`**: Optimizes multi-valued reverse ForeignKeys (e.g. orders and their items).
- **`get_object_or_404(..., user=request.user)`**: Enforces strict customer data isolation.
- **`User.objects.create_user()`**: Applies PBKDF2 cryptographic password hashing.

---

## Key React Patterns Used

- **`useContext`**: Supplies auth session and cart count across all components without prop-drilling.
- **`useSearchParams`**: Synchronizes category filters, search input, and sorting order directly with the browser URL.
- **`<ProtectedRoute>`**: Guards routes by checking auth state and passing `location` for smart redirects after login.
- **Axios Interceptors**: Injects `Authorization: Token <key>` into outgoing request headers.
- **Image Fallbacks**: `onError` fallback preventing broken image icons in the UI.

---

## 30-Second Debugging Checklist

- **Can't connect to PostgreSQL?** Check if PostgreSQL service is running (`Get-Service postgresql*`) and verify password in `backend/.env`.
- **CORS error in browser console?** Verify `corsheaders.middleware.CorsMiddleware` is at the top of `MIDDLEWARE` in `settings.py` and `http://localhost:5173` is listed in `CORS_ALLOWED_ORIGINS`.
- **401 Unauthorized?** Check DevTools Application tab → Local Storage → verify `shopnest_token` exists.
- **Missing frontend packages?** Run `npm install` inside the `frontend` directory.
