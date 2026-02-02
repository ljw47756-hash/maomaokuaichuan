import { create } from 'zustand';

type Language = 'en' | 'zh';

const translations = {
  en: {
    heroTitle: "File Flash",
    heroSubtitle: "Secure, fast, serverless P2P file transfer. Share directly between devices.",
    sendBtn: "Send File",
    sendDesc: "Create a room code",
    receiveBtn: "Receive",
    receiveDesc: "Enter a room code",
    note: "Note: This demo uses BroadcastChannel for signaling. To test, open this app in two tabs.",
    
    // Sender
    sendFileTitle: "Send Files",
    shareCode: "Share this code with the recipient",
    clickCopy: "Click code to copy",
    waiting: "Waiting for connection...",
    uploadTitle: "Click to upload files",
    uploadDesc: "Any file size or type",
    
    // Receiver
    receiveFileTitle: "Receive Files",
    enterCode: "Enter the 6-digit code from the sender",
    connectBtn: "Connect",
    connecting: "Connecting...",
    connected: "Connected to Sender",
    waitingFiles: "Waiting for files...",
    failed: "Connection failed. Check code and try again.",
    
    // Common
    transfers: "Transfers",
    done: "Done",
    back: "Back",
    footer: "Secure P2P Transfer.",
  },
  zh: {
    heroTitle: "猫猫快传",
    heroSubtitle: "安全、快速、无服务器的 P2P 文件传输。直接在设备之间共享文件。",
    sendBtn: "我要发送",
    sendDesc: "创建房间号码",
    receiveBtn: "我要接收",
    receiveDesc: "输入房间号码",
    note: "注意：此演示使用 BroadcastChannel 进行通信。请在同一浏览器的两个标签页中测试。",
    
    // Sender
    sendFileTitle: "发送文件",
    shareCode: "与接收者分享此代码",
    clickCopy: "点击代码复制",
    waiting: "等待连接...",
    uploadTitle: "点击上传文件",
    uploadDesc: "支持任意文件大小或类型",
    
    // Receiver
    receiveFileTitle: "接收文件",
    enterCode: "输入发送者的 6 位代码",
    connectBtn: "连接",
    connecting: "连接中...",
    connected: "已连接到发送者",
    waitingFiles: "等待文件传输...",
    failed: "连接失败。请检查代码并重试。",
    
    // Common
    transfers: "传输列表",
    done: "完成",
    back: "返回",
    footer: "安全 P2P 传输。",
  }
};

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
  t: (key) => translations[get().language][key]
}));