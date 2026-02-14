/**
 * Toast Notification Utility
 * Centralized toast message handler using react-toastify
 */

import { toast } from 'react-toastify';

export const showSuccess = (message) => {
  toast.success(message || 'Operation completed successfully', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showError = (message) => {
  toast.error(message || 'An error occurred', {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showWarning = (message) => {
  toast.warning(message || 'Warning', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showInfo = (message) => {
  toast.info(message || 'Information', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Show confirmation toast with action buttons
 * @param {string} message - Message to display
 * @param {object} actions - {onConfirm: function, onCancel: function}
 */
export const showConfirm = (message, { onConfirm, onCancel } = {}) => {
  toast(
    ({ closeToast }) => (
      <div>
        <p>{message}</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              closeToast();
            }}
            style={{
              padding: '5px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
          <button
            onClick={() => {
              if (onCancel) onCancel();
              closeToast();
            }}
            style={{
              padding: '5px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
    }
  );
};

const ToastNotifier = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  confirm: showConfirm
};

export default ToastNotifier;
