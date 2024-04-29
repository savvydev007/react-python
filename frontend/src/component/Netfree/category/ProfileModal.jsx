// React imports
import React, { useEffect } from "react";

// Third part Imports
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// API services
import categoryService from "../../../services/category";

const ProfileModal = ({
  showModal,
  setShowModal,
  profile,
  newProfile,
  onClick,
  profilesList,
}) => {
  const { t } = useTranslation();
  const defaultValues = {
    name: "",
    description: "",
  };
  const schema = yup.object().shape({
    name: yup
      .string()
      .min(3, "Name must contain least 3 characters.")
      .required("Please enter valid name."),
    description: yup.string().notRequired("Please enter product description"),
  });

  const { control, setValue, reset, handleSubmit } = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  const submitForm = async (data, e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    if (newProfile) {
      const res = await categoryService.createFilterProfile(formData);
    } else {
      const res = await categoryService.updateFilterProfile(
        formData,
        `${profile ? profile?.id + "/" : ""}`
      );
    }
    reset();
    setShowModal(!showModal);
    onClick();
  };

  useEffect(() => {
    if (profilesList && profile) {
      if (!newProfile) {
        setValue("name", profile?.name);
        setValue("description", profile?.description);
      } else {
        setValue("name", `Profile ${profilesList.length + 1}`);
        setValue("description", "");
      }
    }
  }, [JSON.stringify(profile), newProfile]);

  return (
    <>
      {showModal ? (
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
                      {t("netfree.addFilterProfile")}
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
                  <div className="relative p-6 flex-auto">
                    <label className="block text-black text-sm font-bold mb-1">
                      {t("netfree.name")}
                    </label>
                    <Controller
                      name="name"
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
                    <label className="block text-black text-sm font-bold mb-1">
                      {t("netfree.description")}
                    </label>
                    <Controller
                      name="description"
                      control={control}
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

export default React.memo(ProfileModal);
