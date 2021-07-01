

import axios from 'axios';

const Api = axios.create({
    timeout: 7000, // 请求超时时间
    baseURL: 'http://localhost:8180'
  });
  Api.defaults.headers.post['Content-Type'] = 'application/json, charset=utf-8'
  export default Api;