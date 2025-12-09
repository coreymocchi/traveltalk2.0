
import React, { useState } from 'react';
import { User } from '../types';
import { dbPut } from '../services/db';
import { LogOut, Trash2, Moon, Sun, Palette, Monitor, Lock, ShieldCheck, Scale } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpdateUser: (user: User) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onLogout, isDarkMode, toggleDarkMode, onUpdateUser }) => {
  const [color, setColor] = useState(currentUser.theme?.primaryColor || '#588157');

  const handleWipeData = () => {
    if (confirm("⚠️ WARNING: This will permanently delete your account, all chats, and all messages on this device. This cannot be undone.")) {
      indexedDB.deleteDatabase('traveltalk_v5');
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    const newUser = { ...currentUser, theme: { ...currentUser.theme, primaryColor: newColor } };
    await dbPut('users', newUser);
    onUpdateUser(newUser);
  };

  return (
    <div className="p-6 md:p-10 bg-bg h-full overflow-y-auto transition-colors duration-200">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">Settings</h1>
      
      {/* Profile Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-fg text-3xl font-bold uppercase shadow-lg shadow-primary/30">
            {currentUser.name[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">@{currentUser.username}</p>
            <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                   <ShieldCheck size={12} /> Encrypted
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                   Offline Ready
                </span>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Monitor size={20} /> Display
          </h3>
          <div 
             className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all"
             onClick={toggleDarkMode}
           >
             <div className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
             </div>
             <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${isDarkMode ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}>
                <div className="bg-white w-4 h-4 rounded-full shadow-sm"></div>
             </div>
           </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Palette size={20} /> Personalization
          </h3>
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg">
             <span className="font-medium text-gray-700 dark:text-gray-200">Primary Color</span>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{backgroundColor: color}}></div>
               <div className="relative overflow-hidden w-8 h-8 rounded-full border border-border bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <input 
                    type="color" 
                    value={color}
                    onChange={handleColorChange}
                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer opacity-0"
                  />
                  <Palette size={14} className="text-gray-500" />
               </div>
             </div>
           </div>
           <p className="text-xs text-gray-400 mt-3 px-1">Customize the app theme to match your style. Changes apply immediately.</p>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Data & Privacy</h3>
        <div className="space-y-3">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition text-gray-700 dark:text-gray-200 font-medium"
            >
              <div className="flex items-center gap-3"><LogOut size={20} /> Log Out</div>
            </button>
            <button 
              onClick={handleWipeData}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition text-red-600 dark:text-red-400 font-medium border border-red-100 dark:border-red-900/20"
            >
              <div className="flex items-center gap-3"><Trash2 size={20} /> Delete Account & Data</div>
            </button>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center flex items-center justify-center gap-1">
            <Lock size={12}/> Local Storage Encrypted
        </p>
      </div>

      {/* Legal & Copyright */}
      <div className="bg-gray-900 text-gray-400 rounded-2xl p-6 shadow-inner border border-gray-800">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-200">
             <Scale size={16} /> Legal & Intellectual Property
          </h3>
          <div className="text-[10px] leading-relaxed space-y-3 font-mono">
              <p>
                  <strong>OWNERSHIP NOTICE:</strong> This application ("TravelTalk"), including all source code, algorithms, user interface designs, and underlying methodologies, is the sole and exclusive intellectual property of <strong>COREY OSCAR MOCCHI</strong>.
              </p>
              <p>
                  <strong>COPYRIGHT WARNING:</strong> All rights reserved. No part of this software may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the owner.
              </p>
              <p className="text-red-400 font-bold">
                  LEGAL ACTION: ANY UNAUTHORIZED USE, COPYING, REDISTRIBUTION, OR ATTEMPT TO CLAIM OWNERSHIP OF THIS SOFTWARE WILL RESULT IN IMMEDIATE AND AGGRESSIVE LEGAL ACTION. THE OWNER RESERVES THE RIGHT TO SEEK MAXIMUM DAMAGES, INJUNCTIVE RELIEF, AND LEGAL FEES TO THE FULLEST EXTENT OF INTERNATIONAL COPYRIGHT LAW.
              </p>
              <p>
                  By using this application, you acknowledge and agree that <strong>Corey Oscar Mocchi</strong> retains 100% ownership and that no license or transfer of rights is implied or granted beyond personal use.
              </p>
              <p className="text-center mt-4 pt-4 border-t border-gray-800">
                  © {new Date().getFullYear()} COREY OSCAR MOCCHI. ALL RIGHTS RESERVED.
              </p>
          </div>
      </div>
      <div className="h-10"></div>
    </div>
  );
};

export default SettingsView;
