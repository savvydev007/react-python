// React imports
import { useEffect, useState } from "react";

// UI Components Imports
import Categories from "../component/Netfree/category/Index";
import Websites from "../component/Netfree/Websites";

const NetFree = () => {
  const [currentTab, setCurrentTab] = useState("categories");
  const handleTabChange = (tabValue) => {
    setCurrentTab(tabValue);
    localStorage.setItem("CURRENT_NETFREE_TAB", tabValue);
  };
  useEffect(() => {
    const currentTabValue = localStorage.getItem("CURRENT_NETFREE_TAB");
    if (currentTabValue) {
      setCurrentTab(currentTabValue);
    }
  }, []);
  return (
    <>
      {currentTab === "categories" && (
        <Categories currentTab={currentTab} handleTabChange={handleTabChange} />
      )}
      {currentTab === "websites" && (
        <Websites currentTab={currentTab} handleTabChange={handleTabChange} />
      )}
    </>
  );
};

export default NetFree;
