// React imports
import React from "react";

function BlockButton(props) {
  const { onClick, active, classes } = props;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-2 text-start w-[100%] ${classes} ${
        active &&
        "bg-[#E7F1FF] rounded-md border-solid border-l-4 border-l-[#3978fe]"
      }`}
    >
      {props.children ? props.children : "button"}
    </button>
  );
}

export default React.memo(BlockButton);
