import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { agentsAPI } from '../services/api';

// Async thunks
export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await agentsAPI.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAgentById = createAsyncThunk(
  'agents/fetchAgentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await agentsAPI.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAgent = createAsyncThunk(
  'agents/createAgent',
  async (agentData, { rejectWithValue }) => {
    try {
      const response = await agentsAPI.create(agentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAgent = createAsyncThunk(
  'agents/updateAgent',
  async ({ id, agentData }, { rejectWithValue }) => {
    try {
      const response = await agentsAPI.update(id, agentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAgent = createAsyncThunk(
  'agents/deleteAgent',
  async (id, { rejectWithValue }) => {
    try {
      const response = await agentsAPI.delete(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const agentsSlice = createSlice({
  name: 'agents',
  initialState: {
    agents: [],
    currentAgent: null,
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    },
    filters: {
      status: 'all',
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
    clearCurrentAgent: (state) => {
      state.currentAgent = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch agents
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload.data;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        state.error = null;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch agent by ID
      .addCase(fetchAgentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAgent = action.payload.data;
        state.error = null;
      })
      .addCase(fetchAgentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create agent
      .addCase(createAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agents.push(action.payload.data);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update agent
      .addCase(updateAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.agents.findIndex(agent => agent.id === action.payload.data.id);
        if (index !== -1) {
          state.agents[index] = action.payload.data;
        }
        if (state.currentAgent && state.currentAgent.id === action.payload.data.id) {
          state.currentAgent = action.payload.data;
        }
        state.error = null;
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete agent
      .addCase(deleteAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = state.agents.filter(agent => agent.id !== action.payload.id);
        state.pagination.total -= 1;
        if (state.currentAgent && state.currentAgent.id === action.payload.id) {
          state.currentAgent = null;
        }
        state.error = null;
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, clearCurrentAgent, setPagination } = agentsSlice.actions;
export default agentsSlice.reducer;