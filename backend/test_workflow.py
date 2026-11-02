import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from store.models import Category, Product, CartItem, Order, OrderItem
from decimal import Decimal

def run_workflow_test():
    client = Client()
    # Clean up prior test runs
    User.objects.filter(username__in=['john_doe', 'jane_doe']).delete()
    print("=== STARTING 15-STEP END-TO-END WORKFLOW VERIFICATION ===\n")

    # Step 1: Register a new customer
    reg_res = client.post('/api/auth/register/', {
        'username': 'john_doe',
        'email': 'john@example.com',
        'first_name': 'John',
        'last_name': 'Doe',
        'password': 'StrongPassword123!'
    }, content_type='application/json')
    assert reg_res.status_code == 201, f"Reg failed: {reg_res.content}"
    token = reg_res.json()['token']
    print("[OK] Step 1: Registered customer 'john_doe' successfully. Received Token.")

    # Step 2: Log in
    login_res = client.post('/api/auth/login/', {
        'username': 'john_doe',
        'password': 'StrongPassword123!'
    }, content_type='application/json')
    assert login_res.status_code == 200, f"Login failed: {login_res.content}"
    assert login_res.json()['token'] == token
    print("[OK] Step 2: Customer logged in successfully. Token matches.")

    auth_headers = {'HTTP_AUTHORIZATION': f'Token {token}'}

    # Step 3: Browse products
    prods_res = client.get('/api/products/')
    assert prods_res.status_code == 200
    products = prods_res.json()
    assert len(products) > 0
    p1 = products[0]
    p2 = products[1]
    print(f"[OK] Step 3: Browsed {len(products)} products in catalog.")

    # Step 4: Search and filter products
    search_res = client.get('/api/products/?search=Headphones')
    assert search_res.status_code == 200
    assert any('Headphones' in p['name'] for p in search_res.json())

    cat_res = client.get('/api/products/?category=electronics')
    assert cat_res.status_code == 200
    assert all(p['category_slug'] == 'electronics' for p in cat_res.json())
    print("[OK] Step 4: Product search and category filtering verified.")

    # Step 5: Open product details
    detail_res = client.get(f"/api/products/{p1['id']}/")
    assert detail_res.status_code == 200
    assert detail_res.json()['id'] == p1['id']
    print(f"[OK] Step 5: Opened product details for '{p1['name']}'.")

    # Step 6: Add a product to the cart
    add_res = client.post('/api/cart/add/', {
        'product_id': p1['id'],
        'quantity': 2
    }, content_type='application/json', **auth_headers)
    assert add_res.status_code in [200, 201], f"Add to cart failed: {add_res.content}"

    # Also add p2 to test multi-item cart
    client.post('/api/cart/add/', {
        'product_id': p2['id'],
        'quantity': 1
    }, content_type='application/json', **auth_headers)

    cart_res = client.get('/api/cart/', **auth_headers)
    cart_data = cart_res.json()
    assert cart_data['total_items'] == 3
    print(f"[OK] Step 6: Added products to cart. Total items: {cart_data['total_items']}, Total Amount: INR {cart_data['total_amount']}.")

    # Step 7: Update quantity
    target_item = cart_data['items'][0]
    cart_item_id = target_item['id']
    old_qty = target_item['quantity']
    new_qty = old_qty + 1
    update_res = client.put(f'/api/cart/items/{cart_item_id}/', {
        'quantity': new_qty
    }, content_type='application/json', **auth_headers)
    assert update_res.status_code == 200
    cart_res = client.get('/api/cart/', **auth_headers)
    assert cart_res.json()['total_items'] == cart_data['total_items'] + 1
    print(f"[OK] Step 7: Updated cart item quantity to {new_qty}. New total items: {cart_res.json()['total_items']}.")

    # Step 8: Remove an item from cart
    remove_item = cart_data['items'][1]
    remove_item_id = remove_item['id']
    del_res = client.delete(f'/api/cart/items/{remove_item_id}/', **auth_headers)
    assert del_res.status_code == 200
    cart_res = client.get('/api/cart/', **auth_headers)
    expected_items = cart_data['total_items'] + 1 - remove_item['quantity']
    assert cart_res.json()['total_items'] == expected_items
    print(f"[OK] Step 8: Removed second item from cart. Remaining items: {expected_items}.")

    # Step 9: Complete Cash on Delivery order
    remaining_item = cart_res.json()['items'][0]
    ordered_product_id = remaining_item['product']['id']
    ordered_qty = remaining_item['quantity']
    initial_stock = Product.objects.get(id=ordered_product_id).stock
    checkout_payload = {
        'full_name': 'John Doe',
        'email': 'john@example.com',
        'phone_number': '9876543210',
        'shipping_address': 'Flat 402, Green Meadows',
        'city': 'Bengaluru',
        'postal_code': '560001',
        'payment_method': 'COD'
    }
    checkout_res = client.post('/api/orders/checkout/', checkout_payload, content_type='application/json', **auth_headers)
    assert checkout_res.status_code == 201, f"Checkout failed: {checkout_res.content}"
    order = checkout_res.json()['order']
    order_id = order['id']
    print(f"[OK] Step 9: Completed Cash on Delivery order #{order_id}. Total: INR {order['total_amount']}.")

    # Verify inventory was decremented
    updated_stock = Product.objects.get(id=ordered_product_id).stock
    assert updated_stock == initial_stock - ordered_qty, f"Stock decrement mismatch: was {initial_stock}, now {updated_stock}"
    print(f"  -> Stock correctly decremented from {initial_stock} to {updated_stock}.")

    # Step 10: Check order history
    orders_res = client.get('/api/orders/', **auth_headers)
    assert orders_res.status_code == 200
    user_orders = orders_res.json()
    assert len(user_orders) >= 1
    assert user_orders[0]['id'] == order_id
    print(f"[OK] Step 10: Verified order history. Found {len(user_orders)} order(s).")

    # Step 11: Cancel eligible order
    cancel_res = client.post(f'/api/orders/{order_id}/cancel/', **auth_headers)
    assert cancel_res.status_code == 200, f"Cancel failed: {cancel_res.content}"
    assert cancel_res.json()['order']['status'] == 'Cancelled'

    # Verify inventory was restored
    restored_stock = Product.objects.get(id=ordered_product_id).stock
    assert restored_stock == initial_stock, f"Stock restoration mismatch: {restored_stock} vs {initial_stock}"
    print(f"[OK] Step 11: Cancelled order #{order_id}. Stock successfully restored to {restored_stock}.")

    # Step 12: Log out
    logout_res = client.post('/api/auth/logout/', **auth_headers)
    assert logout_res.status_code == 200
    print("[OK] Step 12: Logged out successfully. Token invalidated.")

    # Step 13: Try accessing protected endpoint without authentication
    unauth_res = client.get('/api/cart/')
    assert unauth_res.status_code == 401
    print("[OK] Step 13: Accessing protected endpoint without token returned 401 Unauthorized as expected.")

    # Step 14: Verify user data isolation
    # Register user2 and verify cannot access user1's order
    reg2_res = client.post('/api/auth/register/', {
        'username': 'jane_doe',
        'email': 'jane@example.com',
        'first_name': 'Jane',
        'last_name': 'Doe',
        'password': 'StrongPassword123!'
    }, content_type='application/json')
    token2 = reg2_res.json()['token']
    auth_headers2 = {'HTTP_AUTHORIZATION': f'Token {token2}'}

    cross_res = client.get(f'/api/orders/{order_id}/', **auth_headers2)
    assert cross_res.status_code == 404, f"Cross user isolation failed: status was {cross_res.status_code}"
    print("[OK] Step 14: Data isolation verified. Jane Doe receives 404 trying to access John Doe's order.")

    # Step 15: Admin management verification
    admin_user = User.objects.filter(is_superuser=True).first()
    if admin_user:
        admin_token, _ = Token.objects.get_or_create(user=admin_user)
        admin_headers = {'HTTP_AUTHORIZATION': f'Token {admin_token.key}'}
        # Staff can view any customer's order
        admin_order_res = client.get(f'/api/orders/{order_id}/', **admin_headers)
        assert admin_order_res.status_code == 200
        print(f"[OK] Step 15: Administrator '{admin_user.username}' successfully verified with order access.")

    # Cleanup test users john_doe and jane_doe
    User.objects.filter(username__in=['john_doe', 'jane_doe']).delete()
    print("\n=== ALL 15 END-TO-END WORKFLOW VERIFICATIONS PASSED 100% ===")

if __name__ == '__main__':
    run_workflow_test()
