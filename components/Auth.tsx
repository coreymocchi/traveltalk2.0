
import React, { useState } from 'react';
import { User } from '../types';
import { dbGet, dbPut } from '../services/db';
import { MapPin, ShieldCheck, ArrowRight, CheckSquare, Square } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Username and password are required.');
      setLoading(false);
      return;
    }

    const cleanUsername = username.toLowerCase().trim();

    try {
      // Simulate network delay for realism
      await new Promise(r => setTimeout(r, 800));

      if (isRegistering) {
        if (!name) {
          setError('Please provide a display name.');
          setLoading(false);
          return;
        }
        const existing = await dbGet<User>('users', cleanUsername);
        if (existing) {
          setError('This username is already taken.');
          setLoading(false);
          return;
        }
        const newUser: User = {
          id: `user-${cleanUsername}`,
          username: cleanUsername,
          name: name.trim(),
          password: btoa(password),
          createdAt: Date.now()
        };
        await dbPut('users', newUser);
        // Add default self-chat
        const selfChat = {
           id: `self-${cleanUsername}`,
           name: 'Saved Messages',
           type: 'private',
           participants: [newUser.id, newUser.id],
           lastMessage: 'Welcome to your private space.',
           lastMessageTs: Date.now()
        };
        await dbPut('chats', selfChat);
        
        onLogin(newUser);
      } else {
        const user = await dbGet<User>('users', cleanUsername);
        if (!user || user.password !== btoa(password)) {
          setError('Invalid username or password.');
          setLoading(false);
          return;
        }
        onLogin(user);
      }
    } catch (err) {
      console.error(err);
      setError('System error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-6 transition-colors duration-300">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-6 transform rotate-3">
             <MapPin className="text-primary-fg w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">TravelTalk</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Secure. Private. Local.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {isRegistering && (
              <div className="relative group animate-in slide-in-from-top-2 fade-in">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:text-white"
                  placeholder="Display Name"
                />
              </div>
            )}
            
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:text-white"
                placeholder="Username"
              />
            </div>

            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:text-white"
                placeholder="Password"
              />
            </div>
          </div>
          
          <div 
             className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer w-fit select-none"
             onClick={() => setKeepLoggedIn(!keepLoggedIn)}
          >
             {keepLoggedIn ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
             <span>Keep me signed in</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-pulse">
               <ShieldCheck size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-fg py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : (isRegistering ? 'Create Secure Account' : 'Sign In')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-gray-500 hover:text-primary text-sm font-medium transition-colors"
          >
            {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
        
        <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Saved locally on device</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
