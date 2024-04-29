import api from "./api";

const getLogs = (params) => {
    return api
        .get(`/api/client/logs/${params}`)
}

const logsService = {
    getLogs
}
export default logsService;