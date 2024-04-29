import api from "./api";

const getTemplates = () => {
  return api
    .get('/api/crm/template/')
}

const addNewTemplate = (data) => {
  return api
    .post('/api/crm/template/', data)
}

const updateTemplate = (data) => {
  return api
    .patch('/api/crm/template/', data)
}

const getSingleTemplate = (id) => {
  return api
    .get(`/api/crm/template/?id=${id}`)
}

const deleteTemplate = (id) => {
  return api
    .delete(`/api/crm/template/?id=${id}`)
}

const sendEmail = (data) => {
  return api
    .post(`/api/crm/send-email`, data)
}

const loginEmail = (data) => {
  return api.post(`/api/crm/smtp-email/`, data);
}

const getSMTPDetail = () => {
  return api.get(`/api/crm/smtp-email/`);
}

const duplicateTemplate = (templateId) => {
  return api.post('/api/crm/template-clone/', { id: templateId });
}

const getTemplatingTexts = (params) => {
  return api.get(`/api/crm/hoursvalues/${params}`);
}

const createTemplatingText = (data) => {
  return api.post("/api/crm/hoursvalues/", data);
}

const updateTemplatingText = (data, id) => {
  return api.put(`/api/crm/hoursvalues/${id}/`, data);
}

const deleteTemplatingText = (id) => {
  return api.delete(`/api/crm/hoursvalues/${id}/`);
}

const emailService = {
  getTemplates,
  addNewTemplate,
  updateTemplate,
  getSingleTemplate,
  deleteTemplate,
  sendEmail,
  loginEmail,
  getSMTPDetail,
  duplicateTemplate,
  getTemplatingTexts,
  createTemplatingText,
  updateTemplatingText,
  deleteTemplatingText
}
export default emailService;
