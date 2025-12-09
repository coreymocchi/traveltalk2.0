import React from 'react';
import { User } from '../types';
import { dbPut } from '../services/db';
import { LogOut, Moon, Sun, ShieldCheck } from 'lucide-react';
export default function SettingsView({ currentUser, onLogout, toggleTheme, isDark, onUpdate }: any) {
  const [color, setColor] = React.useState(currentUser.theme?.primaryColor || '#588157');
  const changeColor = async (e:any) => { setColor(e.target.value); const u={...currentUser, theme:{...currentUser.theme, primaryColor:e.target.value}}; await dbPut('users',u); onUpdate(u); };
  
  return (
    <div className="p-6 bg-white dark:bg-gray-950 h-full overflow-auto">
       <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
       <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl mb-6">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
           <p className="text-gray-500 dark:text-gray-400">@{currentUser.username}</p>
           <div className="mt-2 flex gap-2"><span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded flex items-center gap-1"><ShieldCheck size={12}/> Encrypted</span></div>
       </div>
       <div className="grid gap-4 mb-8">
           <button onClick={toggleTheme} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>Dark Mode</span>{isDark?<Moon size={20}/>:<Sun size={20}/>}</button>
           <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"><span>Theme Color</span><input type="color" value={color} onChange={changeColor} className="w-12 h-10 rounded cursor-pointer"/></div>
       </div>
       <button onClick={onLogout} className="w-full p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-xl font-bold flex gap-2 justify-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors"><LogOut size={18}/> Log Out</button>
       <div className="mt-8 p-4 bg-gray-900 dark:bg-black text-gray-400 dark:text-gray-500 rounded-xl text-xs font-mono"><p className="font-bold text-white mb-2">LEGAL NOTICE</p><p>Property of Corey Oscar Mocchi. All rights reserved. Unauthorized use is prohibited.</p></div>
    </div>
  );
}
