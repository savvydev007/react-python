// React imports
import React, { useEffect, useState } from "react";

// UI Imports
import { Select, MenuItem, FormControl, Popover } from "@mui/material";

// UI Components Imports
import NoDataFound from "../common/NoDataFound";
import EditButtonIcon from "../common/EditButton";
import AddButtonIcon from "../common/AddButton";
import Loader from "../common/Loader";
import ErrorMessage from "../common/ErrorMessage";
import CustomCheckBox from "../fields/checkbox";
import FieldLabel from "../fields/FormLabel";

// Third part Imports
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// API services
import clientsService from "../../services/clients";

// Icon imports
import { FaFilter } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
import { IoIosAdd } from "react-icons/io";

function FilterModal({
  showModal,
  setShowModal,
  fullFormData,
  filters,
  fetchClientsData,
  fetchFullFormData,
  applyFilterHandler,
}) {
  const { t } = useTranslation();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);
  const [newFilter, setNewFilter] = useState(true);
  const [editFilter, setEditFilter] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuanchorEl, setMenuAnchorEl] = useState(null);
  const [menuId, setMenuId] = useState(0);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuClick = (event, id) => {
    setMenuId(id);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const open2 = Boolean(menuanchorEl);

  const defaultValues = {
    filter_name: "",
    default: false,
    filters: [],
  };

  const schema = yup.object().shape({
    filter_name: yup
      .string()
      .min(3, t("clients.filterNameMinCondition"))
      .required(
        `${t("clients.filterName")} ${t("clients.is")} ${t("clients.required")}`
      ),
    filters: yup
      .array()
      .of(
        yup.object().shape({
          attr_name: yup
            .string()
            .required(
              `${t("clients.condition")} ${t("clients.field")} ${t(
                "clients.is"
              )} ${t("clients.required")}`
            ),
          condition: yup
            .string()
            .required(
              `${t("clients.condition")} ${t("clients.is")} ${t(
                "clients.required"
              )}`
            ),
          value: yup
            .string()
            .notRequired(
              `${t("clients.condition")} ${t("clients.value")} ${t(
                "clients.is"
              )} ${t("clients.required")}`
            ),
        })
      )
      .min(1, t("clients.minimumConditions"))
      .required(
        `${t("clients.conditions")} ${t("clients.are")} ${t(
          "clients.required"
        )}`
      ),
    default: yup.boolean().notRequired(),
  });

  const {
    control,
    setValue,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  const fetchFilterOptions = async () => {
    setIsloading(true);
    try {
      const filterOptions = await clientsService.getClientFilterOptions();
      setFilterOptions(filterOptions.data);
      setIsloading(false);
    } catch (error) {
      console.log(error);
      setIsloading(false);
    }
  };

  const addConditionHandler = (type) => {
    setConditions((prev) => [
      ...prev,
      {
        id: (Math.random() + 1).toString(36).substring(7),
        attr_name: fullFormData[0]?.field_slug,
        condition: "",
        value: "",
        operator: type,
      },
    ]);
  };

  const filterFieldConditionUpdate = (type, value, id) => {
    const filteredConditions = conditions;
    const condition = conditions.filter((condition) => id === condition.id)[0];
    const index = conditions.findIndex((condition) => condition.id === id);
    condition[type] = value;
    filteredConditions[index] = condition;
    setConditions((prev) => [...filteredConditions]);
    setValue("filters", filteredConditions, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const submitForm = async (data, e) => {
    e.preventDefault();
    if (newFilter) {
      const res = await clientsService.createFilter(data);
    } else {
      const updateData = {
        filter_group_id: editFilter?.id,
        name: data.filter_name,
        ...data,
      };
      const res = await clientsService.updateFilterGroup(updateData);
    }
    fetchClientsData();
    setShowForm(false);
    setShowModal(false);
  };

  const deleteFilterHandler = async (id) => {
    try {
      const res = await clientsService.deleteFilter({
        filter_group_id: id,
      });
      handleFilterMenuClose();
      fetchClientsData();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteFilterCondition = (id) => {
    const conditionsData = conditions.filter((item) => item.id !== id);
    setConditions(conditionsData);
    setValue("filters", conditionsData, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const editFilterHandler = (filter) => {
    handleFilterClose();
    handleFilterMenuClose();
    setShowModal(true);
    setNewFilter(false);
    setEditFilter(filter);
    setShowForm(true);
    setValue("filter_name", filter?.name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setConditions(filter?.filters);
    setValue("filters", filter?.filters, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("default", filter?.fg_default, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleCloseFilter = () => {
    setShowModal(false);
    setShowForm(false);
  };

  const openFilterModal = () => {
    handleFilterClose();
    handleFilterMenuClose();
    setConditions([]);
    setEditFilter(null);
    setNewFilter(true);
    setShowForm(true);
    setShowModal(true);
    reset();
  };

  useEffect(() => {
    fetchFullFormData();
    fetchFilterOptions();
  }, [lang]);

  return (
    <>
      <label
        className={`w-fit rounded-full flex items-center py-1 px-3 mr-1 text-[12px] font-medium bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
        onClick={handleFilterClick}
      >
        <FaFilter
          className={`rounded-full text-white ${
            lang === "he" ? "ml-1" : "mr-1"
          } w-3 h-3 hover:cursor-pointer`}
        />
        {t("clients.filters")}
      </label>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
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
            <h3 className="text-md font-semibold">{t("clients.filters")}</h3>
            <AddButtonIcon onClick={openFilterModal} />
          </div>
          {filters.length > 0 ? (
            <div className=" max-h-[calc(60vh-170px)] overflow-y-auto">
              {filters.map((filter, i) => {
                return (
                  <div
                    className={`group flex ${
                      filter?.fg_default && "bg-gray-200"
                    } items-center hover:bg-gray-200 cursor-pointer justify-between p-3 border-solid`}
                    key={i}
                  >
                    {filter.name}
                    <HiDotsVertical
                      onClick={(e) => handleFilterMenuClick(e, i)}
                      className="m-1"
                    />
                    <Popover
                      open={i === menuId ? open2 : false}
                      anchorEl={menuanchorEl}
                      onClose={handleFilterMenuClose}
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
                        {filter?.fg_default ? (
                          <button
                            className="text-red-500 mx-1 background-transparent font-semibold uppercase px-3 py-1 text-sm outline-none focus:outline-none"
                            type="button"
                            onClick={() => {
                              applyFilterHandler(filter, false);
                              setMenuAnchorEl(null);
                            }}
                          >
                            {t("netfree.remove")}
                          </button>
                        ) : (
                          <button
                            className="text-white mx-1 text-sm transition duration-200 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 uppercase px-2 py-1 rounded shadow hover:shadow-lg outline-none focus:outline-none"
                            type="button"
                            onClick={() => {
                              applyFilterHandler(filter, true);
                              setMenuAnchorEl(null);
                            }}
                          >
                            {t("clients.apply")}
                          </button>
                        )}
                        <EditButtonIcon
                          extra="mx-1 h-[18px] w-[18px]"
                          onClick={() => editFilterHandler(filter)}
                        />
                        <MdDelete
                          className="mx-1 text-blueSecondary h-[22px] w-[22px] hover:cursor-pointer"
                          onClick={() => deleteFilterHandler(filter?.id)}
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
      {showModal ? (
        <div className="fixed left-0 bottom-0 font-semibold z-[999] h-screen w-screen bg-[#00000080] flex justify-center items-center">
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto min-w-[90vw] max-w-[90vw]">
              <div
                className={`w-[100%] ${
                  !showForm
                    ? "max-w-[400px]"
                    : "min-w-[80vw] md:min-w-[70vw] lg:min-w-[60vw]"
                }  overflow-y-auto border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none`}
              >
                <div className="flex items-start justify-between p-5 shadow-md rounded-t ">
                  <h3 className="text-2xl font-semibold">
                    {t("clients.filters")}
                  </h3>
                  <button
                    className="bg-transparent border-0 text-black float-right"
                    onClick={() => setShowModal(false)}
                    type="button"
                  >
                    <span className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full">
                      x
                    </span>
                  </button>
                </div>
                {showForm && (
                  <>
                    {isLoading ? (
                      <Loader />
                    ) : (
                      <form
                        style={{
                          width: "100%",
                          position: "relative",
                        }}
                        method="post"
                        noValidate
                        autoComplete="off"
                        onSubmit={handleSubmit((data, e) =>
                          submitForm(data, e)
                        )}
                      >
                        <div className="relative p-6 flex-auto max-h-[calc(90vh-170px)] overflow-y-auto">
                          <div className="mb-6 flex w-full">
                            <FieldLabel
                              className={`w-[30%] ${
                                lang === "he" ? "ml-6" : "mr-6"
                              }`}
                            >
                              {t("clients.filterName")}
                            </FieldLabel>
                            <div className="w-[60%] mx-2">
                              <Controller
                                name="filter_name"
                                control={control}
                                render={({
                                  field: { value, onChange, onBlur },
                                }) => (
                                  <input
                                    className="shadow appearance-none outline-none border rounded w-full p-2 text-black"
                                    value={value}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                  />
                                )}
                              />
                              {errors?.filter_name && (
                                <ErrorMessage
                                  message={errors.filter_name.message}
                                />
                              )}
                            </div>
                          </div>
                          <div className="w-full flex mb-6">
                            <FieldLabel
                              className={`w-[30%] ${
                                lang === "he" ? "ml-6" : "mr-6"
                              }`}
                            >
                              {t("clients.conditions")}
                            </FieldLabel>
                            <div className="w-[60%]">
                              <p className="font-normal">
                                {t("messages.andConditionsMessage")}
                              </p>
                              {conditions
                                ?.filter((item) => item.operator === "AND")
                                .map((filterCondition, i) => {
                                  return (
                                    <div
                                      className="flex w-full flex-wrap"
                                      key={i}
                                    >
                                      <FormControl
                                        sx={{ m: 1, minWidth: "200px" }}
                                        size="small"
                                      >
                                        <Select
                                          labelId="demo-select-small-label"
                                          id="demo-select-small"
                                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                                          value={filterCondition?.attr_name}
                                          MenuProps={{
                                            sx: {
                                              maxHeight: "250px",
                                            },
                                          }}
                                          onChange={(e) =>
                                            filterFieldConditionUpdate(
                                              "attr_name",
                                              e.target.value,
                                              filterCondition?.id
                                            )
                                          }
                                        >
                                          <MenuItem value="" disabled>
                                            Select
                                          </MenuItem>
                                          {fullFormData
                                            .filter(
                                              (item) =>
                                                item?.data_type.value !== "file"
                                            )
                                            .map((field, i) => (
                                              <MenuItem
                                                value={field?.field_slug}
                                                key={i}
                                              >
                                                {field.field_name}
                                              </MenuItem>
                                            ))}
                                        </Select>
                                        {errors?.filters?.length > 0 &&
                                          errors?.filters[0]?.attr_name && (
                                            <ErrorMessage
                                              message={
                                                errors?.filters[0]?.attr_name
                                                  .message
                                              }
                                            />
                                          )}
                                      </FormControl>
                                      <FormControl
                                        sx={{ m: 1, minWidth: "200px" }}
                                        size="small"
                                      >
                                        <Select
                                          labelId="demo-select-small-label"
                                          id="demo-select-small"
                                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                                          value={filterCondition?.condition}
                                          MenuProps={{
                                            sx: {
                                              maxHeight: "250px",
                                            },
                                          }}
                                          onChange={(e) =>
                                            filterFieldConditionUpdate(
                                              "condition",
                                              e.target.value,
                                              filterCondition?.id
                                            )
                                          }
                                        >
                                          <MenuItem value="" disabled>
                                            Select
                                          </MenuItem>
                                          {filterOptions
                                            .filter(
                                              (filterOption) =>
                                                filterOption.datatype ===
                                                fullFormData.filter(
                                                  (field) =>
                                                    field?.field_slug ===
                                                    filterCondition?.attr_name
                                                )[0]?.data_type.value
                                            )[0]
                                            .conditions?.map((condition, i) => (
                                              <MenuItem
                                                value={condition?.condition}
                                                key={i}
                                              >
                                                {condition?.label}
                                              </MenuItem>
                                            ))}
                                        </Select>
                                        {errors?.filters?.length > 0 &&
                                          errors?.filters[0]?.condition && (
                                            <ErrorMessage
                                              message={
                                                errors?.filters[0]?.condition
                                                  .message
                                              }
                                            />
                                          )}
                                      </FormControl>
                                      <FormControl
                                        sx={{ m: 1, minWidth: "200px" }}
                                        size="small"
                                      >
                                        <input
                                          className="shadow pl-2 appearance-none outline-none border rounded w-full py-2 text-black"
                                          value={filterCondition?.value}
                                          onChange={(e) =>
                                            filterFieldConditionUpdate(
                                              "value",
                                              e.target.value,
                                              filterCondition?.id
                                            )
                                          }
                                        />
                                        {errors?.filters?.length > 0 &&
                                          errors?.filters[0]?.value && (
                                            <ErrorMessage
                                              message={
                                                errors?.filters[0]?.value
                                                  .message
                                              }
                                            />
                                          )}
                                      </FormControl>
                                      <MdDelete
                                        className="mx-1 self-center text-blueSecondary h-[22px] w-[22px] hover:cursor-pointer"
                                        onClick={() =>
                                          deleteFilterCondition(
                                            filterCondition?.id
                                          )
                                        }
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                          <div className="w-full flex mb-6">
                            <FieldLabel
                              className={`w-[30%] ${
                                lang === "he" ? "ml-6" : "mr-6"
                              }`}
                            />
                            <div className="w-[60%] mx-2">
                              <p
                                className="w-fit p-3 rounded-md flex cursor-pointer items-center bg-gray-200"
                                onClick={() => addConditionHandler("AND")}
                              >
                                <IoIosAdd /> {t("clients.addCondition")}
                              </p>
                            </div>
                          </div>
                          <div className="w-full flex mb-6">
                            <FieldLabel
                              className={`w-[30%] ${
                                lang === "he" ? "ml-6" : "mr-6"
                              }`}
                            />
                            <div className="w-[60%]">
                              <p className="font-normal">
                                {t("messages.orConditionsMessage")}
                              </p>
                              {conditions
                                ?.filter((item) => item.operator === "OR")
                                .map((filterCondition, i) => {
                                  return (
                                    <div
                                      className="flex w-full flex-wrap"
                                      key={i}
                                    >
                                      <FormControl
                                        sx={{ m: 1, minWidth: "200px" }}
                                        size="small"
                                      >
                                        <Select
                                          labelId="demo-select-small-label"
                                          id="demo-select-small"
                                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                                          value={filterCondition?.attr_name}
                                          MenuProps={{
                                            sx: {
                                              maxHeight: "250px",
                                            },
                                          }}
                                          onChange={(e) =>
                                            filterFieldConditionUpdate(
                                              "attr_name",
                                              e.target.value,
                                              filterCondition?.id
                                            )
                                          }
                                        >
                                          <MenuItem value="" disabled>
                                            Select
                                          </MenuItem>
                                          {fullFormData
                                            .filter(
                                              (item) =>
                                                item?.data_type.value !== "file"
                                            )
                                            .map((field, i) => (
                                              <MenuItem
                                                value={field?.field_slug}
                                                key={i}
                                              >
                                                {field.field_name}
                                              </MenuItem>
                                            ))}
                                        </Select>
                                        {errors?.filters?.length > 0 &&
                                          errors?.filters[0]?.attr_name && (
                                            <ErrorMessage
                                              message={
                                                errors?.filters[0]?.attr_name
                                                  .message
                                              }
                                            />
                                          )}
                                      </FormControl>
                                      <FormControl
                                        sx={{ m: 1, minWidth: "200px" }}
                                        size="small"
                                      >
                                        <Select
                                          labelId="demo-select-small-label"
                                          id="demo-select-small"
                                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                                          value={filterCondition?.condition}
                                          MenuProps={{
                                            sx: {
                                              maxHeight: "250px",
                                            },
                                          }}
                                          onChange={(e) =>
                                            filterFieldConditionUpdate(
                                              "condition",
                                              e.target.value,
                                              filterCondition?.id
                                            )
                                          }
                                        >
                                          <MenuItem value="" disabled>
                                            Select
                                          </MenuItem>
                                          {filterOptions
                                            .filter(
                                              (filterOption) =>
                                                filterOption.datatype ===
                                                fullFormData.filter(
                                                  (field) =>
                                                    field?.field_slug ===
                                                    filterCondition?.attr_name
                                                )[0]?.data_type.value
                                            )[0]
                                            .conditions?.map((condition, i) => (
                                              <MenuItem
                                                value={condition?.condition}
                                                key={i}
                                              >
                                                {condition?.label}
                                              </MenuItem>
                                            ))}
                                        </Select>
                                        {errors?.filters?.length > 0 &&
                                          errors?.filters[0]?.condition && (
                                            <ErrorMessage
                                              message={
                                                errors?.filters[0]?.condition
                                                  .message
                                              }
                                            />
                                          )}
                                      </FormControl>
                                      <FormControl
                                        sx={{ m: 1, minWidth: "200px" }}
                                        size="small"
                                      >
                                        <input
                                          className="shadow pl-2 appearance-none outline-none border rounded w-full py-2 text-black"
                                          value={filterCondition?.value}
                                          onChange={(e) =>
                                            filterFieldConditionUpdate(
                                              "value",
                                              e.target.value,
                                              filterCondition?.id
                                            )
                                          }
                                        />
                                        {errors?.filters?.length > 0 &&
                                          errors?.filters[0]?.value && (
                                            <ErrorMessage
                                              message={
                                                errors?.filters[0]?.value
                                                  .message
                                              }
                                            />
                                          )}
                                      </FormControl>
                                      <MdDelete
                                        className="mx-1 self-center text-blueSecondary h-[22px] w-[22px] hover:cursor-pointer"
                                        onClick={() =>
                                          deleteFilterCondition(
                                            filterCondition?.id
                                          )
                                        }
                                      />
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                          <div className="w-full flex mb-6">
                            <FieldLabel
                              className={`w-[30%] ${
                                lang === "he" ? "ml-6" : "mr-6"
                              }`}
                            />
                            <div className="w-[60%] mx-2">
                              <p
                                className="w-fit p-3 rounded-md flex cursor-pointer items-center bg-gray-200"
                                onClick={() => addConditionHandler("OR")}
                              >
                                <IoIosAdd /> {t("clients.addCondition")}
                              </p>
                              {errors?.filters && (
                                <ErrorMessage
                                  message={errors.filters.message}
                                />
                              )}
                            </div>
                          </div>
                          <div className="mb-6 flex w-full items-center">
                            <FieldLabel
                              className={`w-[30%] ${
                                lang === "he" ? "ml-6" : "mr-6"
                              }`}
                            >
                              {t("clients.setAsDefault")}
                            </FieldLabel>
                            <div className="w-[60%] mx-2">
                              <Controller
                                name="default"
                                control={control}
                                render={({
                                  field: { value, onChange, onBlur },
                                }) => (
                                  <CustomCheckBox
                                    checked={value}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end p-4 border-t border-solid border-blueGray-200 rounded-b">
                          <button
                            className="text-red-500 background-transparent font-bold uppercase px-3 py-1 text-sm outline-none focus:outline-none mr-1 mb-1"
                            type="button"
                            onClick={handleCloseFilter}
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
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default FilterModal;
