import axios, { AxiosRequestConfig } from "axios";
import Constants from "expo-constants";

let API_URI = Constants.manifest?.extra?.API_URI;

// API_URI = `http://localhost:3000`

export const $get = async (
  endpoint: string,
  params?: any,
  config?: AxiosRequestConfig | undefined
) => {
  try {
    const response = await axios.get(`${API_URI}${endpoint}`, {
      params,
      ...(config || {}),
    });

    return response;
  } catch (error) {
    console.log(error);
  }
};

export const $post = async (
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig | undefined
) => {
  try {
    const response = await axios.post(`${API_URI}${endpoint}`, data, config);

    return response;
  } catch (error) {
    console.log(error);
  }
};
