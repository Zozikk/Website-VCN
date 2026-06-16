function Modal({ title, children, onClose, footer, size = 'medium' }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal-card modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>

        {children}

        {footer ? <div className="modal-actions">{footer}</div> : null}
      </section>
    </div>
  );
}

export default Modal;