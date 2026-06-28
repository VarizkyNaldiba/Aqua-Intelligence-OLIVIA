import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
    label?: string;
    id?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
    className?: string;
    icon?: React.ReactNode;
}

const PasswordInput = ({
    label,
    id,
    value,
    onChange,
    placeholder,
    required,
    disabled,
    autoComplete = "current-password",
    className = "",
    icon,
}: PasswordInputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className={`form-group ${className}`}>
            {label && <label htmlFor={inputId}>{label}</label>}
            <div className="auth-input-wrapper">
                {icon && <span className="auth-input-icon">{icon}</span>}
                <input
                    id={inputId}
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                />
                <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    title={
                        showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"
                    }
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;
