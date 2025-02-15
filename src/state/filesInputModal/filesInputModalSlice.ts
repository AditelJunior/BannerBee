import { File } from "../../../types/types";
import { createSlice } from "@reduxjs/toolkit";

interface FilesInputModalState { 
    open: boolean;
}

const initialState: FilesInputModalState = {
    open: false
}

const filesInputModalSlice = createSlice({
    name: 'filesInputModal',
    initialState,
    reducers: {
        open(state) {
            state.open = true
        },
        close(state) {
            state.open = false
        },
    }
})
export const { open, close } = filesInputModalSlice.actions; 

export default filesInputModalSlice.reducer; 