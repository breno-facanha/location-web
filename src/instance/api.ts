import axios from "axios";

const instance = axios.create({
  baseURL: 'https://location-api-production-3429.up.railway.app/',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});

export default instance;
