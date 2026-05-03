import { toast } from 'react-toastify';

/**
 * Replaces window.confirm with a non-blocking toast-based confirmation.
 * 
 * Usage:
 *   const confirmed = await showConfirm('Delete this record?');
 *   if (!confirmed) return;
 * 
 * @param {string} message - The confirmation message
 * @param {object} options - Optional options: confirmText, cancelText, type ('warning'|'danger')
 * @returns {Promise<boolean>}
 */
export const showConfirm = (message, { confirmText = 'Yes, proceed', cancelText = 'Cancel', type = 'warning' } = {}) => {
    return new Promise((resolve) => {
        const toastId = toast(
            ({ closeToast }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                        {type === 'danger' ? '⚠️ ' : '❓ '}{message}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => { closeToast(); resolve(false); }}
                            style={{
                                padding: '0.35rem 0.9rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: 'var(--text-main)'
                            }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { closeToast(); resolve(true); }}
                            style={{
                                padding: '0.35rem 0.9rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: type === 'danger' ? '#ef4444' : '#f59e0b',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            ),
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                position: 'top-center',
                style: { minWidth: '280px' }
            }
        );

        // Reject if toast is dismissed by other means (e.g. Escape)
        // We resolve(false) on cancel button click above, this covers edge cases
    });
};

export default showConfirm;
