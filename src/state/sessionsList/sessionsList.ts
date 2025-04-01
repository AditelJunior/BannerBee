import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Session } from "../../../types/types";

interface SessionsState {
    sessions: Session[]; // Array of all sessions
    currentSessionId: string | null; // ID of the currently selected session
    currentPreview: string | ''; 
}

const initialState: SessionsState = {
    sessions: [], // Start with an empty array of sessions
    currentSessionId: null, // No session selected initially
    currentPreview: '',
};

const sessionsSlice = createSlice({
    name: "sessions",
    initialState,
    reducers: {
        setCurrentPreview(state, action: PayloadAction<string>) {
            state.currentPreview = action.payload; // Set the current session ID
        },
        setCurrentSessionId(state, action: PayloadAction<string>) {
            state.currentSessionId = action.payload; // Set the current session ID
        },
        addSession(state, action: PayloadAction<Session>) {
            state.sessions.push(action.payload); // Add a new session
        },
        updateSession(state, action: PayloadAction<Session>) {
            const index = state.sessions.findIndex(
                (session) => session.id === action.payload.id
            );
            if (index !== -1) {
                state.sessions[index] = action.payload; // Update the session if it exists
            } else {
                state.sessions.push(action.payload); // Add the session if it doesn't exist}
            }
        },
        setSessions(state, action: PayloadAction<Session[]>) {
            state.sessions = action.payload; // Replace all sessions
        },
        removeSession(state, action: PayloadAction<string>) {
            state.sessions = state.sessions.filter(
                (session) => session.id !== action.payload
            );

            if (state.currentSessionId === action.payload) {
                state.currentSessionId = null;
            }
        },
        clearSessions(state) {
            state.sessions = []; // Clear all sessions
        },
    },
});

export const { addSession, updateSession, setSessions, clearSessions, setCurrentSessionId, setCurrentPreview, removeSession } = sessionsSlice.actions;

export default sessionsSlice.reducer;