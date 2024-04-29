// React imports
import { useEffect, useState } from "react";

// UI Components Imports
import SearchField from "../fields/SearchField";
import Loader from "../common/Loader";

// Third part Imports
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// API services
import emailService from "../../services/email";

// Custom hooks imports
import useAlert from "../../Hooks/useAlert";
import TemplateCard from "./TemplateCard";

// initial state data
const smtpFormObject = {
  email: "",
  password: "",
};

const ListTemplate = ({ newTemplate, onEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [smtpFormdata, setSmtpFormdata] = useState(smtpFormObject);
  const [isLoading, setIsLoading] = useState(false);
  const [templateList, setTemplateList] = useState([]);
  const [addEditMode, setAddEditMode] = useState(false);
  const [connectSMTPData, setConnectedSMTPData] = useState({});
  const [filterdTemplateList, setFilteredTemplteList] = useState([]);
  const { setAlert } = useAlert();

  const getTemplates = async () => {
    setIsLoading(true);
    const response = await emailService.getTemplates();
    setTemplateList(response.data.data);
    setFilteredTemplteList(response.data.data);
    setIsLoading(false);
  };

  const deleteTemplate = async (id) => {
    setIsLoading(true);
    await emailService
      .deleteTemplate(id)
      .then((res) => {
        getTemplates();
        setAlert(t("emails.deleteTemplateSuccess"), "success");
        setIsLoading(false);
      })
      .catch((error) => {
        setAlert(t("emails.deleteTemplateFailed"), "error");
        setIsLoading(false);
      });
  };

  const duplicateTemplate = async (id) => {
    setIsLoading(true);
    await emailService
      .duplicateTemplate(id)
      .then((res) => {
        getTemplates();
        setAlert(t("emails.duplicateTemplateSuccess"), "success");
        setIsLoading(false);
      })
      .catch((error) => {
        setAlert(t("emails.duplicateTemplateFailed"), "error");
        setIsLoading(false);
      });
  };

  const searchTemplte = (searchTerm) => {
    if (searchTerm.trim().length) {
      setFilteredTemplteList(
        templateList.filter((el) =>
          el.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTemplteList(templateList);
    }
  };

  const handleSMTPInputChange = (event) => {
    setSmtpFormdata({
      ...smtpFormdata,
      [event.target.name]: event.target.value,
    });
  };

  const smtpFormValidate = () => {
    if (!smtpFormdata.email || !smtpFormdata.password) {
      return false;
    }
    if (smtpFormdata.email && !/\S+@\S+\.\S+/.test(smtpFormdata.email)) {
      return false;
    }
    if (smtpFormdata.password && smtpFormdata.password.length < 2) {
      return false;
    }
    return true;
  };

  const fetchSMTPSettings = async () => {
    const res = await emailService.getSMTPDetail();
    if (res.status === 200 && res.data.data) {
      setConnectedSMTPData(res.data.data);
      setAddEditMode(false);
    } else {
      setAddEditMode(true);
      setSmtpFormdata({ email: "", password: "" });
    }
  };

  const editSMTPSettings = () => {
    setSmtpFormdata({ email: connectSMTPData.email, password: "" });
    setAddEditMode(true);
  };

  const connectSMTPEmail = async (event) => {
    event.preventDefault();
    await emailService
      .loginEmail({
        email: smtpFormdata.email,
        password: smtpFormdata.password,
      })
      .then((response) => {
        if (response.status === 200) {
          fetchSMTPSettings();
          setAlert(response.data.message, "success");
        }
      })
      .catch((error) => {
        setConnectedSMTPData(smtpFormObject);
        setAlert(error.response.data.message, "error");
      });
  };

  const cancelSMTPEditSettings = () => {
    setAddEditMode(false);
  };

  useEffect(() => {
    getTemplates();
    fetchSMTPSettings();
  }, [lang]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="w-full flex justify-between gap-2 items-center [&_div]:px-1 [&_div]:py-1 [&_div]:rounded-2xl">
        <div className="dark:!bg-navy-800 flex w-1/2">
          <button
            type="submit"
            className={`w-full rounded-full py-2 mx-2 px-7 text-[12px] md:text-base font-medium bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
            onClick={newTemplate}
          >
            {t("emails.newTemplate")}
          </button>
          <button
            type="button"
            className={`w-full rounded-full py-2 mx-2 px-7 text-[12px] md:text-base font-medium bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200`}
            onClick={() => navigate("templating")}
          >
            {t("emails.templating")}
          </button>
        </div>
        <div className="md:w-[25%] bg-white">
          <SearchField
            variant="templateSearch"
            extra=""
            id="searchTemplate"
            type="text"
            placeholder={t("searchbox.placeHolder")}
            onChange={(e) => searchTemplte(e.target.value)}
            name="searchTemplate"
            noUnderline="true"
            borderRadius="30"
          />
        </div>
      </div>
      <div className="mt-4 w-full flex gap-4 flex-col-reverse md:flex-row">
        <div className="w-full md:w-[75%]">
          {isLoading && (
            <div className="h-[67vh] w-full flex justify-center items-center">
              <Loader />
            </div>
          )}
          <div className="w-full flex flex-wrap gap-4">
            {filterdTemplateList.map((template) => {
              return (
                <TemplateCard
                  template={template}
                  onEdit={onEdit}
                  duplicateTemplate={duplicateTemplate}
                  deleteTemplate={deleteTemplate}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:h-[67vh] w-full md:w-[25%] mt-4 md:mt-0">
          <div className="bg-white rounded-3xl text-center text-[#2B3674] p-4">
            <h3 className="mb-2 text-[20px] font-bold">{t("emails.smtp")}</h3>
            {!addEditMode ? (
              <div>
                <div className="flex justify-between">
                  <p>{t("emails.connected")}</p>
                  <p
                    className="cursor-pointer text-brand-500"
                    onClick={editSMTPSettings}
                  >
                    {t("emails.edit")}
                  </p>
                </div>
                <p className="text-left text-[#c9c9c9]">
                  {connectSMTPData && connectSMTPData.email}
                </p>
              </div>
            ) : (
              <form onSubmit={connectSMTPEmail}>
                {connectSMTPData.email && (
                  <p
                    className="cursor-pointer text-right text-brand-500"
                    onClick={cancelSMTPEditSettings}
                  >
                    {t("emails.cancel")}
                  </p>
                )}
                <input
                  type="email"
                  placeholder={t("auth.email")}
                  value={smtpFormdata.email}
                  name="email"
                  className="outline-none mb-2 border-[1px] w-full rounded-lg p-1"
                  onChange={handleSMTPInputChange}
                />
                <input
                  type="password"
                  placeholder={t("auth.password")}
                  value={smtpFormdata.password}
                  name="password"
                  className="outline-none mb-2 border-[1px] w-full rounded-lg p-1"
                  onChange={handleSMTPInputChange}
                />
                <button
                  type="submit"
                  disabled={!smtpFormValidate()}
                  className={`linear w-full rounded-lg p-1 text-base font-medium transition duration-200 ${
                    smtpFormValidate()
                      ? "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white"
                      : "bg-gray-300"
                  }`}
                >
                  {t("emails.connect")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListTemplate;
