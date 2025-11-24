import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosConfig';

interface UserState {
  username: string;
  fullName: string;
  email: string;
  isAuthenticated: boolean;
  token: string | null;
  error: string | null;
  loading: boolean;
}

const initialState: UserState = {
  username: '',
  fullName: '',
  email: '',
  isAuthenticated: false,
  token: localStorage.getItem('token') || null,
  error: null,
  loading: false,
};

// Проверяем, есть ли сохраненный токен при инициализации
if (initialState.token) {
  initialState.isAuthenticated = true;
  // Можно также загрузить данные пользователя из токена или сделать запрос к /users/profile
}

// Асинхронное действие для авторизации
export const loginUserAsync = createAsyncThunk(
  'user/loginUserAsync',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/users/login', credentials);
      const token = response.data.token || response.data.access_token;
      
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return {
        username: response.data.user?.username || response.data.username || credentials.username,
        fullName: response.data.user?.full_name || response.data.full_name || '',
        email: response.data.user?.email || response.data.email || '',
        token: token
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка авторизации');
    }
  }
);

// Асинхронное действие для регистрации
export const registerUserAsync = createAsyncThunk(
  'user/registerUserAsync',
  async (userData: { username: string; password: string; email: string; full_name: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/users/register', userData);
      return {
        username: response.data.username,
        fullName: response.data.full_name,
        email: response.data.email,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка регистрации');
    }
  }
);

// Асинхронное действие для деавторизации
export const logoutUserAsync = createAsyncThunk(
  'user/logoutUserAsync',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/users/logout');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return {};
    } catch (error: any) {
      // Даже если запрос не удался, очищаем локальное хранилище
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return {};
    }
  }
);

// Получение профиля пользователя
export const getProfileAsync = createAsyncThunk(
  'user/getProfileAsync',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Токен не найден');
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/users/profile');
      
      return {
        username: response.data.username,
        fullName: response.data.full_name,
        email: response.data.email,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке профиля');
    }
  }
);

// Обновление профиля пользователя
export const updateProfileAsync = createAsyncThunk(
  'user/updateProfileAsync',
  async (profileData: { email?: string; full_name?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.put('/users/profile', profileData);
      return {
        username: response.data.username,
        fullName: response.data.full_name,
        email: response.data.email,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при обновлении профиля');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.username = action.payload.username;
        state.fullName = action.payload.fullName;
        state.email = action.payload.email;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.username = action.payload.username;
        state.fullName = action.payload.fullName;
        state.email = action.payload.email;
        state.error = null;
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.username = '';
        state.fullName = '';
        state.email = '';
        state.isAuthenticated = false;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        // Все равно очищаем состояние
        state.username = '';
        state.fullName = '';
        state.email = '';
        state.isAuthenticated = false;
        state.token = null;
      })
      // Get Profile
      .addCase(getProfileAsync.fulfilled, (state, action) => {
        state.username = action.payload.username;
        state.fullName = action.payload.fullName;
        state.email = action.payload.email;
        state.isAuthenticated = true;
      })
      // Update Profile
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.fullName = action.payload.fullName;
        state.email = action.payload.email;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;

