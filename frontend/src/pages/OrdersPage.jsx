import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ id: null, message: '', type: '' });
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders/');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Could not retrieve your orders. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel Order #${orderId}? Product inventory will be automatically restored.`
    );
    if (!confirmCancel) return;

    setCancellingId(orderId);
    setActionFeedback({ id: null, message: '', type: '' });

    try {
      const res = await api.post(`/orders/${orderId}/cancel/`);
      // Update order status in local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled', can_cancel: false } : o))
      );
      setActionFeedback({
        id: orderId,
        message: res.data.message || `Order #${orderId} was cancelled successfully.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Error cancelling order:', err);
      setActionFeedback({
        id: orderId,
        message: err.response?.data?.error || 'Failed to cancel this order.',
        type: 'danger',
      });
    } finally {
      setCancellingId(null);
    }
  };

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

  return (
    <div className="orders-page section">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">Track, review, or cancel your orders with full transparency.</p>
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving your orders..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchOrders} />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders placed yet</h3>
            <p>You haven't ordered anything from SHOPNEST yet. Explore our products and order with Cash on Delivery!</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-header-left">
                      <div className="order-meta-item">
                        <span className="order-meta-label">ORDER PLACED</span>
                        <span className="order-meta-val">{formattedDate}</span>
                      </div>
                      <div className="order-meta-item">
                        <span className="order-meta-label">TOTAL AMOUNT</span>
                        <span className="order-meta-val highlight">
                          ₹{Number(order.total_amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="order-meta-item">
                        <span className="order-meta-label">PAYMENT METHOD</span>
                        <span className="order-meta-val">Cash on Delivery</span>
                      </div>
                    </div>

                    <div className="order-header-right">
                      <span className="order-number">Order #{order.id}</span>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {actionFeedback.id === order.id && (
                    <div className={`order-feedback-alert alert-${actionFeedback.type}`}>
                      {actionFeedback.message}
                    </div>
                  )}

                  <div className="order-card-body">
                    <div className="order-items-preview">
                      <h4 className="preview-heading">Items ({order.items?.length || 0}):</h4>
                      <ul className="order-items-list">
                        {order.items?.map((item) => (
                          <li key={item.id} className="order-item-bullet">
                            <span className="bullet-name">{item.product_name}</span>
                            <span className="bullet-qty">× {item.quantity}</span>
                            <span className="bullet-price">
                              (₹{Number(item.subtotal).toLocaleString('en-IN')})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="order-card-actions">
                      <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                        View Details
                      </Link>

                      {order.can_cancel && (
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
