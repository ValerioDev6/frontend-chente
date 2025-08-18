import axios from 'axios';

axios.defaults.withCredentials = true; // Importante para enviar cookies HTTP-only

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/auth/';

export const signup = async (userData: any) => {
  try {
    const response = await axios.post(API_URL + 'signup', userData, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const signin = async (credentials: any) => {
  try {
    const response = await axios.post(API_URL + 'signin', credentials, { withCredentials: true });
    // El token se establece en las cookies HTTP-only por el backend
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const signout = async () => {
  try {
    const response = await axios.post(API_URL + 'signout', {}, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get(API_URL + 'current-user', { withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const refreshToken = async () => {
  try {
    const response = await axios.post(API_URL + 'refresh', {}, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};