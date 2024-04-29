// React imports
import React, { useState } from "react";

// UI Imports
import { Popover } from "@mui/material";

// UI Components Imports
import NoDataFound from "../common/NoDataFound";
import AddButtonIcon from "../common/AddButton";
import ErrorMessage from "../common/ErrorMessage";
import FieldLabel from "../fields/FormLabel";
import EditButtonIcon from "../common/EditButton";

// Third part Imports
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// API services
import requestService from "../../services/request";

// Icon imports
import { HiDotsVertical } from "react-icons/hi";
import { MdDelete } from "react-icons/md";

function RequestStatusModal({ requestStatuses, fetchRequestStatuses }) {
  const { t } = useTranslation();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuanchorEl, setMenuAnchorEl] = useState(null);
  const [menuId, setMenuId] = useState(0);
  const defaultValues = {
    name: "",
  };

  const showFormHandler = (edit) => {
    setShowForm((prevForm) => !prevForm);
    setEdit(edit);
    handleStatusClose();
  };

  const handleStatusClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleStatusClose = () => {
    setAnchorEl(null);
  };

  const handleStatusMenuClick = (event, id) => {
    setMenuId(id);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const open2 = Boolean(menuanchorEl);

  const schema = yup.object().shape({
    name: yup
      .string()
      .min(
        3,
        `${t("netfree.name")} ${t("messages.mustContain")} 3 ${t(
          "messages.characters"
        )}`
      )
      .required(
        `${t("netfree.name")} ${t("clients.is")} ${t("clients.required")}`
      ),
  });

  const {
    control,
    setValue,
    reset,
    watch,
    formState: { errors, dirtyFields },
    handleSubmit,
  } = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  const submitForm = async (data, e) => {
    e.preventDefault();
    try {
      if (edit) {
        const res = await requestService.updateStatus(edit.value, data);
      } else {
        const res = await requestService.createRequestStatus(data);
      }
      fetchRequestStatuses();
    } catch (error) {
      console.log(error);
    } finally {
      setShowForm(false);
      setEdit(null);
    }
  };

  const deleteStatusHandler = async (id) => {
    try {
      const res = await requestService.deleteStatus(id);
      setEdit(null);
      fetchRequestStatuses();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <label
        onClick={handleStatusClick}
        className={`w-fit rounded-full flex items-center py-1 px-3 mr-1 text-[12px] font-medium bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
      >
        {t("requests.status")}
      </label>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleStatusClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: "180px",
              marginTop: "10px",
            },
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <>
          <div className="flex items-start justify-between px-2 p-1 shadow-md rounded-t ">
            <h3 className="text-md font-semibold">{t("requests.status")}</h3>
            <AddButtonIcon
              onClick={() => {
                showFormHandler(null);
                setValue("name", "");
              }}
            />
          </div>
          {requestStatuses && requestStatuses.length > 0 ? (
            <div className=" max-h-[calc(60vh-170px)] overflow-y-auto">
              {requestStatuses.map((status, i) => {
                return (
                  <div
                    className={`group flex items-center hover:bg-gray-200 cursor-pointer justify-between p-3 border-solid`}
                    key={i}
                  >
                    {status.label}
                    <HiDotsVertical
                      onClick={(e) => handleStatusMenuClick(e, i)}
                      className="m-1"
                    />
                    <Popover
                      open={i === menuId ? open2 : false}
                      anchorEl={menuanchorEl}
                      onClose={handleStatusMenuClose}
                      slotProps={{
                        paper: {
                          sx: {
                            marginTop: "5px",
                            marginLeft: "10px",
                            boxShadow: "0 0 10px lightgrey",
                          },
                        },
                      }}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <div className="flex items-center p-2">
                        <EditButtonIcon
                          extra="mx-1 h-[18px] w-[18px]"
                          onClick={() => {
                            showFormHandler(status);
                            setValue("name", status.label);
                          }}
                        />
                        <MdDelete
                          className="mx-1 text-blueSecondary h-[22px] w-[22px] hover:cursor-pointer"
                          onClick={() => deleteStatusHandler(status.value)}
                        />
                      </div>
                    </Popover>
                  </div>
                );
              })}
            </div>
          ) : (
            <NoDataFound description="No filters found" />
          )}
        </>
      </Popover>
      {showForm ? (
        <div className="fixed left-0 bottom-0 font-semibold z-[999] h-screen w-screen bg-[#00000080] flex justify-center items-center">
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
            <div className="relative flex items-center justify-center w-auto my-6 mx-auto min-w-[90vw] max-w-[90vw]">
              <div
                className={`w-[100%] max-w-[400px] overflow-y-auto border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none`}
              >
                <div className="flex items-start justify-between p-5 shadow-md rounded-t ">
                  <h3 className="text-2xl font-semibold">
                    {t("requests.status")}
                  </h3>
                  <button
                    className="bg-transparent border-0 text-black float-right"
                    onClick={() => setShowForm(false)}
                    type="button"
                  >
                    <span className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full">
                      x
                    </span>
                  </button>
                </div>
                <form
                  style={{
                    width: "100%",
                    position: "relative",
                  }}
                  method="post"
                  noValidate
                  autoComplete="off"
                  onSubmit={handleSubmit((data, e) => submitForm(data, e))}
                >
                  <div className="relative p-6 flex-auto max-h-[calc(90vh-170px)] overflow-y-auto">
                    <div className="mb-6 flex flex-col w-full items-start">
                      <FieldLabel className="my-2">
                        {t("netfree.name")}
                      </FieldLabel>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <input
                            value={value}
                            className="shadow appearance-none outline-none border rounded w-full py-2 px-1 text-black"
                            onChange={onChange}
                            onBlur={onBlur}
                          />
                        )}
                      />
                      {errors.name && (
                        <ErrorMessage message={errors.name.message} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end p-4 border-t border-solid border-blueGray-200 rounded-b">
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-3 py-1 text-sm outline-none focus:outline-none mr-1 mb-1"
                      type="button"
                      onClick={() => setShowForm(false)}
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
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RequestStatusModal;
