import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,

  // Recupera la sesión del usuario al cargar la app desde el token guardado
  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');
      set({ user: res.data, token });
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, token: null });
    }
  },

  // Llamado desde la página /auth/callback con el token y usuario que llegan de Discord
  loginFromDiscord: (token, user) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ user, token });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
