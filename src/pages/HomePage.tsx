
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createGame, joinGame } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const generateUniqueId = (baseUid: string) => {
    return `${baseUid}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handleCreate = async () => {
    if (!name || !user) return;
    try {
      const hostId = generateUniqueId(user.uid);
      const code = await createGame(name, hostId);
      localStorage.setItem(`onuw_player_id_${code}`, hostId);
      navigate(`/game/${code}`);
    } catch (e) {
      console.error(e);
      setError('Failed to create game');
    }
  };

  const handleJoin = async () => {
    if (!name || !joinCode || !user) return;
    try {
      const code = joinCode.toUpperCase();
      const playerId = generateUniqueId(user.uid);
      await joinGame(code, name, playerId);
      localStorage.setItem(`onuw_player_id_${code}`, playerId);
      navigate(`/game/${code}`);
    } catch (e) {
      console.error(e);
      setError('Failed to join game. Check code.');
    }
  };

  const fogParticles = Array.from({ length: 15 }).map((_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${8 + Math.random() * 6}s`,
      size: `${40 + Math.random() * 80}px`,
      opacity: 0.04 + Math.random() * 0.06
  }));

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 text-center home-bg font-sans">
      <style>{`
        .home-bg {
          background: linear-gradient(160deg, 
            #080b14 0%, 
            #0d1028 30%, 
            #111a2e 55%, 
            #0a0820 80%,
            #080b14 100%);
        }

        .home-title {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: clamp(2.5rem, 8vw, 5rem);
          letter-spacing: 0.05em;
          text-shadow: 
            0 2px 10px rgba(0,0,0,0.9),
            0 0 40px rgba(196,93,44,0.4),
            0 0 80px rgba(196,93,44,0.15);
        }

        .home-subtitle {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          letter-spacing: 0.4em;
        }

        .home-btn-text {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .fog-container {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 0;
        }

        .fog-particle {
          position: absolute;
          background: radial-gradient(ellipse at center, rgba(140,130,200,0.08) 0%, rgba(180,190,230,0.03) 40%, transparent 70%);
          border-radius: 50%;
          animation: fog-drift-home var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        @keyframes fog-drift-home {
          0% { transform: translateX(-15%) translateY(0) scale(1); opacity: var(--fog-opacity); }
          50% { transform: translateX(15%) translateY(-10px) scale(1.1); opacity: calc(var(--fog-opacity) * 1.8); }
          100% { transform: translateX(-15%) translateY(0) scale(1); opacity: var(--fog-opacity); }
        }

        .moon-bg {
          position: absolute;
          top: 8%; right: 8%;
          width: 220px; height: 220px;
          opacity: 0.22;
          filter: blur(0.5px) brightness(1.3);
          z-index: 1;
          pointer-events: none;
          animation: floatMoon 8s ease-in-out infinite;
        }

        @keyframes floatMoon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .moon-glow {
          position: absolute;
          top: 4%; right: 3%;
          width: 320px; height: 320px;
          background: radial-gradient(circle, 
            rgba(232,213,163,0.06) 0%, 
            rgba(140,130,200,0.04) 30%, 
            rgba(196,93,44,0.02) 50%, 
            transparent 70%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
          animation: floatMoon 8s ease-in-out infinite;
        }

        .moon-outer-ring {
          position: absolute;
          top: 5%; right: 4%;
          width: 300px; height: 300px;
          border-radius: 50%;
          border: 1px solid rgba(232,213,163,0.04);
          box-shadow: 0 0 40px rgba(140,130,200,0.05), 0 0 80px rgba(232,213,163,0.03);
          z-index: 0;
          pointer-events: none;
          animation: floatMoon 8s ease-in-out infinite;
        }

        .icon-stroke {
            stroke: #c45d2c;
            stroke-width: 2;
            fill: none;
            filter: drop-shadow(0 0 2px rgba(196,93,44,0.5));
        }

        .buttons-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          width: 100%;
          max-width: 550px;
        }
        @media (min-width: 640px) {
          .buttons-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .ornate-divider {
          width: 60%;
          max-width: 300px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,213,163,0.15), rgba(196,93,44,0.25), rgba(232,213,163,0.15), transparent);
          position: relative;
          margin: 0 auto;
        }
        .ornate-divider::before {
          content: '◆';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(196,93,44,0.3);
          font-size: 8px;
          background: #080b14;
          padding: 0 8px;
        }

        .btn-card {
          background: rgba(15,22,40,0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(196,93,44,0.18);
          padding: 1.5rem;
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          height: 160px;
          text-align: left;
          position: relative;
          overflow: hidden;
          z-index: 10;
          box-shadow: inset 0 1px 0 rgba(232,213,163,0.04), 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .btn-card:hover {
          transform: translateY(-5px);
          background: rgba(26,21,48,0.9);
          border-color: rgba(232,213,163,0.3);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.6), 0 0 25px rgba(196,93,44,0.12), 0 0 50px rgba(140,130,200,0.05), inset 0 1px 0 rgba(232,213,163,0.08);
        }

        .btn-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(45deg, transparent 0%, rgba(196,93,44,0.04) 50%, rgba(232,213,163,0.02) 100%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .btn-card:hover::before {
          opacity: 1;
        }

        .identity-input {
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(232,213,163,0.15);
          color: white;
          text-align: center;
          font-weight: 800;
          font-size: 1.25rem;
          padding: 0.75rem;
          width: 100%;
          transition: all 0.3s;
          letter-spacing: 0.05em;
          font-family: 'Rajdhani', sans-serif;
          position: relative; 
          z-index: 20;
        }
        .identity-input:focus {
          outline: none;
          border-color: #c45d2c;
          background: rgba(196,93,44,0.05);
          box-shadow: 0 4px 15px -5px rgba(196,93,44,0.2), 0 1px 0 rgba(232,213,163,0.1);
        }
        .identity-input::placeholder {
          color: rgba(232,213,163,0.3);
          font-weight: 500;
        }

        .join-room-card {
          display: flex;
          gap: 0.5rem;
          width: 100%;
          position: relative;
          z-index: 100;
        }

        .room-input-field {
          width: 140px !important;
          height: 48px !important;
          padding: 12px !important;
          font-family: 'Rajdhani', sans-serif !important;
          font-size: 1.1rem !important;
          text-align: center !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          
          background: rgba(232,213,163,0.08) !important;
          border: 2px solid rgba(232,213,163,0.25) !important;
          border-radius: 12px !important;
          color: white !important;
          outline: none !important;
          
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }

        .room-input-field:focus {
          border-color: #c45d2c !important;
          box-shadow: 0 0 0 3px rgba(196,93,44,0.3), 0 0 15px rgba(196,93,44,0.1) !important;
          background: rgba(232,213,163,0.12) !important;
        }
        
        .room-input-field::placeholder {
          color: rgba(232,213,163,0.3) !important;
        }

      `}</style>
      
      <div className="fog-container">
          {fogParticles.map((f, i) => (
              <div 
                key={i} 
                className="fog-particle" 
                style={{ 
                    top: f.top, 
                    left: f.left, 
                    width: f.size, 
                    height: f.size,
                    ['--dur' as string]: f.duration,
                    ['--delay' as string]: f.delay,
                    ['--fog-opacity' as string]: f.opacity,
                }}
              />
          ))}
      </div>

      <div className="moon-glow" />
      <div className="moon-outer-ring" />

      <div className="moon-bg">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
           <defs>
              <linearGradient id="blood-moon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#f0e6cc" />
                 <stop offset="35%" stopColor="#e8d5a3" />
                 <stop offset="65%" stopColor="#c45d2c" />
                 <stop offset="100%" stopColor="#8b1a1a" />
              </linearGradient>
           </defs>
           <path 
             d="M40,20 A30,30 0 1,0 80,60 A25,25 0 1,1 40,20" 
             fill="url(#blood-moon-gradient)" 
             stroke="#e8d5a3" 
             strokeWidth="0.8"
             strokeLinecap="round"
             strokeLinejoin="round"
           />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        
        <div className="animate-fade-in-up">
            <h1 className="home-title text-transparent bg-clip-text bg-gradient-to-b from-moon to-primary-light mb-1">
                ONE NIGHT
            </h1>
            <h2 className="home-subtitle text-lg md:text-xl text-primary font-bold uppercase mt-1">
                Ultimate Werewolf
            </h2>
        </div>

        <div className="ornate-divider" />

        <div className="w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <input
              type="text"
              placeholder="ENTER YOUR NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="identity-input"
            />
        </div>

        <div className="ornate-divider" />

        <div className="buttons-grid animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
                onClick={handleCreate}
                disabled={!name}
                className="btn-card group w-full"
            >
                <div className="mb-2 group-hover:scale-110 transition-transform duration-300">
                   <svg viewBox="0 0 24 24" className="w-10 h-10 icon-stroke">
                       <rect x="5" y="3" width="14" height="18" rx="2" />
                       <circle cx="12" cy="12" r="3" />
                       <path d="M12 9v6" />
                       <path d="M9 12h6" />
                   </svg>
                </div>
                <div>
                    <div className="text-xl font-bold text-white mb-0.5 home-btn-text">Create Room</div>
                    <div className="text-xs text-moon/50 font-medium">Host a new game session</div>
                </div>
                <div className="absolute top-4 right-4 text-white/10 group-hover:text-primary/30 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
            </button>
            
            <div className="btn-card w-full cursor-default">
                <div className="flex justify-between w-full">
                    <div className="mb-2">
                       <svg viewBox="0 0 24 24" className="w-10 h-10 icon-stroke">
                           <circle cx="12" cy="8" r="3" />
                           <path d="M7 20v-2c0-2.2 2.2-4 5-4s5 1.8 5 4v2" />
                           <path d="M19 10c1.1 0 2 .9 2 2" />
                           <path d="M22 20v-1c0-1.5-1-2.7-2.5-3.5" />
                           <path d="M5 10c-1.1 0-2 .9-2 2" />
                           <path d="M2 20v-1c0-1.5 1-2.7 2.5-3.5" />
                       </svg>
                    </div>
                </div>
                
                <div className="w-full">
                    <div className="text-xl font-bold text-white mb-2 home-btn-text">Join Room</div>
                    
                    <div className="join-room-card">
                        <input
                            id="roomCodeInput"
                            type="text"
                            maxLength={6}
                            placeholder="XXXXXX"
                            value={joinCode}
                            autoComplete="off"
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setJoinCode(val.slice(0, 6));
                            }}
                            className="room-input-field"
                        />
                        <button
                            onClick={handleJoin}
                            disabled={!name || !joinCode}
                            className="flex-1 bg-primary hover:bg-primary-light text-white h-[48px] rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl shadow-[0_0_15px_rgba(196,93,44,0.3)] border border-primary/50 relative z-50 pointer-events-auto"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        {error && (
            <div className="animate-bounce bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-2 rounded-full font-bold text-xs backdrop-blur-sm">
                ⚠️ {error}
            </div>
        )}
        
        <div className="text-moon/20 text-[10px] font-mono tracking-widest mt-4">
            EST. MMXXV
        </div>
      </div>
    </div>
  );
};

export default HomePage;
