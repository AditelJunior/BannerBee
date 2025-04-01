import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "firebase/auth";

interface UserInfoState {
    user: User | null; // Firebase User object or null if not authenticated
    loading: boolean;  // Indicates if the authentication state is still loading
    error: string | null; // Error message, if any
}

const initialState: UserInfoState = {
    user: null,
    loading: true,
    error: null,
};

const userInfoSlice = createSlice({
    name: "userInfo",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<User | null>) {
            state.user = action.payload;
            state.loading = false;
            state.error = null;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        clearUser(state) {
            state.user = null;
            state.loading = false;
            state.error = null;
        },
    },
});

export const { setUser, setLoading, setError, clearUser } = userInfoSlice.actions;

export default userInfoSlice.reducer;