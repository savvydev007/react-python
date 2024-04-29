// React imports
import React from "react";

function NoDataFound({ description }) {
  return (
    <div className="m-2 flex flex-col items-center justify-center h-[50vh]">
      <img
        src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
        alt="No data"
        className="h-[200px] w-[320px]"
      />
      <p className="font-semibold text-xl text-gray-800">{description}</p>
    </div>
  );
}

export default NoDataFound;
