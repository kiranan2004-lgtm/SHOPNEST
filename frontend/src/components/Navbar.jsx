import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const categoryList = [
    { name: 'All Products', path: '/products' },
    { name: 'Electronics', path: '/products?category=electronics' },
    { name: 'Fashion & Apparel', path: '/products?category=fashion' },
    { name: 'Home Essentials', path: '/products?category=home-kitchen' },
    { name: 'Fitness & Sports', path: '/products?category=sports-fitness' },
  ];

  return (
    <header className="site-header">
      <div className="navbar container">
        {/* Left: Brand Wordmark */}
        <div className="navbar-brand-group">
          <Link to="/" className="brand-wordmark" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="brand-name">SHOPNEST</span>
            <span className="brand-dot">.</span>
          </Link>
        </div>

        {/* Center: Main Navigation */}
        <nav className={`navbar-nav ${isMobileMenuOpen ? 'nav-active' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive && !location.search.includes('category=') ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Shop
          </NavLink>

          {/* Categories Dropdown */}
          <div
            className={`nav-dropdown-wrapper ${isCategoryOpen ? 'open' : ''}`}
            ref={dropdownRef}
            onMouseEnter={() => setIsCategoryOpen(true)}
            onMouseLeave={() => setIsCategoryOpen(false)}
          >
            <button
              type="button"
              className={`nav-link nav-dropdown-btn ${location.search.includes('category=') ? 'active' : ''}`}
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              aria-expanded={isCategoryOpen}
            >
              <span>Categories</span>
              <svg className="dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isCategoryOpen && (
              <div className="nav-dropdown-menu">
                {categoryList.map((cat, idx) => (
                  <Link
                    key={idx}
                    to={cat.path}
                    className="dropdown-item"
                    onClick={() => {
                      setIsCategoryOpen(false);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Orders Link (Directly visible in nav if authenticated, or inside user menu) */}
          {isAuthenticated && (
            <NavLink
              to="/orders"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Orders
            </NavLink>
          )}

          {/* Mobile Auth actions */}
          <div className="mobile-only-auth">
            {isAuthenticated ? (
              <div className="mobile-auth-logged">
                <span className="mobile-user-greeting">Signed in as {user?.first_name || user?.username}</span>
                {user?.is_staff && (
                  <a
                    href="http://localhost:8000/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-admin-link"
                  >
                    Django Admin Portal
                  </a>
                )}
                <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth-guest">
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setIsMobileMenuOpen(false)}>
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Actions (Search, Cart, User Auth) */}
        <div className="navbar-actions">
          {/* Quick Search */}
          <div className="nav-search-container">
            {isSearchOpen ? (
              <form className="nav-search-form" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="nav-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="nav-search-close"
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Close search"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search store"
                title="Search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Cart Icon Link */}
          <NavLink to="/cart" className="action-cart-link" aria-label="Shopping Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span className="cart-text">Cart</span>
            {cart.total_items > 0 && (
              <span className="cart-count-pill">{cart.total_items}</span>
            )}
          </NavLink>

          {/* Desktop Auth Controls */}
          <div className="desktop-auth-group">
            {isAuthenticated ? (
              <div className="user-dropdown-area">
                <span className="user-greeting-pill" title={user?.email}>
                  {user?.first_name || user?.username}
                </span>

                {user?.is_staff && (
                  <a
                    href="http://localhost:8000/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-badge-link"
                    title="Open Django Admin"
                  >
                    Admin
                  </a>
                )}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="nav-auth-link">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle Navigation Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
