// React imports
import React, { useEffect, useState } from "react";

// UI Imports
import { MenuItem, Select } from "@mui/material";

// UI Components Imports
import ErrorMessage from "../common/ErrorMessage";
import CustomField from "../fields/CustomField";
import FieldLabel from "../fields/FormLabel";

// Third part Imports
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify";

// API services
import clientsService from "../../services/clients";

// Utils imports
import { errorsToastHandler } from "../../lib/CommonFunctions";
import { DateFieldConstants } from "../../lib/FieldConstants";

const ClientModal = ({
  showModal,
  setShowModal,
  client,
  newClient,
  onClick,
  netfreeProfiles,
  fullFormData,
}) => {
  const { t } = useTranslation();
  dayjs.extend(utc);
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const [defaultValues, setDefaultValues] = useState(null);

  const schemaHandler = (type, name, required) => {
    let validation;
    if (type.value === "email") {
      validation = required
        ? yup
            .string()
            .email(`${name} ${t("messages.mustBeValid")}`)
            .required(`${name} ${t("clients.is")} ${t("clients.required")}`)
        : yup.string().email().notRequired();
    } else if (type.value === "file") {
      validation = required
        ? yup
            .mixed()
            .required(`${name} ${t("clients.is")} ${t("clients.required")}`)
        : yup.mixed().notRequired();
    } else {
      validation = required
        ? yup
            .string()
            .required(`${name} ${t("clients.is")} ${t("clients.required")}`)
        : (validation = yup.string().notRequired());
    }
    return validation;
  };

  const schema = yup.object().shape(
    fullFormData.reduce((acc, key) => {
      return {
        ...acc,
        [key.field_slug]: schemaHandler(
          key.data_type,
          key.field_name,
          key.required
        ),
      };
    }, {})
  );

  const {
    control,
    setValue,
    reset,
    formState: { errors, dirtyFields },
    handleSubmit,
  } = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  const initialValuesHandler = () => {
    if (newClient) {
      const arr = fullFormData.map((item) => {
        let value = "";
        switch (item?.data_type.value) {
          case "select":
            value = item.enum_values.choices.filter((choice) => {
              if (item.defaultvalue !== "") {
                return choice.value === item.defaultvalue;
              }
              return choice;
            })[0]?.id;
            break;
          case "date":
            value = "";
            break;
          case "checkbox":
            value = item.defaultvalue;
            break;

          default:
            break;
        }
        return {
          [item.field_slug]: value,
        };
      });

      arr.push({
        netfree_profile: netfreeProfiles[0]?.id,
      });

      // Combine all objects into a single object
      const result = arr.reduce((acc, curr) => Object.assign(acc, curr), {});
      setDefaultValues(result);
      for (const field in result) {
        setValue(field, result[field]);
      }
    }
  };

  const submitForm = async (data, e) => {
    e.preventDefault();
    let fieldsArray = [];
    const formData = new FormData();
    const dirtyFieldsArray = Object.keys(dirtyFields);
    let updateFieldsArray = [];

    for (const field in data) {
      if (field !== "netfree_profile" && typeof data[field] !== "object") {
        for (const dirty in dirtyFields) {
          if (field === dirty) {
            updateFieldsArray.push({
              [field]: data[field],
            });
          }
        }
        fieldsArray.push({
          [field]: data[field],
        });
      }
      if (typeof data[field] === "object") {
        formData.append(field, data[field]);
      }
    }

    if (newClient) {
      const detailsData = {
        netfree_profile: data.netfree_profile,
        fields: fieldsArray,
      };

      formData.append("data", JSON.stringify(detailsData));

      clientsService
        .saveClient(formData)
        .then((res) => {
          reset();
          setShowModal(!showModal);
          onClick();
        })
        .catch((err) => {
          errorsToastHandler(err.response.data.error);
        });
    } else {
      if (dirtyFieldsArray.length > 0) {
        const detailsData = {
          netfree_profile: data.netfree_profile,
          fields: updateFieldsArray,
        };
        formData.append("data", JSON.stringify(detailsData));
        clientsService
          .updateClient(formData, client.client_id)
          .then((res) => {
            reset();
            setShowModal(!showModal);
            onClick();
          })
          .catch((err) => {
            errorsToastHandler(err.response.data.error);
          });
      } else {
        toast.error("No fields to update");
      }
    }
  };

  useEffect(() => {
    reset();
    initialValuesHandler();
    if (netfreeProfiles && client) {
      let data;
      if (!newClient) {
        // Array of objects
        let arr = [];
        client.blocks.forEach((block) => {
          block.field.forEach((item) => {
            arr.push({
              [item.field_slug]: item.value,
            });
          });
        });

        // Combine all objects into a single object
        const result = arr.reduce((acc, curr) => Object.assign(acc, curr), {});
        data = result;
        setValue("netfree_profile", client.netfree_profile);
      } else {
        setValue("netfree_profile", netfreeProfiles[0].id);
      }
      let defaultData = [];
      for (let value in data) {
        if (value !== "netfree_profile") {
          let fieldValue;
          const field = fullFormData.filter(
            (field) => field?.field_slug === value
          );
          const dataValue = data[value];

          switch (field[0]?.data_type.value) {
            case "select":
              fieldValue =
                dataValue.length < 1
                  ? field[0]?.enum_values?.choices[0]?.id
                  : dataValue[0];
              break;
            case "file":
              fieldValue =
                dataValue !== ""
                  ? { name: dataValue.file_name.split("upload/")[1] }
                  : "";
              break;
            case "date":
              fieldValue =
                dataValue === ""
                  ? dayjs(Date.now()).utc(true).toISOString(true)
                  : dataValue;
              break;
            case "checkbox":
              fieldValue =
                dataValue === "" ? "false" : JSON.stringify(dataValue);
              break;
            default:
              fieldValue = dataValue;
              break;
          }
          defaultData.push({
            [value]: fieldValue,
          });
          setValue(value, fieldValue);
        }
      }
      const result = defaultData.reduce(
        (acc, curr) => Object.assign(acc, curr),
        {}
      );
      setDefaultValues(result);
    }
  }, [JSON.stringify(client), newClient]);

  return (
    <>
      {defaultValues && fullFormData.length > 0 ? (
        <div className="fixed left-0 bottom-0 z-[99] h-screen w-screen bg-[#00000080] flex justify-center items-center">
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-[9999] outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-7xl">
              <div className="w-[100%] min-w-[80vw] md:min-w-[70vw] lg:min-w-[60vw] overflow-y-auto border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
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
                  <div className="flex items-start justify-between p-5 shadow-md rounded-t">
                    <h3 className="text-xl font-bold">
                      {newClient
                        ? t("netfree.addClient")
                        : t("netfree.editClient")}
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
                  <div className="relative p-6 flex-auto max-h-[calc(90vh-170px)] overflow-y-auto">
                    <div className="mb-6 flex w-full items-start">
                      <FieldLabel
                        className={`w-[30%] ${lang === "he" ? "ml-6" : "mr-6"}`}
                      >
                        {t("netfree.netfreeProfile")}
                      </FieldLabel>
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
                        {errors.netfree_profile && (
                          <ErrorMessage
                            message={errors.netfree_profile.message}
                          />
                        )}
                      </div>
                    </div>
                    {fullFormData.map((field, index) => {
                      const isDate = DateFieldConstants.includes(
                        field.data_type.value
                      );
                      const isFile = field?.data_type?.value === "file";
                      return (
                        <div
                          className={`mb-6 flex w-full items-start`}
                          key={index}
                        >
                          <FieldLabel
                            className={`w-[30%] ${
                              lang === "he" ? "ml-6" : "mr-6"
                            }`}
                          >
                            {lang === "he"
                              ? field.field_name_language.he
                              : field?.field_name}
                          </FieldLabel>
                          <div className="w-[60%]">
                            <Controller
                              name={field.field_slug}
                              control={control}
                              render={({
                                field: { value, onChange, onBlur },
                              }) => {
                                return (
                                  <CustomField
                                    setValue={setValue}
                                    disabled={false}
                                    field={field}
                                    onChange={(e) => {
                                      if (isDate) {
                                        setValue(
                                          field.field_slug,
                                          dayjs(e).utc(true).toISOString(),
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          }
                                        );
                                      } else if (isFile) {
                                        setValue(
                                          field.field_slug,
                                          e.target.files[0],
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          }
                                        );
                                      } else {
                                        onChange(e);
                                      }
                                    }}
                                    value={value}
                                    onBlur={onBlur}
                                  />
                                );
                              }}
                            />
                            {errors[field.field_slug] && (
                              <ErrorMessage
                                message={errors[field.field_slug].message}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end p-4 border-t border-solid border-blueGray-200 rounded-b">
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

export default React.memo(ClientModal);
