# 10 - Technical Interview Questions & Answers: SHOPNEST

This interview guide contains **42 questions and detailed answers** based directly on the actual SHOPNEST codebase. It is designed to help fresher Full Stack Python Developers confidently defend their architecture, implementation, and choices in technical interviews.

---

## Part 1: Project Architecture & System Design

### Q1: Can you give an elevator pitch of your project SHOPNEST?
**Answer:** SHOPNEST is a full-stack e-commerce web application featuring a React single-page frontend, a Django REST Framework backend, and a PostgreSQL database. It supports real-world e-commerce workflows: catalog search, category filtering, persistent database-backed carts, Cash on Delivery checkout with atomic inventory decrementing, and eligible order cancellation with automated stock restocking.

### Q2: Why did you choose a decoupled architecture (React + Django REST Framework) instead of standard Django templates?
**Answer:** A decoupled architecture provides clean separation of concerns:
1. **Frontend Independence**: React provides a fast, dynamic single-page application experience where users can filter products, adjust cart quantities, and place orders without full page reloads.
2. **Reusability**: The Django REST API is client-agnostic. The same backend endpoints can serve a web app, a mobile app (React Native / Android / iOS), or third-party integrations.
3. **Specialized Tooling**: Frontend developers can leverage modern UI bundling (Vite, npm) while backend developers focus on data models, business rules, security, and database query optimization.

### Q3: Why did you choose PostgreSQL over SQLite?
**Answer:** While SQLite is suitable for quick prototypes, it has significant limitations for production e-commerce:
1. **Concurrency**: SQLite locks the entire database file during writes, creating bottlenecks when multiple customers add items or place orders concurrently. PostgreSQL supports row-level locking.
2. **Data Types**: PostgreSQL supports native, precise `NUMERIC` types, full-text indexing, and robust constraint enforcement (such as compound unique constraints and check constraints).
3. **Production Parity**: Using PostgreSQL in development ensures behavioral consistency with production cloud databases (AWS RDS, Neon, Supabase).

### Q4: How does React communicate with Django?
**Answer:** React communicates with Django over HTTP using Axios. When the user interacts with the UI, React dispatches asynchronous JSON requests to Django REST Framework endpoints under `/api/`. For authenticated routes, Axios automatically attaches an `Authorization: Token <token_key>` header via an Axios request interceptor. Django processes the request, interacts with PostgreSQL via Django ORM, and responds with standard JSON and HTTP status codes.

### Q5: How do you handle Cross-Origin Resource Sharing (CORS)?
**Answer:** Because the React frontend runs on `http://localhost:5173` and Django runs on `http://localhost:8000`, the browser enforces the Same-Origin Policy. To permit cross-origin requests, we install `django-cors-headers`, place `corsheaders.middleware.CorsMiddleware` at the top of Django's `MIDDLEWARE` stack, and whitelist the frontend domain in `CORS_ALLOWED_ORIGINS`.

---

## Part 2: Backend, Django & Database Implementation

### Q6: How is product pricing modeled, and why did you use `DecimalField` instead of `FloatField`?
**Answer:** In `store/models.py`, prices are defined as:
```python
price = models.DecimalField(max_digits=10, decimal_places=2)
```
`FloatField` uses binary floating-point representation (IEEE 754), which causes precision loss (e.g., `0.1 + 0.2` becomes `0.30000000000000004`). In financial and e-commerce systems, rounding errors can cause accounting discrepancies. `DecimalField` uses fixed-point decimal arithmetic, ensuring calculations like `₹4999.00 * 2 = ₹9998.00` are accurate down to the cent.

### Q7: How does the application prevent frontend price manipulation?
**Answer:** The frontend never sends price amounts to the server during checkout. When placing an order, the frontend only sends customer shipping details. The backend fetches the current cart items from PostgreSQL, reads `product.price` directly from the database, and computes `total_amount = sum(item.product.price * item.quantity)`. Even if an attacker modifies client-side JavaScript or alters request payloads, the price charged is always calculated server-side.

