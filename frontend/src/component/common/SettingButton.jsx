// React imports
import React from "react";

// Icon imports
import { FiSettings } from "react-icons/fi";

const SettingButtonIcon = (props) => {
  const { extra } = props;
  return (
    <button className="bg-[#F4F7FE] rounded-full p-1">
      <FiSettings
        className={`${extra} bg-white rounded-full text-blueSecondary w-5 h-5 hover:cursor-pointer`}
        onClick={props.onClick}
      />
    </button>
  );
};

export default SettingButtonIcon;
