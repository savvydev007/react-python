/* eslint-disable */

// React imports
import { useEffect, useState } from "react";

// Third part Imports
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Icon imports
import DashIcon from "../icons/DashIcon";

export function SidebarLinks(props) {
  const { i18n } = useTranslation();
  let location = useLocation();

  const { routes } = props;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // verifies if routeName is the one active (in browser input)
  const activeRoute = (route) => {
    let isActive = false;
    if (route?.children?.length > 0) {
      for (const routeChild of route.children) {
        if (location.pathname.includes(routeChild?.path)) {
          isActive = true;
        }
      }
    } else {
      isActive = location.pathname.includes(route.path);
    }
    return isActive;
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  useEffect(() => {
    if (location.pathname.includes("settings")) {
      setIsSettingsOpen(true);
    } else {
      setIsSettingsOpen(false);
    }
  }, [location.pathname]);

  const GenerateMenuLink = ({ route, index, type }) => {
    return (
      <div className="relative mb-3 flex hover:cursor-pointer">
        <li
          className={`my-[3px] flex cursor-pointer items-center ${
            type === "sub-menu" ? "px-3" : "px-8"
          }`}
          key={route.name + index}
        >
          <span
            className={`${
              activeRoute(route) === true
                ? "font-bold text-brand-500 dark:text-white"
                : "font-medium text-gray-600"
            }`}
          >
            {route.icon ? route.icon : <DashIcon />}
          </span>
          <p
            className={`leading-1 mx-4 flex ${
              activeRoute(route) === true
                ? "font-bold text-navy-700 dark:text-white"
                : "font-medium text-gray-600"
            }`}
          >
            {route.name}
          </p>
        </li>
        {activeRoute(route) ? (
          <div
            className={`absolute bottom-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400 ${
              i18n.dir() === "rtl"
                ? type === "sub-menu"
                  ? "right-0 w-[1px]"
                  : "left-0"
                : type === "sub-menu"
                ? "left-0 w-[1px]"
                : "right-0"
            }`}
          />
        ) : null}
      </div>
    );
  };

  const createLinks = (routes) => {
    const navigate = useNavigate();
    const logout = () => {
      localStorage.clear();
      navigate("/signin");
    };
    return routes.map((route, index) => {
      return route.type === "top-menu" ? (
        <div key={route.name + index}>
          <div onClick={toggleSettings}>
            <GenerateMenuLink
              key={route.name + index}
              index={index}
              route={route}
              type="menu"
            />
          </div>
          <div>
            {isSettingsOpen
              ? route.children.map((subMenu, subIndex) => {
                  return (
                    <div key={subMenu.name + subIndex} className="px-10">
                      <Link to={"/" + subMenu.path}>
                        <GenerateMenuLink
                          index={subIndex}
                          route={subMenu}
                          type="sub-menu"
                        />
                      </Link>
                    </div>
                  );
                })
              : null}
          </div>
        </div>
      ) : route.type === "button" ? (
        <div key={route.name + index} onClick={logout}>
          <GenerateMenuLink
            index={route.name + index}
            route={route}
            type="menu"
          />
        </div>
      ) : (
        <Link key={route.name + index} to={"/" + route.path}>
          <GenerateMenuLink
            index={route.name + index}
            route={route}
            type="menu"
          />
        </Link>
      );
    });
  };
  // BRAND
  return createLinks(routes);
}

export default SidebarLinks;
