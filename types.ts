
export enum AIModelMode {
  FAST = 'fast',      // gemini-2.5-flash-lite-latest
  DEEP = 'deep',      // gemini-3-pro-preview
  SEARCH = 'search'   // gemini-2.5-flash (supports maps + search)
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  content: string;
  isLoading: boolean;
  mode: AIModelMode;
  groundingLinks?: { title: string; uri: string }[];
  isThinking?: boolean;
}

export interface BrowserHistory {
  url: string;
  title: string;
  timestamp: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
