var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Initial state
const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,
};
// Async thunks
export const login = createAsyncThunk('auth/login', (credentials_1, _a) => __awaiter(void 0, [credentials_1, _a], void 0, function* (credentials, { rejectWithValue }) {
    try {
        const response = yield window.api.auth.login(credentials);
        if (!response.success) {
            return rejectWithValue(response.message || 'Login failed');
        }
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        return {
            user: response.user,
            token: response.token,
        };
    }
    catch (error) {
        return rejectWithValue('Login failed: Network error');
    }
}));
export const register = createAsyncThunk('auth/register', (userData_1, _a) => __awaiter(void 0, [userData_1, _a], void 0, function* (userData, { rejectWithValue }) {
    try {
        const response = yield window.api.auth.register(userData);
        if (!response.success) {
            return rejectWithValue(response.message || 'Registration failed');
        }
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        return {
            user: response.user,
            token: response.token,
        };
    }
    catch (error) {
        return rejectWithValue('Registration failed: Network error');
    }
}));
export const logout = createAsyncThunk('auth/logout', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield window.api.auth.logout();
    }
    finally {
        // Always remove token, even if the API call fails
        localStorage.removeItem('token');
    }
}));
// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(login.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
        })
            .addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });
        // Register
        builder
            .addCase(register.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(register.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
        })
            .addCase(register.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        });
        // Logout
        builder
            .addCase(logout.fulfilled, (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
        });
    },
});
export const { clearError } = authSlice.actions;
export default authSlice.reducer;
