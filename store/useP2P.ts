import { create } from 'zustand';
import { P2PStore, FileTransferItem, ConnectionStatus } from '../types';
import { p2pService, setP2PStore } from '../services/p2p';
import { generateUUID } from '../utils';

interface P2PState extends P2PStore {
  setStatus: (status: ConnectionStatus) => void;
  addFile: (file: FileTransferItem) => void;
  completeFile: (id: string, url: string) => void;
}

export const useP2PStore = create<P2PState>((set, get) => ({
  role: 'idle',
  status: 'idle',
  code: null,
  files: [],
  logs: [],

  setRole: (role) => set({ role }),
  
  setStatus: (status) => set({ status }),

  addLog: (msg) => set((state) => ({ logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${msg}`] })),

  reset: () => {
    p2pService.cleanup();
    set({ role: 'idle', status: 'idle', code: null, files: [], logs: [] });
  },

  generateCode: async () => {
    set({ status: 'generating' });
    const code = await p2pService.initiateHost();
    set({ code, status: 'waiting', role: 'sender' });
    return code;
  },

  joinRoom: async (code: string) => {
    set({ status: 'connecting', code, role: 'receiver' });
    await p2pService.joinHost(code);
  },

  addFile: (file) => set((state) => ({ files: [...state.files, file] })),

  updateFileProgress: (id, progress) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, progress } : f)
  })),

  completeFile: (id, url) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, progress: 100, status: 'completed', blobUrl: url } : f)
  })),

  sendFile: (rawFile: File) => {
    const id = generateUUID();
    const newFile: FileTransferItem = {
      id,
      name: rawFile.name,
      size: rawFile.size,
      type: rawFile.type,
      progress: 0,
      status: 'pending',
      timestamp: Date.now()
    };
    
    set((state) => ({ files: [...state.files, newFile] }));
    p2pService.sendFile(rawFile, id);
  }
}));

// Inject the store into the service
setP2PStore(useP2PStore);