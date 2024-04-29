import React from "react";

// Utils imports
import { NetfreePageTabs } from "../../lib/FieldConstants";

// Third part Imports
import { useTranslation } from "react-i18next";

const NetfreeTabs = ({ currentTab, handleTabChange }) => {
  const defaultLanguageValue = localStorage.getItem("DEFAULT_LANGUAGE");
  const { t } = useTranslation();

  return (
    <div className="m-5 px-2">
      <ul
        className={`${
          defaultLanguageValue === "he" ? "pl-[150px]" : "pr-[150px]"
        } pb-1 overflow-x-auto flex text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400`}
      >
        {NetfreePageTabs.map((tabValue, index) => {
          return (
            <li key={index}>
              <a
                onClick={() => handleTabChange(tabValue)}
                className={`mr-1 w-max inline-block cursor-pointer capitalize p-1 px-2 text-[#2B3674] rounded-t-sm ${
                  tabValue == currentTab
                    ? "dark:bg-gray-800 bg-gray-100 dark:text-blue-500"
                    : "hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                }`}
              >
                {t(`netfree.${tabValue}`)}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NetfreeTabs;
