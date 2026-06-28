import type { SelectHTMLAttributes, ReactNode } from "react";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    icon?: ReactNode;
    wrapperClassName?: string;
}

const Select = ({
    label,
    options,
    icon,
    wrapperClassName = "",
    className = "",
    value,
    onChange,
    ...rest
}: SelectProps) => {
    return (
        <div className={`ai-model-selector-bar ${wrapperClassName}`}>
            {icon}
            {label && <span>{label}</span>}
            <select
                value={value}
                onChange={onChange}
                className={`model-select-dropdown ${className}`}
                {...rest}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select;
