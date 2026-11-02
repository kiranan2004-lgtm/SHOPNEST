import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="error-alert" role="alert">
      <div className="error-icon">!</div>
      <div className="error-content">
        <p className="error-title">Something went wrong</p>
        <p className="error-detail">{message}</p>
        {onRetry && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