### Q8: What is an atomic transaction and where did you use it?
**Answer:** An atomic transaction ensures that a series of database operations either all succeed or all fail together (**Atomicity** in ACID). In SHOPNEST, `@transaction.atomic` wraps the checkout process in `views.py`:
1. Verify inventory for all items.
2. Create the `Order` record.
3. Create all `OrderItem` records.
4. Decrement inventory for each `Product`.
5. Delete all items from the customer's `CartItem` table.
If any step fails (e.g., sudden power outage, network drop, or inventory shortage), PostgreSQL rolls back the entire transaction, leaving the database in a consistent state.

### Q9: What happens when an order is cancelled?
**Answer:** When a customer calls `POST /api/orders/<id>/cancel/`, the backend:
1. Validates that the order belongs to `request.user`.
2. Validates `order.can_cancel` (only allowed if status is `Pending` or `Processing`).
3. Inside `transaction.atomic()`, iterates through `order.items.all()`, adds `item.quantity` back to `item.product.stock`, and saves the product.
4. Updates `order.status = 'Cancelled'`.
This guarantees inventory is restored immediately.

### Q10: How do you prevent Customer A from accessing Customer B's cart or orders?
**Answer:** Data isolation is enforced at the database query level:
- In `cart_view`:
  ```python
  cart_items = CartItem.objects.filter(user=request.user)
  ```
- In `order_detail_view`:
  ```python
  order = get_object_or_404(Order, pk=pk, user=request.user)
  ```
Because `user=request.user` is explicitly added to the query filter, customer A's queries will never return customer B's records, returning a `404 Not Found` if an unauthorized ID is probed.

### Q11: Why does `OrderItem` duplicate `product_name` and `product_price`?
**Answer:** This follows the **Historical Immutability Pattern**. If an administrator edits a product title or updates its price in Django Admin next month, past customer orders must remain accurate to what was purchased at that specific time. Duplicating `product_name` and `product_price` directly in `OrderItem` freezes that historical snapshot.

### Q12: How does `select_related` and `prefetch_related` optimize queries?
**Answer:** Both solve the **N+1 query problem**:
- `select_related`: Used for single-valued relationships (ForeignKey or OneToOne). It performs an SQL `INNER JOIN` or `LEFT OUTER JOIN` in a single query. We use it in `cart_view` (`CartItem.objects.select_related('product', 'product__category')`).
- `prefetch_related`: Used for multi-valued relationships (ManyToMany or reverse ForeignKeys). It runs a second query with `WHERE id IN (...)` and stitches records in Python memory. We use it in `order_list_view` (`Order.objects.prefetch_related('items')`).

### Q13: What is the difference between `null=True` and `blank=True`?
**Answer:** `null=True` is database-related; it sets the column to allow `NULL` values in PostgreSQL. `blank=True` is validation-related; it allows the field to be left empty in forms and DRF serializers.

### Q14: Explain the difference between `auto_now_add` and `auto_now`.
**Answer:** `auto_now_add=True` sets the timestamp only once when the model instance is first created. `auto_now=True` updates the timestamp to the current time every time the instance is saved.

### Q15: How does Django's migration system work?
**Answer:** When you modify `models.py`, `python manage.py makemigrations` inspects the differences and generates a Python migration file containing schema operations (`CreateModel`, `AddField`, etc.). `python manage.py migrate` translates these operations into DDL SQL statements (`CREATE TABLE`, `ALTER TABLE`) and records them in the `django_migrations` table in PostgreSQL.

---

## Part 3: Authentication & Security

### Q16: How does authentication work in SHOPNEST?
**Answer:** SHOPNEST uses DRF's built-in `TokenAuthentication`:
1. When a user submits credentials to `/api/auth/login/`, Django checks the password using `authenticate()`.
2. On success, `Token.objects.get_or_create(user=user)` retrieves or generates a 40-character token.
3. The token is sent to the client and stored in `localStorage`.
4. The client includes `Authorization: Token <key>` in headers for protected routes.
5. DRF validates the token against the `authtoken_token` table on every request and assigns the corresponding `User` to `request.user`.

