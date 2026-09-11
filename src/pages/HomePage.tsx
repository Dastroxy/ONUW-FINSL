import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createGame, joinGame } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { ROLE_METADATA } from '../constants';
import { RoleID } from '../types';

const PLAYER_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jack&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Liam&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sophia&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Maria&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Amaya&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Eden&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jocelyn&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Chase&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Ryker&backgroundColor=c0aede'
];

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [icon, setIcon] = useState('https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4');
  const [showIconSelect, setShowIconSelect] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const generateUniqueId = (baseUid: string) => {
    return `${baseUid}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter your name first');
      nameInputRef.current?.focus();
      return;
    }
    if (!user) return;
    try {
      const hostId = generateUniqueId(user.uid);
      const code = await createGame(name.trim(), hostId, icon);
      localStorage.setItem(`onuw_player_id_${code}`, hostId);
      navigate(`/game/${code}`);
    } catch (e) {
      console.error(e);
      setError('Failed to create game');
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name first');
      nameInputRef.current?.focus();
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    if (!user) return;
    try {
      const code = joinCode.toUpperCase().trim();
      let playerId = localStorage.getItem(`onuw_player_id_${code}`);
      if (!playerId) {
        playerId = generateUniqueId(user.uid);
      }
      const actualPlayerId = await joinGame(code, name.trim(), playerId, icon, user.uid);
      localStorage.setItem(`onuw_player_id_${code}`, actualPlayerId || playerId);
      navigate(`/game/${code}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to join game. Check code.');
    }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-y-auto overflow-x-hidden flex flex-col items-center justify-between pb-24 pt-4 px-4 sm:px-6 bg-[#0a0e16] font-sans">
      
      {/* Top Bar */}
      <header className="w-full max-w-md flex items-center justify-between py-2 px-1 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00e575] to-[#0a6639] p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,117,0.4)]">
            <div className="w-full h-full rounded-full bg-[#0a1219] flex items-center justify-center text-[#00e575] text-xs font-bold">
              ✦
            </div>
          </div>
          <span className="font-display font-bold tracking-[0.2em] text-sm text-white uppercase">
            ONE NIGHT
          </span>
        </div>

        <button
          onClick={() => setShowIconSelect(true)}
          className="w-10 h-10 rounded-full bg-[#121926] border border-white/10 hover:border-[#00e575]/40 flex items-center justify-center text-gray-300 hover:text-white transition-all overflow-hidden shadow-md cursor-pointer"
          title="Change Avatar"
        >
          {icon.includes('/') ? (
            <img src={icon} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-sm flex flex-col items-center my-auto py-4 z-10">
        
        {/* Emblem Hero */}
        <div className="relative mb-6 flex flex-col items-center">
          {/* Concentric Glow Circles */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
            {/* Outer soft aura */}
            <div className="absolute inset-0 rounded-full bg-[#00e575]/10 filter blur-xl animate-pulse"></div>
            
            {/* Dashed outer ring */}
            <div className="absolute inset-1 rounded-full border border-dashed border-[#00e575]/30 animate-[spin_40s_linear_infinite]"></div>
            
            {/* Solid middle ring */}
            <div className="absolute inset-3 rounded-full border border-[#00e575]/40"></div>

            {/* Glowing teal inner moon disc */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#10dc78] via-[#0b8449] to-[#04331b] p-1 shadow-[0_0_35px_rgba(0,229,117,0.35)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#091118] flex items-center justify-center relative overflow-hidden">
                {/* Moon crescent & star */}
                <svg viewBox="0 0 100 100" className="w-16 h-16 text-[#00e575]" fill="currentColor">
                  <path d="M50 8 C 30 8 16 24 16 45 C 16 68 34 86 57 86 C 68 86 78 82 85 75 C 62 75 44 57 44 34 C 44 23 48 14 55 8 C 53 8 51 8 50 8 Z" opacity="0.9" />
                  <polygon points="68,22 71,28 77,31 71,34 68,40 65,34 59,31 65,28" fill="#00e575" />
                  <circle cx="78" cy="48" r="2.5" fill="#00e575" opacity="0.8" />
                </svg>
              </div>
            </div>
          </div>

          {/* Titles */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-[0.1em] uppercase mt-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            ONE NIGHT
          </h1>
          <div className="text-[#00e575] font-mono font-bold tracking-[0.35em] text-[11px] sm:text-xs uppercase mt-1">
            ULTIMATE WEREWOLF
          </div>
        </div>

        {/* Profile / Playing As Card */}
        <div className="w-full bg-[#111824] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg mb-5">
          <button 
            onClick={() => setShowIconSelect(true)}
            className="w-12 h-12 rounded-full overflow-hidden border border-[#00e575]/40 hover:border-[#00e575] transition-all shrink-0 bg-[#16202f] cursor-pointer"
            title="Change Avatar"
          >
            {icon.includes('/') ? (
              <img src={icon} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl flex items-center justify-center h-full">👤</span>
            )}
          </button>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[10px] tracking-[0.25em] text-gray-400 font-mono font-bold uppercase">
              PLAYING AS
            </div>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="ENTER YOUR NAME"
              value={name}
              maxLength={18}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-transparent text-white font-bold text-sm sm:text-base tracking-wide uppercase outline-none placeholder:text-gray-500 truncate"
            />
          </div>

          <button 
            onClick={() => nameInputRef.current?.focus()}
            className="text-gray-400 hover:text-[#00e575] p-2 transition-colors text-sm cursor-pointer"
            title="Edit name"
          >
            ✎
          </button>
        </div>

        {/* Primary Action: Create Room */}
        <button
          onClick={handleCreate}
          className="btn-primary-neon w-full py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base mb-4"
        >
          <span className="text-lg leading-none">+</span>
          <span>CREATE ROOM</span>
        </button>

        {/* Divider */}
        <div className="w-full flex items-center justify-center gap-3 my-2">
          <div className="flex-1 h-[1px] bg-white/10"></div>
          <span className="text-[10px] tracking-[0.25em] text-gray-400 font-mono uppercase">
            OR ENTER VILLAGE
          </span>
          <div className="flex-1 h-[1px] bg-white/10"></div>
        </div>

        {/* Room Code Input Box */}
        <div className="w-full bg-[#111824] border border-white/10 focus-within:border-[#00e575]/60 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 shadow-lg mt-3 transition-colors">
          <span className="text-gray-400 pl-2 text-sm">🔑</span>
          <input
            id="roomCodeInput"
            type="text"
            maxLength={6}
            placeholder="ROOM CODE"
            value={joinCode}
            autoComplete="off"
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              setJoinCode(val.slice(0, 6));
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
            className="flex-1 bg-transparent text-white font-mono tracking-[0.25em] uppercase text-sm sm:text-base outline-none px-1 placeholder:text-gray-500"
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            className="w-10 h-10 rounded-xl bg-[#1b2535] hover:bg-[#253349] disabled:opacity-40 disabled:cursor-not-allowed text-[#00e575] flex items-center justify-center text-base font-bold transition-all shrink-0 cursor-pointer"
            title="Join Room"
          >
            ➔
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-2 rounded-xl font-medium text-xs text-center animate-fade-in w-full">
            ⚠️ {error}
          </div>
        )}

      </main>

      {/* Bottom Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c1119]/95 backdrop-blur-xl border-t border-white/10 py-2.5 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button 
            className="flex flex-col items-center gap-1 text-[#00e575] px-3 py-1 cursor-pointer transition-transform hover:scale-105"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="text-lg">🏰</span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">VILLAGE</span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white px-3 py-1 cursor-pointer transition-transform hover:scale-105"
            onClick={() => setShowRolesModal(true)}
          >
            <span className="text-lg">📖</span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">ROLES</span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white px-3 py-1 cursor-pointer transition-transform hover:scale-105"
            onClick={() => {
              nameInputRef.current?.focus();
            }}
          >
            <span className="text-lg">👥</span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">LOBBY</span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white px-3 py-1 cursor-pointer transition-transform hover:scale-105"
            onClick={() => setShowRulesModal(true)}
          >
            <span className="text-lg">📜</span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">RULES</span>
          </button>
        </div>
      </footer>

      {/* Avatar Picker Modal */}
      {showIconSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-[#111824] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-white font-display font-bold text-lg mb-4 text-center tracking-wider">
              SELECT YOUR AVATAR
            </h3>
            <div className="grid grid-cols-4 gap-2.5">
              {PLAYER_AVATARS.map((avatar) => (
                <button 
                  key={avatar}
                  onClick={() => { setIcon(avatar); setShowIconSelect(false); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    icon === avatar 
                      ? 'border-[#00e575] shadow-[0_0_15px_rgba(0,229,117,0.4)] scale-105' 
                      : 'border-white/10 hover:border-white/40'
                  }`}
                >
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowIconSelect(false)} 
              className="mt-5 w-full py-3 rounded-xl bg-[#172232] text-gray-300 hover:text-white transition-colors border border-white/10 font-bold tracking-wider text-xs uppercase cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Roles Modal */}
      {showRolesModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowRolesModal(false)}
        >
          <div 
            className="w-full max-w-lg max-h-[80vh] flex flex-col bg-[#111824] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-white/10 bg-[#0d131e]">
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider">
                  ALL VILLAGE ROLES
                </h3>
                <p className="text-xs text-gray-400">Discover role abilities and alignments</p>
              </div>
              <button 
                onClick={() => setShowRolesModal(false)}
                className="w-8 h-8 rounded-full bg-[#1b2535] hover:bg-[#253349] text-gray-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3">
              {Object.keys(ROLE_METADATA).map((k) => {
                const meta = ROLE_METADATA[k as RoleID];
                return (
                  <div key={k} className="p-3 rounded-xl bg-[#151e2b] border border-white/5 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a2636] flex items-center justify-center shrink-0 text-sm font-bold text-[#00e575]">
                      ✦
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-bold text-sm tracking-wide">{meta.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                          meta.team === 'GOOD' ? 'bg-blue-500/20 text-blue-300' :
                          meta.team === 'EVIL' ? 'bg-red-500/20 text-red-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {meta.team}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{meta.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowRulesModal(false)}
        >
          <div 
            className="w-full max-w-md max-h-[80vh] flex flex-col bg-[#111824] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-white/10 bg-[#0d131e]">
              <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider">
                VILLAGE RULES
              </h3>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-[#1b2535] hover:bg-[#253349] text-gray-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 bg-[#151e2b] rounded-xl border border-white/5">
                <span className="text-[#00e575] font-bold block mb-1 uppercase font-mono">1. The Night Phase</span>
                Everyone goes to sleep. Certain roles wake up in a specific order and perform their special night actions to gather information or manipulate cards and marks.
              </div>
              <div className="p-3 bg-[#151e2b] rounded-xl border border-white/5">
                <span className="text-[#00e575] font-bold block mb-1 uppercase font-mono">2. Daybreak & Discussion</span>
                Everyone wakes up. You have a limited timer to discuss, accuse, bluff, and deduce who holds which role.
              </div>
              <div className="p-3 bg-[#151e2b] rounded-xl border border-white/5">
                <span className="text-[#00e575] font-bold block mb-1 uppercase font-mono">3. The Vote</span>
                All players point and vote simultaneously. The player(s) with the most votes are eliminated. Village wins if at least one Werewolf or Vampire is slain!
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;
