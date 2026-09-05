
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createGame, joinGame } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';

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

  const generateUniqueId = (baseUid: string) => {
    return `${baseUid}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handleCreate = async () => {
    if (!name || !user) return;
    try {
      const hostId = generateUniqueId(user.uid);
      const code = await createGame(name, hostId, icon);
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
      await joinGame(code, name, playerId, icon);
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
      {showIconSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIconSelect(false)}></div>
          <div className="relative bg-surface border border-moon/20 rounded-2xl shadow-[0_0_50px_rgba(18,184,134,0.15)] p-6 w-full max-w-md animate-fade-in-up">
            <h3 className="text-moon font-display text-xl mb-4 text-center">Select Your Avatar</h3>
            <div className="grid grid-cols-4 gap-3">
              {PLAYER_AVATARS.map(avatar => (
                <button 
                  key={avatar}
                  onClick={() => { setIcon(avatar); setShowIconSelect(false); }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${icon === avatar ? 'border-primary shadow-[0_0_15px_rgba(18,184,134,0.4)] scale-105' : 'border-transparent hover:border-moon/30 hover:scale-105'}`}
                >
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowIconSelect(false)} 
              className="mt-6 w-full py-3 rounded-lg bg-forest text-moon hover:bg-bark transition-colors border border-moon/10 font-bold tracking-wider"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
      <style>{`
        .home-bg {
          background: linear-gradient(160deg, 
            #090614 0%, 
            #0d1028 30%, 
            #0c0818 55%, 
            #0a0820 80%,
            #090614 100%);
        }

        .home-title {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: clamp(2.5rem, 8vw, 5rem);
          letter-spacing: 0.05em;
          text-shadow: 
            0 2px 10px rgba(0,0,0,0.9),
            0 0 40px rgba(18,184,134,0.4),
            0 0 80px rgba(18,184,134,0.15);
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
          top: 5%; right: 5%;
          width: 250px; height: 250px;
          opacity: 0.45;
          filter: drop-shadow(0 0 20px rgba(18, 184, 134, 0.2));
          z-index: 1;
          pointer-events: none;
          animation: floatMoon 10s ease-in-out infinite;
        }

        @keyframes floatMoon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        .moon-glow {
          position: absolute;
          top: 1%; right: 1%;
          width: 340px; height: 340px;
          background: radial-gradient(circle, 
            rgba(220,245,235,0.04) 0%, 
            rgba(18,184,134,0.03) 30%, 
            rgba(140,130,200,0.02) 55%, 
            transparent 70%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
          animation: floatMoon 10s ease-in-out infinite;
        }

        .moon-outer-ring {
          position: absolute;
          top: 2%; right: 2%;
          width: 320px; height: 320px;
          border-radius: 50%;
          border: 1px solid rgba(220,245,235,0.02);
          box-shadow: 0 0 50px rgba(18,184,134,0.04), inset 0 0 30px rgba(220,245,235,0.01);
          z-index: 0;
          pointer-events: none;
          animation: floatMoon 10s ease-in-out infinite;
        }

        .icon-stroke {
            stroke: #12b886;
            stroke-width: 2;
            fill: none;
            filter: drop-shadow(0 0 2px rgba(18,184,134,0.5));
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
          background: linear-gradient(90deg, transparent, rgba(220,245,235,0.15), rgba(18,184,134,0.25), rgba(220,245,235,0.15), transparent);
          position: relative;
          margin: 0 auto;
        }
        .ornate-divider::before {
          content: '◆';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(18,184,134,0.3);
          font-size: 8px;
          background: #090614;
          padding: 0 8px;
        }

        .btn-card {
          background: rgba(19,14,38,0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(220,245,235,0.15);
          padding: 1.5rem;
          border-radius: 20px;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.4s ease;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          min-height: 160px;
          text-align: left;
          position: relative;
          overflow: hidden;
          z-index: 10;
          box-shadow: inset 0 1px 0 rgba(220,245,235,0.05), 0 8px 32px rgba(0,0,0,0.4);
          transform: translateZ(0);
          will-change: transform, box-shadow;
        }
        
        .btn-card:hover {
          transform: translateY(-6px) scale(1.02);
          background: rgba(26,18,46,0.85);
          border-color: rgba(220,245,235,0.4);
          box-shadow: 0 15px 40px -10px rgba(0,0,0,0.7), 0 0 30px rgba(18,184,134,0.15), 0 0 60px rgba(140,130,200,0.08), inset 0 1px 0 rgba(220,245,235,0.04);
        }

        .btn-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(220,245,235,0.05) 0%, rgba(18,184,134,0.04) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .btn-card:hover::before {
          opacity: 1;
        }

        .identity-input {
          background: rgba(19,14,38,0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(220,245,235,0.04);
          border-bottom: 2px solid rgba(220,245,235,0.25);
          color: white;
          text-align: center;
          font-weight: 800;
          font-size: 1.25rem;
          padding: 1rem;
          border-radius: 12px;
          width: 100%;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.4s ease;
          letter-spacing: 0.1em;
          font-family: 'Rajdhani', sans-serif;
          position: relative; 
          z-index: 20;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3);
          transform: translateZ(0);
          will-change: transform, box-shadow;
        }
        .identity-input:focus {
          outline: none;
          border-color: #12b886;
          background: rgba(18,184,134,0.04);
          box-shadow: 0 8px 25px -5px rgba(18,184,134,0.25), 0 0 0 1px rgba(18,184,134,0.5) inset;
          transform: translateY(-2px);
        }
        .identity-input::placeholder {
          color: rgba(220,245,235,0.3);
          font-weight: 500;
        }

        .join-room-card {
          display: flex;
          width: 100%;
          position: relative;
          z-index: 100;
        }

        .room-input-field {
          width: 100% !important;
          height: 48px !important;
          padding: 0 54px 0 16px !important;
          font-family: 'Rajdhani', sans-serif !important;
          font-size: 1.1rem !important;
          text-align: left !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          
          background: rgba(19,14,38,0.4) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(220,245,235,0.04) !important;
          border-bottom: 2px solid rgba(220,245,235,0.25) !important;
          border-radius: 12px !important;
          color: white !important;
          outline: none !important;
          
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.4s ease !important;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.2) !important;
          transform: translateZ(0);
          will-change: transform, box-shadow;
        }

        .room-input-field:focus {
          border-color: #12b886 !important;
          box-shadow: 0 8px 25px -5px rgba(18,184,134,0.25), 0 0 0 1px rgba(18,184,134,0.5) inset !important;
          background: rgba(18,184,134,0.04) !important;
        }
        
        .room-input-field::placeholder {
          color: rgba(220,245,235,0.3) !important;
          font-weight: 500 !important;
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
                 <stop offset="35%" stopColor="#dcf5eb" />
                 <stop offset="65%" stopColor="#12b886" />
                 <stop offset="100%" stopColor="#8b113b" />
              </linearGradient>
              <radialGradient id="moon-crater-1" cx="30%" cy="30%" r="20%">
                 <stop offset="0%" stopColor="#000" stopOpacity="0.25" />
                 <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="moon-crater-2" cx="70%" cy="60%" r="30%">
                 <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
                 <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="moon-crater-3" cx="40%" cy="75%" r="15%">
                 <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                 <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <filter id="moon-glow" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="2" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <mask id="crescent-mask">
                 <circle cx="50" cy="50" r="45" fill="white" />
                 <circle cx="65" cy="40" r="40" fill="black" />
              </mask>
           </defs>
           <g mask="url(#crescent-mask)" filter="url(#moon-glow)">
              <circle cx="50" cy="50" r="45" fill="url(#blood-moon-gradient)" />
              <circle cx="50" cy="50" r="45" fill="url(#moon-crater-1)" />
              <circle cx="50" cy="50" r="45" fill="url(#moon-crater-2)" />
              <circle cx="50" cy="50" r="45" fill="url(#moon-crater-3)" />
           </g>
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

        <div className="w-full max-w-sm animate-fade-in-up flex gap-3" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <button 
                onClick={() => setShowIconSelect(true)}
                className="identity-input !p-0 w-[64px] h-[64px] flex-shrink-0 flex items-center justify-center hover:bg-surface/60 transition-colors overflow-hidden rounded-xl border-2 border-transparent hover:border-primary/50"
                style={{ marginBottom: 0 }}
              >
                {icon.includes('/') ? <img src={icon} alt="avatar" className="w-full h-full object-cover rounded-xl" /> : icon}
              </button>
            </div>
            
            <input
              type="text"
              placeholder="ENTER YOUR NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="identity-input flex-1"
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
                            placeholder="CODE"
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
                            className="absolute right-1 top-1 bottom-1 w-10 bg-primary hover:bg-primary-light text-white rounded-[10px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl shadow-[0_0_15px_rgba(18,184,134,0.3)] border border-primary/50 pointer-events-auto"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        {error && (
            <div className="animate-bounce bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-2 rounded-full font-bold text-xs backdrop-blur-sm transform-gpu">
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
