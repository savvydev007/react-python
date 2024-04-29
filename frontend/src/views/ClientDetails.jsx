// React imports
import React, { useEffect, useState } from "react";

// UI Imports
import { Tabs, Tab, Box } from "@mui/material";

// UI Components Imports
import DetailsTabPanel from "../component/client/ClientTabPanels/DetailsTabPanel";
import RequestsTabPanel from "../component/client/ClientTabPanels/RequestsTabPanel";
import ClientNetfreeTabPanel from "../component/client/ClientTabPanels/ClientNetfreeTabPanel";
import Loader from "../component/common/Loader";
import ClientModal from "../component/client/ClientModal";
import DeleteConfirmationModal from "../component/common/DeleteConfirmationModal";

// Third part Imports
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// API services
import clientsService from "../services/clients";
import categoryService from "../services/category";

// Icon imports
import { MdDelete } from "react-icons/md";
import { FaUser } from "react-icons/fa";

function ClientDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const tabs = [
    t("sidebar.details"),
    t("sidebar.netfree"),
    t("sidebar.request"),
  ];
  const [isLoading, setIsloading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [value, setValue] = useState(0);
  const [netfreeprofile, setNetfreeProfile] = useState(null);
  const [clientModal, setClientModal] = useState(false);
  const [netfreeprofiles, setNetfreeProfiles] = useState(null);
  const [fullFormData, setFullFormData] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(false);

  const getClientDataHandler = async () => {
    setIsloading(true);
    try {
      const profilesData = await categoryService.getProfilesList();
      const netfreeProfiles = profilesData.data.data;
      clientsService
        .getClient(id)
        .then((res) => {
          setClientData(res.data);
          setIsloading(false);
          if (netfreeProfiles.length > 0) {
            const { netfree_profile } = res.data;
            const matchingProfile = netfreeProfiles.filter(
              (profile) => profile.id === netfree_profile
            )[0];
            setNetfreeProfile(matchingProfile);
          }
        })
        .catch((err) => {
          console.log(err);
          setIsloading(false);
        });
    } catch (error) {
      console.log(err);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const deleteClientHandler = async (id) => {
    try {
      const res = await clientsService.deleteClient(id);
      if (res.status > 200) {
        navigate("/clients");
        toast.success(t("common.deleteSuccess"));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchNetfreeProfiles = async () => {
    const profilesListData = await categoryService.getProfilesList();
    setNetfreeProfiles(profilesListData.data.data);
  };

  const fetchFullFormData = async () => {
    const formData = await clientsService.getFullformData();
    let formFields = [];
    formData.data.result.forEach((block) => {
      block.field.forEach((field) => {
        formFields.push(field);
      });
    });
    // Array of objects
    const arr = formFields.map((item) => {
      return {
        [item.field_slug]: item.display,
      };
    });

    setFullFormData(formFields);
  };

  useEffect(() => {
    fetchFullFormData();
    fetchNetfreeProfiles();
    getClientDataHandler();
  }, [lang]);

  return (
    <>
      <div className="w-full h-full bg-white rounded-3xl p-5">
        {isLoading ? (
          <div className="h-[calc(100vh-210px)] w-full flex justify-center items-center">
            <Loader />
          </div>
        ) : (
          <>
            {clientData && !isLoading ? (
              <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
                <div className="flex p-2">
                  <div className="p-2 mx-2 rounded-lg shadow-md">
                    <FaUser color="lightgrey" size={80} />
                  </div>
                  <div className="mx-2 flex flex-col w-[80%] text-sm">
                    <div className={`mb-1 flex w-full items-start`}>
                      <span className="font-semibold w-1/6  w-[120px]">
                        {t("clients.id")}
                      </span>
                      <p> : {clientData?.client_id}</p>
                    </div>
                    <div className={`mb-1 flex w-full items-start`}>
                      <span className="font-semibold w-1/6  w-[120px]">
                        {t("netfree.netfreeProfile")}
                      </span>
                      :
                      <div className="mx-1">
                        <p className="capitalize">{netfreeprofile?.name}</p>
                        {netfreeprofile?.description !== "" && (
                          <p className="capitalize text-gray-700">
                            ({netfreeprofile?.description})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-auto w-full flex items-center justify-end">
                    {/* <MdEdit className="text-blueSecondary mx-2 w-5 h-5 hover:cursor-pointer" onClick={() => editClientHandler(clientData)} /> */}
                    <MdDelete
                      className="text-blueSecondary mx-2 w-5 h-5 hover:cursor-pointer"
                      onClick={() => setConfirmationModal(true)}
                    />
                  </div>
                </div>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="basic tabs example"
                  >
                    {tabs.map((tabItem, i) => {
                      return (
                        <Tab
                          key={i}
                          label={
                            <>
                              <h5 className="text-start text-[12px] capitalize py-2 md:text-[16px] font-bold text-[#2B3674] w-[100%] flex items-center justify-between">
                                {tabItem}
                              </h5>
                            </>
                          }
                        />
                      );
                    })}
                  </Tabs>
                </Box>
                {value === 0 && (
                  <DetailsTabPanel
                    isLoading={isLoading}
                    clientData={clientData}
                    setClientData={setClientData}
                    value={value}
                    index={0}
                  />
                )}
                {value === 1 && netfreeprofiles && (
                  <ClientNetfreeTabPanel
                    isLoading={isLoading}
                    setNetfreeProfile={setNetfreeProfile}
                    clientData={clientData}
                    setClientData={setClientData}
                    netfreeprofile={netfreeprofile}
                    netfreeProfiles={netfreeprofiles}
                    value={value}
                    index={1}
                  />
                )}
                {value === 2 && (
                  <RequestsTabPanel id={id} value={value} index={2} />
                )}
              </Box>
            ) : (
              t("clients.noClientFound") + " " + id
            )}
          </>
        )}
        {netfreeprofiles && clientModal && (
          <ClientModal
            showModal={clientModal}
            setShowModal={setClientModal}
            newClient={false}
            client={clientData}
            netfreeProfiles={netfreeprofiles}
            fullFormData={fullFormData}
            onClick={() => {
              getClientDataHandler();
            }}
          />
        )}
        {confirmationModal && (
          <DeleteConfirmationModal
            showModal={confirmationModal}
            setShowModal={setConfirmationModal}
            onClick={() => deleteClientHandler(clientData?.client_id)}
          />
        )}
      </div>
    </>
  );
}

export default ClientDetails;
