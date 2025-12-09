import React from 'react';
import { User } from '../types';
import { dbPut } from '../services/db';
import { LogOut, Moon, Sun, ShieldCheck } from 'lucide-react';
export default function SettingsView({ currentUser, onLogout, toggleTheme, isDark, onUpdate }: any) {
  const [color, setColor] = React.useState(currentUser.theme?.primaryColor || '#588157');
  const changeColor = async (e:any) => { setColor(e.target.value); const u={...currentUser, theme:{...currentUser.theme, primaryColor:e.target.value}}; await dbPut('users',u); onUpdate(u); };
  
  return (
    <div className="p-6 bg-white dark:bg-gray-900 h-full overflow-auto">
       <h1 className="text-3xl font-bold dark:text-white mb-8 text-gray-900">Settings</h1>
       <div className="bg-surface border p-6 rounded-2xl mb-6">
           <h2 className="text-xl font-bold dark:text-white">{currentUser.name}</h2>
           <p className="text-gray-500">@{currentUser.username}</p>
           <div className="mt-2 flex gap-2"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1"><ShieldCheck size={12}/> Encrypted</span></div>
       </div>
       <div className="grid gap-4 mb-8">
           <button onClick={toggleTheme} className="p-4 border rounded-xl flex items-center justify-between bg-surface dark:text-white"><span>Dark Mode</span>{isDark?<Moon/>:<Sun/>}</button>
           <div className="p-4 border rounded-xl flex items-center justify-between bg-surface dark:text-white"><span>Theme Color</span><input type="color" value={color} onChange={changeColor}/></div>
       </div>
       <button onClick={onLogout} className="w-full p-4 bg-red-100 text-red-500 rounded-xl font-bold flex gap-2 justify-center"><LogOut/> Log Out</button>
       <div className="mt-8 p-4 bg-gray-900 text-gray-500 rounded-xl text-xs font-mono"><p className="font-bold text-white mb-2">LEGAL NOTICE</p><p>Property of Corey Oscar Mocchi. All rights reserved. Unauthorized use is prohibited.</p></div>
    </div>
  );
}
