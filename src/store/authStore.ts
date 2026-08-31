import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  rollNo: number;
  department: string;
  session: string;
  semester: string;
  instituteName: string;
  instituteId: number;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserProfile, token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user, token) => {
    try {
      set({ isLoading: true });
      
      // Save to secure hardware storage
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('polymate_token', token);
        await SecureStore.setItemAsync('polymate_user', JSON.stringify(user));
      } else {
        localStorage.setItem('polymate_token', token);
        localStorage.setItem('polymate_user', JSON.stringify(user));
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to save auth session:', error);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Wipe from storage
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('polymate_token');
        await SecureStore.deleteItemAsync('polymate_user');
      } else {
        localStorage.removeItem('polymate_token');
        localStorage.removeItem('polymate_user');
      }

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to clear auth session:', error);
      set({ isLoading: false });
    }
  },

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      let token: string | null = null;
      let userStr: string | null = null;

      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('polymate_token');
        userStr = await SecureStore.getItemAsync('polymate_user');
      } else {
        token = localStorage.getItem('polymate_token');
        userStr = localStorage.getItem('polymate_user');
      }

      if (token && userStr) {
        const user = JSON.parse(userStr) as UserProfile;
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to restore auth session:', error);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));
