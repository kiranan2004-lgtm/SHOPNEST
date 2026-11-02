import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ErrorMessage from '../components/ErrorMessage';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || '',
    email: user?.email || '',
    phone_number: '',
    shipping_address: '',
    city: '',
    postal_code: '',
    payment_method: 'COD',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Please add products to your cart before proceeding to checkout.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side quick validation
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      setError('Please provide a valid full name.');
      return;
    }
    if (!formData.phone_number.trim() || formData.phone_number.trim().length < 10) {
      setError('Please provide a valid 10-digit phone number.');
      return;
    }
    if (!formData.shipping_address.trim() || formData.shipping_address.trim().length < 5) {
      setError('Please provide a complete shipping address (minimum 5 characters).');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please enter your city.');
      return;
    }
    if (!formData.postal_code.trim()) {
      setError('Please enter your postal/PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/orders/checkout/', formData);
      // Refresh cart context (which will now be empty)
      await fetchCart();
      const placedOrder = response.data.order;
      // Navigate to order details with success state
      navigate(`/orders/${placedOrder.id}`, {
        state: { orderPlaced: true, message: response.data.message },
      });
    } catch (err) {
      console.error('Checkout error:', err);
      let errMsg = 'Failed to place order. Please verify your details.';
      if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      } else if (err.response?.data) {
        const firstKey = Object.keys(err.response.data)[0];
        const val = err.response.data[firstKey];
        errMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page section">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">Provide your delivery information to complete your Cash on Delivery order.</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="checkout-layout">
          {/* Shipping Form */}
          <div className="checkout-form-container">
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-section">
                <h3 className="form-section-title">1. Contact & Customer Details</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="full_name" className="form-label">Full Name *</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number" className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                  <small className="form-hint">Our courier partner will call this number for delivery coordination.</small>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">2. Delivery Address</h3>
                <div className="form-group">
                  <label htmlFor="shipping_address" className="form-label">Street Address / House / Flat *</label>
                  <textarea
                    id="shipping_address"
                    name="shipping_address"
                    className="form-control"
                    rows="3"
                    placeholder="Flat No, Building Name, Street, Landmark"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className="form-control"
                      placeholder="e.g. Bengaluru"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="postal_code" className="form-label">Postal / PIN Code *</label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      className="form-control"
                      placeholder="e.g. 560001"
                      value={formData.postal_code}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">3. Payment Method</h3>
                <div className="payment-method-card active-payment">
                  <div className="payment-radio-row">
                    <input
                      type="radio"
                      id="payment_cod"
                      name="payment_method"
                      value="COD"
                      checked={formData.payment_method === 'COD'}
                      readOnly
                    />
                    <label htmlFor="payment_cod" className="payment-label">
                      <strong>Cash on Delivery (COD)</strong>
                      <span className="payment-tag">Recommended & Supported</span>
                    </label>
                  </div>
                  <p className="payment-explanation">
                    Pay with physical cash directly to the delivery courier when your order arrives at your address. No advance payment or credit card is required.
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={submitting}
                >
                  {submitting ? 'Placing Order...' : 'Confirm Order with Cash on Delivery'}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Column */}
          <div className="checkout-summary-container">
            <div className="summary-card">
              <h3 className="summary-title">Order Review</h3>

              <div className="checkout-items-preview">
                {items.map((item) => (
                  <div key={item.id} className="preview-item">
                    <img
                      src={item.product.display_image}
                      alt={item.product.name}
                      className="preview-img"
                    />
                    <div className="preview-info">
                      <p className="preview-name">{item.product.name}</p>
                      <span className="preview-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="preview-price">
                      ₹{Number(item.subtotal).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

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
                <span>Shipping</span>
                <span className="text-success font-semibold">FREE (COD)</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total-line">
                <span>Total Due on Delivery</span>
                <span className="grand-total-amount">
                  ₹{Number(cart.total_amount).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="checkout-trust-badge">
                <span>🔒 100% Safe & Secure Doorstep Handover</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
