import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_BASE_API || 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// REQUEST INTERCEPTOR: Automatically attach the Access Token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Catch 401 Unauthorized errors and automatically refresh the token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401, and we haven't tried to retry yet...
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                // Ask Django for a new access token
                const response = await axios.post(`${baseURL}login/refresh/`, {
                    refresh: refreshToken
                });

                // Save the new token
                localStorage.setItem('access_token', response.data.access);
                
                // Retry the original request (e.g., booking the room) with the new token
                originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                // If the refresh token is also dead, log them out
                console.log("Session expired. Please log in again.");
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                // You can optionally force a page reload here: window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;