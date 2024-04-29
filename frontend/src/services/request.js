import api from "./api";

const getRequests = (params) => {
  return api.get(`/api/crm/requests/${params}`);
};

const getRequestStatuses = (params) => {
  return api.get(`/api/crm/requests-status/${params}`);
};

const updateRequestStatus = (data) => {
  return api.put(`/api/crm/requests/`, data);
};

const createRequestStatus = (data) => {
  return api.post("/api/crm/requests-status/", data);
};

const updateStatus = (id, data) => {
  return api.put(`/api/crm/requests-status/${id}/`, data);
};

const deleteStatus = (id) => {
  return api.delete(`/api/crm/requests-status/${id}/`);
};

const deleteCategoryStatus = (id) => {
  return api.delete(`/api/crm/category-request-status/${id}/`);
};

const requestService = {
  getRequests,
  getRequestStatuses,
  updateRequestStatus,
  createRequestStatus,
  updateStatus,
  deleteStatus,
  deleteCategoryStatus,
};
export default requestService;
