import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    wrapperClassName?: string;
}

const SearchInput = ({
    wrapperClassName = "",
    className = "",
    value,
    onChange,
    placeholder = "Cari...",
    ...rest
}: SearchInputProps) => {
    return (
        <div className={`search-box-wrapper ${wrapperClassName}`}>
            <Search size={16} className="search-icon" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={className || undefined}
                {...rest}
            />
        </div>
    );
};

export default SearchInput;
