export type ConnectionStatus = 'idle' | 'generating' | 'waiting' | 'connecting' | 'connected' | 'failed';

export interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0 to 100
  status: 'pending' | 'transferring' | 'completed' | 'error';
  receivedChunks?: ArrayBuffer[];
  blobUrl?: string;
  timestamp: number;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'ready' | 'join' | 'error';
  room?: string;
  payload?: any;
}

export interface P2PStore {
  role: 'idle' | 'sender' | 'receiver';
  status: ConnectionStatus;
  code: string | null;
  files: FileTransferItem[];
  logs: string[];
  
  // Actions
  setRole: (role: 'idle' | 'sender' | 'receiver') => void;
  reset: () => void;
  generateCode: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  addLog: (msg: string) => void;
  sendFile: (file: File) => void;
  updateFileProgress: (id: string, progress: number) => void;
}