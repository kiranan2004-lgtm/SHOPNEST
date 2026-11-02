from decimal import Decimal
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from .models import Category, Product, CartItem, Order, OrderItem


class ShopnestAPITests(APITestCase):
    """
    Automated integration and unit tests for SHOPNEST E-Commerce APIs.
    """

    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            username='alice',
            email='alice@example.com',
            password='Password123!',
            first_name='Alice',
            last_name='Smith'
        )
        self.token1 = Token.objects.create(user=self.user1)

        self.user2 = User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='Password123!',
            first_name='Bob',
            last_name='Jones'
        )
        self.token2 = Token.objects.create(user=self.user2)

        # Create test category and products
        self.category = Category.objects.create(
            name='Audio',
            slug='audio',
            description='Audio devices'
        )
        self.product1 = Product.objects.create(
            category=self.category,
            name='Noise Cancelling Headphones',
            slug='noise-cancelling-headphones',
            description='High quality sound',
            price=Decimal('2000.00'),
            stock=10,
            is_active=True
        )
        self.product2 = Product.objects.create(
            category=self.category,
            name='Wireless Earbuds',
            slug='wireless-earbuds',
            description='Compact earbuds',
            price=Decimal('1000.00'),
            stock=5,
            is_active=True
        )

    # --------------------------------------------------------------------------
    # 1. Authentication Tests
    # --------------------------------------------------------------------------
    def test_user_registration_success(self):
        url = reverse('api-register')
        data = {
            'username': 'charlie',
            'email': 'charlie@example.com',
            'password': 'SecurePassword123!',
            'first_name': 'Charlie',
            'last_name': 'Brown'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'charlie')
        self.assertTrue(User.objects.filter(username='charlie').exists())

    def test_user_registration_duplicate_username(self):
        url = reverse('api-register')
        data = {
            'username': 'alice',
            'email': 'alice2@example.com',
            'password': 'Password123!',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        url = reverse('api-login')
        data = {
            'username': 'alice',
            'password': 'Password123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['token'], self.token1.key)

    def test_user_login_invalid_password(self):
        url = reverse('api-login')
        data = {
            'username': 'alice',
            'password': 'WrongPassword'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_logout(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        url = reverse('api-logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Token should be deleted from DB
        self.assertFalse(Token.objects.filter(user=self.user1).exists())

    # --------------------------------------------------------------------------
    # 2. Catalog Tests
    # --------------------------------------------------------------------------
    def test_category_list(self):
        url = reverse('api-categories')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_product_list_and_search(self):
        url = reverse('api-products')
        response = self.client.get(url, {'search': 'Headphones'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Noise Cancelling Headphones')

    def test_product_detail(self):
        url = reverse('api-product-detail', kwargs={'pk': self.product1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product1.name)

    # --------------------------------------------------------------------------
    # 3. Cart Tests
    # --------------------------------------------------------------------------
    def test_cart_operations(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

        # Add to cart
        add_url = reverse('api-cart-add')
        response = self.client.post(add_url, {'product_id': self.product1.id, 'quantity': 2})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Retrieve cart
        cart_url = reverse('api-cart')
        response = self.client.get(cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_items'], 2)
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('4000.00'))

        cart_item_id = response.data['items'][0]['id']

        # Update cart quantity
        detail_url = reverse('api-cart-item-detail', kwargs={'pk': cart_item_id})
        update_res = self.client.put(detail_url, {'quantity': 3})
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)

        # Verify updated total
        response = self.client.get(cart_url)
        self.assertEqual(response.data['total_items'], 3)
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('6000.00'))

        # Remove from cart
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        # Verify cart is empty
        response = self.client.get(cart_url)
        self.assertEqual(response.data['total_items'], 0)

    def test_cart_user_isolation(self):
        # Alice adds product to her cart
        CartItem.objects.create(user=self.user1, product=self.product1, quantity=2)

        # Bob logs in and checks cart
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        cart_url = reverse('api-cart')
        response = self.client.get(cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_items'], 0)  # Bob sees only his own empty cart

    # --------------------------------------------------------------------------
    # 4. Checkout & Order Lifecycle Tests
    # --------------------------------------------------------------------------
    def test_checkout_and_cancellation_workflow(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

        # 1. Add items to cart
        CartItem.objects.create(user=self.user1, product=self.product1, quantity=2)
        initial_stock = self.product1.stock

        # 2. Checkout
        checkout_url = reverse('api-checkout')
        checkout_payload = {
            'full_name': 'Alice Smith',
            'email': 'alice@example.com',
            'phone_number': '9876543210',
            'shipping_address': '42 Baker Street, Apt 3B',
            'city': 'Bengaluru',
            'postal_code': '560001',
            'payment_method': 'COD'
        }
        res = self.client.post(checkout_url, checkout_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_id = res.data['order']['id']
        self.assertEqual(res.data['order']['total_amount'], '4000.00')

        # Verify stock decreased
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock - 2)

        # Verify cart cleared
        self.assertEqual(CartItem.objects.filter(user=self.user1).count(), 0)

        # 3. View order detail
        order_url = reverse('api-order-detail', kwargs={'pk': order_id})
        order_res = self.client.get(order_url)
        self.assertEqual(order_res.status_code, status.HTTP_200_OK)
        self.assertEqual(order_res.data['status'], 'Pending')

        # 4. Cancel order
        cancel_url = reverse('api-order-cancel', kwargs={'pk': order_id})
        cancel_res = self.client.post(cancel_url)
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data['order']['status'], 'Cancelled')

        # Verify stock was restored
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock)

    def test_order_user_isolation(self):
        # Alice places an order
        order = Order.objects.create(
            user=self.user1,
            full_name='Alice Smith',
            email='alice@example.com',
            phone_number='9876543210',
            shipping_address='Street 1',
            city='Bengaluru',
            postal_code='560001',
            total_amount=Decimal('2000.00'),
            status='Pending'
        )

        # Bob attempts to view Alice's order
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        order_url = reverse('api-order-detail', kwargs={'pk': order.id})
        response = self.client.get(order_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