### Q17: How are passwords stored securely?
**Answer:** Passwords are never stored in plain text. When creating users via `User.objects.create_user()`, Django hashes the password using PBKDF2 with a SHA256 hash and a unique cryptographic salt. Even if the database is compromised, the hashes cannot be reversed without brute force.

### Q18: What is the purpose of `write_only=True` in serializers?
**Answer:** `write_only=True` ensures that sensitive fields like passwords can be accepted during incoming POST/PUT requests, but will be excluded from the outgoing JSON response.

### Q19: How does logout work in TokenAuthentication?
**Answer:** On the frontend, React removes the token from `localStorage` and resets the auth state. On the backend, `logout_view` calls `request.user.auth_token.delete()`, removing the token from the database. Any future requests with that token will return `401 Unauthorized`.

### Q20: Where are secret keys and database credentials stored?
**Answer:** They are stored in an unversioned `.env` file and loaded using `python-dotenv`. An `.env.example` template is provided in version control with placeholder values. Real secrets are never committed to Git.

---

## Part 4: Frontend & React Concepts

### Q21: What is JSX?
**Answer:** JSX (JavaScript XML) is a syntax extension for JavaScript used in React that allows you to write HTML-like markup inside JavaScript files. It is transpiled by Vite/Babel into standard `React.createElement()` calls.

### Q22: What is the Virtual DOM, and how does React use it?
**Answer:** The Virtual DOM is a lightweight in-memory representation of the real DOM. When component state changes, React updates the Virtual DOM, runs a diffing algorithm to compare it against the previous snapshot (reconciliation), and updates only the altered elements in the real browser DOM.

### Q23: Why did you use React Context instead of Redux?
**Answer:** Redux introduces significant boilerplate (actions, reducers, dispatchers, store configuration) that is often unnecessary for small-to-medium applications. React's built-in `useContext` and `useState` provide clean, lightweight global state management for session auth (`AuthContext`) and shopping cart sync (`CartContext`) without external dependencies.

### Q24: How does `useLocation` help with protected route redirects?
**Answer:** When an unauthenticated user attempts to visit `/checkout`, `<ProtectedRoute>` passes the current path via `state={{ from: location }}` when redirecting to `/login`. After successful login, `LoginPage` checks `location.state?.from?.pathname` and navigates the user back to `/checkout`, preserving their intended destination.

### Q25: What is the difference between `Link` and standard `<a>` tags in React?
**Answer:** A standard `<a href="...">` causes the browser to reload the entire HTML document and re-download assets. React Router's `<Link to="...">` intercepts the click, prevents the full browser reload, updates the URL via the HTML5 History API, and renders the matched route component client-side.

### Q26: How does SHOPNEST handle image fallbacks?
**Answer:** In `ProductCard.jsx` and `ProductDetailPage.jsx`, `<img>` elements include an `onError` handler:
```javascript
onError={(e) => {
  e.target.onerror = null;
  e.target.src = 'https://images.unsplash.com/...placeholder';
}}
```
If a product image link breaks or fails to load, it automatically falls back to a clean placeholder image, preventing broken image icons.

### Q27: How do you format currency in React?
**Answer:** Using JavaScript's built-in `Intl.NumberFormat` or `toLocaleString('en-IN')`:
```javascript
Number(product.price).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
```
This formats `1499` cleanly as `1,499.00` according to Indian numbering standards.

### Q28: How does live search work in `ProductsPage.jsx`?
**Answer:** When the user enters a search query and submits, `setSearchParams({ search: query })` updates the browser URL parameters. A `useEffect` hook listening to URL search changes triggers `fetchProducts()`, sending the query to `/api/products/?search=...`.

---

