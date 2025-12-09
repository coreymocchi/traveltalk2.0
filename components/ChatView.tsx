
import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message, User } from '../types';
import { dbGetAll, dbPut } from '../services/db';
import { translateText } from '../services/geminiService';
import { Send, Languages, Video, Mic, StopCircle, X, Maximize2, Minimize2, MapPin, Eye, EyeOff, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';

interface ChatViewProps {
  chatId: string;
  currentUser: User;
  onMinimize: () => void;
  onClose: () => void;
  viewMode: 'desktop' | 'mobile-minimized' | 'mobile-expanded';
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🚗', '✈️', '🚆', '🗺️', '📸', '🍔', '🍺', '👋', '✅', '🛑'];
const STICKERS = ['https://cdn-icons-png.flaticon.com/128/742/742751.png', 'https://cdn-icons-png.flaticon.com/128/742/742752.png', 'https://cdn-icons-png.flaticon.com/128/1355/1355238.png', 'https://cdn-icons-png.flaticon.com/128/9408/9408201.png'];

const ChatView: React.FC<ChatViewProps> = ({ chatId, currentUser, onMinimize, onClose, viewMode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [isDriveMode, setIsDriveMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Audio Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatData();
    const interval = setInterval(loadMessages, 3000); 
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadChatData = async () => {
    const chats = await dbGetAll<Chat>('chats');
    const c = chats.find(chat => chat.id === chatId);
    if (c) setChatInfo(c);
    loadMessages();
  };

  const loadMessages = async () => {
    const all = await dbGetAll<Message>('messages');
    const msgs = all.filter(m => m.chatId === chatId).sort((a, b) => a.timestamp - b.timestamp);
    
    if (autoTranslate) {
      const processed = await Promise.all(msgs.map(async (msg) => {
        if (!msg.translatedText && msg.type === 'text' && msg.sender !== currentUser.id) {
          msg.translatedText = await translateText(msg.text);
        }
        return msg;
      }));
      setMessages(processed);
    } else {
      setMessages(msgs);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      chatId,
      sender: currentUser.id,
      type: 'text',
      text: inputText,
      timestamp: Date.now()
    };
    await dbPut('messages', newMsg);
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' = 'image') => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.size > 20 * 1024 * 1024) { 
          alert("File too large. Limit is 20MB.");
          return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          const newMsg: Message = {
              id: Date.now(),
              chatId,
              sender: currentUser.id,
              type: type,
              text: type === 'video' ? 'Video Message' : 'Image Message',
              mediaData: base64,
              timestamp: Date.now()
          };
          await dbPut('messages', newMsg);
          setMessages(prev => [...prev, newMsg]);
      };
      e.target.value = ''; // Reset input
  };

  const sendSticker = async (url: string) => {
      const newMsg: Message = {
          id: Date.now(),
          chatId,
          sender: currentUser.id,
          type: 'sticker',
          text: 'Sticker',
          mediaData: url,
          timestamp: Date.now()
      };
      await dbPut('messages', newMsg);
      setMessages(prev => [...prev, newMsg]);
      setShowEmojiPicker(false);
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const newMsg: Message = {
            id: Date.now(),
            chatId,
            sender: currentUser.id,
            type: 'audio',
            text: 'Audio Message',
            mediaData: base64data,
            timestamp: Date.now()
          };
          await dbPut('messages', newMsg);
          setMessages(prev => [...prev, newMsg]);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  if (!chatInfo) return null;

  // --- MINIMIZED PILL VIEW ---
  if (viewMode === 'mobile-minimized') {
      return (
          <div className="bg-surface/90 backdrop-blur-md shadow-2xl rounded-full px-4 py-3 flex items-center justify-between border border-border w-full animate-in slide-in-from-bottom-5 pointer-events-auto">
             <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={onMinimize}>
                 <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                     {chatInfo.name[0]}
                 </div>
                 <div className="flex flex-col">
                     <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{chatInfo.name}</span>
                     <span className="text-xs text-gray-500">Tap to expand</span>
                 </div>
             </div>
             <div className="flex items-center gap-3">
                <button onClick={onMinimize} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition shadow-sm z-50">
                    <Maximize2 size={18} />
                </button>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition shadow-sm z-50">
                    <X size={20} />
                </button>
             </div>
          </div>
      );
  }

  // --- FULL CHAT VIEW ---
  const isMobile = viewMode === 'mobile-expanded';
  const containerClass = isDriveMode ? 'bg-black/80 backdrop-blur-xl border-white/10' : 'bg-surface border-border';

  return (
    <div className={`flex flex-col h-full w-full ${containerClass} transition-colors duration-300 relative pointer-events-auto`}>
      
      {/* Header */}
      <div className={`flex justify-between items-center p-3 border-b ${isDriveMode ? 'border-white/10 bg-transparent text-white' : 'border-border bg-surface/50 text-gray-900 dark:text-white'}`}>
        <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={onMinimize}>
            {isMobile && <Minimize2 size={24} className={isDriveMode ? "text-white/70" : "text-gray-400"} />}
            <span className="font-bold truncate text-lg">{chatInfo.name}</span>
        </div>
        <div className="flex gap-3 shrink-0 items-center z-50">
            <button onClick={() => setIsDriveMode(!isDriveMode)} className={`p-2 rounded-full transition ${isDriveMode ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`} title="Drive Mode">
                {isDriveMode ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button onClick={() => setAutoTranslate(!autoTranslate)} className={`p-2 rounded-full transition ${autoTranslate ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`} title="Auto Translate">
                <Languages size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition z-50">
                <X size={24} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar`}>
          {messages.length === 0 && <div className="text-center mt-10 text-gray-400 text-sm">Start the conversation...</div>}
          {messages.map(msg => {
              const isMe = msg.sender === currentUser.id;
              let bubbleClass = isMe ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-border';
              if (isDriveMode) bubbleClass = isMe ? 'bg-primary text-white' : 'bg-gray-900 text-white border border-white/20';
              if (msg.type === 'sticker') bubbleClass = 'bg-transparent border-none shadow-none';

              return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleClass} ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                          {msg.type === 'audio' ? (
                               <div className="flex flex-col gap-1 min-w-[200px]">
                                   <div className="flex items-center gap-2 font-bold opacity-80 mb-1"><Mic size={14} /> Audio Message</div>
                                   <audio controls src={msg.mediaData} className="w-full h-8 rounded" />
                               </div>
                          ) : msg.type === 'image' ? (
                               <img src={msg.mediaData} alt="Shared" className="rounded-lg max-h-60 object-cover" />
                          ) : msg.type === 'video' ? (
                               <video src={msg.mediaData} controls className="rounded-lg max-h-60 w-full" />
                          ) : msg.type === 'sticker' ? (
                               <img src={msg.mediaData} alt="Sticker" className="w-24 h-24 object-contain" />
                          ) : msg.type === 'live_location' ? (
                              <div className="flex items-center gap-2 font-bold text-red-400"><MapPin className="animate-pulse" size={16}/> <span>Live Location</span></div>
                          ) : (
                              <div>
                                  <div className={isDriveMode ? "text-base font-medium" : ""}>{msg.text}</div>
                                  {msg.translatedText && <div className="mt-2 pt-2 border-t border-white/20 text-xs italic opacity-80">{msg.translatedText}</div>}
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-3 border-t relative z-40 ${isDriveMode ? 'border-white/10 bg-black/40' : 'border-border bg-surface'}`}>
          {showEmojiPicker && (
             <div className="absolute bottom-full left-0 w-full bg-surface dark:bg-gray-800 border-t border-border shadow-2xl p-4 grid grid-cols-4 gap-2 h-48 overflow-y-auto">
                 {EMOJIS.map(e => <button key={e} onClick={() => setInputText(p => p + e)} className="text-2xl p-2 hover:bg-black/5 rounded">{e}</button>)}
                 <div className="col-span-4 border-t my-2 pt-2 text-xs font-bold text-gray-500">STICKERS</div>
                 {STICKERS.map(s => <button key={s} onClick={() => sendSticker(s)} className="p-2 hover:bg-black/5 rounded flex justify-center"><img src={s} className="w-10 h-10"/></button>)}
             </div>
          )}

          <div className={`flex items-center gap-2 rounded-xl px-2 py-1 ${isDriveMode ? 'bg-black/50 border border-white/20' : 'bg-bg border border-border'}`}>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-full hover:bg-black/5 ${isDriveMode ? 'text-white' : 'text-gray-500'}`}><Smile size={24}/></button>
              
              {/* Native Image Input */}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'image')} />
              <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full hover:bg-black/5 ${isDriveMode ? 'text-white' : 'text-gray-500'}`} title="Send Photo"><Paperclip size={24}/></button>

              {/* Native Video Input */}
              <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={(e) => handleFileUpload(e, 'video')} />
              <button onClick={() => videoInputRef.current?.click()} className={`p-2 rounded-full hover:bg-black/5 ${isDriveMode ? 'text-white' : 'text-gray-500'}`} title="Send Video"><Video size={24}/></button>

              {isRecordingAudio ? (
                  <div className="flex-1 flex items-center justify-between px-3">
                      <span className="text-red-500 animate-pulse font-bold flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"/> Recording Audio...</span>
                      <button onClick={stopAudioRecording} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"><StopCircle size={20} fill="currentColor" /></button>
                  </div>
              ) : (
                  <>
                    <input 
                        className={`flex-1 bg-transparent outline-none py-3 px-1 ${isDriveMode ? 'text-white placeholder:text-white/50 font-bold' : 'text-gray-900 dark:text-white placeholder:text-gray-400'}`}
                        placeholder={isDriveMode ? "Type..." : "Type message..."}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    {inputText.trim() ? (
                        <button onClick={handleSend} className="p-2 rounded-full text-primary"><Send size={24}/></button>
                    ) : (
                        <button onClick={startAudioRecording} className={`p-2 rounded-full ${isDriveMode ? 'text-white' : 'text-gray-500 hover:bg-black/5'}`}><Mic size={24}/></button>
                    )}
                  </>
              )}
          </div>
      </div>
    </div>
  );
};

export default ChatView;
