import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // if you use cookies for auth
});

export default api;
