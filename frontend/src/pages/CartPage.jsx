import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CartPage = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h2>Please Log In</h2>
          <p>You need to be logged in to view and manage your shopping cart.</p>
          <Link to="/login" state={{ from: { pathname: '/cart' } }} className="btn btn-primary">
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return <LoadingSpinner text="Loading your shopping cart..." />;
  }

  const items = cart.items || [];
  const isEmpty = items.length === 0;

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  return (
    <div className="cart-page section">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Your Shopping Cart</h1>
          <p className="page-subtitle">
            {isEmpty
              ? 'Your cart is currently empty.'
              : `You have ${cart.total_items} item${cart.total_items > 1 ? 's' : ''} in your cart.`}
          </p>
        </div>

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items List */}
            <div className="cart-items-container">
              <div className="cart-items-header">
                <span>Product</span>
                <span>Quantity</span>
                <span>Subtotal</span>
              </div>

              <div className="cart-items-list">
                {items.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <div className="item-product-cell">
                      <Link to={`/products/${item.product.id}`} className="item-thumbnail-link">
                        <img
                          src={item.product.display_image}
                          alt={item.product.name}
                          className="item-thumbnail"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      </Link>
                      <div className="item-details">
                        <Link to={`/products/${item.product.id}`} className="item-name">
                          {item.product.name}
                        </Link>
                        <span className="item-category">{item.product.category_name}</span>
                        <span className="item-price">
                          ₹{Number(item.product.price).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} each
                        </span>
                        <button
                          type="button"
                          className="item-remove-link"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="item-quantity-cell">
                      <div className="cart-stepper">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="stepper-count">{item.quantity}</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      {item.quantity >= item.product.stock && (
                        <span className="max-stock-notice">Max stock reached</span>
                      )}
                    </div>

                    <div className="item-subtotal-cell">
                      <span className="item-subtotal-price">
                        ₹{Number(item.subtotal).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-actions-row">
                <Link to="/products" className="btn btn-outline btn-sm">
                  ← Continue Shopping
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-danger"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="cart-summary-sidebar">
              <div className="summary-card">
                <h3 className="summary-title">Order Summary</h3>

                <div className="summary-line">
                  <span>Total Items</span>
                  <span>{cart.total_items}</span>
                </div>

                <div className="summary-line">
                  <span>Items Subtotal</span>
                  <span>
                    ₹{Number(cart.total_amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="summary-line">
                  <span>Shipping & Delivery</span>
                  <span className="text-success font-semibold">FREE (COD)</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total-line">
                  <span>Grand Total</span>
                  <span className="grand-total-amount">
                    ₹{Number(cart.total_amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="cod-alert-box">
                  <span className="cod-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery (COD)</strong>
                    <p>No online transaction needed. Pay with cash when package arrives.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  onClick={handleCheckoutClick}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
