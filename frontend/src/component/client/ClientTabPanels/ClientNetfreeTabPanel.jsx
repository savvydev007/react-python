// React imports
import React, { useState } from "react";

// UI Imports
import { Box, MenuItem, Select } from "@mui/material";

// UI Components Imports
import Loader from "../../common/Loader";
import FieldLabel from "../../fields/FormLabel";
import EditButtonIcon from "../../common/EditButton";

// Third part Imports
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";

// API services
import clientsService from "../../../services/clients";

// Utils imports
import { errorsToastHandler } from "../../../lib/CommonFunctions";

function ClientNetfreeTabPanel(props) {
  const {
    children,
    value,
    index,
    netfreeprofile,
    netfreeProfiles,
    setNetfreeProfile,
    isLoading,
    setClientData,
    clientData,
    ...other
  } = props;
  const { t } = useTranslation();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [editNetfree, setEditNetfree] = useState(false);
  const defaultValues = {
    netfree_profile: clientData?.netfree_profile,
  };

  const editHandler = () => {
    setEditNetfree(!editNetfree);
  };

  const { control, handleSubmit } = useForm({
    defaultValues,
    mode: "onBlur",
  });

  const submitForm = async (data, e) => {
    e.preventDefault();
    const formData = new FormData();
    const detailsData = {
      netfree_profile: data.netfree_profile,
    };

    formData.append("data", JSON.stringify(detailsData));
    clientsService
      .updateClient(formData, clientData.client_id)
      .then((res) => {
        clientsService
          .getClient(clientData.client_id)
          .then((res) => {
            setClientData(res.data);
            const { netfree_profile } = res.data;
            const matchingProfile = netfreeProfiles.filter(
              (profile) => profile.id === netfree_profile
            )[0];
            setNetfreeProfile(matchingProfile);
            setEditNetfree(false);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        errorsToastHandler(err?.response?.data?.error);
      });
  };

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {isLoading ? (
            <Loader />
          ) : (
            <div className="w-full flex">
              <div className={`mb-6 flex items-start w-full`}>
                <FieldLabel
                  className={`min-w-[120px] ${lang === "he" ? "ml-6" : "mr-6"}`}
                >
                  {t("netfree.netfreeProfile")}
                </FieldLabel>
                :
                <div className="mx-6 flex w-full justify-between">
                  {editNetfree ? (
                    <form
                      style={{
                        width: "100%",
                        position: "relative",
                      }}
                      className="flex justify-between"
                      method="post"
                      noValidate
                      autoComplete="off"
                      onSubmit={handleSubmit((data, e) => submitForm(data, e))}
                    >
                      <div className="w-[60%]">
                        <Controller
                          name="netfree_profile"
                          control={control}
                          render={({ field: { value, onChange, onBlur } }) => (
                            <Select
                              MenuProps={{
                                sx: {
                                  maxHeight: "250px",
                                },
                              }}
                              className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                              onChange={onChange}
                              value={value}
                              placeholder="Select Profile"
                            >
                              {netfreeProfiles?.map((el) => {
                                return el ? (
                                  <MenuItem key={el.id} value={el.id}>
                                    {el.name}
                                  </MenuItem>
                                ) : null;
                              })}
                            </Select>
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-end rounded-b">
                        <button
                          className="text-red-500 background-transparent font-bold uppercase px-3 py-1 text-sm outline-none focus:outline-none mr-1 mb-1"
                          type="button"
                          onClick={editHandler}
                        >
                          {t("netfree.close")}
                        </button>
                        <button
                          className="text-white text-[14px] font-small transition duration-200 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 uppercase px-3 py-1 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1"
                          type="submit"
                        >
                          {t("netfree.save")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="capitalize">{netfreeprofile?.name}</p>
                        {netfreeprofile?.description !== "" && (
                          <p className="capitalize text-gray-700">
                            ({netfreeprofile?.description})
                          </p>
                        )}
                      </div>
                      <EditButtonIcon onClick={editHandler} />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Box>
      )}
    </div>
  );
}

export default ClientNetfreeTabPanel;
