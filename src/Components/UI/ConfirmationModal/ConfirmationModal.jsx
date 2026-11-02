import { useEffect } from "react";
import "./ConfirmationModal.css";

/**
 * Reusable confirmation dialog.
 * Props: isOpen, title, message, confirmText, cancelText, variant,
 * loading, onConfirm, onCancel.
 */
export default function ConfirmationModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) onCancel?.();
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !loading) {
        onConfirm?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="confirmation-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel?.();
      }}
    >
      <section
        className="confirmation-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-message"
      >
        <div className={`confirmation-modal-icon confirmation-modal-icon-${variant}`} aria-hidden="true">
          {variant === "danger" ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5m0 3h.01M10.3 3.9 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 11v5m0-8h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <div className="confirmation-modal-copy">
          <h2 id="confirmation-modal-title">{title}</h2>
          <p id="confirmation-modal-message">{message}</p>
        </div>

        <div className="confirmation-modal-actions">
          <button
            type="button"
            className="confirmation-modal-button confirmation-modal-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirmation-modal-button confirmation-modal-confirm confirmation-modal-confirm-${variant}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading && <span className="confirmation-modal-spinner" aria-hidden="true" />}
            {loading ? "Please wait…" : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
