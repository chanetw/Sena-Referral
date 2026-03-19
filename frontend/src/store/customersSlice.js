import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customersAPI, agentsAPI } from '../services/api';

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('=== fetchCustomers thunk called ===', params);
      const response = await customersAPI.getAll(params);
      console.log('=== fetchCustomers response ===', response);
      return response;
    } catch (error) {
      console.error('=== fetchCustomers error ===', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await customersAPI.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await customersAPI.create(customerData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const response = await customersAPI.update(id, customerData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id, { rejectWithValue }) => {
    try {
      const response = await customersAPI.delete(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAgentsList = createAsyncThunk(
  'customers/fetchAgentsList',
  async (_, { rejectWithValue }) => {
    try {
      console.log('=== fetchAgentsList thunk called ===');
      const response = await agentsAPI.getList();
      console.log('=== fetchAgentsList response ===', response);
      return response;
    } catch (error) {
      console.error('=== fetchAgentsList error ===', error);
      return rejectWithValue(error.message);
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: {
    customers: [],
    currentCustomer: null,
    agentsList: [],
    loading: false,
    agentsLoading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    },
    filters: {
      status: 'all',
      agentId: 'all',
      search: ''
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        console.log('=== fetchCustomers.fulfilled ===', action.payload);
        state.loading = false;
        state.customers = action.payload.data;
        console.log('=== state.customers updated ===', state.customers);
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        state.error = null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch customer by ID
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomer = action.payload.data;
        state.error = null;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create customer
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload.data);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(customer => customer.id === action.payload.data.id);
        if (index !== -1) {
          state.customers[index] = action.payload.data;
        }
        if (state.currentCustomer && state.currentCustomer.id === action.payload.data.id) {
          state.currentCustomer = action.payload.data;
        }
        state.error = null;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter(customer => customer.id !== action.payload.id);
        state.pagination.total -= 1;
        if (state.currentCustomer && state.currentCustomer.id === action.payload.id) {
          state.currentCustomer = null;
        }
        state.error = null;
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch agents list
      .addCase(fetchAgentsList.pending, (state) => {
        console.log('=== fetchAgentsList.pending ===');
        state.agentsLoading = true;
      })
      .addCase(fetchAgentsList.fulfilled, (state, action) => {
        console.log('=== fetchAgentsList.fulfilled ===', action.payload);
        state.agentsLoading = false;
        state.agentsList = action.payload.data;
        console.log('=== state.agentsList updated ===', state.agentsList);
      })
      .addCase(fetchAgentsList.rejected, (state, action) => {
        console.log('=== fetchAgentsList.rejected ===', action.payload);
        state.agentsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, clearCurrentCustomer, setPagination } = customersSlice.actions;
export default customersSlice.reducer;