# 03 - Django & Django REST Framework Guide: SHOPNEST

This guide provides a comprehensive technical breakdown of the backend architecture in SHOPNEST, explaining how models, serializers, views, permissions, authentication, and migrations operate.

---

## 1. Project vs. App in Django

- **Django Project (`backend/backend/`)**: Represents the entire deployment configuration. It contains `settings.py` (database connections, installed apps, middleware, CORS), `urls.py` (the top-level URL dispatcher), and WSGI/ASGI application hooks.
- **Django App (`backend/store/`)**: A modular Python package dedicated to a specific business capability. In SHOPNEST, `store` manages the entire e-commerce domain: categories, products, customer carts, and orders.

---

## 2. Models & Relational Architecture (`store/models.py`)

SHOPNEST uses five core models built on top of Django's built-in `User` model.

### A. Category Model
```python
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
```
- **`unique=True`**: Prevents duplicate category names and URL slugs.
- **`slug`**: A URL-friendly version of the name (e.g., "Home & Kitchen" becomes `"home-kitchen"`).
- **`save()` method override**: Automatically generates the slug using `django.utils.text.slugify` if one is not provided.

### B. Product Model
```python
class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
- **Why `DecimalField` for price?** Never use `FloatField` for currency! Floating point numbers suffer from binary rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). `DecimalField` stores prices with exact precision.
- **Why both `image` and `image_url`?**
  - `image` enables administrators to upload real image files through Django Admin into `media/products/`.
  - `image_url` provides instant fallback for remote CDN images (such as Unsplash demonstration assets).
- **Property `is_in_stock`**:
  ```python
  @property
  def is_in_stock(self):
      return self.stock > 0 and self.is_active
  ```

### C. CartItem Model
```python
class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
```
- **`unique_together = ('user', 'product')`**: Enforces at the database level that a customer can only have one row for a given product in their cart. Adding the same product again increases `quantity` instead of creating duplicate records.
- **`on_delete=models.CASCADE`**: If a user is deleted, their cart items are automatically purged.

### D. Order & OrderItem Models
```python
class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    full_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150)
    phone_number = models.CharField(max_length=20)
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    payment_method = models.CharField(max_length=20, default='COD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```
```python
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
```
- **Historical Immutability Pattern**: Notice that `OrderItem` stores copies of `product_name` and `product_price` directly!
  - *Why?* If an administrator later renames a product from "Smartwatch v1" to "Smartwatch v2" or changes its price from ₹2,999 to ₹3,499, past customer receipts must remain immutable. Storing `product_name` and `product_price` guarantees the order receipt never changes.
  - Notice `on_delete=models.SET_NULL` on the product reference: even if a product is later deleted from the store, past order items remain preserved.

---

## 3. Serializers (`store/serializers.py`)

Serializers in DRF perform two vital tasks:
1. **Serialization**: Translating complex Django model instances and querysets into JSON payloads.
2. **Deserialization & Validation**: Parsing incoming JSON request bodies, enforcing type checks, validating rules, and creating or updating model instances.

### Password Hashing in Registration Serializer
```python
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
```
- **`User.objects.create_user()`**: Never call `User.objects.create(password=...)`! `create_user()` runs Django's cryptographic hashing algorithm (PBKDF2-SHA256 with salt), ensuring passwords are never stored in plain text.
- **`write_only=True`**: Prevents the password hash from ever being included in serialized API responses sent back to the browser.

---

## 4. API Views & Business Logic (`store/views.py`)

SHOPNEST uses function-based views decorated with `@api_view` and `@permission_classes`. This structure is straightforward, readable, and easy to explain during interviews.

### A. The Checkout View: Atomic Transactions
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_view(request):
    serializer = CheckoutSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        cart_items = CartItem.objects.filter(user=request.user).select_related('product')
        if not cart_items.exists():
            return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify stock availability
        for item in cart_items:
            if item.product.stock < item.quantity:
                return Response({
                    'error': f"Insufficient stock for {item.product.name}."
                }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Calculate server-side total
        total_amount = sum(
            (Decimal(str(item.product.price)) * item.quantity for item in cart_items),
            Decimal('0.00')
        )

        # 3. Create the Order
        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            payment_method='COD',
            **serializer.validated_data
        )

        # 4. Create OrderItems & decrement stock
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_price=item.product.price,
                quantity=item.quantity,
                subtotal=item.subtotal
            )
            item.product.stock -= item.quantity
            item.product.save(update_fields=['stock'])

        # 5. Clear customer cart
        cart_items.delete()

    return Response({'message': 'Order placed successfully!', 'order': OrderSerializer(order).data}, status=status.HTTP_201_CREATED)
```

#### Why is `with transaction.atomic():` crucial here?
An atomic transaction follows the **ACID** principle: All-or-Nothing.
If an error occurs while writing the third `OrderItem` or saving stock, the database transaction is automatically rolled back. Without this, you could end up with half an order created, stock decremented without an order, or a customer's cart emptied without their order being saved.

### B. Order Cancellation & Stock Restoration
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_cancel_view(request, pk):
    order = get_object_or_404(Order, pk=pk, user=request.user)

    if not order.can_cancel:
        return Response({
            'error': f"Order #{order.id} cannot be cancelled because status is '{order.status}'."
        }, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])

        order.status = 'Cancelled'
        order.save(update_fields=['status', 'updated_at'])

    return Response({'message': f"Order #{order.id} cancelled.", 'order': OrderSerializer(order).data})
```
- Orders can only be cancelled by the user who owns them (`user=request.user`).
- Inventory is immediately and safely returned to the available stock pool.

---

## 5. Authentication & Authorization

### How DRF TokenAuthentication Works:
1. When a user submits valid credentials to `/api/auth/login/`, Django checks the password hash.
2. If valid, Django retrieves or creates a token row in `authtoken_token`:
   ```python
   token, _ = Token.objects.get_or_create(user=user)
   ```
3. The hexadecimal token (e.g., `9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b`) is returned to React in the JSON response.
4. React saves the token in browser `localStorage`.
5. On every subsequent request, Axios attaches the header:
   ```http
   Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
   ```
6. DRF `TokenAuthentication` middleware intercepts this header, looks up the token in PostgreSQL, and sets `request.user` to the authenticated `User` instance.
7. If the token is missing or invalid on an endpoint requiring `@permission_classes([IsAuthenticated])`, DRF immediately halts execution and returns HTTP `401 Unauthorized`.

---

## 6. Django Admin Customization (`store/admin.py`)

Django's built-in administration portal (`http://localhost:8000/admin/`) is customized to give store managers full operational control:
- **`list_editable = ('price', 'stock', 'is_active')`**: Allows the store manager to update prices and stock levels directly on the product list page without clicking into individual product forms.
- **`OrderItemInline`**: Displays ordered items directly inside the parent `Order` detail page as a read-only tabular inline.
- **`list_filter`**: Provides filter sidebars for status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) and categories.
- **`search_fields`**: Enables fast search across order IDs, customer usernames, cities, and phone numbers.
