// React imports
import React from "react";

// UI Imports
import { Select, MenuItem } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// UI Components Imports
import CustomCheckBox from "./checkbox";

// CSS imports
import "react-phone-number-input/style.css";

// Third part Imports
import dayjs from "dayjs";
import PhoneInput from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import he from "react-phone-number-input/locale/he";
import { useTranslation } from "react-i18next";

// Icon imports
import { MdOutlineUploadFile } from "react-icons/md";

// Utils imports
import {
  DateFieldConstants,
  NumberFieldConstants,
  TextFieldConstants,
  checkBoxConstants,
} from "../../lib/FieldConstants";
import { handleNumberkeyPress } from "../../lib/CommonFunctions";

function CustomField(props) {
  const { t } = useTranslation();
  const { data_type, required, enum_values, defaultvalue } = props.field;
  const { onChange, onBlur, value, disabled } = props;
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");

  return (
    <>
      {TextFieldConstants.includes(data_type.value) && (
        <input
          type={data_type.value}
          className="shadow appearance-none outline-none border rounded w-full p-2 text-black"
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          value={value ? value : ""}
          disabled={disabled}
          placeholder={defaultvalue}
        />
      )}
      {NumberFieldConstants.includes(data_type.value) && (
        <input
          type="number"
          min="0"
          onKeyDown={handleNumberkeyPress}
          className="shadow appearance-none outline-none border rounded w-full p-2 text-black"
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          value={value ? value : ""}
          disabled={disabled}
          placeholder={defaultvalue}
        />
      )}
      {data_type.value === "phone" && (
        <PhoneInput
          labels={lang === "en" ? en : he}
          className="shadow appearance-none outline-none border rounded w-full p-2 text-black [&>input]:outline-none [&>input]:bg-white"
          placeholder={t("clients.enterNumber")}
          defaultCountry={"IL"}
          value={value ? value : ""}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
        />
      )}
      {data_type.value === "file" && (
        <label className="shadow text-md flex items-center w-full appearance-none outline-none border rounded p-2.5 text-black">
          <MdOutlineUploadFile
            style={{
              marginRight: "5px",
              fontSize: "1.25rem",
            }}
          />
          {value?.name || value?.file_name || value}
          <input
            type={data_type.value}
            required={required}
            onChange={onChange}
            onBlur={onBlur}
            hidden
            disabled={disabled}
          />
        </label>
      )}
      {data_type.value === "select" && (
        <Select
          className="shadow [&_div]:p-0.5 [&_fieldset]:border-none appearance-none border rounded outline-none w-full p-2 text-black bg-white"
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          defaultValue={
            enum_values?.choices?.filter(
              (item) => item.id == value || item.value === value
            )[0]?.id
          }
          placeholder="Select"
        >
          {enum_values?.choices?.map((el) => {
            return el !== "" ? (
              <MenuItem key={el.id} value={el.id}>
                {el.label}
              </MenuItem>
            ) : null;
          })}
        </Select>
      )}
      {checkBoxConstants.includes(data_type.value) && (
        <CustomCheckBox
          onChange={onChange}
          onBlur={onBlur}
          checked={value === "true" || value === true ? true : false}
          disabled={disabled}
        />
      )}
      {DateFieldConstants.includes(data_type.value) && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            className="shadow appearance-none outline-none border-0 rounded w-full p-0 text-black"
            format="DD/MM/YYYY"
            onChange={onChange}
            onBlur={onBlur}
            value={dayjs(value)}
            disabled={disabled}
            sx={{
              border: 0,
              "& .MuiInputBase-input": {
                padding: 1.5,
                border: "none",
              },
              "& fieldset": {
                borderColor: "inherit!important",
              },
            }}
          />
        </LocalizationProvider>
      )}
    </>
  );
}

export default CustomField;
