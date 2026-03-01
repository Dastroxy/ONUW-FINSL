
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message } from '../types';
import { sendChatMessage } from '../services/firestoreService';

interface Props {
  gameId: string;
  myId: string;
  myName: string;
}

const Chat: React.FC<Props> = ({ gameId, myId, myName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'games', gameId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
    });
    return unsubscribe;
  }, [gameId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
        await sendChatMessage(gameId, myId, myName, inputText.trim());
        setInputText('');
    } catch (err) {
        console.error("Chat Error", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-xl border border-white/10 overflow-hidden">
      <div className="bg-white/5 p-3 border-b border-white/10 font-bold text-gray-300 text-sm">
        Discussion Chat
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[85%] rounded-lg p-2 text-sm ${isMe ? 'bg-primary text-white' : 'bg-gray-700 text-gray-200'}`}>
                 {!isMe && <div className="text-[10px] text-gray-400 font-bold mb-0.5">{msg.senderName}</div>}
                 {msg.text}
               </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
        />
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-primary/80"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
