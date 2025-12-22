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


export const getCalcIsolationList = createAsyncThunk(
  'calc_isolation/getCalcIsolationList',
  async (filters?: { status?: string; formed_from?: string; formed_to?: string; page?: number; limit?: number; silent?: boolean }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.formed_from) params.append('formed_from', filters.formed_from);
      if (filters?.formed_to) params.append('formed_to', filters.formed_to);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(`/calculations?${params.toString()}`);

      return { data: response.data.data || response.data, silent: filters?.silent || false };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке заявок');
    }
  }
);


export const getIsolationCartInfo = createAsyncThunk(
  'calc_isolation/getIsolationCartInfo',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return { calculation_id: null, item_count: 0 };
      }

      const response = await axios.get('/calculations/cart-info');

      return response.data;
    } catch (error: any) {

      return { calculation_id: null, item_count: 0 };
    }
  }
);


export const getCalcIsolationById = createAsyncThunk(
  'calc_isolation/getCalcIsolationById',
  async (id: number, { rejectWithValue, getState }) => {
    try {

      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.get(`/calculations/${id}`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке заявки');
    }
  }
);


export const getCalcIsolationMaterials = createAsyncThunk(
  'calc_isolation/getCalcIsolationMaterials',
  async (calculationId: number, { rejectWithValue, getState }) => {
    try {

      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.get(`/calculations/${calculationId}/materials`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке материалов');
    }
  }
);


export const addMaterialToCalcIsolation = createAsyncThunk(
  'calc_isolation/addMaterialToCalcIsolation',
  async (materialId: number, { rejectWithValue, dispatch, getState }) => {
    try {

      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.post(`/materials/${materialId}/add-to-cart`, {});

      // cartInfo обновится автоматически через addMaterialToCalcIsolation.fulfilled
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при добавлении материала');
    }
  }
);

export const removeMaterialFromCalcIsolation = createAsyncThunk(
  'calc_isolation/removeMaterialFromCalcIsolation',
  async ({ calculationId, materialId }: { calculationId: number; materialId: number }, { rejectWithValue, getState }) => {
    try {

      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      await axios.delete(`/calculations/${calculationId}/materials/${materialId}`);

      return { calculationId, materialId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении материала');
    }
  }
);

export const updateMaterialInCalcIsolation = createAsyncThunk(
  'calc_isolation/updateMaterialInCalcIsolation',
  async ({ calculationId, materialId, updates }: { calculationId: number; materialId: number; updates: { quantity?: number; comment?: string } }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      await axios.put(`/calculations/${calculationId}/materials/${materialId}`, updates);

      return { calculationId, materialId, updates };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при обновлении материала');
    }
  }
);


export const formCalcIsolation = createAsyncThunk(
  'calc_isolation/formCalcIsolation',
  async ({ calculationId, data }: { calculationId: number; data: { installation_weight: number; natural_frequency: number } }, { rejectWithValue, getState }) => {
    try {
      // Получаем токен из Redux state
      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      const response = await axios.put(`/calculations/${calculationId}/form`, data);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при формировании заявки');
    }
  }
);


export const deleteCalcIsolation = createAsyncThunk(
  'calc_isolation/deleteCalcIsolation',
  async (calculationId: number, { rejectWithValue, getState }) => {
    try {
      // Получаем токен из Redux state
      const state = getState() as any;
      const token = state.user?.token;
      if (!token) {
        return rejectWithValue('Требуется авторизация');
      }

      await axios.delete(`/calculations/${calculationId}`);

      return calculationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении заявки');
    }
  }
);

// Вызов асинхронного сервиса для расчета стоимости
export const triggerAsyncCalcIsolation = createAsyncThunk(
  'calc_isolation/triggerAsyncCalcIsolation',
  async (calculationId: number, { rejectWithValue }) => {
    try {
      // Вызываем Django асинхронный сервис напрямую
      const response = await fetch('http://localhost:8000/calculate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calculation_id: calculationId }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при вызове асинхронного сервиса');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка при вызове асинхронного сервиса');
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
      .addCase(getCalcIsolationList.pending, (state, action) => {
        // Не показываем loading при тихом обновлении (silent polling)
        if (!(action.meta.arg as any)?.silent) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(getCalcIsolationList.fulfilled, (state, action) => {
        state.loading = false;
        // Обрабатываем payload - может быть объект с data и silent, или просто массив
        const payload = action.payload as any;
        const isSilent = payload?.silent || (action.meta.arg as any)?.silent;
        const newData = payload?.data || payload;
        
        // Проверяем, изменились ли данные перед обновлением (только для silent обновлений)
        if (isSilent && Array.isArray(newData) && Array.isArray(state.calculations)) {
          // Сравниваем только по ID и total_cost для оптимизации (избегаем полного пересоздания массива)
          const currentMap = new Map(state.calculations.map(c => [c.id, c.total_cost]));
          const newMap = new Map(newData.map((c: any) => [c.id, c.total_cost]));
          
          // Проверяем, есть ли изменения в total_cost
          let dataChanged = false;
          for (const [id, totalCost] of newMap) {
            if (currentMap.get(id) !== totalCost) {
              dataChanged = true;
              break;
            }
          }
          
          // Также проверяем, не появились ли новые заявки
          if (!dataChanged && newMap.size !== currentMap.size) {
            dataChanged = true;
          }
          
          if (dataChanged) {
            state.calculations = newData;
          }
        } else {
          // Для обычных обновлений всегда обновляем
          state.calculations = newData;
        }
      })
      .addCase(getCalcIsolationList.rejected, (state, action) => {
        // Не показываем ошибку при тихом обновлении
        if (!(action.meta.arg as any)?.silent) {
          state.loading = false;
          state.error = action.payload as string;
        }
      })
      // Get Cart Info
      .addCase(getIsolationCartInfo.fulfilled, (state, action) => {
        state.cartInfo = {
          calculation_id: action.payload.calculation_id || action.payload.calculationId || null,
          item_count: action.payload.item_count || action.payload.itemCount || 0,
        };
      })
      // Get Calculation By Id
      .addCase(getCalcIsolationById.fulfilled, (state, action) => {
        state.currentCalculation = action.payload;
      })
      // Get Calculation Materials
      .addCase(getCalcIsolationMaterials.fulfilled, (state, action) => {
        state.calculationMaterials = action.payload;
      })
      // Add Material To Calculation
      .addCase(addMaterialToCalcIsolation.fulfilled, (state, action) => {
        if (action.payload.calculation_id) {
          state.cartInfo.calculation_id = action.payload.calculation_id;
          // Увеличиваем счетчик товаров
          state.cartInfo.item_count += 1;
        }
      })
      .addCase(addMaterialToCalcIsolation.rejected, (state) => {
        // Ошибка при добавлении - не меняем состояние
      })
      // Remove Material From Calculation
      .addCase(removeMaterialFromCalcIsolation.fulfilled, (state, action) => {
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
      .addCase(formCalcIsolation.fulfilled, (state, action) => {
        // Обновляем статус текущей заявки на "completed"
        if (state.currentCalculation) {
          state.currentCalculation.status = action.payload.status || 'completed';
        }
        // Обновляем статус в списке заявок
        const calculationIndex = state.calculations.findIndex(calc => calc.id === action.payload.calculation_id);
        if (calculationIndex !== -1) {
          state.calculations[calculationIndex].status = action.payload.status || 'completed';
        }
        // Очищаем корзину, так как заявка больше не черновик
        if (state.cartInfo.calculation_id === action.payload.calculation_id) {
          state.cartInfo.calculation_id = null;
          state.cartInfo.item_count = 0;
        }
      })
      // Delete Calculation
      .addCase(deleteCalcIsolation.fulfilled, (state, action) => {
        state.calculations = state.calculations.filter((calc) => calc.id !== action.payload);
        if (state.currentCalculation?.id === action.payload) {
          state.currentCalculation = null;
          state.calculationMaterials = [];
        }
        if (state.cartInfo.calculation_id === action.payload) {
          state.cartInfo.calculation_id = null;
          state.cartInfo.item_count = 0;
        }
      })
      // Trigger Async Calculation
      .addCase(triggerAsyncCalcIsolation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerAsyncCalcIsolation.fulfilled, (state) => {
        state.loading = false;
        // Сообщение об успешном запуске будет показано в UI
      })
      .addCase(triggerAsyncCalcIsolation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentCalculation, clearCartInfo } = calculationsSlice.actions;
export default calculationsSlice.reducer;

