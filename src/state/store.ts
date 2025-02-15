import { configureStore } from "@reduxjs/toolkit";
import filesReducer from "./files/filesSlice";
import filesInputModalReducer from "./filesInputModal/filesInputModalSlice";
export const store = configureStore({
    reducer: {
        files: filesReducer,
        filesInputModal: filesInputModalReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['files/addFiles'],
                
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;