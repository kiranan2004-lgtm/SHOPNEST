import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    total_items: 0,
    total_amount: '0.00',
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart({ items: [], total_items: 0, total_amount: '0.00' });
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/cart/');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({ items: [], total_items: 0, total_amount: '0.00' });
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      return { success: false, requireAuth: true, message: 'Please log in to add items to cart.' };
    }
    try {
      const response = await api.post('/cart/add/', {
        product_id: productId,
        quantity,
      });
      await fetchCart();
      return { success: true, message: response.data.message || 'Added to cart!' };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.quantity?.[0] ||
        error.response?.data?.stock?.[0] ||
        'Failed to add item to cart.';
      return { success: false, message };
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }
    try {
      await api.put(`/cart/items/${cartItemId}/`, { quantity });
      await fetchCart();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update item quantity.';
      return { success: false, message };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/items/${cartItemId}/`);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to remove item.' };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear/');
      setCart({ items: [], total_items: 0, total_amount: '0.00' });
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to clear cart.' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
