import { useEffect, useCallback } from "react";
import type { ReactNode, FormEvent } from "react";
import { X } from "lucide-react";

type ModalSize = "small" | "medium" | "large";
type ModalPosition = "centered" | "top" | "bottom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: ModalSize;
    position?: ModalPosition;
    onSubmit?: () => void;
    submitText?: string;
    cancelText?: string;
    showFooter?: boolean;
    isSubmitting?: boolean;
}

const sizeClassMap: Record<ModalSize, string> = {
    small: "modal-sm",
    medium: "modal-md",
    large: "modal-lg",
};

const positionClassMap: Record<ModalPosition, string> = {
    centered: "modal-centered",
    top: "modal-top",
    bottom: "modal-bottom",
};

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = "medium",
    position = "centered",
    onSubmit,
    submitText = "Simpan",
    cancelText = "Batal",
    showFooter = true,
    isSubmitting = false,
}: ModalProps) => {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const sizeClass = sizeClassMap[size];
    const posClass = positionClassMap[position];

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit?.();
    };

    return (
        <div className={`modal-overlay ${posClass}`} onClick={onClose}>
            <div
                className={`modal-dialog ${sizeClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    {title && <h3 className="modal-title">{title}</h3>}
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">{children}</div>

                    {/* Footer */}
                    {showFooter && (
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="modal-btn modal-btn-cancel"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                {cancelText}
                            </button>
                            <button
                                type="submit"
                                className="modal-btn modal-btn-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Menyimpan..." : submitText}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Modal;
