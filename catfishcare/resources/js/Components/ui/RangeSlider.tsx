interface RangeSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: string;
    max: string;
    step: string;
    displayValue: string;
    valueClassName?: string;
    wrapperClassName?: string;
}

const RangeSlider = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    displayValue,
    valueClassName = "",
    wrapperClassName = "",
}: RangeSliderProps) => {
    return (
        <div className={`slider-item-wrapper ${wrapperClassName}`}>
            <div className="slider-labels">
                <span className="lbl">{label}</span>
                <span className={`val ${valueClassName}`}>{displayValue}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="slider-input"
            />
        </div>
    );
};

export default RangeSlider;
