import api from "./api";

const getDomains = () => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.get(
    `/api/crm/domain-list/?lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const createDomain = (formData) => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.post(
    `/api/crm/domain-list/?lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`,
    formData
  );
};
const editDomain = (formData, id) => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.put(
    `/api/crm/domain-list/${id}/?lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`,
    formData
  );
};

const deleteDomain = (domain_id) => {
  const lang = localStorage.getItem("DEFAULT_LANGUAGE");
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  return api.delete(
    `/api/crm/domain-list/${domain_id}/?lang=${lang}&profile=${
      filterProfileID ? filterProfileID : "1"
    }`
  );
};

const websiteActions = (data, id) => {
  const filterProfileID = localStorage.getItem("FILTER_PROFILE_ID");
  if (id) {
    return api.post(
      `/api/crm/domain-action/?status=update&id=${id}&profile=${
        filterProfileID ? filterProfileID : "1"
      }`,
      data
    );
  } else {
    return api.post(
      `/api/crm/domain-action/?profile=${
        filterProfileID ? filterProfileID : "1"
      }`,
      data
    );
  }
};

const deleteWebsiteStatus = (id) => {
  return api.delete(
    `/api/crm/category-request-status/${id}/?request_type=domain`
  );
};

const websiteServices = {
  getDomains,
  createDomain,
  editDomain,
  deleteDomain,
  websiteActions,
  deleteWebsiteStatus,
};
export default websiteServices;
