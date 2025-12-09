import React from 'react';
import { User } from '../types';
import { dbPut } from '../services/db';
import { LogOut, Moon, Sun, ShieldCheck } from 'lucide-react';

export default function SettingsView({ currentUser, onLogout, toggleTheme, isDark, onUpdate }: any) {
  const [color, setColor] = React.useState(currentUser.theme?.primaryColor || '#588157');
  
  const changeColor = async (e:any) => { 
    const newColor = e.target.value;
    setColor(newColor); 
    const u={...currentUser, theme:{...currentUser.theme, primaryColor: newColor}}; 
    await dbPut('users',u); 
    onUpdate(u); 
  };
  
  return (
    <div className="px-6 py-4">
       <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
       
       {/* User Info */}
       <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-800">
           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentUser.name}</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400">@{currentUser.username}</p>
           <div className="mt-3 flex gap-2">
             <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full flex items-center gap-1 font-medium">
               <ShieldCheck size={14}/> Encrypted
             </span>
           </div>
       </div>

       {/* Theme Settings */}
       <div className="space-y-4 mb-6">
           {/* Dark Mode Toggle */}
           <button 
             onClick={toggleTheme} 
             className="w-full p-4 rounded-lg flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
           >
             <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
             <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
               {isDark ? <Moon size={18} className="text-gray-900 dark:text-white" /> : <Sun size={18} className="text-gray-900 dark:text-white" />}
             </div>
           </button>

           {/* Theme Color Picker */}
           <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
             <label className="block font-medium text-gray-900 dark:text-white mb-3">Theme Color</label>
             <input 
               type="color" 
               value={color} 
               onChange={changeColor}
               className="w-full h-12 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700"
               title="Choose theme color"
             />
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Selected: {color}</p>
           </div>
       </div>

       {/* Logout Button */}
       <button 
         onClick={onLogout} 
         className="w-full p-4 rounded-lg font-semibold flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
       >
         <LogOut size={18}/>
         Log Out
       </button>

       {/* Legal */}
       <div className="mt-8 p-4 bg-gray-900 dark:bg-black rounded-lg text-gray-400 text-xs">
         <p className="font-bold text-white mb-2">⚖️ LEGAL NOTICE</p>
         <p>Property of Corey Oscar Mocchi. All rights reserved. Unauthorized use is prohibited.</p>
       </div>
    </div>
  );
}
