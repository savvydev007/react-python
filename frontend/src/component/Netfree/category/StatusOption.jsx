// React imports
import React, { useState } from "react";

// Third part Imports
import { useTranslation } from "react-i18next";

// Icon imports
import { MdExpandMore } from "react-icons/md";

function StatusOption({ dataValue, getData, deleteStatusFn }) {
  const [clicked, setClicked] = useState(false);
  const { t, i18n } = useTranslation();

  const deleteStatus = async (id) => {
    try {
      const res = await deleteStatusFn(id);
      getData();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="px-3 relative py-1 bg-[#F4F7FE] rounded-full flex gap-2 whitespace-nowrap">
      {dataValue.request_status.email_request_status.label}
      <MdExpandMore
        onClick={() => setClicked((prev) => !prev)}
        className="h-5 w-5 text-blueSecondary cursor-pointer"
      />
      {clicked && (
        <div
          className={`absolute top-[20px] z-10 drop-shadow-md bg-white cursor-pointer ${
            i18n.dir() === "rtl" ? "left-[-15px]" : "right-[-15px]"
          }`}
        >
          <div
            className="py-1 px-3 hover:bg-[#f2f3f5]"
            onClick={() => deleteStatus(dataValue.request_status.id)}
          >
            {t("netfree.remove")}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusOption;
