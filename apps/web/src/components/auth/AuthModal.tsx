import { type ReactNode } from "react";

type AuthModalProps = {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
};

export function AuthModal({ title, subtitle, onClose, children }: AuthModalProps) {
  return (
    <div className="auth-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="auth-modal auth-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="auth-modal__close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <div className="auth-card__intro auth-modal__intro auth-modal__intro--compact">
          <span className="page-eyebrow">Acesso</span>
          <h1 id="auth-modal-title">{title}</h1>
          <p>{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
