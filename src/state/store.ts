import { configureStore } from "@reduxjs/toolkit";
import filesReducer from "./files/filesSlice";
import filesInputModalReducer from "./filesInputModal/filesInputModalSlice";
import userInfoReducer from "./userInfo/userInfo";
import sessionsListReducer from "./sessionsList/sessionsList";

export const store = configureStore({
    reducer: {
        files: filesReducer,
        filesInputModal: filesInputModalReducer,
        userInfo: userInfoReducer,
        sessionsList: sessionsListReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;