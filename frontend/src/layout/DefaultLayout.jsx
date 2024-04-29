// React imports
import React, { useEffect, useState } from "react";

// UI Components Imports
import Sidebar from "../component/common/Sidebar";
import Navbar from "../component/common/Navbar";
import AlertPopup from "../component/common/AlertPopup";

// Third part Imports
import { useTranslation } from "react-i18next";

const DefaultLayout = ({ children, route }) => {
  const [open, setOpen] = useState(true);

  const { i18n } = useTranslation();

  useEffect(() => {
    window.addEventListener("resize", () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true)
    );
  }, []);

  return (
    <div className="flex gap-4 max-h-[100vh] md:overflow-y-hidden h-full w-full">
      <AlertPopup />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="h-full w-full bg-lightPrimary">
        <main
          className={`mx-[12px] h-full flex-none transition-all md:pe-2 ${
            i18n.dir() === "rtl" ? "xl:mr-[250px]" : "xl:ml-[250px]"
          }`}
        >
          <div className="h-full md:h-[100vh]">
            <Navbar
              onOpenSidenav={() => setOpen(true)}
              logoText={"Horizon UI Tailwind React"}
              brandText={
                route.path.includes(":")
                  ? location.pathname.substring(1)
                  : route.path
              }
              brandName={route.name}
            />
            <div
              className={`pt-5s mx-auto mb-auto h-[calc(100%-100px)] p-2 md:pr-2 ${
                i18n.dir() === "rtl" ? "xl:mr-3" : "xl:ml-3"
              }`}
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DefaultLayout;
