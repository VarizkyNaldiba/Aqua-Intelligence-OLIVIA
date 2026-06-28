interface RadioOption {
    value: string;
    label: string;
}

interface RadioGroupProps {
    name: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    wrapperClassName?: string;
    disabled?: boolean;
}

const RadioGroup = ({
    name,
    options,
    value,
    onChange,
    label,
    wrapperClassName = "",
    disabled = false,
}: RadioGroupProps) => {
    return (
        <div className={`form-group ${wrapperClassName}`}>
            {label && <label>{label}</label>}
            <div
                style={{
                    display: "flex",
                    gap: "15px",
                    marginTop: "8px",
                    flexWrap: "wrap",
                }}
            >
                {options.map((opt) => (
                    <label key={opt.value} className="radio-label">
                        <input
                            type="radio"
                            name={name}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                            disabled={disabled}
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default RadioGroup;
