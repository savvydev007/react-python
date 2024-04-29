// Third part Imports
import { useTranslation } from "react-i18next";

// Custom hooks imports
import useAlert from "../../Hooks/useAlert";

const AlertPopup = () => {
  const { text, type } = useAlert();
  const { i18n } = useTranslation();

  if (text && type) {
    return (
      <div
        className={`z-[9999] absolute ${
          i18n.dir() === "rtl" ? "left-[20px]" : "right-[20px]"
        } bottom-[20px] px-4 py-2 text-[14px] rounded-lg shadow-md ${type}`}
      >
        {text}
      </div>
    );
  } else {
    return <></>;
  }
};

export default AlertPopup;
