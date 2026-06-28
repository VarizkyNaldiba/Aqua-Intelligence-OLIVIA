import { cloneElement, isValidElement } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: ReactNode;
    wrapperClassName?: string;
}

/**
 * Clones the icon element and applies the positioning className directly
 * so the CSS absolute-positioning works on the SVG itself (not a wrapper).
 */
const renderIcon = (icon: ReactNode): ReactNode => {
    if (isValidElement<{ className?: string }>(icon)) {
        const existing = icon.props.className || "";
        return cloneElement(icon, {
            className: `auth-input-icon ${existing}`.trim(),
        });
    }
    return <span className="auth-input-icon">{icon}</span>;
};

const TextInput = ({
    label,
    icon,
    wrapperClassName = "",
    className = "",
    id,
    type = "text",
    ...rest
}: TextInputProps) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className={`form-group ${wrapperClassName}`}>
            {label && <label htmlFor={inputId}>{label}</label>}
            {icon ? (
                <div className="auth-input-wrapper">
                    {renderIcon(icon)}
                    <input
                        id={inputId}
                        type={type}
                        className={`auth-input ${className}`}
                        {...rest}
                    />
                </div>
            ) : (
                <input
                    id={inputId}
                    type={type}
                    className={className || undefined}
                    {...rest}
                />
            )}
        </div>
    );
};

export default TextInput;
