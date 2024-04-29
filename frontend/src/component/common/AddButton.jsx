// React imports
import React from "react";

// Icon imports
import { BsPlusCircleFill } from "react-icons/bs";

const AddButtonIcon = (props) => {
  const { extra } = props;
  const clickHandler = (e) => {
    e.preventDefault();
    props.onClick();
  };
  return (
    <button className="bg-[#F4F7FE] rounded-full p-1" onClick={clickHandler}>
      <BsPlusCircleFill
        className={`${extra} bg-white rounded-full text-blueSecondary w-5 h-5 hover:cursor-pointer`}
      />
    </button>
  );
};

export default AddButtonIcon;
