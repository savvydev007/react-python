// React imports
import React from "react";

// Icon imports
import { BsInfoCircle } from "react-icons/bs";

const TooltipButtonIcon = (props) => {
  const { extra } = props;
  return (
    <button>
      <BsInfoCircle
        className={`${extra} w-3 h-3 hover:cursor-pointer`}
        onClick={props.onClick}
      />
    </button>
  );
};

export default TooltipButtonIcon;
