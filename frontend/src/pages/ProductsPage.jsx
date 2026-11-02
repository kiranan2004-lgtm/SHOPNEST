import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract query parameters
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  // Search input local state
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch filtered products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (currentSearch) params.search = currentSearch;
      if (currentCategory) params.category = currentCategory;
      if (currentSort) params.sort = currentSort;

      const res = await api.get('/products/', { params });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Could not retrieve products. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentSearch, currentSort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update query params helper
  const updateParams = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        next.set(k, v);
      } else {
        next.delete(k);
      }
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const handleCategorySelect = (slug) => {
    updateParams({ category: slug });
  };

  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);

  return (
    <div className="products-page section">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            {activeCategoryObj ? `${activeCategoryObj.name}` : 'All Products'}
          </h1>
          <p className="page-subtitle">
            {activeCategoryObj
              ? activeCategoryObj.description || `Browse the best of ${activeCategoryObj.name}`
              : 'Browse our complete catalog of verified goods with Cash on Delivery.'}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="catalog-toolbar">
          <form className="toolbar-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search products..."
              className="toolbar-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearchInput('');
                  updateParams({ search: '' });
                }}
              >
                ✕
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          {/* Sort Selector */}
          <div className="toolbar-sort">
            <label htmlFor="sort-select" className="sort-label">Sort by:</label>
            <select
              id="sort-select"
              className="sort-dropdown"
              value={currentSort}
              onChange={handleSortChange}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="category-pills-bar">
          <button
            type="button"
            className={`pill-btn ${!currentCategory ? 'active' : ''}`}
            onClick={() => handleCategorySelect('')}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pill-btn ${currentCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Active Filter Indicators */}
        {(currentSearch || currentCategory) && (
          <div className="active-filters">
            <span className="filters-label">Active Filters:</span>
            {currentCategory && (
              <span className="filter-chip">
                Category: {activeCategoryObj?.name || currentCategory}
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  aria-label="Remove category filter"
                >
                  ✕
                </button>
              </span>
            )}
            {currentSearch && (
              <span className="filter-chip">
                Search: "{currentSearch}"
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ search: '' });
                  }}
                  aria-label="Remove search filter"
                >
                  ✕
                </button>
              </span>
            )}
            <button type="button" className="btn-link" onClick={handleClearFilters}>
              Reset all
            </button>
          </div>
        )}

        {/* Catalog Results Grid */}
        <div className="catalog-results">
          {loading ? (
            <LoadingSpinner text="Fetching products..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchProducts} />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No matching products found</h3>
              <p>We couldn't find anything matching your selected search or category filters.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="results-count">
                Showing <strong>{products.length}</strong> product{products.length !== 1 ? 's' : ''}
              </div>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
