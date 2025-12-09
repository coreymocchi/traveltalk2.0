export interface User { id: string; username: string; name: string; password?: string; theme?: { primaryColor: string; }; createdAt: number; }
export interface Chat { id: string; name: string; type: 'private' | 'group'; participants: string[]; admins?: string[]; lastMessage?: string; lastMessageTs?: number; }
export interface Message { id: number; chatId: string; sender: string; type: 'text' | 'route' | 'image' | 'video' | 'sticker' | 'live_location' | 'audio'; text: string; timestamp: number; translatedText?: string; mediaData?: string; metadata?: any; }
export interface Place { id: string; type: 'accident' | 'camera' | 'construction' | 'hazard' | 'police' | 'traffic' | 'traffic_stop'; lat: number; lng: number; title: string; description: string; authorId: string; upvotes: number; downvotes: number; timestamp: number; }
export interface SearchResult { place_id: number; lat: string; lon: string; display_name: string; type: string; class: string; }
