import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState('');

  const isOutOfStock = product.stock <= 0 || !product.is_active;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setAdding(true);
    setFeedback('');

    const res = await addToCart(product.id, 1);
    setAdding(false);

    if (res.success) {
      setFeedback('Added');
      setTimeout(() => setFeedback(''), 1800);
    } else {
      setFeedback(res.message || 'Error');
      setTimeout(() => setFeedback(''), 2500);
    }
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-media-container">
          <img
            src={product.display_image}
            alt={product.name}
            className="product-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
            }}
          />
          {product.category_name && (
            <span className="product-category-tag">{product.category_name}</span>
          )}
        </div>

        <div className="product-body">
          <div className="product-meta-row">
            {isOutOfStock ? (
              <span className="stock-indicator stock-out">Out of Stock</span>
            ) : isLowStock ? (
              <span className="stock-indicator stock-low">Only {product.stock} left</span>
            ) : (
              <span className="stock-indicator stock-in">In Stock</span>
            )}
          </div>

          <h3 className="product-heading" title={product.name}>
            {product.name}
          </h3>

          <div className="product-footer-row">
            <span className="product-price-display">
              ₹{Number(product.price).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>

            <button
              type="button"
              className={`product-action-btn ${feedback === 'Added' ? 'btn-success-state' : ''}`}
              disabled={isOutOfStock || adding}
              onClick={handleAddToCart}
            >
              {adding ? 'Adding...' : feedback ? feedback : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
