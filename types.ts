export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  sources?: {
    uri: string;
    title: string;
  }[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR'
}

export interface DesignStyle {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
}

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

// Intent classification for routing requests
export enum UserIntent {
  EDIT_IMAGE = 'EDIT_IMAGE',
  CHAT_QUERY = 'CHAT_QUERY'
}