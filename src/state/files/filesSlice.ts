import { File } from "../../../types/types";
import { createSlice } from "@reduxjs/toolkit";

interface FilesState { 
    inputFiles: File[];
}

const initialState: FilesState = {
    inputFiles: []
}

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        addFiles(state, action) {
            state.inputFiles = [...state.inputFiles, ...action.payload]
        },
        removeFile(state, action) {
            state.inputFiles = state.inputFiles.filter((file) => file !== action.payload)
        },
        clearFiles(state) {
            state.inputFiles = []
        }
    }
})
export const { addFiles, removeFile, clearFiles } = filesSlice.actions; 

export default filesSlice.reducer; 