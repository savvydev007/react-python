/* eslint-disable */

// UI Components Imports
import SidebarLinks from "./SidebarLinks";
import Request from "../../views/Request";
import Emails from "../../views/Emails";
import NetFree from "../../views/NetFree";
import Clients from "../../views/Clients";
import ClientsForm from "../../views/ClientsForm";
import Logs from "../../views/Logs";
import Users from "../../views/Users";

// Third part Imports
import { useTranslation } from "react-i18next";

// Icon imports
import { HiX } from "react-icons/hi";
import {
  MdOutlineContactSupport,
  MdOutlineEmail,
  MdLogout,
  MdOutlineSettings,
} from "react-icons/md";
import { IoLogoBuffer } from "react-icons/io";
import { HiOutlineUserGroup, HiOutlineUsers } from "react-icons/hi2";
import NetfreeIcon from "../../constants/icons/NetfreeIcon";

const Sidebar = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const routes = [
    // {
    //   name: t('sidebar.dashboard'),
    //   path: "dashboard",
    //   type: 'menu',
    //   icon: <MdHome className="h-6 w-6" />,
    //   component: <Dashboard />,
    // },
    {
      name: t("sidebar.clients"),
      path: "clients",
      type: "menu",
      icon: <HiOutlineUserGroup className="h-6 w-6" />,
      component: <Clients />,
    },
    {
      name: t("sidebar.request"),
      path: "request",
      type: "menu",
      icon: <MdOutlineContactSupport className="h-6 w-6" />,
      component: <Request />,
    },
    {
      name: t("sidebar.settings"),
      type: "top-menu",
      icon: <MdOutlineSettings className="h-6 w-6" />,
      children: [
        {
          name: t("sidebar.clients"),
          path: "settings/formSettings",
          type: "menu",
          icon: <HiOutlineUserGroup className="h-6 w-6" />,
          component: <ClientsForm />,
        },
        {
          name: t("sidebar.users"),
          path: "settings/users",
          type: "menu",
          icon: <HiOutlineUsers className="h-6 w-6" />,
          component: <Users />,
        },
        {
          name: t("sidebar.netfree"),
          path: "settings/netfree",
          type: "menu",
          icon: <NetfreeIcon className="h-6 w-6" />,
          component: <NetFree />,
        },
        {
          name: t("sidebar.emails"),
          path: "settings/emails",
          type: "menu",
          icon: <MdOutlineEmail className="h-6 w-6" />,
          component: <Emails />,
        },
        {
          name: t("sidebar.logs"),
          path: "settings/logs",
          type: "menu",
          icon: <IoLogoBuffer className="h-6 w-6" />,
          component: <Logs />,
        },
      ],
    },
    // {
    //   name: t('sidebar.profile'),
    //   path: "profile",
    //   type: 'menu',
    //   icon: <MdPerson className="h-6 w-6" />,
    //   component: <Profile />,
    // },
    {
      name: t("sidebar.logout"),
      path: "profile",
      type: "button",
      icon: <MdLogout className="h-6 w-6" />,
    },
  ];

  return (
    <div
      className={`sm:none duration-175 xl:min-w-[250px] fixed linear !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all md:!z-50 lg:!z-50 xl:!z-0 ${
        open
          ? i18n.dir() === "ltr"
            ? `left-0`
            : "right-0"
          : i18n.dir() === "ltr"
          ? "-left-96"
          : "-right-96"
      }`}
    >
      <span
        className="absolute top-2 block cursor-pointer end-2 xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className={`mx-auto mt-5 flex items-center`}>
        <div className="mt-1 h-2.5 font-poppins text-[18px] font-bold uppercase text-navy-700 ms-1 dark:text-white">
          {t("sidebar.title")}
        </div>
      </div>
      <div className={`mb-5 mt-[40px] h-px bg-gray-300 dark:bg-white/30`} />
      <ul className="mb-auto pt-1">
        <SidebarLinks routes={routes} />
      </ul>
    </div>
  );
};

export default Sidebar;
