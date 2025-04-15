import { configureStore } from "@reduxjs/toolkit";
import filesReducer from "./files/filesSlice";
import filesInputModalReducer from "./filesInputModal/filesInputModalSlice";
import userInfoReducer from "./userInfo/userInfo";
import sessionsListReducer from "./sessionsList/sessionsList";
import templateReducer from "./pickedTemplate/pickedTemplate";

export const store = configureStore({
    reducer: {
        files: filesReducer,
        filesInputModal: filesInputModalReducer,
        userInfo: userInfoReducer,
        sessionsList: sessionsListReducer,
        pickedTemplate: templateReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;