export type ChatItem = {
    role: string,
    parts: any
}
export type File = {
    url?: string,
    file: any,
    description?: string,
    size: {
       width: number,
       height: number,
    }
 }

export type Session = {
    id: string; // Session ID
    chatHistory: any[]; // Chat history for the session
    time: string; // Timestamp of the session
}