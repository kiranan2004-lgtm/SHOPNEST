# 06 - Complete End-to-End User Flows: SHOPNEST

This document traces the complete lifecycle of major user workflows across the three tiers: **React (Frontend)**, **Django (REST API Backend)**, and **PostgreSQL (Database)**.

---

## 1. User Registration & Login Flow

```
+---------------+                    +----------------+                    +-----------------+
|   React SPA   |                    |   Django API   |                    |   PostgreSQL    |
+---------------+                    +----------------+                    +-----------------+
        |                                    |                                      |
        | 1. POST /api/auth/register/        |                                      |
        |    {username, email, password}     |                                      |
        |----------------------------------->|                                      |
        |                                    | 2. UserRegistrationSerializer        |
        |                                    |    validates unique username & email |
        |                                    | 3. User.objects.create_user()        |
        |                                    |    hashes password via PBKDF2        |
        |                                    |------------------------------------->| INSERT INTO auth_user
        |                                    | 4. Token.objects.create(user)        |
        |                                    |------------------------------------->| INSERT INTO authtoken_token
        | 5. JSON Response:                  |                                      |
        |    {token, user: {id, username}}   |                                      |
        |<-----------------------------------|                                      |
        |                                    |                                      |
        | 6. React saves token in            |                                      |
        |    localStorage.setItem()          |                                      |
        |    and updates AuthContext         |                                      |
```

1. **User Action**: The customer fills out `RegisterPage.jsx` and clicks "Register Account".
2. **React**: Validates that passwords match and sends `POST /api/auth/register/` using Axios.
3. **Django**:
   - `UserRegistrationSerializer` checks that the username and email are not taken.
   - `User.objects.create_user()` runs PBKDF2 password hashing.
   - `Token.objects.create(user=user)` generates a 40-character hexadecimal token.
4. **PostgreSQL**: Stores the user row in `auth_user` and the token in `authtoken_token`.
5. **Session**: React receives `{ token: "...", user: {...} }` and persists it in `localStorage`. All future Axios requests include `Authorization: Token <key>`.

---

## 2. Product Catalog, Search & Filter Flow

1. **User Action**: The user visits `/products?category=electronics&search=headphone&sort=price_low`.
2. **React**:
   - `ProductsPage.jsx` extracts query parameters via `useSearchParams()`.
   - Sends `GET /api/products/?category=electronics&search=headphone&sort=price_low`.
3. **Django**:
   - `product_list_view` receives `request.GET`.
   - Builds query:
     ```python
     products = Product.objects.filter(is_active=True)
     products = products.filter(name__icontains='headphone')
     products = products.filter(category__slug='electronics')
     products = products.order_by('price')
     ```
4. **PostgreSQL**: Runs an optimized SQL query with `ILIKE` and `ORDER BY price ASC`.
5. **React**: Renders the filtered results in a responsive grid of `ProductCard` components.

---

## 3. Add to Cart & Cart Update Flow

```
+---------------+                    +----------------+                    +-----------------+
|   React SPA   |                    |   Django API   |                    |   PostgreSQL    |
+---------------+                    +----------------+                    +-----------------+
        |                                    |                                      |
        | 1. POST /api/cart/add/             |                                      |
        |    {product_id: 1, quantity: 2}    |                                      |
        |    Header: Authorization: Token... |                                      |
        |----------------------------------->|                                      |
        |                                    | 2. Check token -> request.user       |
        |                                    | 3. AddToCartSerializer validates:    |
        |                                    |    - Product exists and is active    |
        |                                    |    - quantity <= product.stock       |
        |                                    | 4. CartItem.objects.get_or_create(  |
        |                                    |       user=request.user,             |
        |                                    |       product=product                |
        |                                    |    )                                 |
        |                                    |------------------------------------->| SELECT/INSERT/UPDATE
        |                                    |                                      | into store_cartitem
        | 5. HTTP 201 Created:               |                                      |
        |    {message: "Added to cart"}      |                                      |
        |<-----------------------------------|                                      |
        |                                    |                                      |
        | 6. React CartContext re-fetches    |                                      |
        |    GET /api/cart/                  |                                      |
        | 7. Updates cart badge count        |                                      |
```

