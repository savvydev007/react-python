// React imports
import React, { useEffect } from "react";

// Third part Imports
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// UI Components
import ErrorMessage from "../../common/ErrorMessage";

// API Services
import websiteServices from "../../../services/website";

function WebsiteModal({
  showModal,
  setShowModal,
  editDomain,
  setEditDomain,
  onClick,
}) {
  const { t } = useTranslation();
  const defaultValues = {
    domain: "",
    note: "",
  };
  const schema = yup.object().shape({
    domain: yup.string().required(t("messages.domainAddError")),
    note: yup.string().notRequired(),
  });
  const {
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  const submitForm = async (data, e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("domain", data.domain);
      formData.append("note", data.note);
      const res = editDomain
        ? await websiteServices.editDomain(formData, editDomain.id)
        : await websiteServices.createDomain(formData);

      if (res.status >= 200 && res.status < 300) {
        reset();
        setShowModal(!showModal);
        onClick();
        setEditDomain(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (editDomain) {
      setValue("domain", editDomain.domain);
      setValue("note", editDomain.note);
    }
  }, [editDomain]);

  return (
    <div className="fixed left-0 bottom-0 z-[9999] h-screen w-screen bg-[#00000080] flex justify-center items-center">
      <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="min-w-300px border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
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
                  {t("websites.addDomain")}
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
              <div className="relative px-6 py-3 flex-auto">
                <label className="block text-black text-sm font-bold mb-1">
                  {t("websites.domain")}
                </label>
                <Controller
                  name="domain"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <input
                      value={value}
                      className="shadow appearance-none outline-none border rounded w-full py-2 px-1 text-black"
                      required
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.domain && (
                  <ErrorMessage message={errors.domain.message} />
                )}
              </div>
              <div className="relative px-6 py-3 flex-auto">
                <label className="block text-black text-sm font-bold mb-1">
                  {t("websites.note")}
                </label>
                <Controller
                  name="note"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <input
                      value={value}
                      className="shadow appearance-none outline-none border rounded w-full py-2 px-1 text-black"
                      required
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.note && <ErrorMessage message={errors.note.message} />}
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
  );
}

export default React.memo(WebsiteModal);
