import { ICE_SERVERS, CHUNK_SIZE } from '../constants';
import { SignalingMessage, FileTransferItem } from '../types';
import { useP2PStore } from '../store/useP2P';

class P2PManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private signaling: BroadcastChannel | null = null;
  private roomCode: string | null = null;
  
  // File processing state
  private incomingFiles: Map<string, { meta: any, chunks: ArrayBuffer[], receivedSize: number }> = new Map();

  public cleanup() {
    this.pc?.close();
    this.dc?.close();
    this.signaling?.close();
    this.pc = null;
    this.dc = null;
    this.signaling = null;
    this.incomingFiles.clear();
  }

  // --- Signaling (Mocked via BroadcastChannel for Demo) ---
  // In a real app, this would be a WebSocket or API polling implementation
  private setupSignaling(code: string) {
    this.roomCode = code;
    this.signaling = new BroadcastChannel(`p2p-${code}`);
    
    this.signaling.onmessage = async (event) => {
      const msg: SignalingMessage = event.data;
      const { status } = useP2PStore.getState();
      
      console.log(`[Signal] Received ${msg.type}`, msg);

      if (msg.type === 'ready' && useP2PStore.getState().role === 'sender') {
        // Receiver is ready, sender initiates offer
        this.createPeerConnection();
        this.setupDataChannel(); // Sender creates channel
        const offer = await this.pc!.createOffer();
        await this.pc!.setLocalDescription(offer);
        this.sendSignal('offer', offer);
        useP2PStore.getState().setStatus('connecting');
      } 
      else if (msg.type === 'offer' && useP2PStore.getState().role === 'receiver') {
        this.createPeerConnection();
        useP2PStore.getState().setStatus('connecting');
        
        // Receiver waits for DataChannel via ondatachannel
        this.pc!.ondatachannel = (e) => {
            this.dc = e.channel;
            this.setupDataChannelEvents();
        };

        await this.pc!.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await this.pc!.createAnswer();
        await this.pc!.setLocalDescription(answer);
        this.sendSignal('answer', answer);
      } 
      else if (msg.type === 'answer' && useP2PStore.getState().role === 'sender') {
        await this.pc!.setRemoteDescription(new RTCSessionDescription(msg.payload));
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

  private sendSignal(type: SignalingMessage['type'], payload?: any) {
    this.signaling?.postMessage({ type, payload });
  }

  // --- WebRTC Core ---

  private createPeerConnection() {
    if (this.pc) return;
    
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('candidate', event.candidate);
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        useP2PStore.getState().setStatus('connected');
      } else if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
        useP2PStore.getState().setStatus('failed');
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
      useP2PStore.getState().setStatus('connected');
      useP2PStore.getState().addLog("P2P Connection Established!");
    };

    this.dc.onmessage = (event) => {
      this.handleDataMessage(event.data);
    };

    this.dc.onerror = (error) => {
      console.error("DataChannel Error:", error);
      useP2PStore.getState().setStatus('failed');
    };
  }

  // --- File Transfer Logic ---

  public async initiateHost(): Promise<string> {
    this.cleanup();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.setupSignaling(code);
    // Sender doesn't create PC immediately; waits for receiver to join channel
    return code;
  }

  public async joinHost(code: string) {
    this.cleanup();
    this.setupSignaling(code);
    // Receiver announces presence
    setTimeout(() => {
        this.sendSignal('ready');
    }, 500);
  }

  public sendFile(file: File, id: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
        console.error("Data channel not ready");
        return;
    }

    const { updateFileProgress, addLog } = useP2PStore.getState();

    // 1. Send Metadata
    const meta = {
        type: 'meta',
        id,
        name: file.name,
        size: file.size,
        fileType: file.type
    };
    this.dc.send(JSON.stringify(meta));
    addLog(`Starting transfer: ${file.name}`);

    // 2. Read and Chunk
    const reader = new FileReader();
    let offset = 0;

    reader.onload = () => {
        if (!this.dc || this.dc.readyState !== 'open') return;
        
        const buffer = reader.result as ArrayBuffer;
        this.dc.send(buffer); // Send chunk
        
        offset += buffer.byteLength;
        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        updateFileProgress(id, progress);

        if (offset < file.size) {
            readNextChunk();
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
    const { addFile, updateFileProgress, completeFile, addLog } = useP2PStore.getState();

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
        // For simplicity, we assume strictly ordered delivery (WebRTC DataChannels are ordered by default)
        // A robust app handles potential interleaving if using multiple files concurrently by adding headers to chunks
        // Here we assume 1 file at a time or relying on ordered channel
        
        // Find the "active" file (Simulated: taking the most recent incomplete one)
        // In production: Prefix chunks with File ID
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
