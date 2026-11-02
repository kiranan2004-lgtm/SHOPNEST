import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <Link to="/" className="footer-wordmark">
            <span className="brand-name">SHOPNEST</span>
            <span className="brand-dot">.</span>
          </Link>
          <p className="footer-bio">
            Curated everyday essentials, modern home living, apparel, and electronics. Convenient doorstep delivery with Cash on Delivery across all locations.
          </p>
          <div className="footer-service-note">
            <span>Payment supported: Cash on Delivery (COD)</span>
          </div>
        </div>

        {/* Shop Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Shop</h4>
          <ul className="footer-nav">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?category=electronics">Electronics</Link></li>
            <li><Link to="/products?category=fashion">Fashion & Apparel</Link></li>
            <li><Link to="/products?category=home-kitchen">Home Essentials</Link></li>
            <li><Link to="/products?category=sports-fitness">Fitness & Sports</Link></li>
          </ul>
        </div>

        {/* Account Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Customer Account</h4>
          <ul className="footer-nav">
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
          </ul>
        </div>

        {/* Help & Policies Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Ordering & Delivery</h4>
          <ul className="footer-nav">
            <li><span className="info-item">Doorstep Delivery with COD</span></li>
            <li><span className="info-item">Pay cash upon parcel inspection</span></li>
            <li><span className="info-item">One-click cancellation before dispatch</span></li>
            <li><span className="info-item">Support: support@shopnest.local</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="container bottom-bar-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} SHOPNEST. All rights reserved.
          </p>
          <p className="footer-disclaimer">
            Genuine online store experience powered by Django REST & React.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
