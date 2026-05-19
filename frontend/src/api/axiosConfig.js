import axios from 'axios';

// This uses the environment variable if deployed, otherwise defaults to local Django
const baseURL = import.meta.env.VITE_BACKEND_BASE_API || 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;