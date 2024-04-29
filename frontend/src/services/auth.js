import api from "./api";

const login = (email, password) => {
  return api
    .post('/api/auth/login/', {
      email,
      password
    })
}

const getUsers = (params) => {
  return api
    .get(`/api/auth/users/${params}`)
}

const createUser = (data) => {
  return api.post(`/api/auth/users/create/`, data)
}

const editUser = (data, id) => {
  return api.put(`/api/auth/edit/${id}/`, data)
}

const deleteUser = (id) => {
  return api.delete(`/api/auth/edit/${id}/`)
}

const authService = {
  login,
  getUsers,
  createUser,
  editUser,
  deleteUser
}
export default authService
