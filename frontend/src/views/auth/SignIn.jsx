// React imports
import { useState } from "react";

// UI Components Imports
import InputField from "../../component/fields/InputField";
import LanguageSelect from "../../component/common/LanguageSelect";

// Third part Imports
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// API services
import authService from "../../services/auth";

// Utils imports
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../../constants/index";

// Custom hooks imports
import useAlert from "../../Hooks/useAlert";

export default function SignIn() {
  const navigate = useNavigate();
  const formObject = {
    email: null,
    password: null,
  };

  const [formdata, setFormData] = useState(formObject);
  const { t } = useTranslation();
  const { setAlert } = useAlert();
  const handleLogin = async (event) => {
    event.preventDefault();
    authService
      .login(formdata.email, formdata.password)
      .then((data) => {
        if (data.status === 200) {
          setAlert(t("auth.loginSuccess"), "success");
          localStorage.setItem(ACCESS_TOKEN_KEY, data.data.access);
          localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refresh);
          navigate("/request");
        } else {
          setAlert(t("auth.loginFailed"), "error");
        }
      })
      .catch((error) => {
        setAlert(error.response.data.message, "error");
      });
  };
  const handleInput = (event) => {
    setFormData({ ...formdata, [event.target.name]: event.target.value });
  };

  const formValidate = () => {
    if (!formdata.email || !formdata.password) {
      return false;
    }
    if (formdata.email && !/\S+@\S+\.\S+/.test(formdata.email)) {
      return false;
    }
    if (formdata.password && formdata.password.length < 2) {
      return false;
    }
    return true;
  };
  return (
    <div className="relative w-screen h-screen">
      <LanguageSelect
        customClass={`absolute top-[1rem] md:top-[2rem] right-[1rem] md:right-[2rem] p-2 border-[1px] border-[#E0E5F2] rounded-md`}
      />
      <div className="w-[20rem] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <form onSubmit={handleLogin}>
          <InputField
            variant="auth"
            extra="mb-3"
            label={t("auth.email")}
            id="email"
            type="text"
            onChange={handleInput}
            name="email"
          />
          <InputField
            variant="auth"
            extra="mb-3"
            label={t("auth.password")}
            id="password"
            type="password"
            name="password"
            onChange={handleInput}
          />
          <div className="mb-4 flex items-center justify-between px-2">
            <a
              className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
              href=" "
            >
              {t("auth.forgotPassword")}
            </a>
          </div>
          <button
            type="submit"
            className={`linear mt-2 w-full rounded-xl py-[12px] text-base font-medium transition duration-200 ${
              formValidate()
                ? "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
                : "bg-gray-300"
            }`}
          >
            {t("auth.signin")}
          </button>
        </form>
      </div>
    </div>
  );
}
