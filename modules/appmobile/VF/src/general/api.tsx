import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notify } from './notification';

export const BASE_URL = "http://192.168.1.69:8000";
export const API_URL = `${BASE_URL}/api`;
var is_auth_alert_shown = false;

const apiFitlife = axios.create({
    baseURL: API_URL,
});
apiFitlife.defaults.headers.common['Accept'] = 'application/json';
apiFitlife.defaults.headers.common['Content-Type'] = 'application/json';

apiFitlife.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if(token){
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
        if (status == 401 && is_auth_alert_shown == false) {
            is_auth_alert_shown = true;
            notify({
                type: "auth",
                message: check_error.data.message ? check_error.data.message : "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
            })
            await AsyncStorage.removeItem('token');
        }
        setTimeout(() => {
            is_auth_alert_shown = false;
        }, 3000);
        return Promise.reject(error.response || error);
    }
);

export default apiFitlife;