## Part 5: REST APIs & Protocols

### Q29: What makes an API "RESTful"?
**Answer:** A RESTful API adheres to six architectural constraints:
1. Client-Server separation.
2. Statelessness (every request contains all credentials needed to process it).
3. Cacheability.
4. Uniform Interface (consistent resource URIs like `/api/products/`).
5. Layered System.
6. Standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).

### Q30: What is the difference between `PUT` and `PATCH`?
**Answer:** `PUT` replaces the entire resource with the payload provided. `PATCH` applies partial updates to only the specified fields. In SHOPNEST, `cart_item_detail_view` accepts both for quantity adjustments.

### Q31: What are idempotent HTTP methods?
**Answer:** An idempotent method produces the same server state regardless of whether it is executed once or multiple times. `GET`, `PUT`, and `DELETE` are idempotent; `POST` is non-idempotent (calling `POST /api/orders/checkout/` twice would create two separate orders).

### Q32: What HTTP status codes are used in SHOPNEST?
- `200 OK`: Successful read or update (`GET`, `PUT`, `DELETE`).
- `201 Created`: Successful creation (`POST` register, checkout, add to cart).
- `400 Bad Request`: Validation failure (insufficient stock, invalid input).
- `401 Unauthorized`: Missing or invalid auth token on a protected endpoint.
- `403 Forbidden`: Authenticated user lacks permission (e.g., non-staff in Admin).
- `404 Not Found`: Resource does not exist or user doesn't have access.

---

## Part 6: Behavioral, Practical & Debugging Questions

### Q33: How do you debug an API returning 500 Internal Server Error?
**Answer:**
1. Check the backend console running `python manage.py runserver` for the full Python traceback.
2. Identify the file, function, and line where the unhandled exception was thrown.
3. Check inputs by inspecting the request payload in browser DevTools Network tab.
4. If necessary, use Python's built-in debugger (`breakpoint()`) or add logging to inspect variables.

### Q34: What challenges did you face during the development of SHOPNEST?
**Answer:**
1. **Stock Concurrency & Integrity**: Preventing race conditions where two customers attempt to buy the last remaining item. Solved by implementing `@transaction.atomic` and validating inventory limits directly on the database models.
2. **Historical Order Preservation**: If a product price or name changes later, past order receipts shouldn't change. Solved by implementing frozen snapshot fields on `OrderItem`.
3. **Cross-Origin Auth**: Managing CORS and token persistence across page refreshes. Solved by structuring a clean Axios interceptor and verifying the token on initial app mount.

### Q35: What would you improve or add to SHOPNEST next?
**Answer:**
1. **Online Payment Gateway**: Integrate Stripe or Razorpay webhooks alongside Cash on Delivery.
2. **Email Notifications**: Use Celery and Redis to send automated dispatch and delivery notification emails asynchronously in the background.
3. **Product Reviews & Ratings**: Allow customers who purchased an item to submit star ratings and verified purchase reviews.
4. **Pagination**: Implement DRF `PageNumberPagination` to paginate catalog results as the inventory scales to thousands of items.

---

## Summary Table: Quick Reference for Interviews

| Topic | Key Term | Explanation |
| :--- | :--- | :--- |
| **Pricing** | `DecimalField` | Eliminates floating-point rounding errors in currency. |
| **Checkout** | `@transaction.atomic` | Guarantees all-or-nothing execution for order creation and inventory updates. |
| **Order History** | Frozen Snapshots | `OrderItem` stores historical `product_name` and `product_price` directly. |
| **Authentication** | `TokenAuthentication` | Stateless auth where token is stored in client `localStorage` and validated in DB. |
| **Queries** | `select_related` / `prefetch_related` | Eliminates N+1 database queries. |
| **Frontend State** | React Context (`useContext`) | Manages auth and cart count globally without prop-drilling. |
| **Navigation** | `useSearchParams` / React Router | Keeps catalog search and category filtering in sync with the browser URL. |
