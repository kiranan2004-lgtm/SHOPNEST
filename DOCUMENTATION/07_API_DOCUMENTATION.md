# 07 - REST API Specification: SHOPNEST

Base URL for all API requests: `http://localhost:8000/api`

---

## 1. Authentication Endpoints

### A. Register New User
- **Endpoint**: `/auth/register/`
- **Method**: `POST`
- **Purpose**: Registers a new customer and returns an authentication token.
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "StrongPassword123!"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "message": "Account created successfully.",
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
    "user": {
      "id": 2,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_staff": false
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Username or email already in use, or password too short.

---

### B. User Login
- **Endpoint**: `/auth/login/`
- **Method**: `POST`
- **Purpose**: Authenticates a user with username (or email) and password.
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "password": "StrongPassword123!"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Login successful.",
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
    "user": {
      "id": 2,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_staff": false
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Missing fields or invalid credentials.

---

### C. User Logout
- **Endpoint**: `/auth/logout/`
- **Method**: `POST`
- **Purpose**: Deletes the user's active token from the database.
- **Authentication**: `Token <key>` (Required)
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Logged out successfully."
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: Missing or invalid auth header.

---

### D. Current User Profile
- **Endpoint**: `/auth/profile/`
- **Method**: `GET`
- **Purpose**: Returns the authenticated user's profile.
- **Authentication**: `Token <key>` (Required)
- **Success Response (`200 OK`)**:
  ```json
  {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_staff": false
  }
  ```

---

## 2. Catalog & Products Endpoints

### A. List Categories
- **Endpoint**: `/categories/`
- **Method**: `GET`
- **Purpose**: Retrieves all active product categories.
- **Authentication**: None (Public)
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Latest gadgets and gear.",
      "products_count": 4
    }
  ]
  ```

---

### B. List Products (Search & Filter)
- **Endpoint**: `/products/`
- **Method**: `GET`
- **Query Parameters**:
  - `search` (optional): Full-text search in name and description.
  - `category` (optional): Category slug or ID.
  - `sort` (optional): `price_low`, `price_high`, or `newest`.
- **Authentication**: None (Public)
- **Example URL**: `/api/products/?category=electronics&sort=price_low`
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "category": 1,
      "category_name": "Electronics",
      "category_slug": "electronics",
      "name": "AeroSound Pro Wireless Headphones",
      "slug": "aerosound-pro-wireless-headphones",
      "description": "Active noise cancelling...",
      "price": "4999.00",
      "stock": 25,
      "image": null,
      "image_url": "https://images.unsplash.com/...",
      "display_image": "https://images.unsplash.com/...",
      "is_active": true,
      "is_in_stock": true,
      "created_at": "2026-11-02T14:00:00Z"
    }
  ]
  ```

---

### C. Featured Products
- **Endpoint**: `/products/featured/`
- **Method**: `GET`
- **Purpose**: Retrieves top 8 in-stock products for the homepage showcase.
- **Authentication**: None (Public)

---

### D. Product Details
- **Endpoint**: `/products/<id>/`
- **Method**: `GET`
- **Purpose**: Retrieves full product record by ID.
- **Authentication**: None (Public)
- **Error Codes**:
  - `404 Not Found`: If product does not exist or `is_active=False`.

---

## 3. Shopping Cart Endpoints (Authenticated)

### A. View Cart
- **Endpoint**: `/cart/`
- **Method**: `GET`
- **Purpose**: Returns current customer's cart items and computed totals.
- **Authentication**: `Token <key>` (Required)
- **Success Response (`200 OK`)**:
  ```json
  {
    "items": [
      {
        "id": 10,
        "product": {
          "id": 1,
          "name": "AeroSound Pro Wireless Headphones",
          "price": "4999.00",
          "display_image": "https://...",
          "stock": 25
        },
        "quantity": 2,
        "subtotal": "9998.00",
        "created_at": "2026-11-02T14:15:00Z"
      }
    ],
    "total_items": 2,
    "total_amount": "9998.00"
  }
  ```

---

### B. Add to Cart
- **Endpoint**: `/cart/add/`
- **Method**: `POST`
- **Authentication**: `Token <key>` (Required)
- **Request Body**:
  ```json
  {
    "product_id": 1,
    "quantity": 1
  }
  ```
- **Success Response (`200 OK` or `201 Created`)**:
  ```json
  {
    "message": "Added 'AeroSound Pro Wireless Headphones' to cart.",
    "item": { "id": 10, "quantity": 1, "subtotal": "4999.00" }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: If requested quantity exceeds warehouse stock.

---

### C. Update Cart Item Quantity
- **Endpoint**: `/cart/items/<id>/`
- **Method**: `PUT` or `PATCH`
- **Authentication**: `Token <key>` (Required)
- **Request Body**:
  ```json
  {
    "quantity": 3
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Cart item updated.",
    "item": { "id": 10, "quantity": 3, "subtotal": "14997.00" }
  }
  ```

---

### D. Remove Item from Cart
- **Endpoint**: `/cart/items/<id>/`
- **Method**: `DELETE`
- **Authentication**: `Token <key>` (Required)
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Removed 'AeroSound Pro Wireless Headphones' from cart."
  }
  ```

---

### E. Clear Entire Cart
- **Endpoint**: `/cart/clear/`
- **Method**: `DELETE`
- **Authentication**: `Token <key>` (Required)
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Cart cleared."
  }
  ```

---

## 4. Checkout & Order Endpoints (Authenticated)

### A. Place Order (Cash on Delivery)
- **Endpoint**: `/orders/checkout/`
- **Method**: `POST`
- **Purpose**: Atomically converts cart into a confirmed order, decrements stock, and empties cart.
- **Authentication**: `Token <key>` (Required)
- **Request Body**:
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "9876543210",
    "shipping_address": "Flat 402, Green Meadows",
    "city": "Bengaluru",
    "postal_code": "560001",
    "payment_method": "COD"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "message": "Order placed successfully! Cash on Delivery will be collected upon delivery.",
    "order": {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "9876543210",
      "shipping_address": "Flat 402, Green Meadows",
      "city": "Bengaluru",
      "postal_code": "560001",
      "payment_method": "COD",
      "status": "Pending",
      "total_amount": "4999.00",
      "can_cancel": true,
      "items_count": 1,
      "items": [
        {
          "id": 1,
          "product": 1,
          "product_name": "AeroSound Pro Wireless Headphones",
          "product_price": "4999.00",
          "quantity": 1,
          "subtotal": "4999.00"
        }
      ],
      "created_at": "2026-11-02T14:30:00Z"
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Cart is empty, stock is insufficient, or missing shipping fields.

---

### B. List User Orders
- **Endpoint**: `/orders/`
- **Method**: `GET`
- **Purpose**: Returns all orders belonging strictly to the logged-in user.
- **Authentication**: `Token <key>` (Required)

---

### C. Order Details
- **Endpoint**: `/orders/<id>/`
- **Method**: `GET`
- **Purpose**: Returns full order receipt.
- **Authentication**: `Token <key>` (Required)
- **Error Codes**:
  - `404 Not Found`: If order does not exist or belongs to another user.

---

### D. Cancel Order
- **Endpoint**: `/orders/<id>/cancel/`
- **Method**: `POST`
- **Purpose**: Cancels order if still in `Pending` or `Processing` status; restocks items back into inventory.
- **Authentication**: `Token <key>` (Required)
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Order #1 has been cancelled and product stock has been restored.",
    "order": {
      "id": 1,
      "status": "Cancelled",
      "can_cancel": false
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: If order is already `Shipped` or `Delivered`.
