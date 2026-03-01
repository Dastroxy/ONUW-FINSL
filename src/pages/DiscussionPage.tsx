
import React, { useEffect, useState } from 'react';
import { GameState, Player, RoleID, Team } from '../types';
import { toggleDiscussionReady, advanceToVoting } from '../services/firestoreService';
import RoleCard from '../components/RoleCard';
import RoleIcon from '../components/RoleIcons';
import RolesInfoButton from '../components/RolesInfoButton';
import SeatingButton from '../components/SeatingButton';
import { ROLE_METADATA } from '../constants';

interface Props {
  game: GameState;
  me: Player;
}

const DiscussionPage: React.FC<Props> = ({ game, me }) => {
  const [timeLeft, setTimeLeft] = useState<number>(300);
  
  // Timer Sync
  useEffect(() => {
      const interval = setInterval(() => {
          if (!game.timerEnd) return;
          const remaining = Math.max(0, Math.floor((game.timerEnd - Date.now()) / 1000));
          setTimeLeft(remaining);
          
          if (remaining === 0 && me.isHost) {
              advanceToVoting(game.id);
          }
      }, 500); // Check more frequently for smooth ticking
      return () => clearInterval(interval);
  }, [game.timerEnd, me.isHost, game.id]);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isReady = (game.discussionReadyPlayers || []).includes(me.id);
  const readyCount = (game.discussionReadyPlayers || []).length;
  const totalPlayers = Object.keys(game.players).length;
  const revealedPlayers = Object.values(game.players).filter(p => p.isRevealed);

  // Particle generation
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 10
  }));

  return (
      <div className="min-h-screen relative flex flex-col items-center justify-between p-6 overflow-hidden bg-gradient-to-b from-[#080b14] via-[#0f1628] to-[#0a0e1a]">
          
          {/* ANIMATIONS */}
          <style>{`
            @keyframes float-up {
              0% { transform: translateY(100vh) scale(0); opacity: 0; }
              50% { opacity: 0.5; }
              100% { transform: translateY(-20vh) scale(1); opacity: 0; }
            }
            @keyframes dawn-glow {
              0%, 100% { opacity: 0.18; transform: scale(1); }
              50% { opacity: 0.3; transform: scale(1.08); }
            }
            @keyframes tick {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
          `}</style>

          {/* Misty Dawn Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(100,80,180,0.2) 0%, rgba(60,40,140,0.12) 40%, rgba(196,93,44,0.06) 70%, transparent 100%)', animation: 'dawn-glow 8s ease-in-out infinite' }}></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[300px] h-[300px] bg-[#6050b0]/10 rounded-full blur-[80px] pointer-events-none"></div>

          {/* Mist Particles */}
          {particles.map(p => (
            <div 
              key={p.id}
              className="absolute w-1 h-1 rounded-full pointer-events-none"
              style={{
                left: `${p.left}%`,
                background: p.id % 3 === 0 ? 'rgba(196,93,44,0.5)' : p.id % 3 === 1 ? 'rgba(100,80,180,0.5)' : 'rgba(232,213,163,0.4)',
                animation: `float-up ${p.duration}s infinite linear`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}

          {/* HEADER & TIMER */}
          <div className="relative z-10 flex flex-col items-center mt-12">
              <h1 className="text-2xl font-display font-bold tracking-[0.2em] text-[#7eb8c9]/80 mb-6 drop-shadow-[0_0_12px_rgba(100,80,180,0.5)]">
                  DISCUSSION PHASE
              </h1>
              
              <div 
                className={`
                   text-7xl font-mono font-bold text-[#e8d5a3] transition-all
                   ${timeLeft < 10 ? 'text-[#b91c1c] animate-pulse' : ''}
                `}
                style={{ animation: timeLeft > 0 ? 'tick 1s infinite' : 'none', textShadow: timeLeft < 10 ? '0 0 20px rgba(185,28,28,0.6)' : '0 0 20px rgba(232,213,163,0.4), 0 0 40px rgba(196,93,44,0.2)' }}
              >
                  {formatTime(timeLeft)}
              </div>
              <p className="text-[#7eb8c9]/50 text-sm mt-2 uppercase tracking-widest">Until Voting</p>
          </div>
          
          {/* NOSTRADAMUS ANNOUNCEMENT */}
          {game.nostradamusAnnouncement && (
              <div className="relative z-20 mt-6 animate-bounce">
                  <div className="bg-[#0f1628]/90 border-2 border-[#1a1530] px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(100,80,180,0.3),0_0_10px_rgba(232,213,163,0.1)] text-center">
                      <h3 className="text-[#7eb8c9] text-xs font-display font-bold uppercase tracking-widest mb-1">Public Announcement</h3>
                      <p className="text-[#e8d5a3] font-bold text-lg">{game.nostradamusAnnouncement}</p>
                  </div>
              </div>
          )}

          {/* REVEALED PLAYERS (Revealer/Exposer) */}
          {revealedPlayers.length > 0 && (
              <div className="relative z-20 mt-6 w-full max-w-2xl flex flex-col items-center animate-fade-in-up">
                  <h3 className="text-[#c45d2c] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-[#c45d2c] animate-pulse"></span>
                     Revealed Players
                     <span className="w-2 h-2 rounded-full bg-[#c45d2c] animate-pulse"></span>
                  </h3>
                  <div className="flex flex-wrap justify-center gap-6">
                      {revealedPlayers.map(p => {
                          const meta = ROLE_METADATA[p.currentRole];
                          return (
                              <div key={p.id} className="flex flex-col items-center">
                                  <div className="relative">
                                      <RoleCard role={p.currentRole} revealed={true} size="sm" className="shadow-[0_0_20px_rgba(196,93,44,0.4)] ring-2 ring-[#c45d2c]" />
                                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#c45d2c] text-black font-bold rounded-full flex items-center justify-center text-xs animate-bounce">!</div>
                                  </div>
                                  <div className="mt-2 text-center">
                                      <span className="block text-[#e8d5a3] font-bold text-sm">{p.name}</span>
                                      <span className="block text-[10px] text-[#c45d2c] uppercase tracking-wide">is {meta.name}</span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* CENTER CARDS */}
          <div className="relative z-10 flex flex-col items-center w-full my-8">
              <h3 className="text-[#7eb8c9]/50 text-xs font-bold uppercase tracking-widest mb-4">Center Cards</h3>
              <div className="flex gap-4 justify-center">
                  {game.centerCards.map(card => {
                      const isExposed = (game.exposedCenterCardIds || []).includes(card.id);
                      return (
                          <RoleCard 
                            key={card.id} 
                            role={card.role} 
                            revealed={isExposed} 
                            size="sm"
                            className={isExposed ? 'shadow-[0_0_20px_rgba(196,93,44,0.4)] ring-2 ring-[#c45d2c]' : 'shadow-[0_0_20px_rgba(0,0,0,0.5)] border-[#111a2e]/50'}
                          />
                      );
                  })}
              </div>
          </div>

          <RolesInfoButton roles={game.selectedRoles} />

          {/* SKIP CONTROLS */}
          <div className="relative z-10 w-full max-w-sm mb-6">
              <button 
                  onClick={() => !isReady && toggleDiscussionReady(game.id, me.id)}
                  disabled={isReady}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform border
                    ${isReady 
                        ? 'bg-[#c45d2c]/20 border-[#c45d2c] text-[#d4783f] cursor-default animate-pulse shadow-[0_0_20px_rgba(196,93,44,0.2)]' 
                        : 'bg-gradient-to-r from-[#0f1628]/80 to-[#111a2e]/80 backdrop-blur-sm border-[#e8d5a3]/15 hover:border-[#e8d5a3]/40 text-[#e8d5a3] hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(232,213,163,0.1)]'}
                  `}
              >
                  {isReady ? 'READY' : 'SKIP TO VOTE'}
              </button>
              
              <div className="mt-4 flex justify-between items-center px-2">
                  <span className="text-xs text-[#7eb8c9]/40 font-mono">PLAYERS READY</span>
                  <div className="flex gap-1">
                      {Array.from({ length: totalPlayers }).map((_, i) => (
                          <div 
                             key={i} 
                             className={`h-2 w-8 rounded-full transition-all duration-500 ${i < readyCount ? 'bg-[#c45d2c] shadow-[0_0_8px_rgba(196,93,44,0.6)]' : 'bg-[#111a2e]'}`}
                          ></div>
                      ))}
                  </div>
              </div>
          </div>

          <SeatingButton players={Object.values(game.players) as Player[]} />
      </div>
  );
};

export default DiscussionPage;
