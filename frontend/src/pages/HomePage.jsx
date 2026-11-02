import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 4 Core Category Collections
  const categories = [
    {
      title: 'Electronics',
      description: 'Audio, smart accessories & daily tech',
      slug: 'electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Fashion',
      description: 'Everyday apparel, bags & footwear',
      slug: 'fashion',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Home Essentials',
      description: 'Kitchenware, diffusers & comfort living',
      slug: 'home-kitchen',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Fitness',
      description: 'Yoga mats, workout gear & wellness',
      slug: 'sports-fitness',
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const loadFeaturedProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/products/featured/');
      setFeaturedProducts(res.data);
    } catch (err) {
      console.error('Error loading featured products:', err);
      setError('Unable to load featured products right now. Please check if the Django backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  return (
    <div className="homepage-root">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-headline">
              Find Something You'll Love.
            </h1>
            <p className="hero-description">
              Explore everyday essentials, thoughtful accessories, electronics and more. Shop your favourites at SHOPNEST and enjoy convenient Cash on Delivery.
            </p>

            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop Now
              </Link>
              <Link to="/products" className="btn btn-outline btn-lg">
                Explore Products
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&auto=format&fit=crop&q=80"
              alt="Curated retail lifestyle boutique with everyday essentials and home goods"
              className="hero-photo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80';
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Trust Information Row */}
      <section className="trust-strip">
        <div className="container trust-container">
          <div className="trust-item">
            <div className="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
                <circle cx="12" cy="15" r="2"></circle>
              </svg>
            </div>
            <div className="trust-text">
              <h4 className="trust-title">Cash on Delivery</h4>
              <p className="trust-desc">Pay in cash when your order arrives at your door.</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div className="trust-text">
              <h4 className="trust-title">Live Stock</h4>
              <p className="trust-desc">Check real product availability before checking out.</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </div>
            <div className="trust-text">
              <h4 className="trust-title">Order Cancellation</h4>
              <p className="trust-desc">Cancel eligible orders directly from your account before dispatch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shop by Category */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-heading-group">
            <h2 className="section-heading">Shop by Category</h2>
            <p className="section-subheading">Thoughtfully organized collections for your home, style, and daily routine.</p>
          </div>

          <div className="category-grid">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/products?category=${cat.slug}`}
                className="category-card"
              >
                <div className="category-photo-wrapper">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="category-photo"
                    loading="lazy"
                  />
                </div>
                <div className="category-details">
                  <h3 className="category-title">{cat.title}</h3>
                  <p className="category-desc">{cat.description}</p>
                  <span className="category-link-text">Browse Collection →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Products (Real Django API) */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <h2 className="section-heading">Featured Products</h2>
              <p className="section-subheading">Selected quality items available for doorstep delivery.</p>
            </div>
            <Link to="/products" className="view-catalog-link">
              View All Products ({featuredProducts.length}+) →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading products..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadFeaturedProducts} />
          ) : featuredProducts.length === 0 ? (
            <div className="empty-state">
              <h3>No featured products available</h3>
              <p>We are currently updating our featured selection. Please explore the full catalog.</p>
              <Link to="/products" className="btn btn-primary">
                Explore Full Catalog
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Simple Retail Informational Banner */}
      <section className="promo-banner-section">
        <div className="container">
          <div className="promo-banner-card">
            <div className="promo-text-col">
              <h2 className="promo-title">Doorstep Delivery with Cash on Delivery</h2>
              <p className="promo-desc">
                We believe in simple, transparent shopping. Choose your items, enter your delivery address at checkout, and pay in cash directly to our delivery courier upon parcel arrival.
              </p>
              <div className="promo-actions">
                <Link to="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
