export interface Folder {
  id: number;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Note {
  id: number;
  folder_id: number;
  title: string;
  text: string;
  user_id: string;
  timestamp: string;
}

export interface Database {
  public: {
    Tables: {
      folders: {
        Row: Folder;
        Insert: Omit<Folder, 'id'>;
        Update: Partial<Omit<Folder, 'id'>>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id'>;
        Update: Partial<Omit<Note, 'id'>>;
      };
    };
  };
}
