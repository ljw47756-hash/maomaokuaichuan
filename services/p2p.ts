import { ICE_SERVERS, CHUNK_SIZE } from '../constants';
import { SignalingMessage } from '../types';

// Store reference to avoid circular dependency imports
let getP2PStore: () => any;

export const setP2PStore = (store: any) => {
  getP2PStore = () => store.getState();
};

class P2PManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private socket: WebSocket | null = null;
  private roomCode: string | null = null;
  
  // File processing state
  private incomingFiles: Map<string, { meta: any, chunks: ArrayBuffer[], receivedSize: number }> = new Map();

  public cleanup() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.incomingFiles.clear();
  }

  // --- Signaling (WebSocket for LAN) ---
  private setupSignaling(code: string) {
    this.roomCode = code;
    
    // Determine WebSocket URL based on current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same hostname as the webpage, but port 8080 for signaling
    const wsUrl = `${protocol}//${window.location.hostname}:8080`;
    
    console.log(`Connecting to Signaling Server: ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log("WebSocket connected. Joining room:", code);
      this.sendSignal('join', null, code);
      
      const store = getP2PStore();
      if (store.role === 'sender') {
          // If we are the sender (host), we just wait in the room.
          // Receiver will join later and send 'ready'.
      } else if (store.role === 'receiver') {
          // If receiver, announce presence
          // Give a small delay to ensure room join is processed
          setTimeout(() => {
              console.log("Sending ready signal");
              this.sendSignal('ready');
          }, 500);
      }
    };

    this.socket.onclose = () => {
        console.log("WebSocket disconnected");
    };

    this.socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        const store = getP2PStore();
        if (store) store.addLog("Signaling Server Error. Ensure 'npm run server' is running.");
    };
    
    this.socket.onmessage = async (event) => {
      const msg: SignalingMessage = JSON.parse(event.data);
      if (!getP2PStore) return;
      
      const store = getP2PStore();
      
      console.log(`[Signal] Received ${msg.type}`, msg);

      if (msg.type === 'error') {
          store.addLog(`Error: ${msg.payload}`);
          store.setStatus('failed');
          return;
      }

      if (msg.type === 'ready' && store.role === 'sender') {
        // Receiver is ready, sender initiates offer
        console.log("Sender received ready, creating offer...");
        this.createPeerConnection();
        this.setupDataChannel(); // Sender creates channel
        
        try {
          const offer = await this.pc!.createOffer();
          await this.pc!.setLocalDescription(offer);
          this.sendSignal('offer', offer);
          store.setStatus('connecting');
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      } 
      else if (msg.type === 'offer' && store.role === 'receiver') {
        console.log("Receiver received offer, creating answer...");
        this.createPeerConnection();
        store.setStatus('connecting');
        
        // Receiver waits for DataChannel via ondatachannel
        this.pc!.ondatachannel = (e) => {
            console.log("Receiver received DataChannel");
            this.dc = e.channel;
            this.setupDataChannelEvents();
        };

        try {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);
          this.sendSignal('answer', answer);
        } catch (err) {
          console.error("Error creating answer:", err);
        }
      } 
      else if (msg.type === 'answer' && store.role === 'sender') {
        console.log("Sender received answer, setting remote description...");
        try {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(msg.payload));
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      } 
      else if (msg.type === 'candidate') {
        if (this.pc && this.pc.remoteDescription) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(msg.payload));
            } catch (e) {
                console.error("Error adding candidate", e);
            }
        }
      }
    };
  }

  private sendSignal(type: SignalingMessage['type'], payload?: any, roomOverride?: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const msg: SignalingMessage = {
            type,
            payload,
            room: roomOverride || this.roomCode || undefined
        };
        this.socket.send(JSON.stringify(msg));
    }
  }

  // --- WebRTC Core ---

  private createPeerConnection() {
    if (this.pc) return;
    
    console.log("Creating RTCPeerConnection");
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('candidate', event.candidate);
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      const store = getP2PStore();
      if (this.pc?.connectionState === 'connected') {
        store.setStatus('connected');
      } else if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
        store.setStatus('failed');
      }
    };
  }

  private setupDataChannel() {
    if (!this.pc) return;
    this.dc = this.pc.createDataChannel("file-transfer");
    this.setupDataChannelEvents();
  }

  private setupDataChannelEvents() {
    if (!this.dc) return;

    this.dc.onopen = () => {
      console.log("DataChannel Open");
      const store = getP2PStore();
      store.setStatus('connected');
      store.addLog("P2P Connection Established!");
    };

    this.dc.onmessage = (event) => {
      this.handleDataMessage(event.data);
    };

    this.dc.onerror = (error) => {
      console.error("DataChannel Error:", error);
      const store = getP2PStore();
      store.setStatus('failed');
    };
  }

  // --- File Transfer Logic ---

  public async initiateHost(): Promise<string> {
    this.cleanup();
    // Use a simple 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.setupSignaling(code);
    return code;
  }

  public async joinHost(code: string) {
    this.cleanup();
    this.setupSignaling(code);
    console.log(`Joining host: ${code}`);
    // Signaling Setup handles the rest
  }

  public sendFile(file: File, id: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
        console.error("Data channel not ready");
        return;
    }

    const store = getP2PStore();
    const { updateFileProgress, addLog } = store;

    // 1. Send Metadata
    const meta = {
        type: 'meta',
        id,
        name: file.name,
        size: file.size,
        fileType: file.type
    };
    try {
      this.dc.send(JSON.stringify(meta));
      addLog(`Starting transfer: ${file.name}`);
    } catch (e) {
      console.error("Error sending meta", e);
      return;
    }

    // 2. Read and Chunk
    const reader = new FileReader();
    let offset = 0;

    reader.onload = () => {
        if (!this.dc || this.dc.readyState !== 'open') return;
        
        const buffer = reader.result as ArrayBuffer;
        try {
          this.dc.send(buffer); // Send chunk
        } catch (e) {
           console.error("Error sending chunk", e);
           return;
        }
        
        offset += buffer.byteLength;
        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        updateFileProgress(id, progress);

        if (offset < file.size) {
             // Use setTimeout to avoid blocking UI thread on large files
            setTimeout(readNextChunk, 0);
        } else {
            addLog(`Sent: ${file.name}`);
        }
    };

    const readNextChunk = () => {
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    };

    // Start reading
    readNextChunk();
  }

  private handleDataMessage(data: any) {
    const store = getP2PStore();
    const { addFile, updateFileProgress, completeFile, addLog } = store;

    if (typeof data === 'string') {
        // Metadata message
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'meta') {
                this.incomingFiles.set(msg.id, {
                    meta: msg,
                    chunks: [],
                    receivedSize: 0
                });
                
                // Add to store for UI
                addFile({
                    id: msg.id,
                    name: msg.name,
                    size: msg.size,
                    type: msg.fileType,
                    progress: 0,
                    status: 'transferring',
                    timestamp: Date.now()
                });
                addLog(`Receiving: ${msg.name}`);
            }
        } catch (e) {
            console.error("Error parsing signaling JSON", e);
        }
    } else {
        // Binary Chunk (ArrayBuffer)
        const activeFileId = this.getLastActiveFileId();
        if (!activeFileId) return;

        const fileData = this.incomingFiles.get(activeFileId);
        if (fileData) {
            fileData.chunks.push(data);
            fileData.receivedSize += data.byteLength;
            
            const progress = Math.min(100, Math.round((fileData.receivedSize / fileData.meta.size) * 100));
            updateFileProgress(activeFileId, progress);

            if (fileData.receivedSize >= fileData.meta.size) {
                // Done
                const blob = new Blob(fileData.chunks, { type: fileData.meta.fileType });
                const url = URL.createObjectURL(blob);
                completeFile(activeFileId, url);
                addLog(`Received: ${fileData.meta.name}`);
                this.incomingFiles.delete(activeFileId); // Cleanup memory
            }
        }
    }
  }

  private getLastActiveFileId(): string | undefined {
      // Return the key of the first incomplete file
      for (const [key] of this.incomingFiles) {
          return key;
      }
      return undefined;
  }
}

export const p2pService = new P2PManager();