1. **User Action**: The user clicks "Add to Cart" on a product card or product detail page.
2. **React**: Verifies authentication; if unauthenticated, redirects to `/login`. If authenticated, calls `addToCart(product.id, quantity)`.
3. **Django**:
   - Checks that the requested quantity does not exceed available warehouse stock (`product.stock`).
   - Uses `get_or_create` on `(user, product)`: if the row already exists, it increments `quantity`; otherwise, it inserts a new `CartItem`.
4. **PostgreSQL**: Updates or inserts the row in `store_cartitem`.
5. **React State**: `CartContext` updates `cart.total_items`, and the badge in the navigation header instantly increments.

---

## 4. Cash on Delivery Checkout & Order Creation Flow

```
+---------------+                    +----------------+                    +-----------------+
|   React SPA   |                    |   Django API   |                    |   PostgreSQL    |
+---------------+                    +----------------+                    +-----------------+
        |                                    |                                      |
        | 1. POST /api/orders/checkout/      |                                      |
        |    {full_name, phone, address...}  |                                      |
        |----------------------------------->|                                      |
        |                                    | 2. BEGIN TRANSACTION                 |
        |                                    | 3. Fetch user's CartItems            |
        |                                    | 4. Verify stock for EVERY item       |
        |                                    | 5. Calculate total server-side:      |
        |                                    |    sum(price * quantity)             |
        |                                    | 6. INSERT INTO store_order           |
        |                                    |------------------------------------->|
        |                                    | 7. INSERT INTO store_orderitem       |
        |                                    |    (freeze product name & price)     |
        |                                    |------------------------------------->|
        |                                    | 8. UPDATE store_product              |
        |                                    |    SET stock = stock - quantity      |
        |                                    |------------------------------------->|
        |                                    | 9. DELETE FROM store_cartitem        |
        |                                    |    WHERE user_id = request.user.id   |
        |                                    |------------------------------------->|
        |                                    | 10. COMMIT TRANSACTION               |
        | 11. HTTP 201 Created:              |                                      |
        |     {order: {id: 42, total: 4999}} |                                      |
        |<-----------------------------------|                                      |
        |                                    |                                      |
        | 12. React clears cart state        |                                      |
        | 13. Redirects to /orders/42 with   |                                      |
        |     "Order Placed" confirmation    |                                      |
```

1. **User Action**: The customer enters their delivery details on `/checkout` and clicks "Confirm Order with Cash on Delivery".
2. **React**: Validates input formats and posts to `/api/orders/checkout/`.
3. **Django (Atomic Transaction)**:
   - Locks and verifies stock for all cart items.
   - Computes the true order total directly from database product prices (preventing price tampering).
   - Inserts `Order` record with status `Pending` and payment method `COD`.
   - Inserts `OrderItem` rows with frozen product names and prices.
   - Decrements stock from each purchased `Product`.
   - Clears the user's `CartItem` rows.
   - Commits transaction.
4. **PostgreSQL**: All database changes are committed atomically.
5. **Confirmation**: React redirects to `/orders/:id`, showing a confirmation banner with full receipt details.

---

## 5. Order Cancellation Flow

1. **User Action**: The customer visits `/orders` or `/orders/:id` and clicks "Cancel This Order".
2. **Eligibility Check**:
   - If the order status is `Pending` or `Processing`, the order is eligible for cancellation (`can_cancel === true`).
   - If the order has already progressed to `Shipped` or `Delivered`, cancellation is rejected.
3. **Django Execution**:
   - `order_cancel_view` runs inside `@transaction.atomic`.
   - Iterates over `order.items.all()`.
   - For every item with an active product, restores stock:
     ```python
     item.product.stock += item.quantity
     item.product.save(update_fields=['stock'])
     ```
   - Sets `order.status = 'Cancelled'`.
   - Commits the transaction.
4. **React**: Immediately updates the status badge to red `Cancelled` and disables further cancellation actions.

---

## 6. Admin Management Flow (Django Admin)

1. The store administrator navigates to `http://localhost:8000/admin/`.
2. Logs in using your created superuser credentials (via `python manage.py createsuperuser`).
3. Administrative operations:
   - **Manage Inventory**: Edit stock numbers and prices inline.
   - **Fulfill Orders**: Open incoming orders, inspect delivery addresses, and advance order status from `Pending` → `Processing` → `Shipped` → `Delivered`.
   - **Add Products**: Upload real product photos and assign them to categories.
4. When the admin marks an order as `Shipped`, the customer's `/orders` view automatically reflects the `Shipped` badge, and the "Cancel" button is automatically disabled.
