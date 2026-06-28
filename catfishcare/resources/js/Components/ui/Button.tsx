import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant =
    | "primary"
    | "action"
    | "logout"
    | "ghost"
    | "add"
    | "action-row"
    | "inline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    children: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
    primary: "auth-submit-btn",
    action: "btn-action",
    logout: "btn-logout",
    ghost: "sim-btn",
    add: "btn-add-pond",
    "action-row": "action-row-btn",
    inline: "pond-card-btn inline-btn",
};

const Button = ({
    variant = "action",
    icon,
    isLoading = false,
    loadingText,
    children,
    className = "",
    disabled,
    type = "button",
    ...rest
}: ButtonProps) => {
    const baseClass = variantClassMap[variant] || "btn-action";

    return (
        <button
            type={type}
            className={`${baseClass} ${className}`}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading ? (
                <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{loadingText || "Memproses..."}</span>
                </>
            ) : (
                <>
                    {icon}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
