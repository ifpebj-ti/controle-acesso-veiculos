import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});