import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-page section">
      <div className="container not-found-container">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The page or product you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            Return to Homepage
          </Link>
          <Link to="/products" className="btn btn-outline btn-lg">
            Browse All Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
