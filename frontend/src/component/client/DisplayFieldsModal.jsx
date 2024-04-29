// React imports
import React from "react";

// UI Components Imports
import ToggleSwitch from "../common/ToggleSwitch";

// Third part Imports
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";

// API services
import clientsService from "../../services/clients";

const DisplayFieldsModal = ({
  showModal,
  setShowModal,
  formValues,
  displayFields,
  onClick,
}) => {
  const { t } = useTranslation();
  const defaultValues = formValues;
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");

  const submitForm = async (data, e) => {
    e.preventDefault();
    let formData = {
      fields: [],
    };

    displayFields.forEach((field) => {
      formData.fields.push({
        id: field.id,
        display: data[field.field_slug],
      });
    });

    const res = await clientsService.updateBlockField(formData);
    setShowModal(false);
    onClick();
  };

  const { control, handleSubmit } = useForm({
    defaultValues,
    mode: "onBlur",
  });

  return (
    <>
      {showModal ? (
        <div className="fixed left-0 bottom-0 z-[9999] h-screen w-screen bg-[#00000080] flex justify-center items-center">
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="min-w-300px md:min-w-[400px] overflow-y-auto border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
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
                  <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t ">
                    <h3 className="text-2xl font-semibold">
                      {t("clients.display")}
                    </h3>
                    <button
                      className="bg-transparent border-0 text-black float-right"
                      onClick={() => setShowModal(false)}
                    >
                      <span className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full">
                        x
                      </span>
                    </button>
                  </div>
                  <div className="relative p-6 flex-auto max-h-[calc(90vh-170px)] overflow-y-auto">
                    {displayFields.length > 0 &&
                      displayFields.map((fieldData, index) => {
                        return (
                          <div
                            className="flex items-center justify-between"
                            key={index}
                          >
                            <label className="block text-black text-sm font-bold mb-1">
                              {lang === "he"
                                ? fieldData?.field_name_language.he
                                : fieldData?.field_name}
                            </label>
                            <Controller
                              name={fieldData?.field_slug}
                              control={control}
                              render={({ field: { value, onChange } }) => {
                                return (
                                  <ToggleSwitch
                                    clickHandler={onChange}
                                    selected={value}
                                  />
                                );
                              }}
                            />
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-3 py-1 text-sm outline-none focus:outline-none mr-1 mb-1"
                      type="button"
                      onClick={() => setShowModal(false)}
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
    </>
  );
};

export default React.memo(DisplayFieldsModal);
