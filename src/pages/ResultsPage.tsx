
import React, { useEffect, useState } from 'react';
import { GameState, Team, Player, RoleID } from '../types';
import { resetGame } from '../services/firestoreService';
import RoleCard from '../components/RoleCard';
import RoleIcon from '../components/RoleIcons';
import { useNavigate } from 'react-router-dom';
import { ROLE_METADATA } from '../constants';

interface Props {
  game: GameState;
  me: Player;
}

const ResultsPage: React.FC<Props> = ({ game, me }) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0); 
  // 0 = Initial, 1 = Win Reveal, 2 = Vote Reveal, 3 = Role Reveal, 4 = Logs/Votes
  const [expandedLogs, setExpandedLogs] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  useEffect(() => {
    // Reveal stages quickly so user is never blocked
    setStage(1);
    const t1 = setTimeout(() => setStage(2), 200);
    const t2 = setTimeout(() => setStage(3), 400);
    const t3 = setTimeout(() => setStage(4), 600);

    // If user starts scrolling or touches screen, immediately reveal everything
    const handleImmediateReveal = () => {
      setStage(4);
    };

    const handleScrollCheck = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      // Show scroll-to-bottom if not near the bottom and content is scrollable
      if (fullHeight > windowHeight + 100) {
        setShowScrollToBottom(scrollY + windowHeight < fullHeight - 120);
      } else {
        setShowScrollToBottom(false);
      }
    };

    window.addEventListener('scroll', handleImmediateReveal, { passive: true, once: true });
    window.addEventListener('touchstart', handleImmediateReveal, { passive: true, once: true });
    window.addEventListener('wheel', handleImmediateReveal, { passive: true, once: true });
    window.addEventListener('scroll', handleScrollCheck, { passive: true });
    window.addEventListener('resize', handleScrollCheck, { passive: true });

    // Initial check after elements render
    const tCheck = setTimeout(handleScrollCheck, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tCheck);
      window.removeEventListener('scroll', handleImmediateReveal);
      window.removeEventListener('touchstart', handleImmediateReveal);
      window.removeEventListener('wheel', handleImmediateReveal);
      window.removeEventListener('scroll', handleScrollCheck);
      window.removeEventListener('resize', handleScrollCheck);
    };
  }, []);

  const handleReset = async () => {
      await resetGame(game.id);
  };

  const handleLeave = () => {
      navigate('/');
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const players = Object.values(game.players) as Player[];
  const eliminated = game.eliminatedIds || [];

  // Determine Winners/Losers
  const { winners, losers } = (() => {
      const w: Player[] = [];
      const l: Player[] = [];

      players.forEach(p => {
          let won = false;
          const meta = ROLE_METADATA[p.currentRole];
          let pTeam = meta.team;
          
          // Squire is always evil team
          if (p.currentRole === RoleID.SQUIRE) {
             pTeam = Team.EVIL;
          }

          // Cursed conversion: if originalRole was CURSED but currentRole changed, use current team
          if (p.originalRole === RoleID.CURSED && p.currentRole !== RoleID.CURSED) {
             pTeam = ROLE_METADATA[p.currentRole].team;
          }

          // Nostradamus override
          if (p.originalRole === RoleID.NOSTRADAMUS && p.nostradamusRole) {
               const adoptedMeta = ROLE_METADATA[p.nostradamusRole];
               if (adoptedMeta.team === game.winningTeam) won = true;
          } 
          // Tanner override (Independent Win)
          else if (game.winningTeam === Team.INDEPENDENT) {
               if (p.currentRole === RoleID.TANNER || p.currentRole === RoleID.APPRENTICE_TANNER) {
                   won = true; 
               }
          }
          // Standard Team check
          else if (pTeam === game.winningTeam) {
              won = true;
          }

          // Apprentice Tanner override (additive — wins if Tanner dies, or if no Tanner and self dies)
          if (p.currentRole === RoleID.APPRENTICE_TANNER) {
              const tannerExists = players.some(pl => pl.currentRole === RoleID.TANNER);
              const tannerDied = eliminated.some(id => game.players[id]?.currentRole === RoleID.TANNER);
              const selfDied = eliminated.includes(p.id);
              if (tannerExists && tannerDied) {
                  won = true;
              } else if (!tannerExists && selfDied) {
                  won = true;
              } else {
                  won = false;
              }
          }

          // Mortician override (additive — can win alongside any team)
          if (p.currentRole === RoleID.MORTICIAN) {
              const morticianSurvived = !eliminated.includes(p.id);
              const sortedBySeats = players.filter(pl => pl.seatId !== null && pl.seatId !== undefined).sort((a, b) => a.seatId! - b.seatId!);
              const mortIdx = sortedBySeats.findIndex(pl => pl.id === p.id);
              if (mortIdx !== -1 && sortedBySeats.length >= 2) {
                  const leftIdx = (mortIdx - 1 + sortedBySeats.length) % sortedBySeats.length;
                  const rightIdx = (mortIdx + 1) % sortedBySeats.length;
                  const neighborDied = eliminated.includes(sortedBySeats[leftIdx].id) || eliminated.includes(sortedBySeats[rightIdx].id);
                  won = won || (morticianSurvived && neighborDied);
              }
          }

          if (won) w.push(p);
          else l.push(p);
      });
      return { winners: w, losers: l };
  })();

  const getHeaderText = () => {
      if (game.winningTeam === Team.GOOD) return "GOOD TEAM WINS!";
      if (game.winningTeam === Team.EVIL) return "EVIL TEAM WINS!";
      if (game.winningTeam === Team.INDEPENDENT) return "INDEPENDENT WINS!";
      return "GAME OVER";
  }

  const headerText = getHeaderText();

  // Helper to render a list of players with cards
  const renderPlayerList = (list: Player[], delayStart: number) => {
      return (
         <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
             {list.map((p, i) => (
                 <div 
                   key={p.id} 
                   className="flex flex-col items-center animate-card-fade"
                   style={{ animationDelay: `${delayStart + (i * 40)}ms` }} 
                 >
                     <div className="relative group">
                        <RoleCard 
                            role={p.currentRole} 
                            revealed={true} 
                            size="md" 
                            className={`
                                shadow-[0_0_25px_rgba(0,0,0,0.6),0_0_50px_rgba(8,11,20,0.4)] transition-transform duration-200 hover:scale-105
                                ${eliminated.includes(p.id) ? 'grayscale opacity-70 ring-4 ring-red-600' : ''}
                            `} 
                        />
                        {eliminated.includes(p.id) && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <span className="text-red-600 font-black text-4xl sm:text-5xl -rotate-12 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] border-4 border-red-600 px-3 sm:px-4 py-1 rounded-xl bg-black/40 backdrop-blur-sm">DIED</span>
                            </div>
                        )}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 px-2 py-1 rounded text-xs whitespace-nowrap text-gray-300 pointer-events-none z-20 font-bold border border-white/10">
                            Started as: {ROLE_METADATA[p.originalRole]?.name}
                        </div>
                     </div>
                     <div className="mt-3 text-center">
                         <div className="font-black text-white text-base sm:text-lg leading-none tracking-wide drop-shadow-[0_0_8px_rgba(220,245,235,0.15)]">{p.name}</div>
                         <div className={`flex items-center justify-center gap-1.5 text-xs font-bold mt-1 uppercase tracking-wider
                            ${ROLE_METADATA[p.currentRole]?.team === Team.GOOD ? 'text-good' : 
                              ROLE_METADATA[p.currentRole]?.team === Team.EVIL ? 'text-evil' : 'text-independent'}
                         `}>
                             <RoleIcon role={p.currentRole} className="w-5 h-5 sm:w-6 sm:h-6" />
                             {ROLE_METADATA[p.currentRole]?.name}
                         </div>
                     </div>
                 </div>
             ))}
         </div>
      );
  }

  return (
      <div 
        className="w-full min-h-[100dvh] pt-20 sm:pt-16 relative flex flex-col items-center p-4 sm:p-6 overflow-x-hidden"
        style={{ 
          background: 'linear-gradient(160deg, #090614 0%, #0d1228 30%, #12082a 60%, #090614 100%)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
          
          <div className={`fixed inset-0 pointer-events-none -z-10 transition-opacity duration-700 ${stage >= 1 ? 'opacity-40' : 'opacity-0'}
             ${game.winningTeam === Team.GOOD ? 'bg-gradient-to-br from-[#0a2a3a] via-[#090614] to-[#0d1a30]' : 
               game.winningTeam === Team.EVIL ? 'bg-gradient-to-br from-[#2a0515] via-[#090614] to-[#1a0820]' : 
               'bg-gradient-to-br from-[#2a1f08] via-[#090614] to-[#1a122e]'}
          `}></div>

          <div className="fixed inset-0 pointer-events-none opacity-[0.04] -z-10 animate-mist"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(120,100,200,0.2), transparent 70%)' }}
          ></div>
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10 animate-fog"
            style={{ background: 'radial-gradient(ellipse at 70% 60%, rgba(90,70,180,0.15), transparent 60%)' }}
          ></div>

          <div className={`relative z-10 transition-all duration-400 transform
               ${stage >= 1 ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}
               mt-6 sm:mt-8 mb-6 sm:mb-8 text-center px-2
          `}>
              <h1 className={`text-4xl sm:text-6xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b tracking-wide
                 ${game.winningTeam === Team.GOOD ? 'from-good to-[#4a8a9a]' : 
                   game.winningTeam === Team.EVIL ? 'from-evil to-[#6a1010]' : 'from-independent to-[#a07820]'}
              `}
                style={{ 
                  filter: 'drop-shadow(0 0 40px rgba(220,245,235,0.25)) drop-shadow(0 0 80px rgba(18,184,134,0.15))',
                  textShadow: '0 0 60px rgba(220,245,235,0.2)'
                }}
              >
                  {headerText}
              </h1>
              <p className="text-moon/50 text-xs sm:text-sm font-bold uppercase tracking-[0.4em] sm:tracking-[0.5em] mt-2 animate-pulse drop-shadow-[0_0_10px_rgba(220,245,235,0.1)]">
                  {game.winner?.replace(/!.*$/, '')}
              </p>
          </div>

          {stage >= 2 && eliminated.length > 0 && (
              <div className="relative z-10 mb-8 sm:mb-10 animate-fade-in-up">
                  <div className="bg-[#1a122e]/70 border border-evil/30 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-3 sm:gap-4 shadow-[0_0_25px_rgba(139,17,59,0.25)] backdrop-blur-md">
                      <span className="text-evil font-bold text-xs sm:text-sm uppercase tracking-wider drop-shadow-[0_0_6px_rgba(185,28,28,0.4)]">Eliminated:</span>
                      <div className="flex flex-wrap gap-2">
                          {eliminated.map(id => (
                              <span key={id} className="text-white font-bold bg-evil/80 px-2.5 sm:px-3 py-0.5 rounded-md text-xs sm:text-sm shadow-[0_0_10px_rgba(185,28,28,0.3)]">
                                  {game.players[id]?.name || 'Player'}
                              </span>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {stage >= 3 && (
              <div className="relative z-10 w-full max-w-6xl flex flex-col gap-10 sm:gap-12 mb-12 sm:mb-16 animate-fade-in">
                   
                   {winners.length > 0 && (
                       <div className="flex flex-col items-center">
                           <h2 className="text-3xl sm:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-moon to-primary mb-6 sm:mb-8 tracking-widest"
                             style={{ filter: 'drop-shadow(0 0 20px rgba(220,245,235,0.2))' }}
                           >
                               WINNERS 👑
                           </h2>
                           {renderPlayerList(winners, 0)}
                       </div>
                   )}

                   {losers.length > 0 && (
                       <div className="flex flex-col items-center opacity-85">
                           <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-400 mb-6 sm:mb-8 tracking-widest mt-6 sm:mt-8 drop-shadow-[0_0_10px_rgba(100,100,120,0.15)]">
                               LOSERS 💀
                           </h2>
                           {renderPlayerList(losers, 40)} 
                       </div>
                   )}

              </div>
          )}

          {stage >= 4 && (
              <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in-up mb-12">
                  
                  {/* Vote History: Clean chip grid, NO nested scroll trap */}
                  <div className="w-full rounded-2xl p-4 sm:p-5 backdrop-blur-md"
                    style={{
                      background: 'rgba(26, 18, 46, 0.55)',
                      border: '1px solid rgba(220, 245, 235, 0.12)',
                      boxShadow: '0 4px 30px rgba(0,0,0,0.4), 0 0 20px rgba(220,245,235,0.04), inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}
                  >
                        <h3 className="text-white/80 text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            🗳️ Vote Breakdown
                        </h3>
                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs text-white/90">
                            {players.filter(p => p.votedFor).map((p) => {
                                const target = game.players[p.votedFor!];
                                return (
                                    <div 
                                      key={p.id} 
                                      className="inline-flex items-center gap-1.5 bg-black/30 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                                    >
                                        <span className="text-white font-bold">{p.name}</span>
                                        <span className="text-white/40">→</span>
                                        <span className="text-evil font-bold">{target ? target.name : 'Unknown'}</span>
                                    </div>
                                );
                            })}
                            {players.filter(p => p.votedFor).length === 0 && (
                              <div className="text-white/50 text-xs italic py-1">No recorded votes.</div>
                            )}
                        </div>
                  </div>

                  {/* Night Phase Log: Fluid readable layout, NO nested scroll trap */}
                  <div className="w-full max-w-2xl rounded-2xl p-5 sm:p-6 backdrop-blur-md"
                    style={{
                      background: 'rgba(12, 8, 24, 0.75)',
                      border: '1px solid rgba(220, 245, 235, 0.1)',
                      boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 25px rgba(220,245,235,0.03), inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}
                  >
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="text-white/80 font-bold uppercase tracking-widest text-xs">
                              Night Phase Log
                          </h3>
                          {game.logs.length > 0 && (
                            <span className="text-[10px] text-white/50 font-mono">
                              {game.logs.length} events
                            </span>
                          )}
                      </div>
                      <div className="space-y-1.5">
                          {game.logs.length > 0 ? (
                              (expandedLogs ? game.logs : game.logs.slice(0, 8)).map((log, i) => (
                                  <div key={i} className="text-xs text-white/90 font-mono border-l-2 border-primary/40 pl-3 py-1 bg-white/[0.02] rounded-r">
                                      {log}
                                  </div>
                              ))
                          ) : (
                              <div className="text-white/50 italic text-xs">No actions taken.</div>
                          )}
                          {game.logs.length > 8 && (
                            <div className="pt-2 text-center">
                              <button 
                                onClick={() => setExpandedLogs(!expandedLogs)}
                                className="text-xs text-primary font-bold hover:underline px-3 py-1 rounded bg-primary/10 border border-primary/20 transition-colors"
                              >
                                {expandedLogs ? 'Show Less Logs ▲' : `Show all ${game.logs.length} logs ▼`}
                              </button>
                            </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          <div id="results-actions" className="relative z-20 mt-4 flex flex-col md:flex-row gap-4 mb-16">
              {me.isHost && (
                 <button 
                   onClick={handleReset}
                   className="px-10 py-4 text-white font-black text-xl rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                   style={{
                     background: 'linear-gradient(135deg, #12b886 0%, #20c997 50%, #12b886 100%)',
                     boxShadow: '0 0 25px rgba(18,184,134,0.4), 0 0 50px rgba(18,184,134,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                     border: '1px solid rgba(220,245,235,0.2)'
                   }}
                 >
                   NEXT GAME
                 </button>
              )}
              <button 
                 onClick={handleLeave}
                 className="px-8 py-4 font-bold rounded-2xl transition-all hover:scale-105 backdrop-blur-md cursor-pointer"
                 style={{
                   background: 'rgba(19, 14, 38, 0.7)',
                   color: 'rgba(220, 245, 235, 0.7)',
                   border: '1px solid rgba(220, 245, 235, 0.1)',
                   boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
                 }}
              >
                 LEAVE ROOM
              </button>
          </div>

          {/* Quick Glide to Bottom Floating Button */}
          {showScrollToBottom && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-5 right-5 z-40 bg-[#130e26]/90 border border-primary/50 text-moon px-4 py-2.5 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(18,184,134,0.25)] backdrop-blur-md flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-black transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Scroll to Next Game / Bottom"
            >
              <span>{me.isHost ? '🎮 Next Game' : 'To Bottom'}</span>
              <span className="text-primary font-black text-sm">↓</span>
            </button>
          )}
          
          <style>{`
            @keyframes card-fade-up {
                0% { transform: translateY(14px) scale(0.96); opacity: 0; }
                100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .animate-card-fade {
                animation: card-fade-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                opacity: 0;
            }
          `}</style>
      </div>
  );
};

export default ResultsPage;
