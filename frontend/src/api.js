import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({ 
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true // Include credentials with requests
});

export default api;