import api from './api';

export default {
    login(credentials) {
        return api.post('/auth/login', credentials);
    },
    logout() {
        return api.post('/auth/logout');
    },
    register(userData) {
        return api.post('/auth/register', userData);
    },    
    setToken(token) {
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    getToken() {
        return localStorage.getItem('token')
    },

    removeToken() {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
    },
    isAuthenticated() {
        return !!this.getToken()
    }
}