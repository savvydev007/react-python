// Third part Imports
import axios from "axios";

// Utils imports
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../constants";
import { errorsToastHandler } from "../lib/CommonFunctions";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});

const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const res = await axios.post(
      import.meta.env.VITE_API_URL + "/api/auth/token/refresh/",
      { refresh: refreshToken }
    );
    if (res.status === 200) {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.data.access);
      return res.data.access;
    }
  } catch (error) {
    console.log(error);
    localStorage.clear();
    if (!window.location.pathname.includes("/signin")) {
      window.location = "/signin";
    }
  }
};

const requestSuccessInterceptor = (config) => {
  const authToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (authToken) {
    config.headers.Authorization = "Bearer " + authToken;
  }

  return config;
};

api.interceptors.request.use(requestSuccessInterceptor);

api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    if (err.response.status > 400) {
      const originalRequest = err.config;
      if (err.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const access_token = await refreshAccessToken();
        axios.defaults.headers.common["Authorization"] =
          "Bearer " + access_token;
        return api(originalRequest);
      }
    }
    if (Object.keys(err?.response?.data?.errors).length > 0) {
      errorsToastHandler(err.response.data.errors);
    }
    return Promise.reject(err);
  }
);

export default api;
