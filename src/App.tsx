import React, { useState, useEffect } from 'react';
import { dbGet } from './services/db';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import SettingsView from './components/SettingsView';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileState, setMobileState] = useState(1);
  const [resize, setResize] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => { 
    const u = localStorage.getItem('tt_user'); 
    if(u) dbGet('users', u).then(setUser); 
    const theme = localStorage.getItem('theme');
    if(theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);
  
  useEffect(() => { if(user?.theme?.primaryColor) document.documentElement.style.setProperty('--primary', user.theme.primaryColor); }, [user]);
  useEffect(() => { setTimeout(()=>setResize(r=>r+1), 300) }, [sidebarOpen, chatId, mobileState]);

  if(!user) return <Auth onLogin={(u: any)=>{setUser(u); localStorage.setItem('tt_user', u.username)}} />;

  return (
    <div className="fixed inset-0 flex bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden">
       {/* Sidebar */}
       <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-950 shadow-xl transition-transform border-r border-gray-200 dark:border-gray-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}`}>
           <Sidebar currentUser={user} currentChatId={chatId} onSelectChat={(id: string)=>{setChatId(id); setSidebarOpen(false); setMobileState(2);}} onOpenSettings={()=>{setSettingsOpen(true); setSidebarOpen(false);}} onClose={()=>setSidebarOpen(false)} />
       </div>
       
       {/* Main Area */}
       <div className="flex-1 relative flex flex-col">
           <div className="absolute top-4 left-4 z-20 md:hidden"><button onClick={()=>setSidebarOpen(true)} className="bg-white dark:bg-gray-800 p-3 rounded-full shadow text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Menu/></button></div>
           <div className="flex-1 relative"><MapView currentUser={user} resizeTrigger={resize} /></div>
           {chatId && (
               <>
                 <div className="hidden md:block w-96 border-l bg-white dark:bg-gray-950 absolute right-0 top-0 bottom-0 z-30 shadow-xl border-l-gray-200 dark:border-l-gray-800"><ChatView chatId={chatId} currentUser={user} viewMode="desktop" onClose={()=>setChatId(null)} /></div>
                 <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform ${mobileState===1 ? '' : 'h-[60%]'}`}>
                     {mobileState===1 ? <div className="absolute bottom-4 left-4 right-4"><ChatView chatId={chatId} currentUser={user} viewMode="mobile-minimized" onMinimize={()=>setMobileState(2)} onClose={()=>setChatId(null)}/></div> : <div className="h-full"><ChatView chatId={chatId} currentUser={user} viewMode="mobile-expanded" onMinimize={()=>setMobileState(1)} onClose={()=>setChatId(null)}/></div>}
                 </div>
               </>
           )}
       </div>

       {/* Settings Modal */}
       {settingsOpen && (
         <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" onClick={(e) => {
           if(e.target === e.currentTarget) setSettingsOpen(false);
         }}>
           <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col relative max-h-[90vh]">
             <button 
               onClick={() => setSettingsOpen(false)}
               className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full z-10"
             >
               <X size={20} />
             </button>
             <div className="overflow-y-auto pt-8 pb-6">
               <SettingsView 
                 currentUser={user} 
                 onLogout={() => {
                   setUser(null); 
                   localStorage.clear();
                 }} 
                 isDark={isDark}
                 toggleTheme={() => {
                   const newDark = !isDark;
                   setIsDark(newDark);
                   if(newDark) {
                     document.documentElement.classList.add('dark');
                     localStorage.setItem('theme', 'dark');
                   } else {
                     document.documentElement.classList.remove('dark');
                     localStorage.setItem('theme', 'light');
                   }
                 }}
                 onUpdate={setUser}
               />
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
