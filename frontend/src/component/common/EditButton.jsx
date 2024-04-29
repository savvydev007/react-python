// React imports
import React from "react";

// Icon imports
import { BsPencilSquare } from "react-icons/bs";

const EditButtonIcon = (props) => {
  const { extra } = props;
  return (
    <BsPencilSquare
      className={`${extra} w-3 h-3 hover:cursor-pointer`}
      onClick={props.onClick}
    />
  );
};

export default EditButtonIcon;
