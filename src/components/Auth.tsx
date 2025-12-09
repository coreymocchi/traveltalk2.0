import React, { useState } from 'react';
import { User } from '../types';
import { dbGet, dbPut } from '../services/db';
import { MapPin } from 'lucide-react';
export default function Auth({ onLogin }: { onLogin: (u: User) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!username || !password) { setError('Required'); setLoading(false); return; }
    const clean = username.toLowerCase().trim();
    try {
      await new Promise(r => setTimeout(r, 500));
      if (isReg) {
        if (!name) { setError('Name required'); setLoading(false); return; }
        if (await dbGet('users', clean)) { setError('Taken'); setLoading(false); return; }
        const u = { id: `u-${clean}`, username: clean, name, password: btoa(password), theme: {primaryColor: '#588157'}, createdAt: Date.now() };
        await dbPut('users', u);
        await dbPut('chats', { id: `self-${clean}`, name: 'Saved Messages', type: 'private', participants: [u.id, u.id], lastMessageTs: Date.now() });
        localStorage.setItem('tt_user', clean);
        onLogin(u);
      } else {
        const u = await dbGet<User>('users', clean);
        if (!u || u.password !== btoa(password)) { setError('Invalid'); setLoading(false); return; }
        localStorage.setItem('tt_user', clean);
        onLogin(u);
      }
    } catch { setError('Error'); setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-6 shadow-lg"><MapPin className="text-white w-8 h-8"/></div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">TravelTalk</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isReg && <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Display Name" value={name} onChange={e=>setName(e.target.value)} />}
          <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg font-bold transition-colors">{loading ? '...' : (isReg ? 'Sign Up' : 'Login')}</button>
        </form>
        <button onClick={()=>{setIsReg(!isReg);setError('')}} className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{isReg ? 'Login instead' : 'Create account'}</button>
      </div>
    </div>
  );
}
