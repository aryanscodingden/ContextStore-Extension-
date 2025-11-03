export interface Folder {
    id: Number
    name: String;
    user_id: String;
}

export interface Note {
    id: Number;
    folder_id: Number;
    text:string;
    timestamp: string;
    user_id: string;
}