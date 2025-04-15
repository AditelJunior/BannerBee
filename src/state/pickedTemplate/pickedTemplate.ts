import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Template } from "../../../types/types";

interface TemplateState {
    id: string | '';
    html: string | '';
    image: string | '';
    title: string | '';
}

const initialState: TemplateState = {
    id: '',
    html: '',
    image: '',
    title: '',
};

const templateSlice = createSlice({
    name: "template",
    initialState,
    reducers: {
        setTemplate(state, action: PayloadAction<Template>) {
            state.id = action.payload.id;
            state.html = action.payload.html;
            state.title = action.payload.title;
            state.image = action.payload.image;
        },
        removeTemplate(state) {
            state.id = '';
            state.image = '';
            state.title = '';
            state.html = '';
        },
    },
});

export const { removeTemplate, setTemplate } = templateSlice.actions;

export default templateSlice.reducer;