import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notify } from './notification';


export const BASE_URL = "http://172.29.192.1:8000";

// cái ni của Ngọc đừng xóa :)) comment nó lại giùm đi. 
// export const BASE_URL = "http://192.168.1.152:8000"; 

// export const BASE_URL = "http://192.168.1.171:8000"; 


// Cái này của Hùng xóa là t chém.
// export const BASE_URL = "http://localhost:8000";

export const API_URL = `${BASE_URL}/api`;
var is_auth_alert_shown = false;

const apiFitlife = axios.create({
    baseURL: API_URL,
    timeout: 10000, // BE không phản hồi sau 10s thì báo lỗi, tránh treo màn hình Onloading
});
apiFitlife.defaults.headers.common['Accept'] = 'application/json';
apiFitlife.defaults.headers.common['Content-Type'] = 'application/json';

apiFitlife.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    }
);
apiFitlife.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // const navigation = require('../navigation/RootNavigation').default;
        var check_error = error.response;
        const status = check_error ? error.response.status : 500;
        if (status === 401 && !is_auth_alert_shown) {
            is_auth_alert_shown = true;
        
            console.log("AUTH ERROR:", {
                url: error.config?.url,
                status: error.response?.status,
                message: error.response?.data?.message,
            });
        
            notify({
                type: "auth",
                message:
                    error.response?.data?.message ||
                    "API không chấp nhận quyền truy cập hiện tại."
            });
        }
        setTimeout(() => {
            is_auth_alert_shown = false;
        }, 3000);
        // return Promise.reject(error.response || error);
        return Promise.reject(error);
    }
);

export default apiFitlife;
