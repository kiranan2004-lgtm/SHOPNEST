import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <div className="spinner"></div>
      <p className="spinner-text">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
