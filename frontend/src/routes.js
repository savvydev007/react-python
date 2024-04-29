// React imports
import React from "react";

// UI Components Imports
import Request from "./views/Request";
import Emails from "./views/Emails";
import NetFree from "./views/NetFree";
import Clients from "./views/Clients";
import ClientDetails from "./views/ClientDetails";
import EmailTemplating from "./views/EmailTemplating";

// Icon imports
import { MdOutlineContactSupport, MdOutlineSettings } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi2";

const routes = [
  // {
  //   name: t('sidebar.dashboard'),
  //   path: "dashboard",
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
    name: t("clients.clientDetails"),
    path: "clients/:clientId",
    component: <ClientDetails />,
  },
  {
    name: t("clients.clientFormSettings"),
    path: "settings/formSettings",
    component: <ClientsForm />,
  },
  {
    name: t("sidebar.request"),
    path: "request",
    icon: <MdOutlineContactSupport className="h-6 w-6" />,
    component: <Request />,
  },
  {
    name: t("sidebar.netfree"),
    path: "settings/netfree",
    type: "menu",
    icon: <MdOutlineSettings className="h-6 w-6" />,
    component: <NetFree />,
  },
  {
    name: t("sidebar.emails"),
    path: "settings/emails",
    type: "menu",
    icon: <MdOutlineSettings className="h-6 w-6" />,
    component: <Emails />,
  },
  {
    name: t("sidebar.templating"),
    path: "settings/emails/templating",
    type: "menu",
    icon: <MdOutlineSettings className="h-6 w-6" />,
    component: <EmailTemplating />,
  },
  // {
  //   name: t('sidebar.profile'),
  //   path: "profile",
  //   icon: <MdPerson className="h-6 w-6" />,
  //   component: <Profile />,
  // }
];

export default routes;
