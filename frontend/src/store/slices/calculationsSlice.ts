import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosConfig';

interface Calculation {
  id: number;
  status: string;
  title: string;
  description: string;
  creator_id: number;
  creator_login: string;
  created_at: string;
  formed_at?: string;
  completed_at?: string;
  total_cost?: number;
  delivery_date?: string;
}

interface MaterialCalculation {
  calculation_id: number;
  material_id: number;
  quantity: number;
  sort_order: number;
  is_main: boolean;
  comment: string;
  result_freq?: number;
  result_percent?: number;
  created_at: string;
  material: any;
}

interface CalculationsState {
  calculations: Calculation[];
  currentCalculation: Calculation | null;
  calculationMaterials: MaterialCalculation[];
  cartInfo: {
    calculation_id: number | null;
    item_count: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CalculationsState = {
  calculations: [],
  currentCalculation: null,
  calculationMaterials: [],
  cartInfo: {
    calculation_id: null,
    item_count: 0,
  },
  loading: false,
  error: null,
};

// Получение списка заявок
export const getCalculationsList = createAsyncThunk(
  'calculations/getCalculationsList',
  async (filters?: { status?: string; formed_from?: string; formed_to?: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.formed_from) params.append('formed_from', filters.formed_from);
      if (filters?.formed_to) params.append('formed_to', filters.formed_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(`/calculations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке заявок');
    }
  }
);

// Получение информации о корзине
export const getCartInfo = createAsyncThunk(
  'calculations/getCartInfo',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { calculation_id: null, item_count: 0 };
      }

      const response = await axios.get('/calculations/cart-info', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      // Если ошибка авторизации, возвращаем пустую корзину
      return { calculation_id: null, item_count: 0 };
    }
  }
);

// Получение заявки по ID
export const getCalculationById = createAsyncThunk(
  'calculations/getCalculationById',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.get(`/calculations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке заявки');
    }
  }
);

// Получение материалов заявки
export const getCalculationMaterials = createAsyncThunk(
  'calculations/getCalculationMaterials',
  async (calculationId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.get(`/calculations/${calculationId}/materials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке материалов');
    }
  }
);

// Добавление материала в заявку
export const addMaterialToCalculation = createAsyncThunk(
  'calculations/addMaterialToCalculation',
  async (materialId: number, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.post(`/materials/${materialId}/add-to-cart`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Обновляем информацию о корзине после добавления
      if (response.data.calculation_id) {
        dispatch(getCartInfo());
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при добавлении материала');
    }
  }
);

// Удаление материала из заявки
export const removeMaterialFromCalculation = createAsyncThunk(
  'calculations/removeMaterialFromCalculation',
  async ({ calculationId, materialId }: { calculationId: number; materialId: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      await axios.delete(`/calculations/${calculationId}/materials/${materialId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { calculationId, materialId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении материала');
    }
  }
);

// Обновление материала в заявке
export const updateMaterialInCalculation = createAsyncThunk(
  'calculations/updateMaterialInCalculation',
  async ({ calculationId, materialId, updates }: { calculationId: number; materialId: number; updates: { quantity?: number; comment?: string } }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      await axios.put(`/calculations/${calculationId}/materials/${materialId}`, updates, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { calculationId, materialId, updates };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при обновлении материала');
    }
  }
);

// Формирование заявки (подтверждение)
export const formCalculation = createAsyncThunk(
  'calculations/formCalculation',
  async ({ calculationId, data }: { calculationId: number; data: { installation_weight: number; natural_frequency: number } }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.put(`/calculations/${calculationId}/form`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при формировании заявки');
    }
  }
);

// Удаление заявки
export const deleteCalculation = createAsyncThunk(
  'calculations/deleteCalculation',
  async (calculationId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      await axios.delete(`/calculations/${calculationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return calculationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении заявки');
    }
  }
);

const calculationsSlice = createSlice({
  name: 'calculations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCalculation: (state) => {
      state.currentCalculation = null;
      state.calculationMaterials = [];
    },
    clearCartInfo: (state) => {
      state.cartInfo = {
        calculation_id: null,
        item_count: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Calculations List
      .addCase(getCalculationsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCalculationsList.fulfilled, (state, action) => {
        state.loading = false;
        state.calculations = action.payload;
      })
      .addCase(getCalculationsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Cart Info
      .addCase(getCartInfo.fulfilled, (state, action) => {
        state.cartInfo = {
          calculation_id: action.payload.calculation_id || action.payload.calculationId || null,
          item_count: action.payload.item_count || action.payload.itemCount || 0,
        };
      })
      // Get Calculation By Id
      .addCase(getCalculationById.fulfilled, (state, action) => {
        state.currentCalculation = action.payload;
      })
      // Get Calculation Materials
      .addCase(getCalculationMaterials.fulfilled, (state, action) => {
        state.calculationMaterials = action.payload;
      })
      // Add Material To Calculation
      .addCase(addMaterialToCalculation.fulfilled, (state, action) => {
        if (action.payload.calculation_id) {
          state.cartInfo.calculation_id = action.payload.calculation_id;
          // Увеличиваем счетчик товаров
          state.cartInfo.item_count += 1;
        }
      })
      .addCase(addMaterialToCalculation.rejected, (state) => {
        // Ошибка при добавлении - не меняем состояние
      })
      // Remove Material From Calculation
      .addCase(removeMaterialFromCalculation.fulfilled, (state, action) => {
        state.calculationMaterials = state.calculationMaterials.filter(
          (item) => item.material_id !== action.payload.materialId
        );
        // Обновляем счетчик товаров
        if (state.cartInfo.item_count > 0) {
          state.cartInfo.item_count -= 1;
        }
        // Если товаров не осталось, сбрасываем calculation_id
        if (state.cartInfo.item_count === 0) {
          state.cartInfo.calculation_id = null;
        }
      })
      // Form Calculation
      .addCase(formCalculation.fulfilled, (state, action) => {
        if (state.currentCalculation) {
          state.currentCalculation.status = action.payload.status;
        }
      })
      // Delete Calculation
      .addCase(deleteCalculation.fulfilled, (state, action) => {
        state.calculations = state.calculations.filter((calc) => calc.id !== action.payload);
        if (state.currentCalculation?.id === action.payload) {
          state.currentCalculation = null;
          state.calculationMaterials = [];
        }
        if (state.cartInfo.calculation_id === action.payload) {
          state.cartInfo.calculation_id = null;
          state.cartInfo.item_count = 0;
        }
      });
  },
});

export const { clearError, clearCurrentCalculation, clearCartInfo } = calculationsSlice.actions;
export default calculationsSlice.reducer;

