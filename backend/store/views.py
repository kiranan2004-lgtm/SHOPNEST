from decimal import Decimal
from django.db import transaction
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Category, Product, CartItem, Order, OrderItem
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    CategorySerializer,
    ProductSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
    OrderSerializer,
    CheckoutSerializer,
)


# ==============================================================================
# AUTHENTICATION VIEWS
# ==============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new customer account.
    Returns the created user and a DRF authentication token.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'Account created successfully.',
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user by username and password.
    Returns DRF authentication token and user profile on success.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Allow login with either username or email
    user = None
    if '@' in username:
        try:
            matched_user = User.objects.get(email__iexact=username)
            user = authenticate(username=matched_user.username, password=password)
        except User.DoesNotExist:
            user = None
    else:
        user = authenticate(username=username, password=password)

    if user is not None:
        if not user.is_active:
            return Response(
                {'error': 'This account has been disabled.'},
                status=status.HTTP_403_FORBIDDEN
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'Login successful.',
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    return Response(
        {'error': 'Invalid username or password.'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Invalidate the current user's authentication token.
    """
    try:
        request.user.auth_token.delete()
    except (AttributeError, Token.DoesNotExist):
        pass
    return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Get current authenticated user profile details.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ==============================================================================
# CATALOG VIEWS (CATEGORIES & PRODUCTS)
# ==============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list_view(request):
    """
    List all product categories.
    """
    categories = Category.objects.all().order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_list_view(request):
    """
    List active products with optional search, category filter, and price sorting.
    Query params:
      - search: string to search in product name and description
      - category: category slug or id
      - sort: 'price_low', 'price_high', 'newest'
    """
    products = Product.objects.filter(is_active=True).select_related('category')

    # 1. Search filter
    search_query = request.GET.get('search', '').strip()
    if search_query:
        products = products.filter(name__icontains=search_query) | products.filter(description__icontains=search_query)

    # 2. Category filter
    category_param = request.GET.get('category', '').strip()
    if category_param:
        if category_param.isdigit():
            products = products.filter(category_id=int(category_param))
        else:
            products = products.filter(category__slug=category_param)

    # 3. Sorting
    sort_param = request.GET.get('sort', 'newest')
    if sort_param == 'price_low':
        products = products.order_by('price')
    elif sort_param == 'price_high':
        products = products.order_by('-price')
    elif sort_param == 'newest':
        products = products.order_by('-created_at')
    else:
        products = products.order_by('-created_at')

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def featured_products_view(request):
    """
    Get top 8 featured active products for the homepage.
    """
    products = Product.objects.filter(is_active=True, stock__gt=0).select_related('category')[:8]
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail_view(request, pk):
    """
    Get details of a single product by ID.
    """
    product = get_object_or_404(Product, pk=pk, is_active=True)
    serializer = ProductSerializer(product)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ==============================================================================
# SHOPPING CART VIEWS (AUTHENTICATED)
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    """
    Retrieve current customer's shopping cart.
    Calculates subtotal and total purely on the backend.
    """
    cart_items = CartItem.objects.filter(user=request.user).select_related('product', 'product__category')
    total_amount = sum((item.subtotal for item in cart_items), Decimal('0.00'))
    total_items = sum((item.quantity for item in cart_items), 0)

    serializer = CartItemSerializer(cart_items, many=True)
    return Response({
        'items': serializer.data,
        'total_items': total_items,
        'total_amount': str(total_amount),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart_view(request):
    """
    Add a product to the authenticated user's cart or increment quantity.
    Enforces product stock availability.
    """
    serializer = AddToCartSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    product = serializer.validated_data['product']
    quantity = serializer.validated_data['quantity']

    cart_item, created = CartItem.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={'quantity': quantity}
    )

    if not created:
        new_quantity = cart_item.quantity + quantity
        if new_quantity > product.stock:
            return Response({
                'error': f"Cannot add {quantity} more. Only {product.stock} units in stock and you already have {cart_item.quantity} in cart."
            }, status=status.HTTP_400_BAD_REQUEST)
        cart_item.quantity = new_quantity
        cart_item.save()

    return Response({
        'message': f"Added '{product.name}' to cart.",
        'item': CartItemSerializer(cart_item).data
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart_item_detail_view(request, pk):
    """
    Update quantity or remove a specific cart item.
    Enforces stock limit and user ownership.
    """
    cart_item = get_object_or_404(CartItem, pk=pk, user=request.user)

    if request.method == 'DELETE':
        product_name = cart_item.product.name
        cart_item.delete()
        return Response({
            'message': f"Removed '{product_name}' from cart."
        }, status=status.HTTP_200_OK)

    # PUT or PATCH: update quantity
    serializer = UpdateCartItemSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    quantity = serializer.validated_data['quantity']
    if quantity > cart_item.product.stock:
        return Response({
            'error': f"Only {cart_item.product.stock} units available in stock."
        }, status=status.HTTP_400_BAD_REQUEST)

    cart_item.quantity = quantity
    cart_item.save()

    return Response({
        'message': 'Cart item updated.',
        'item': CartItemSerializer(cart_item).data
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart_view(request):
    """
    Remove all items from current user's cart.
    """
    CartItem.objects.filter(user=request.user).delete()
    return Response({'message': 'Cart cleared.'}, status=status.HTTP_200_OK)


# ==============================================================================
# CHECKOUT & ORDER VIEWS (AUTHENTICATED)
# ==============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_view(request):
    """
    Convert the customer's current cart into a confirmed Cash on Delivery order.
    Uses atomic database transaction:
      1. Validates shipping address and contact inputs.
      2. Ensures cart is not empty.
      3. Verifies stock availability for every single item.
      4. Computes total server-side (never trusts frontend price values).
      5. Decrements inventory for each ordered product.
      6. Creates immutable Order and OrderItem records.
      7. Clears user's cart upon success.
    """
    serializer = CheckoutSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Fetch cart items
        cart_items = CartItem.objects.filter(user=request.user).select_related('product')
        if not cart_items.exists():
            return Response(
                {'error': 'Your cart is empty. Add products before checking out.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Check stock for all items first
        for item in cart_items:
            product = item.product
            if not product.is_active or product.stock < item.quantity:
                return Response({
                    'error': f"Insufficient stock for '{product.name}'. Available: {product.stock}, in your cart: {item.quantity}."
                }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Calculate total server-side
        total_amount = sum(
            (Decimal(str(item.product.price)) * item.quantity for item in cart_items),
            Decimal('0.00')
        )

        # 3. Create Order
        validated = serializer.validated_data
        order = Order.objects.create(
            user=request.user,
            full_name=validated['full_name'],
            email=validated['email'],
            phone_number=validated['phone_number'],
            shipping_address=validated['shipping_address'],
            city=validated['city'],
            postal_code=validated['postal_code'],
            payment_method='COD',
            status='Pending',
            total_amount=total_amount
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
            # Decrement inventory
            item.product.stock -= item.quantity
            item.product.save(update_fields=['stock'])

        # 5. Clear the user's cart
        cart_items.delete()

    return Response({
        'message': 'Order placed successfully! Cash on Delivery will be collected upon delivery.',
        'order': OrderSerializer(order).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list_view(request):
    """
    List past orders belonging ONLY to the authenticated customer.
    Enforces user data isolation.
    """
    orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail_view(request, pk):
    """
    Retrieve details of a specific order belonging to the authenticated customer.
    Staff members can view any order.
    """
    if request.user.is_staff:
        order = get_object_or_404(Order.objects.prefetch_related('items'), pk=pk)
    else:
        order = get_object_or_404(Order.objects.prefetch_related('items'), pk=pk, user=request.user)

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_cancel_view(request, pk):
    """
    Cancel an order if it is in an eligible status ('Pending' or 'Processing').
    Restores product stock atomically.
    """
    order = get_object_or_404(Order, pk=pk, user=request.user)

    if not order.can_cancel:
        return Response({
            'error': f"Order #{order.id} cannot be cancelled because its current status is '{order.status}'."
        }, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Restore stock for each item in the order
        for item in order.items.all():
            if item.product is not None:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])

        order.status = 'Cancelled'
        order.save(update_fields=['status', 'updated_at'])

    return Response({
        'message': f"Order #{order.id} has been cancelled and product stock has been restored.",
        'order': OrderSerializer(order).data
    }, status=status.HTTP_200_OK)
