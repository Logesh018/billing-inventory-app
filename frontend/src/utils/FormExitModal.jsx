import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Context to manage form state across the app
const FormNavigationContext = createContext();

export const FormNavigationProvider = ({ children }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const formCloseCallbackRef = useRef(null);
  const isProcessingRef = useRef(false);

  const requestNavigation = useCallback((destination, onConfirm) => {
    if (isProcessingRef.current) {
      return false;
    }
    
    if (isFormOpen) {
      setPendingNavigation({ destination, onConfirm });
      setShowModal(true);
      return false; // Block navigation
    }
    
    // If form not open, navigate immediately
    if (onConfirm) onConfirm();
    return true;
  }, [isFormOpen]);

  const confirmNavigation = useCallback(() => {
    if (isProcessingRef.current || !pendingNavigation) {
      return;
    }
    
    isProcessingRef.current = true;
    
    // Store refs locally before clearing
    const callback = formCloseCallbackRef.current;
    const navigation = pendingNavigation;
    
    // Clear states
    setShowModal(false);
    setIsFormOpen(false);
    setPendingNavigation(null);
    formCloseCallbackRef.current = null;
    
    // Execute callback to close form UI first
    if (callback) {
      callback();
    }
    
    // Execute navigation with a small delay to ensure form is closed
    setTimeout(() => {
      if (navigation?.onConfirm) {
        navigation.onConfirm();
      }
      isProcessingRef.current = false;
    }, 50);
  }, [pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
    setShowModal(false);
  }, []);

  const registerFormClose = useCallback((callback) => {
    formCloseCallbackRef.current = callback;
  }, []);

  const unregisterFormClose = useCallback(() => {
    formCloseCallbackRef.current = null;
  }, []);

  return (
    <FormNavigationContext.Provider
      value={{
        isFormOpen,
        setIsFormOpen,
        requestNavigation,
        confirmNavigation,
        cancelNavigation,
        showModal,
        pendingNavigation,
        registerFormClose,
        unregisterFormClose,
      }}
    >
      {children}
    </FormNavigationContext.Provider>
  );
};

export const useFormNavigation = () => {
  const context = useContext(FormNavigationContext);
  if (!context) {
    throw new Error('useFormNavigation must be used within FormNavigationProvider');
  }
  return context;
};

// Main Modal Dialog Component
export const FormExitModal = () => {
  const { showModal, cancelNavigation, confirmNavigation, pendingNavigation } = useFormNavigation();

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={cancelNavigation}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Close button */}
        <button
          onClick={cancelNavigation}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Close Form?
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to close this form? Any unsaved changes will be lost.
            {pendingNavigation?.destination && (
              <span className="block mt-3 font-medium text-gray-800">
                Navigating to: <span className="text-blue-600">{pendingNavigation.destination}</span>
              </span>
            )}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={cancelNavigation}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Stay on Form
            </button>
            <button
              onClick={confirmNavigation}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Close Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}