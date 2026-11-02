import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/products/${id}/`);
        setProduct(res.data);
      } catch (err) {
        console.error('Failed to load product detail:', err);
        setError('Product not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading product details..." />;
  if (error || !product) {
    return (
      <div className="container section">
        <ErrorMessage message={error || 'Product not found'} />
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/products" className="btn btn-primary">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0 || !product.is_active;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async (goToCheckout = false) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setAdding(true);
    setFeedback({ type: '', text: '' });

    const res = await addToCart(product.id, quantity);
    setAdding(false);

    if (res.success) {
      if (goToCheckout) {
        navigate('/checkout');
      } else {
        setFeedback({ type: 'success', text: `Added ${quantity} item(s) to your cart!` });
        setTimeout(() => setFeedback({ type: '', text: '' }), 3000);
      }
    } else {
      setFeedback({ type: 'danger', text: res.message || 'Could not add to cart.' });
    }
  };

  const subtotal = (Number(product.price) * quantity).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="product-detail-page section">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/products">Products</Link>
          <span className="breadcrumb-sep">/</span>
          {product.category_slug && (
            <>
              <Link to={`/products?category=${product.category_slug}`}>
                {product.category_name}
              </Link>
              <span className="breadcrumb-sep">/</span>
            </>
          )}
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="product-detail-layout">
          {/* Product Image Column */}
          <div className="product-detail-media">
            <div className="detail-image-box">
              <img
                src={product.display_image}
                alt={product.name}
                className="detail-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>

          {/* Product Info & Purchase Column */}
          <div className="product-detail-content">
            <div className="detail-tags">
              <span className="badge badge-category">{product.category_name}</span>
              {isOutOfStock ? (
                <span className="badge badge-danger">Out of Stock</span>
              ) : isLowStock ? (
                <span className="badge badge-warning">Only {product.stock} units left!</span>
              ) : (
                <span className="badge badge-success">In Stock ({product.stock} available)</span>
              )}
            </div>

            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-price-box">
              <div className="price-primary">
                <span className="price-currency">₹</span>
                <span className="price-amount">
                  {Number(product.price).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <span className="tax-tag">Inclusive of all taxes</span>
            </div>

            <div className="detail-description">
              <h3>About this item</h3>
              <p>{product.description}</p>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="detail-purchase-section">
                <div className="quantity-group">
                  <label className="quantity-label">Quantity:</label>
                  <div className="quantity-stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="stepper-value">{quantity}</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="stepper-subtotal">Subtotal: ₹{subtotal}</span>
                </div>

                {/* Feedback Message */}
                {feedback.text && (
                  <div className={`alert-box alert-${feedback.type}`}>
                    {feedback.text}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="detail-action-buttons">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() => handleAddToCart(false)}
                    disabled={adding}
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-accent btn-lg"
                    onClick={() => handleAddToCart(true)}
                    disabled={adding}
                  >
                    Buy Now with COD
                  </button>
                </div>
              </div>
            )}

            {isOutOfStock && (
              <div className="out-of-stock-notice">
                <p>This item is currently out of stock. Please check back later or explore alternative products.</p>
                <Link to="/products" className="btn btn-outline">
                  Browse Other Items
                </Link>
              </div>
            )}

            {/* Assurance Perks */}
            <div className="detail-perks-list">
              <div className="detail-perk">
                <span className="perk-emoji">💵</span>
                <div>
                  <strong>Cash on Delivery (COD)</strong>
                  <p>Pay cash when your order reaches your home</p>
                </div>
              </div>
              <div className="detail-perk">
                <span className="perk-emoji">🚚</span>
                <div>
                  <strong>Free Standard Shipping</strong>
                  <p>Dispatched in 24-48 business hours</p>
                </div>
              </div>
              <div className="detail-perk">
                <span className="perk-emoji">🛡️</span>
                <div>
                  <strong>Hassle-Free Cancellation</strong>
                  <p>Cancel directly from your account before dispatch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
