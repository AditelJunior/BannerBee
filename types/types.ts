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