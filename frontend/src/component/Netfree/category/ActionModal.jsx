// React imports
import { useEffect, useState } from "react";

// UI Imports
import { MenuItem, Select } from "@mui/material";

// Third part Imports
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// API services
import categoryService from "../../../services/category";
import emailService from "../../../services/email";
import requestService from "../../../services/request";

// Icon imports
import { AiTwotoneDelete } from "react-icons/ai";

// Initial state data
const initialState = {
  Admin: false,
  Client: false,
  Custom: false,
};

const ActionModal = ({
  showModal,
  setShowModal,
  updateAction,
  categoryId,
  setDefaultAction,
  isDefault,
  editActionID,
  setEditActionId,
  trafficAction,
  defaultStatus,
  trafficStatus,
}) => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [actionsList, setActionsList] = useState([]);
  const { t } = useTranslation();
  const [templateList, setTemplateList] = useState([]);
  const [selectedAction, setSelectedAction] = useState("selectAction");
  const [timeAmount, setTimeAmount] = useState("");
  const [timePeriod, setTimePeriod] = useState("Hours");
  const [selectedStatus, setSelectedStatus] = useState("selectStatus");
  const [selectedTemplate, setSelectedTemplate] = useState("selectTemplate");
  const [actionNeedsOtherFields, setActionNeedsOtherFields] = useState([]);
  const [sendEmailTypes, setSendEmailTypes] = useState(initialState);
  const [inputValues, setInputValues] = useState([""]);
  const [deleteButtonsVisible, setDeleteButtonsVisible] = useState([false]);
  const [requestStatuses, setRequestStatuses] = useState([]);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const notify = (error) => toast.error(error);
  const handleAddInput = () => {
    setInputValues([...inputValues, ""]);
    setDeleteButtonsVisible([...deleteButtonsVisible, true]);
  };

  const handleInputChange = (index, newValue) => {
    const updatedInputValues = [...inputValues];
    updatedInputValues[index] = newValue;
    setInputValues(updatedInputValues);
  };

  const handleDeleteInput = (index) => {
    if (inputValues.length > 1) {
      const updatedInputValues = [...inputValues];
      updatedInputValues.splice(index, 1);
      setInputValues(updatedInputValues);

      const updatedDeleteButtonsVisible = [...deleteButtonsVisible];
      updatedDeleteButtonsVisible.splice(index, 1);
      setDeleteButtonsVisible(updatedDeleteButtonsVisible);
    }
  };

  const handleCheckboxChange = (event, type) => {
    setSendEmailTypes({
      ...sendEmailTypes,
      [type]: event.target.checked,
    });
  };

  const getCustomValues = () => {
    const nonEmptyValues = inputValues.filter((value) => value.trim() !== "");
    const customEmailValue = sendEmailTypes.Custom
      ? nonEmptyValues.join(", ")
      : "";
    return customEmailValue;
  };

  const periods = [
    { label: t("netfree.minutes"), value: "Minutes" },
    { label: t("netfree.hours"), value: "Hours" },
    { label: t("netfree.days"), value: "Days" },
    { label: t("netfree.weeks"), value: "Weeks" },
  ];

  const getActionsList = async () => {
    const response = await categoryService.getActions();
    if (trafficAction) {
      const trafficActions = response.data.data.filter(
        (action) => action.is_template_action || action.id === 9999999
      );
      setActionsList(trafficActions);
    } else {
      setActionsList(response.data.data);
    }
  };

  const getRequestStatusList = async () => {
    try {
      const params = `?lang=${lang}`;
      const res = await requestService.getRequestStatuses(params);
      setRequestStatuses(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getTemplates = async () => {
    const response = await emailService.getTemplates();
    setTemplateList(response.data.data);
  };

  const setActionValue = (e) => {
    const actionId = e.target.value;
    const selected = actionsList.find((el) => el.id == actionId);
    const isNeeded = selected.label.split("").filter((el) => el === "X");
    setActionNeedsOtherFields(isNeeded);
    setSelectedAction(actionId);
  };

  const submitForm = async () => {
    let data;
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const areEmailsValid = inputValues.every((value) => emailRegex.test(value));
    if (selectedAction === "selectAction") {
      notify("Please select action!!");
      return;
    }
    if (showEmailTemplate) {
      if (selectedTemplate === "selectTemplate") {
        notify("Please select template!!");
        return;
      }
      if (
        !sendEmailTypes.Admin &&
        !sendEmailTypes.Client &&
        !sendEmailTypes.Custom
      ) {
        notify("Please select at least one action!!");
        return;
      }
      if (sendEmailTypes.Custom && inputValues[0] === "") {
        notify("Please enter email address!!");
        return;
      }
      if (sendEmailTypes.Custom && !areEmailsValid) {
        notify("Invalid email detected.");
        return;
      }
      data = {
        id: categoryId?.categories_id,
        to_add: selectedAction,
        inputs: {
          email_to_admin: sendEmailTypes?.Admin,
          email_to_client: sendEmailTypes?.Client,
          custom_email: getCustomValues(),
        },
        template_id: selectedTemplate,
      };
    } else {
      data = {
        id: categoryId?.categories_id,
        to_add: selectedAction,
        inputs:
          actionNeedsOtherFields.length > 0
            ? {
                amount: timeAmount === "" ? "1" : timeAmount,
                openfor: timePeriod,
              }
            : {},
      };
      if (
        actionsList.filter((el) => el.id == selectedAction)[0]
          ?.is_request_status
      ) {
        data = {
          ...data,
          inputs: { ...data.inputs, email_request_status: selectedStatus },
          is_status: true,
        };
      }
    }

    if (isDefault) {
      await setDefaultAction(selectedAction, data);
    } else {
      if (editActionID) {
        await updateAction(data, editActionID);
      } else {
        await updateAction(data, null);
      }
    }

    setSelectedAction("selectAction");
    setSelectedTemplate("selectTemplate");
    setActionNeedsOtherFields([]);
    setTimeAmount("");
    setTimePeriod("Hours");
    setSendEmailTypes(initialState);
    setInputValues([""]);
    setDeleteButtonsVisible([false]);
    setEditActionId(null);
    setShowModal(false);
    setShowEmailTemplate(false);
  };

  function findPartialMatch(searchString, arr, text) {
    for (const item of arr) {
      if (text === "label") {
        if (searchString.includes(item.label)) {
          return item.id;
        }
      } else {
        if (searchString.includes(item.name)) {
          return item.id;
        }
      }
    }
    return null;
  }

  const getActionUpdateValue = () => {
    let obj = categoryId?.actions?.find((val) => val.id === editActionID);
    if (
      obj?.label.includes("Send email template") ||
      obj?.label.includes("שלח תבנית אימייל")
    ) {
      const emailArray = obj?.custom_email
        ?.split(",")
        .map((email) => email.trim());
      setInputValues(emailArray);
      const updatedState = {
        ...initialState,
        Admin: obj.email_to_admin,
        Client: obj.email_to_client,
        Custom: obj.custom_email !== "",
      };
      setSendEmailTypes(updatedState);
      const matchedId = findPartialMatch(obj?.label, actionsList, "label");
      const matchedIdTemplate = findPartialMatch(
        obj?.label,
        templateList,
        "name"
      );
      setSelectedAction(matchedId);
      setSelectedTemplate(matchedIdTemplate);
      setDeleteButtonsVisible([...deleteButtonsVisible, true]);
    } else {
      setInputValues([""]);
      setSendEmailTypes(initialState);
      setSelectedAction("selectAction");
      setSelectedTemplate("selectTemplate");
      setDeleteButtonsVisible([false]);
    }
  };

  useEffect(() => {
    getActionsList();
    getTemplates();
    getRequestStatusList();
  }, [trafficAction]);

  useEffect(() => {
    getActionUpdateValue();
    let status = "selectStatus";
    if (isDefault) {
      status = defaultStatus?.email_request_status?.value || "selectStatus";
      if (trafficAction) {
        status = trafficStatus?.email_request_status?.value || "selectStatus";
      }
    } else {
      status =
        categoryId?.request_status?.email_request_status?.value ||
        "selectStatus";
    }
    setSelectedStatus(status);
  }, [
    editActionID,
    JSON.stringify(defaultStatus),
    JSON.stringify(trafficStatus),
    trafficAction,
    JSON.stringify(categoryId),
    isDefault,
  ]);

  useEffect(() => {
    if (!sendEmailTypes.Custom) {
      setInputValues([""]);
    }
  }, [sendEmailTypes]);
  console.log(trafficAction);
  return (
    <>
      {showModal ? (
        <div className="fixed left-0 bottom-0 z-[9999] h-screen w-screen bg-[#00000080] flex justify-center items-center">
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="min-w-300px border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t ">
                  <h3 className="text-2xl font-semibold">
                    {t("netfree.addAction")}
                  </h3>
                  <button
                    className="bg-transparent border-0 text-black float-right"
                    onClick={() => {
                      setShowModal(false);
                      setEditActionId(null);
                    }}
                  >
                    <span className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full">
                      x
                    </span>
                  </button>
                </div>
                <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-scroll">
                  <div className="bg-gray-200 shadow-md rounded px-8 pt-6 pb-8 w-full">
                    <label className="block text-black text-sm font-bold mb-1">
                      {t("netfree.actions")}
                    </label>
                    <Select
                      MenuProps={{
                        sx: {
                          zIndex: 9999,
                        },
                      }}
                      className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                      onChange={(e) => {
                        setActionValue(e);
                        const isTemplateAction = actionsList.filter(
                          (el) => el.id === e.target.value
                        )[0]?.is_template_action;
                        if (isTemplateAction) {
                          setShowEmailTemplate(true);
                        } else {
                          setShowEmailTemplate(false);
                        }
                      }}
                      value={selectedAction}
                      placeholder="Select Action"
                    >
                      <MenuItem value={"selectAction"} disabled>
                        {t("netfree.selectAction")}
                      </MenuItem>
                      {actionsList?.map((el) => {
                        return el ? (
                          <MenuItem key={el.id} value={el.id}>
                            {el.label}
                          </MenuItem>
                        ) : null;
                      })}
                    </Select>
                    {actionsList.filter((el) => el.id == selectedAction)[0]
                      ?.is_request_status && (
                      <>
                        <label className="block text-black text-sm font-bold mb-1">
                          {t("netfree.changeStatus")}
                        </label>
                        <Select
                          MenuProps={{
                            sx: {
                              zIndex: 9999,
                            },
                          }}
                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          value={selectedStatus}
                          placeholder="Select status"
                        >
                          <MenuItem value={"selectStatus"} disabled>
                            {t("netfree.selectStatus")}
                          </MenuItem>
                          {requestStatuses.length > 0 &&
                            requestStatuses?.map((el) => {
                              return el ? (
                                <MenuItem key={el.value} value={el.value}>
                                  {el.label}
                                </MenuItem>
                              ) : null;
                            })}
                        </Select>
                      </>
                    )}
                    {actionNeedsOtherFields.length >= 2 ? (
                      <>
                        <label className="block text-black text-sm font-bold mb-1">
                          {t("netfree.amount")}
                        </label>
                        <input
                          className="shadow appearance-none outline-none border rounded w-full py-2 px-1 text-black"
                          required
                          type="number"
                          min={1}
                          onChange={(e) => setTimeAmount(e.target.value)}
                        />
                        <label className="block text-black text-sm font-bold mb-1">
                          {t("netfree.openfor")}
                        </label>
                        <Select
                          MenuProps={{
                            sx: {
                              zIndex: 9999,
                            },
                          }}
                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                          onChange={(e) => setTimePeriod(e.target.value)}
                          value={timePeriod}
                          placeholder="Select period"
                        >
                          {periods?.map((el, i) => {
                            return el ? (
                              <MenuItem key={i} value={el.value}>
                                {el.label}
                              </MenuItem>
                            ) : null;
                          })}
                        </Select>
                      </>
                    ) : null}
                    {showEmailTemplate && (
                      <>
                        <label className="block text-black text-sm font-bold mb-1">
                          {t("netfree.template")}
                        </label>
                        <Select
                          MenuProps={{
                            sx: {
                              maxHeight: "300px",
                              zIndex: 9999,
                            },
                          }}
                          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          value={selectedTemplate}
                          placeholder="Select Action"
                        >
                          <MenuItem value={"selectTemplate"} disabled>
                            {t("netfree.selectTemplate")}
                          </MenuItem>
                          {templateList?.map((el) => {
                            return el ? (
                              <MenuItem key={el.id} value={el.id}>
                                {el.name}
                              </MenuItem>
                            ) : null;
                          })}
                        </Select>
                        {selectedTemplate !== "selectTemplate" && (
                          <>
                            <div className="" style={{ display: "grid" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  marginTop: "10px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  name="sendEmailTypeAdmin"
                                  checked={sendEmailTypes.Admin}
                                  onChange={(e) =>
                                    handleCheckboxChange(e, "Admin")
                                  }
                                />
                                <label htmlFor="Admin">
                                  {t("netfree.SendtoAdmin")}
                                </label>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  marginTop: "10px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  name="sendEmailTypeClient"
                                  checked={sendEmailTypes.Client}
                                  onChange={(e) =>
                                    handleCheckboxChange(e, "Client")
                                  }
                                />
                                <label htmlFor="Client">
                                  {t("netfree.SendtoClien")}
                                </label>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  marginTop: "10px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  name="sendEmailTypeCustom"
                                  checked={sendEmailTypes.Custom}
                                  onChange={(e) =>
                                    handleCheckboxChange(e, "Custom")
                                  }
                                />
                                <label htmlFor="Custom">
                                  {t("netfree.CustomEmail")}
                                </label>
                              </div>
                            </div>
                            {sendEmailTypes.Custom && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  display: "grid",
                                  gap: "10px",
                                  justifyContent: "center",
                                }}
                              >
                                {inputValues.map((value, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                  >
                                    <input
                                      className="shadow appearance-none outline-none border rounded w-full py-2 px-1 text-black"
                                      required
                                      value={value}
                                      onChange={(e) =>
                                        handleInputChange(index, e.target.value)
                                      }
                                      placeholder={t("netfree.Enteremail")}
                                    />
                                    {deleteButtonsVisible[index] && (
                                      <div
                                        onClick={() => handleDeleteInput(index)}
                                      >
                                        <AiTwotoneDelete
                                          style={{
                                            width: "20px",
                                            height: "20px",
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <button
                                  className="text-white text-[14px] font-small transition duration-200 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 uppercase px-3 py-1 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1"
                                  type="button"
                                  onClick={handleAddInput}
                                >
                                  {t("netfree.Addmore")}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* <div style={{ textAlign: 'center', color: 'red' }} >
                  {error}
                </div> */}
                <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-3 py-1 text-sm outline-none focus:outline-none mr-1 mb-1"
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditActionId(null);
                    }}
                  >
                    {t("netfree.close")}
                  </button>
                  <button
                    className="text-white text-[14px] font-small transition duration-200 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 uppercase px-3 py-1 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1"
                    type="button"
                    onClick={submitForm}
                  >
                    {t("netfree.save")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ActionModal;
