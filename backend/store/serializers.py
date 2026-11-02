from rest_framework import serializers
from django.contrib.auth.models import User
from decimal import Decimal
from .models import Category, Product, CartItem, Order, OrderItem


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for customer registration.
    Enforces password hashing via User.objects.create_user.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        # Uses Django's built-in create_user which automatically hashes passwords
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer to return authenticated user details.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for product categories.
    """
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'products_count']


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for products including stock status and computed image URL.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    display_image = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'category_slug',
            'name',
            'slug',
            'description',
            'price',
            'stock',
            'image',
            'image_url',
            'display_image',
            'is_active',
            'is_in_stock',
            'created_at',
            'updated_at',
        ]


class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer for reading cart items with nested product summary.
    """
    product = ProductSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'subtotal', 'created_at']


class AddToCartSerializer(serializers.Serializer):
    """
    Serializer to validate adding an item to the shopping cart.
    """
    product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate(self, attrs):
        product_id = attrs.get('product_id')
        quantity = attrs.get('quantity')
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "Product not found or unavailable."})

        if product.stock <= 0:
            raise serializers.ValidationError({"stock": "Product is currently out of stock."})

        if quantity > product.stock:
            raise serializers.ValidationError({
                "quantity": f"Only {product.stock} units available in stock."
            })

        attrs['product'] = product
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """
    Serializer to update cart item quantity.
    """
    quantity = serializers.IntegerField(required=True, min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for individual items within an order.
    """
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_price',
            'quantity',
            'subtotal',
        ]


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for orders including nested order items.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    can_cancel = serializers.ReadOnlyField()
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'full_name',
            'email',
            'phone_number',
            'shipping_address',
            'city',
            'postal_code',
            'payment_method',
            'status',
            'total_amount',
            'can_cancel',
            'items_count',
            'items',
            'created_at',
            'updated_at',
        ]


class CheckoutSerializer(serializers.Serializer):
    """
    Serializer to validate customer checkout details.
    """
    full_name = serializers.CharField(max_length=150, required=True, min_length=2)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=20, required=True, min_length=10)
    shipping_address = serializers.CharField(required=True, min_length=5)
    city = serializers.CharField(max_length=100, required=True)
    postal_code = serializers.CharField(max_length=20, required=True)
    payment_method = serializers.ChoiceField(
        choices=[('COD', 'Cash on Delivery')],
        default='COD'
    )
