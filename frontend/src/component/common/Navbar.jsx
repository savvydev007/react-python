// UI Components Imports
import LanguageSelect from "./LanguageSelect";

// Third part Imports
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Icon imports
import { FiAlignJustify } from "react-icons/fi";

const Navbar = (props) => {
  const { onOpenSidenav, brandText, brandName } = props;
  const { t, i18n } = useTranslation();
  const routeTextArray = brandText.split("/").map((item) => {
    if (isNaN(Number(item))) {
      return t(`routes.${item}`);
    }
    return item;
  });

  return (
    <nav
      className={`sticky flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d] ${
        i18n.dir() === "rtl" ? "xl:mr-3" : "xl:ml-3"
      }`}
    >
      <div className="ms-[6px]">
        <div className="h-6 w-auto pt-1">
          <a
            className="text-sm font-normal text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href=" "
          >
            {t("common.pages")}
            <span className="mx-1 text-sm text-navy-700 hover:text-navy-700 dark:text-white">
              {" "}
              /{" "}
            </span>
          </a>
          <Link
            className="text-sm font-normal capitalize text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            to="#"
          >
            {routeTextArray.join(" / ")}
          </Link>
        </div>
        <p className="shrink text-[28px] capitalize text-navy-700 dark:text-white">
          <Link
            to="#"
            className="font-bold capitalize hover:text-navy-700 dark:hover:text-white"
          >
            {brandName}
          </Link>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-auto w-auto items-center justify-around gap-2 rounded-full bg-white px-3 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:flex-grow-0 md:gap-1 xl:gap-2">
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        <LanguageSelect
          customClass={`p-1 rounded-sm bg-white dark:!bg-navy-800 dark:text-white outline-0`}
        />
      </div>
    </nav>
  );
};

export default Navbar;
