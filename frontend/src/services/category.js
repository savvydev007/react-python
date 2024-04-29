import api from "./api";

const getCategories = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/category/?lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const searchSiteSetting = (query) => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/category/?search=${query}&lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const getActions = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/actions/?lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const setDefaultAction = (data, params) => {
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.post(
    `/api/crm/actions/?profile=${
      filterProfileID ? filterProfileID : "1"
    }${params}`,
    data
  );
};

const getDefaultAction = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/actions/?get_default=true&lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const getDefaultStatus = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `api/crm/actions/?get_default_request_status=true&lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const getTrafficStatus = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `api/crm/actions/?get_netfree_traffic_status=true&lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const getDefaultTrafficActions = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/actions/?get_netfree_traffic=true&lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const getDefaultTraffic = () => {
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/netfree-traffic/?default=true&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const updateNetfreeTraffic = (data) => {
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.post(
    `/api/crm/netfree-traffic/?profile=${
      filterProfileID ? filterProfileID : "1"
    }`,
    data
  );
};

const updateCategories = () => {
  return api.post("/api/crm/category/");
};

const updateActionInCategory = (data, id) => {
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  if (id) {
    return api.put(
      `/api/crm/category/?status=update&id=${id}&profile=${
        filterProfileID ? filterProfileID : "1"
      }`,
      data
    );
  } else {
    return api.put(
      `/api/crm/category/?profile=${filterProfileID ? filterProfileID : "1"}`,
      data
    );
  }
};

const getProfilesList = (params = "") => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  return api.get(`/api/crm/netfree-categories-profile/?lang=${lang}&${params}`);
};

const createFilterProfile = (data) => {
  return api.post(`/api/crm/netfree-categories-profile/`, data);
};

const updateFilterProfile = (data, params) => {
  return api.put(`/api/crm/netfree-categories-profile/${params}`, data);
};

const deleteDefaultAction = (actionID) => {
  return api.delete(`/api/crm/actions/?action_id=${actionID}`);
};

const deleteProfile = (profileID) => {
  return api.delete(`/api/crm/netfree-categories-profile/${profileID}/`);
};

const duplicateProfile = (data) => {
  return api.post("/api/crm/netfree-categories-profile-clone/", data);
};

const categoryService = {
  getCategories,
  getActions,
  setDefaultAction,
  getDefaultAction,
  getDefaultTraffic,
  updateCategories,
  updateNetfreeTraffic,
  updateActionInCategory,
  searchSiteSetting,
  getProfilesList,
  createFilterProfile,
  updateFilterProfile,
  getDefaultTrafficActions,
  deleteDefaultAction,
  deleteProfile,
  duplicateProfile,
  getDefaultStatus,
  getTrafficStatus,
};
export default categoryService;
