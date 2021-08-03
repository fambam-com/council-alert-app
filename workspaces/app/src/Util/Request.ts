import axios, { AxiosRequestConfig } from "axios";
import Constants from "expo-constants";

const API_URI = Constants.manifest?.extra?.API_URI;

export const $get = async (
  endpoint: string,
  config?: AxiosRequestConfig | undefined
) => {
  try {
    const response = await axios.get(`${API_URI}${endpoint}`, config);

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
    const response = await axios.post(
      `http://localhost:3000${endpoint}`,
      data,
      config
    );

    return response;
  } catch (error) {
    console.log(error);
  }
};
