from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.register_view, name='api-register'),
    path('auth/login/', views.login_view, name='api-login'),
    path('auth/logout/', views.logout_view, name='api-logout'),
    path('auth/profile/', views.profile_view, name='api-profile'),

    # Catalog endpoints
    path('categories/', views.category_list_view, name='api-categories'),
    path('products/', views.product_list_view, name='api-products'),
    path('products/featured/', views.featured_products_view, name='api-products-featured'),
    path('products/<int:pk>/', views.product_detail_view, name='api-product-detail'),

    # Cart endpoints (Authenticated)
    path('cart/', views.cart_view, name='api-cart'),
    path('cart/add/', views.add_to_cart_view, name='api-cart-add'),
    path('cart/items/<int:pk>/', views.cart_item_detail_view, name='api-cart-item-detail'),
    path('cart/clear/', views.clear_cart_view, name='api-cart-clear'),

    # Order endpoints (Authenticated)
    path('orders/', views.order_list_view, name='api-orders'),
    path('orders/checkout/', views.checkout_view, name='api-checkout'),
    path('orders/<int:pk>/', views.order_detail_view, name='api-order-detail'),
    path('orders/<int:pk>/cancel/', views.order_cancel_view, name='api-order-cancel'),
]
