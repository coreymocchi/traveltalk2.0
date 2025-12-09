import React, { useState } from 'react';
import { User } from '../types';
import { dbGet, dbPut } from '../services/db';
import { MapPin, ArrowRight, CheckSquare, Square } from 'lucide-react';
export default function Auth({ onLogin }: { onLogin: (u: User) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [keep, setKeep] = useState(true);
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
        const u = { id: `u-${clean}`, username: clean, name, password: btoa(password), createdAt: Date.now() };
        await dbPut('users', u);
        await dbPut('chats', { id: `self-${clean}`, name: 'Saved Messages', type: 'private', participants: [u.id, u.id], lastMessageTs: Date.now() });
        onLogin(u);
      } else {
        const u = await dbGet<User>('users', clean);
        if (!u || u.password !== btoa(password)) { setError('Invalid'); setLoading(false); return; }
        onLogin(u);
      }
    } catch { setError('Error'); setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-6 shadow-lg"><MapPin className="text-white w-8 h-8"/></div>
        <h1 className="text-3xl font-bold dark:text-white mb-8">TravelTalk</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isReg && <input className="w-full p-3 bg-surface border rounded-xl" placeholder="Display Name" value={name} onChange={e=>setName(e.target.value)} />}
          <input className="w-full p-3 bg-surface border rounded-xl" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" className="w-full p-3 bg-surface border rounded-xl" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer" onClick={()=>setKeep(!keep)}>{keep?<CheckSquare size={16} className="text-primary"/>:<Square size={16}/>} Keep me signed in</div>
          {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
          <button disabled={loading} className="w-full bg-primary text-white p-3 rounded-xl font-bold">{loading ? '...' : (isReg ? 'Sign Up' : 'Login')}</button>
        </form>
        <button onClick={()=>{setIsReg(!isReg);setError('')}} className="mt-6 text-sm text-gray-500">{isReg ? 'Login instead' : 'Create account'}</button>
      </div>
    </div>
  );
}
