export type ChatItem = {
    role: string,
    parts:
    {
        text: string | '',
        files?: any,
        referenceTemplate?: Template,
        html?: string | '',
    }[]
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
export type Template = {
    id: string;
    html: string;
    title: string;
    image: string;
}