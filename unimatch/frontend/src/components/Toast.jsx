import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckIcon, XIcon, AlertCircleIcon, InfoIcon } from './ui/Icons';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message) => addToast(message, 'success');
  const showError = (message) => addToast(message, 'error');
  const showInfo = (message) => addToast(message, 'info');
  const showWarning = (message) => addToast(message, 'warning');

  return (
    <ToastContext.Provider value={{ 
      showSuccess, 
      showError, 
      showInfo, 
      showWarning 
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={() => onRemove(toast.id)} 
        />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300); // Wait for animation to complete
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    const visibleStyles = isVisible 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    };

    return `${baseStyles} ${visibleStyles} ${typeStyles[toast.type] || typeStyles.info}`;
  };

  const getIcon = () => {
    const iconProps = { size: 20, className: "flex-shrink-0" };
    
    switch (toast.type) {
      case 'success':
        return <CheckIcon {...iconProps} className="text-green-600" />;
      case 'error':
        return <AlertCircleIcon {...iconProps} className="text-red-600" />;
      case 'warning':
        return <AlertCircleIcon {...iconProps} className="text-yellow-600" />;
      case 'info':
      default:
        return <InfoIcon {...iconProps} className="text-blue-600" />;
    }
  };

  return (
    <div className={`
      flex items-center gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-[400px]
      ${getToastStyles()}
    `}>
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
};

export default Toast; 