// React imports
import { useEffect, useRef, useState } from "react";

// Third part Imports
import { useTranslation } from "react-i18next";
import EmailEditor from "react-email-editor";

// API services
import emailService from "../../services/email";
import clientsService from "../../services/clients";

// Utils imports
import { DEFAULT_LANGUAGE } from "../../constants";
import emailEditorHe from "../../locales/emailEditorHe.json";

// Custom hooks imports
import useAlert from "../../Hooks/useAlert";

const NewTemplate = ({ editableTemplateId, onSave }) => {
  const formObject = {
    name: "",
    to: "$admin_email",
    subject: "",
    message: "",
  };
  const { t } = useTranslation();
  const { setAlert } = useAlert();
  const emailEditorRef = useRef(null);
  const defaultLanguageValue = localStorage.getItem(DEFAULT_LANGUAGE);
  const [formdata, setFormData] = useState(formObject);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingTags, setloadingTags] = useState(true);
  const [mergeTagsData, setMergeTagsData] = useState({});

  const onReady = () => {
    emailEditorRef.current.editor.setMergeTags({
      $request_id: {
        name: t("requests.$requestId"),
        value: "{request_id}",
      },
      $client_name: {
        name: t("requests.$clinetName"),
        value: "{client_name}",
      },
      $client_email: {
        name: t("requests.$clientEmail"),
        value: "{client_email}",
      },
      $domain_requested: {
        name: t("requests.$domainRequested"),
        value: "{domain_requested}",
      },
      $admin_email: {
        name: t("requests.$adminEmail"),
        value: "{admin_email}",
      },
      ...mergeTagsData,
    });
    // editor is ready
    // you can load your template here;
    // const templateJson = {};
    if (editableTemplateId) {
      emailEditorRef.current.editor.loadDesign(formdata.message);
    }
  };

  const exportHtml = () => {
    return new Promise((resolve, reject) => {
      let messageBody = {
        design: null,
        html: null,
      };
      emailEditorRef.current.editor.exportHtml((data) => {
        messageBody.design = data.design;
        messageBody.html = data.html;
        resolve(messageBody);
      });
    });
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    // parse tokenized data
    let data = JSON.parse(JSON.stringify(formdata));
    data.message = await exportHtml();
    for (let item in data) {
      if (item === "to" || item === "subject") {
        data[item] = data[item].replaceAll("$", "");
      }
    }
    if (editableTemplateId) {
      // update existing template
      await emailService
        .updateTemplate({
          id: editableTemplateId,
          name: data.name,
          email_to: data.to,
          subject: data.subject,
          body: data.message,
        })
        .then((response) => {
          setAlert(t("emails.templateUpdated"), "success");
        })
        .catch((error) => {
          setAlert(t("emails.templateUpdateFailed"), "error");
        });
    } else {
      // add new template
      await emailService
        .addNewTemplate({
          name: data.name,
          email_to: data.to,
          subject: data.subject,
          body: data.message,
        })
        .then((response) => {
          setAlert(t("emails.templateAdded"), "success");
        })
        .catch((error) => {
          setAlert(t("emails.templateAddFailed"), "error");
        });
    }
    setFormData(formObject);
    onSave();
  };

  const handleInput = (event) => {
    setFormData({ ...formdata, [event.target.name]: event.target.value });
  };

  const formValidate = () => {
    if (!formdata.name || !formdata.to || !formdata.subject) {
      return false;
    }
    return true;
  };

  const fetchEditableTemplateData = async () => {
    setLoadingTemplate(true);
    let response = await emailService.getSingleTemplate(editableTemplateId);
    response = response.data.data;
    // parse back the response data to form data with dynamic token
    for (let key in response) {
      if (key === "email_to" || key === "subject") {
        response[key] = response[key]
          .split(/[, ]/)
          .map((word) => {
            return word.includes("_") ? `$${word}` : word;
          })
          .join(" ");
      }
    }
    setFormData({
      name: response.name,
      to: response.email_to,
      subject: response.subject,
      message: response.design,
    });
    setLoadingTemplate(false);
  };

  const fetchFormDataTags = async () => {
    setloadingTags(true);
    try {
      const res = await clientsService.getFullformData(
        "&field_email_template=true"
      );
      setMergeTagsData(res.data.result);
      setloadingTags(false);
    } catch (error) {
      console.log(error);
      setloadingTags(false);
    }
  };

  useEffect(() => {
    if (editableTemplateId) {
      fetchEditableTemplateData();
    }
    fetchFormDataTags();
  }, [defaultLanguageValue]);

  const option = {
    locale: "en-US",
    textDirection: "rtl",
    translations: {
      "en-US": emailEditorHe,
    },
    tools: {
      text: {
        properties: {
          text: {
            value:
              '<p style="line-height: 140%;">זהו בלוק טקסט חדש. שנה את הטקסט.</p>',
          },
          textAlign: {
            value: "right",
          },
        },
      },
      heading: {
        properties: {
          text: {
            value: "כּוֹתֶרֶת",
          },
          textAlign: {
            value: "right",
          },
        },
      },
      button: {
        properties: {
          text: { value: "טקסט לחצן" },
        },
      },
    },
  };

  return (
    <div className="h-full w-full flex flex-col-reverse md:flex-row gap-4">
      <div className="bg-white rounded-3xl w-full">
        <div className="flex pt-3 px-7 font-bold text-[#2B3674]">
          {t("emails.templates")}
        </div>
        <form onSubmit={saveTemplate}>
          <div className="px-7 flex gap-4 font-semibold text-[#2B3674] [&_input]:border-[1px] [&_textarea]:border-[1px] [&_input]:outline-none [&_textarea]:outline-0 [&_input]:w-full [&_textarea]:w-full [&_input]:!px-4 [&_textarea]:!px-4 [&_input]:!py-1 [&_textarea]:!py-1">
            <div className="w-[100%] [&_tr]:h-10">
              <div className="flex my-2 w-full gap-4">
                <td className="w-1/2 md:w-1/5">{t("emails.templateName")}</td>
                <input
                  className="text-[13px]"
                  id="templateName"
                  type="text"
                  value={formdata.name}
                  onChange={handleInput}
                  name="name"
                />
              </div>
              <div className="flex my-2 w-full gap-4">
                <td className="w-1/2 md:w-1/5">{t("emails.subject")}</td>
                <input
                  className="text-[13px]"
                  id="emailSubject"
                  type="text"
                  placeholder={t("emails.subject")}
                  value={formdata.subject}
                  onChange={handleInput}
                  name="subject"
                />
              </div>
              <div className="w-full my-5 h-[calc(100vh-330px)] [&_iframe]:!min-w-[100%] [&_iframe]:!h-[calc(100vh-330px)] [&_div]:!max-h-[calc(100vh-330px)]">
                {!loadingTemplate && !loadingTags ? (
                  <EmailEditor
                    ref={emailEditorRef}
                    onReady={onReady}
                    options={defaultLanguageValue === "he" ? option : null}
                  />
                ) : null}
              </div>
              <button
                className={`linear mb-2 px-[30px] rounded-lg py-2 text-base font-medium transition duration-200 ${
                  formValidate()
                    ? "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white"
                    : "bg-gray-300"
                }`}
              >
                {t("emails.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTemplate;
