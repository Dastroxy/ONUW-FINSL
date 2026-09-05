
import React, { useState } from 'react';
import { GameState, Player } from '../types';
import { submitVote, finalizeGame } from '../services/firestoreService';
import SeatingButton from '../components/SeatingButton';

interface Props {
  game: GameState;
  me: Player;
}

const VotingPage: React.FC<Props> = ({ game, me }) => {
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  
  const handleVote = async () => {
     if (!voteTarget) return;
     await submitVote(game.id, me.id, voteTarget);
  };
  
  const players = Object.values(game.players) as Player[];
  const totalPlayers = players.length;
  // Calculate how many people have locked in their vote
  const votesCast = players.filter(p => p.votedFor).length;
  const allVoted = votesCast === totalPlayers;
  
  const handleFinish = async () => {
      await finalizeGame(game.id);
  }

  // Generate background particles
  const particles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5
  }));

  return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#090614] via-[#130e26] to-[#0d0818] overflow-hidden">
          <style>{`
            @keyframes float-particle {
                0% { transform: translateY(110vh) scale(0) rotate(0deg); opacity: 0; }
                30% { opacity: 0.2; }
                70% { opacity: 0.1; }
                100% { transform: translateY(-10vh) scale(1) rotate(180deg); opacity: 0; }
            }
            .glass-card {
                background: rgba(19, 14, 38, 0.7);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(220, 245, 235, 0.12);
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
                transform: translateZ(0);
                will-change: transform, backdrop-filter;
            }
            .glass-btn {
                background: rgba(19, 14, 38, 0.6);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(220, 245, 235, 0.1);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
                transform: translateZ(0);
                will-change: transform, box-shadow;
            }
            .glass-btn:hover:not(:disabled) {
                background: rgba(100, 80, 180, 0.1);
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(220, 245, 235, 0.08);
                border-color: rgba(220, 245, 235, 0.25);
            }
            .glass-btn:active:not(:disabled) {
                transform: scale(0.95);
            }
            .pulse-badge {
                animation: pulse-amber 2s infinite;
            }
            @keyframes pulse-amber {
                0% { box-shadow: 0 0 0 0 rgba(220, 245, 235, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(220, 245, 235, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 245, 235, 0); }
            }
          `}</style>
          
          {/* Particles */}
          {particles.map(p => (
              <div 
                key={p.id}
                className="absolute w-2 h-2 rounded-full pointer-events-none blur-[1px]"
                style={{
                    left: `${p.left}%`,
                    background: p.id % 3 === 0 ? 'rgba(18,184,134,0.12)' : p.id % 3 === 1 ? 'rgba(100,80,180,0.15)' : 'rgba(220,245,235,0.1)',
                    animation: `float-particle ${p.duration}s infinite linear`,
                    animationDelay: `${p.delay}s`
                }}
              />
          ))}

          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
              <h1 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-2 tracking-widest" style={{ filter: 'drop-shadow(0 0 12px rgba(18,184,134,0.4))' }}>
                  CAST YOUR VOTE
              </h1>
              <p className="text-moon/50 mb-8 font-medium tracking-wide">Select a player to eliminate</p>
              
              {/* Vote Counter Badge */}
              <div className={`
                 mb-8 px-5 py-1.5 rounded-full text-xs font-bold border transition-colors duration-500 tracking-wider
                 ${allVoted ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-primary/10 border-[#dcf5eb]/30 text-primary-light pulse-badge'}
              `}>
                  {votesCast} / {totalPlayers} VOTES LOCKED
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full px-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {players.map(p => {
                      if (p.id === me.id) return null; // Cannot vote self
                      const isSelected = voteTarget === p.id;
                      
                      return (
                          <button
                            key={p.id}
                            onClick={() => !me.votedFor && setVoteTarget(p.id)}
                            disabled={!!me.votedFor}
                            className={`
                               glass-btn relative p-4 rounded-2xl flex flex-col items-center justify-center gap-3 group
                               ${isSelected ? 'ring-2 ring-[#dcf5eb] bg-[#dcf5eb]/10 !transform-none !border-[#dcf5eb]/50 shadow-[0_0_25px_rgba(220,245,235,0.15)]' : ''}
                               ${me.votedFor && !isSelected ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                            `}
                          >
                              {/* Avatar Circle */}
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors duration-300 overflow-hidden
                                ${isSelected ? 'bg-primary text-white shadow-[0_0_20px_rgba(18,184,134,0.4)] ring-2 ring-[#dcf5eb]/40' : 'bg-forest text-moon/50 group-hover:bg-bark group-hover:text-moon'}
                              `}>
                                 {p.icon && p.icon.includes('/') ? (
                                   <img src={p.icon} alt={p.name} className="w-full h-full object-cover" />
                                 ) : (
                                   <span className={p.icon ? 'text-2xl' : 'text-lg'}>{p.icon || p.name.charAt(0).toUpperCase()}</span>
                                 )}
                              </div>
                              
                              <span className={`font-bold transition-colors text-sm ${isSelected ? 'text-[#dcf5eb]' : 'text-moon/60 group-hover:text-moon'}`}>
                                  {p.name}
                              </span>

                              {/* Selection Indicator */}
                              {isSelected && (
                                  <div className="absolute top-2 right-2 w-3 h-3 bg-[#dcf5eb] rounded-full shadow-[0_0_10px_rgba(220,245,235,0.6)] animate-bounce"></div>
                              )}
                          </button>
                      );
                  })}
              </div>

              <div className="mt-10 w-full max-w-sm px-4">
                  {me.votedFor ? (
                      <div className="glass-card p-6 rounded-2xl text-center border-[#dcf5eb]/20 bg-[#dcf5eb]/5">
                          <div className="text-[#dcf5eb] font-black text-2xl mb-1 animate-pulse" style={{ textShadow: '0 0 15px rgba(220,245,235,0.4)' }}>VOTE LOCKED</div>
                          <div className="text-[10px] text-moon/40 uppercase tracking-widest font-bold">Waiting for other players...</div>
                      </div>
                  ) : (
                      <button
                        disabled={!voteTarget}
                        onClick={handleVote}
                        className={`
                          w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all duration-300 relative overflow-hidden
                          ${voteTarget 
                              ? 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_30px_rgba(18,184,134,0.3),0_0_15px_rgba(220,245,235,0.1)] hover:scale-[1.02] active:scale-95 border border-[#dcf5eb]/20' 
                              : 'bg-forest/50 text-moon/30 cursor-not-allowed border border-[#dcf5eb]/5'}
                        `}
                      >
                        <span className="relative z-10">LOCK VOTE</span>
                        {voteTarget && <div className="absolute inset-0 bg-white/20 transform -translate-x-full hover:translate-x-full transition-transform duration-500"></div>}
                      </button>
                  )}
              </div>

              {me.isHost && allVoted && (
                 <button 
                   onClick={handleFinish} 
                   className="mt-8 px-8 py-2.5 rounded-full bg-[#dcf5eb]/10 hover:bg-[#dcf5eb]/20 text-[#dcf5eb] text-xs font-bold uppercase tracking-widest border border-[#dcf5eb]/20 transition-all hover:text-moon hover:border-[#dcf5eb]/40 hover:shadow-[0_0_20px_rgba(220,245,235,0.15)] hover:scale-105"
                 >
                   Reveal Results
                 </button>
              )}
          </div>
          <SeatingButton players={Object.values(game.players) as Player[]} />
      </div>
  );
};

export default VotingPage;
