
import React, { useState, useEffect } from 'react';
import { User, Chat, Message } from '../types';
import { dbGetAll, dbPut, dbDelete } from '../services/db';
import { Plus, Search, Trash2, Users, X, Check, Settings } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenSettings: () => void;
  onClose?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentChatId, onSelectChat, onOpenSettings, onClose, className }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  
  // Group Creation State
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userList, setUserList] = useState<User[]>([]);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 3000); 
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Load all users for group creation
  useEffect(() => {
    if (showNewGroupModal) {
        dbGetAll<User>('users').then(users => {
            setUserList(users.filter(u => u.id !== currentUser.id));
        });
    }
  }, [showNewGroupModal]);

  const loadChats = async () => {
    const allChats = await dbGetAll<Chat>('chats');
    const allMessages = await dbGetAll<Message>('messages');

    let myChats = allChats.filter(c => c.participants.includes(currentUser.id));

    myChats = myChats.map(chat => {
      const chatMsgs = allMessages
        .filter(m => m.chatId === chat.id)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      const lastMsg = chatMsgs[0];
      let preview = 'No messages yet';
      if (lastMsg) {
          if (lastMsg.type === 'route') preview = '📍 Shared a Route';
          else if (lastMsg.type === 'live_location') preview = '📡 Live Location';
          else preview = lastMsg.text;
      }

      return {
        ...chat,
        lastMessage: preview,
        lastMessageTs: lastMsg ? lastMsg.timestamp : 0
      };
    }).sort((a, b) => (b.lastMessageTs || 0) - (a.lastMessageTs || 0));

    setChats(myChats);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    const users = await dbGetAll<User>('users');
    const filtered = users.filter(u => 
      u.id !== currentUser.id && 
      (u.username.toLowerCase().includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  const startPrivateChat = async (targetUser: User) => {
    const chatID = `private-${[currentUser.id, targetUser.id].sort().join('-')}`;
    const existing = chats.find(c => c.id === chatID);
    
    if (existing) {
      onSelectChat(existing.id);
    } else {
      const newChat: Chat = {
        id: chatID,
        name: targetUser.name,
        type: 'private',
        participants: [currentUser.id, targetUser.id],
        lastMessageTs: Date.now()
      };
      await dbPut('chats', newChat);
      await loadChats();
      onSelectChat(newChat.id);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const createGroup = async () => {
      if (!groupName || selectedUsers.length === 0) return alert("Please name the group and add users.");
      
      const newChat: Chat = {
          id: `group-${Date.now()}`,
          name: groupName,
          type: 'group',
          participants: [currentUser.id, ...selectedUsers.map(u => u.id)],
          admins: [currentUser.id],
          lastMessageTs: Date.now()
      };

      await dbPut('chats', newChat);
      
      // Add a system message
      const sysMsg: Message = {
          id: Date.now(),
          chatId: newChat.id,
          sender: currentUser.id,
          type: 'text',
          text: `Group "${groupName}" created.`,
          timestamp: Date.now()
      };
      await dbPut('messages', sysMsg);

      await loadChats();
      onSelectChat(newChat.id);
      setShowNewGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this chat?')) {
          await dbDelete('chats', chatId);
          // Optional: Delete messages too, or leave them orphaned
          loadChats();
          if (currentChatId === chatId) onSelectChat('');
      }
  };

  const toggleUserSelection = (user: User) => {
      if (selectedUsers.find(u => u.id === user.id)) {
          setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
      } else {
          setSelectedUsers(prev => [...prev, user]);
      }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex flex-col bg-surface border-r border-border h-full transition-colors duration-200 ${className}`}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-surface/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
        <h2 className="font-extrabold text-xl tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
          Messages
        </h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowNewGroupModal(true)}
                className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                title="Create Group"
            >
                <Users size={16} />
            </button>
            {onClose && (
                <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 transition-colors"
                    title="Close Sidebar"
                >
                    <X size={18} />
                </button>
            )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
          <input
            className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 dark:text-gray-200"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {searchResults.length > 0 ? (
          <div className="pb-2">
            <h3 className="px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Search Results</h3>
            {searchResults.map(u => (
              <div 
                key={u.id}
                onClick={() => startPrivateChat(u)}
                className="px-5 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                  {u.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.name}</div>
                  <div className="text-xs text-gray-500">@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {chats.length === 0 && (
              <div className="text-center p-8 text-gray-400">
                 <p className="text-sm">No chats yet.</p>
                 <p className="text-xs mt-1">Start a conversation!</p>
              </div>
            )}
            {chats.map(chat => (
              <li 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`relative px-4 py-3 cursor-pointer flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                  currentChatId === chat.id 
                    ? 'bg-primary text-primary-fg shadow-lg shadow-primary/20' 
                    : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 ${
                   currentChatId === chat.id ? 'border-white/20 bg-white/20' : 'border-border bg-gray-50 dark:bg-gray-800'
                }`}>
                  {chat.type === 'group' ? <Users size={20} /> : <span className="font-bold text-lg">{chat.name[0]}</span>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-bold truncate ${currentChatId === chat.id ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {chat.name}
                    </span>
                    <span className={`text-[10px] ${currentChatId === chat.id ? 'text-white/80' : 'text-gray-400'}`}>
                      {formatTime(chat.lastMessageTs)}
                    </span>
                  </div>
                  <div className={`text-xs truncate mt-0.5 ${currentChatId === chat.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {chat.lastMessage}
                  </div>
                </div>

                <button 
                    onClick={(e) => deleteChat(e, chat.id)}
                    className={`absolute right-2 bottom-2 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 ${
                        currentChatId === chat.id ? 'text-white/80 hover:bg-red-600' : 'text-gray-400'
                    }`}
                >
                    <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Settings */}
      <div className="p-4 border-t border-border mt-auto">
        <button 
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition font-medium"
        >
            <Settings size={18} />
            <span>Settings</span>
        </button>
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-bg w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-bold text-lg">Create Group</h3>
                      <button onClick={() => setShowNewGroupModal(false)} className="text-gray-500"><X size={20} /></button>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto">
                      <div className="mb-4">
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Group Name</label>
                          <input 
                              value={groupName}
                              onChange={e => setGroupName(e.target.value)}
                              className="w-full p-2 bg-surface border border-border rounded-lg outline-none focus:border-primary"
                              placeholder="e.g. Hiking Buddies"
                          />
                      </div>
                      
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Members</label>
                      <div className="space-y-2">
                          {userList.map(u => {
                              const isSelected = !!selectedUsers.find(s => s.id === u.id);
                              return (
                                  <div 
                                      key={u.id}
                                      onClick={() => toggleUserSelection(u)}
                                      className={`p-2 flex items-center gap-3 rounded-lg cursor-pointer border transition-colors ${
                                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface'
                                      }`}
                                  >
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                                          {isSelected && <Check size={12} className="text-white" />}
                                      </div>
                                      <span className="font-medium text-sm">{u.name}</span>
                                      <span className="text-xs text-gray-400 ml-auto">@{u.username}</span>
                                  </div>
                              )
                          })}
                          {userList.length === 0 && <p className="text-gray-500 text-sm italic">No other users found.</p>}
                      </div>
                  </div>

                  <div className="p-4 border-t border-border">
                      <button 
                          onClick={createGroup}
                          className="w-full bg-primary text-primary-fg py-3 rounded-xl font-bold disabled:opacity-50"
                          disabled={!groupName || selectedUsers.length === 0}
                      >
                          Create Group ({selectedUsers.length})
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sidebar;
