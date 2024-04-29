// React imports
import React from "react";

function FieldLabel({ children, className }) {
  return (
    <label
      className={`block break-words capitalize text-black text-end text-md font-semibold ${className}`}
    >
      {children}
    </label>
  );
}

export default FieldLabel;
