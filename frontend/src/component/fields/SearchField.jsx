// React imports
import React from "react";

// Third part Imports
import { useTranslation } from "react-i18next";

// Icon imports
import { FiSearch } from "react-icons/fi";

function SearchField(props) {
  const {
    label,
    id,
    extra,
    type,
    placeholder,
    variant,
    disabled,
    onChange,
    name,
    noUnderline,
    borderRadius,
  } = props;

  const { i18n } = useTranslation();

  return (
    <div
      className={`${extra} ${
        i18n.dir() === "rtl" ? "text-right" : "text-left"
      }`}
    >
      {label && (
        <label
          htmlFor={id}
          className={`text-[10px] capitalize flex p-1 truncate md:text-[14px] text-navy-700 ${
            variant === "auth" ? "font-medium" : "font-bold"
          }`}
        >
          {label}
        </label>
      )}
      <div className="flex justify-center items-end relative">
        <input
          disabled={disabled}
          type={type}
          id={id}
          onChange={onChange}
          name={name}
          placeholder={placeholder}
          className={`mt-2 h-7 w-full px-6 text-[14px] bg-transparent  outline-none bg-lightPrimary ${
            !noUnderline && "border-b-[1px] border-[#2B3674]"
          } ${borderRadius && "rounded-full"}`}
        />
        <span
          className={`absolute ${
            i18n.dir() === "rtl"
              ? variant === "auth"
                ? "right-1"
                : "right-[10px]"
              : variant === "auth"
              ? "left-1"
              : "left-[10px]"
          } top-3/5 transform -translate-y-1/2`}
        >
          <FiSearch className="h-3.5 w-3.5 text-[#2B3674]" />
        </span>
      </div>
    </div>
  );
}

export default SearchField;
