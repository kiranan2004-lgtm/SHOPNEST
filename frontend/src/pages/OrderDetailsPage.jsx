import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState({ text: '', type: '' });

  // Banner if navigated directly from checkout
  const [showPlacedBanner, setShowPlacedBanner] = useState(
    location.state?.orderPlaced || false
  );

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/${id}/`);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError('Order not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleCancel = async () => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel Order #${order.id}? All items will be restocked immediately.`
    );
    if (!confirmCancel) return;

    setCancelling(true);
    setCancelFeedback({ text: '', type: '' });

    try {
      const res = await api.post(`/orders/${id}/cancel/`);
      setOrder(res.data.order);
      setCancelFeedback({
        text: res.data.message || 'Order successfully cancelled.',
        type: 'success',
      });
      setShowPlacedBanner(false);
    } catch (err) {
      console.error('Cancellation failed:', err);
      setCancelFeedback({
        text: err.response?.data?.error || 'Failed to cancel order.',
        type: 'danger',
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner text="Fetching order details..." />;
  if (error || !order) {
    return (
      <div className="container section">
        <ErrorMessage message={error || 'Order not found.'} />
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/orders" className="btn btn-primary">
            ← Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Processing':
        return 'badge-info';
      case 'Shipped':
        return 'badge-primary';
      case 'Delivered':
        return 'badge-success';
      case 'Cancelled':
        return 'badge-danger';
      default:
        return 'badge-category';
    }
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="order-details-page section">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/orders">My Orders</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Order #{order.id}</span>
        </nav>

        {/* Success Confirmation Banner if fresh checkout */}
        {showPlacedBanner && (
          <div className="confirmation-banner">
            <div className="confirmation-icon">🎉</div>
            <div className="confirmation-text">
              <h3>Order Placed Successfully!</h3>
              <p>
                Thank you for shopping with SHOPNEST. Your Cash on Delivery order <strong>#{order.id}</strong> has been received and is being prepared for shipment.
              </p>
            </div>
            <button
              type="button"
              className="confirmation-close"
              onClick={() => setShowPlacedBanner(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Cancel Feedback */}
        {cancelFeedback.text && (
          <div className={`alert-box alert-${cancelFeedback.type} mb-4`}>
            {cancelFeedback.text}
          </div>
        )}

        {/* Order Header Card */}
        <div className="order-summary-header">
          <div className="order-title-wrap">
            <h1 className="order-details-title">Order #{order.id}</h1>
            <span className="order-details-date">Placed on {formattedDate}</span>
          </div>

          <div className="order-header-status-box">
            <span className={`badge badge-lg ${getStatusBadgeClass(order.status)}`}>
              Status: {order.status}
            </span>
          </div>
        </div>

        {/* Detail Cards Grid */}
        <div className="order-info-cards-grid">
          {/* Shipping Address */}
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-card-icon">📍</span>
              <h3>Delivery Address</h3>
            </div>
            <div className="info-card-content">
              <p className="customer-name"><strong>{order.full_name}</strong></p>
              <p className="address-line">{order.shipping_address}</p>
              <p className="city-line">{order.city} - {order.postal_code}</p>
              <div className="contact-details">
                <p>📞 Phone: {order.phone_number}</p>
                <p>✉️ Email: {order.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-card-icon">💵</span>
              <h3>Payment Information</h3>
            </div>
            <div className="info-card-content">
              <p className="payment-type"><strong>Cash on Delivery (COD)</strong></p>
              <p className="payment-note">
                Amount to be collected in physical cash upon delivery:
              </p>
              <div className="due-amount-display">
                ₹{Number(order.total_amount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <span className="payment-safety-badge">✓ Zero upfront financial risk</span>
            </div>
          </div>
        </div>

        {/* Itemized Order Items Table */}
        <div className="ordered-items-card">
          <h3 className="ordered-items-title">Items Ordered ({order.items?.length || 0})</h3>
          <div className="ordered-items-table-wrap">
            <table className="ordered-items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th className="text-center">Price</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="ordered-product-name">{item.product_name}</span>
                      {item.product && (
                        <Link to={`/products/${item.product}`} className="view-product-link">
                          View current product page →
                        </Link>
                      )}
                    </td>
                    <td className="text-center">
                      ₹{Number(item.product_price).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right font-semibold">
                      ₹{Number(item.subtotal).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right">Delivery Charges:</td>
                  <td className="text-right text-success font-semibold">FREE (COD)</td>
                </tr>
                <tr className="grand-total-row">
                  <td colSpan="3" className="text-right"><strong>Grand Total:</strong></td>
                  <td className="text-right grand-total-cell">
                    ₹{Number(order.total_amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Order Actions and Cancellation Section */}
        <div className="order-footer-actions">
          <Link to="/orders" className="btn btn-outline">
            ← Back to All Orders
          </Link>

          {order.can_cancel && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling Order...' : 'Cancel This Order'}
            </button>
          )}

          {order.status === 'Cancelled' && (
            <span className="cancelled-note">
              This order was cancelled. Reserved items have been restored to inventory.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
