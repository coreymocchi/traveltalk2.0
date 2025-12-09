
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { dbGet } from './services/db';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import SettingsView from './components/SettingsView';
import { Menu, Settings as SettingsIcon, X, Map as MapIcon, ChevronLeft, MessageCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // UI State
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Mobile Chat State: 0 = Closed, 1 = Mini/Pill, 2 = Open/Half
  const [mobileChatState, setMobileChatState] = useState<0 | 1 | 2>(1); 
  const [routeInfo, setRouteInfo] = useState<{time: number, distance: number, text: string} | null>(null);
  
  // Trigger map resize when layout changes
  const [layoutVersion, setLayoutVersion] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
          const stored = localStorage.getItem('traveltalk_user');
          if (stored) {
            const u = await dbGet<User>('users', stored);
            if (u) {
                setUser(u);
                const last = localStorage.getItem('lastChat');
                if (last) {
                  setCurrentChatId(last);
                  setMobileChatState(1); // Default to mini on load
                }
            } else {
                // User ID found in storage but not in DB (maybe DB cleared), reset storage
                localStorage.removeItem('traveltalk_user');
            }
          }
      } catch (e) {
          console.error("Auto-login failed:", e);
          // If critical error, clear storage to allow fresh login
          localStorage.removeItem('traveltalk_user');
      }
    };
    checkAuth();

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (user?.theme?.primaryColor) document.documentElement.style.setProperty('--primary', user.theme.primaryColor);
  }, [user]);

  // Trigger map redraw when sidebars/panels open/close
  useEffect(() => {
    const t = setTimeout(() => setLayoutVersion(v => v + 1), 300); // Wait for CSS transition
    return () => clearTimeout(t);
  }, [isSidebarOpen, currentChatId, mobileChatState]);

  const handleCloseChat = () => {
      setCurrentChatId(null);
      setMobileChatState(1); // Reset to default mini state for next opening
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); localStorage.setItem('traveltalk_user', u.username); }} />;

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      
      {/* --- LEFT SIDEBAR (Navigation/Chats) --- */}
      {/* Desktop: Static or Drawer / Mobile: Drawer */}
      <div className={`
        fixed md:relative z-40 inset-y-0 left-0 
        w-80 bg-surface border-r border-border shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
         <div className="h-full flex flex-col relative">
             <Sidebar 
                currentUser={user} 
                currentChatId={currentChatId} 
                onSelectChat={(id) => { 
                    setCurrentChatId(id); 
                    setSidebarOpen(false); // Close nav on mobile select
                    setMobileChatState(2); // Open chat view
                    localStorage.setItem('lastChat', id);
                }} 
                onOpenSettings={() => { setSidebarOpen(false); setIsSettingsOpen(true); }}
                onClose={() => setSidebarOpen(false)}
                className="h-full" 
             />
         </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
        
        {/* Header / Controls Overlay */}
        <div className="absolute top-4 left-4 z-20 flex gap-2 pointer-events-auto">
            {!isSidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="bg-surface/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-border hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95 text-primary">
                    <Menu size={24} />
                </button>
            )}
        </div>
        
        {/* Route Info Pill */}
        {routeInfo && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-[90%] md:w-auto flex justify-center pointer-events-auto">
                <div className="bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce-in max-w-full truncate border border-white/20">
                    <span className="truncate font-bold">🚗 {routeInfo.text}</span>
                    <button onClick={() => setRouteInfo(null)} className="hover:bg-white/20 rounded-full p-1 transition"><X size={16}/></button>
                </div>
            </div>
        )}

        {/* --- MAP & CHAT SPLIT CONTAINER --- */}
        <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
            
            {/* MAP SECTION - Grows to fill available space */}
            <div className="flex-1 relative z-0 min-h-0">
                <MapView currentUser={user} onRouteCalculated={setRouteInfo} resizeTrigger={layoutVersion} />
            </div>

            {/* CHAT SECTION - DESKTOP (Right Panel) */}
            {currentChatId && (
                <div className="hidden md:block w-96 border-l border-border bg-surface z-10 transition-all duration-300 ease-in-out relative shadow-xl">
                    <ChatView 
                        chatId={currentChatId} 
                        currentUser={user} 
                        onMinimize={handleCloseChat} // Close on desktop
                        onClose={handleCloseChat}
                        viewMode="desktop"
                    />
                </div>
            )}

            {/* CHAT SECTION - MOBILE (Bottom Sheet / Overlay) */}
            {currentChatId && (
                <div className={`
                    md:hidden fixed inset-x-0 bottom-0 z-30 
                    transition-all duration-300 ease-in-out 
                    ${mobileChatState === 0 ? 'translate-y-full' : 'translate-y-0'}
                    ${mobileChatState === 1 ? 'h-auto bg-transparent pointer-events-none' : 'h-[60%] pointer-events-auto'}
                `}>
                    {/* Floating Pill for Minimized State */}
                    {mobileChatState === 1 && (
                        <div className="absolute bottom-6 left-4 right-4 pointer-events-auto">
                            <ChatView 
                                chatId={currentChatId} 
                                currentUser={user} 
                                onMinimize={() => setMobileChatState(2)} // Expand
                                onClose={handleCloseChat}
                                viewMode="mobile-minimized"
                            />
                        </div>
                    )}

                    {/* Full Mobile Chat View (GLASS OVERLAY) */}
                    {mobileChatState === 2 && (
                        <div className="h-full w-full rounded-t-3xl overflow-hidden border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] bg-surface/85 backdrop-blur-md">
                            <ChatView 
                                chatId={currentChatId} 
                                currentUser={user} 
                                onMinimize={() => setMobileChatState(1)} // Minimize
                                onClose={handleCloseChat}
                                viewMode="mobile-expanded"
                            />
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-bg w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
                  <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full z-10 hover:rotate-90 transition shadow-sm"><X size={20} /></button>
                  <SettingsView 
                    currentUser={user} 
                    onLogout={() => { setUser(null); localStorage.removeItem('traveltalk_user'); localStorage.removeItem('lastChat'); }}
                    isDarkMode={document.documentElement.classList.contains('dark')}
                    toggleDarkMode={() => { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }}
                    onUpdateUser={(u) => { setUser(u); localStorage.setItem('traveltalk_user', u.username); }}
                  />
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
