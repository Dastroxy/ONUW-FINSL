
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

  useEffect(() => {
    // Stage 1: Win Reveal (Immediate)
    setStage(1);
    
    // Stage 2: Vote Results (Fast - 0.5s)
    const t1 = setTimeout(() => setStage(2), 500);
    
    // Stage 3: Role Reveal (Fast - 0.8s)
    const t2 = setTimeout(() => setStage(3), 800);

    // Stage 4: Logs & History (Fast - 1.2s)
    const t3 = setTimeout(() => setStage(4), 1200);

    return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
    };
  }, []);

  const handleReset = async () => {
      await resetGame(game.id);
  };

  const handleLeave = () => {
      navigate('/');
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
         <div className="flex flex-wrap justify-center gap-6">
             {list.map((p, i) => (
                 <div 
                   key={p.id} 
                   className="flex flex-col items-center animate-flip-in"
                   style={{ animationDelay: `${delayStart + (i * 50)}ms` }} 
                 >
                     <div className="relative group perspective-1000">
                        <RoleCard 
                            role={p.currentRole} 
                            revealed={true} 
                            size="md" 
                            className={`
                                shadow-[0_0_25px_rgba(0,0,0,0.6),0_0_50px_rgba(8,11,20,0.4)] transition-transform duration-200 hover:scale-105 hover:rotate-1
                                ${eliminated.includes(p.id) ? 'grayscale opacity-70 ring-4 ring-red-600' : ''}
                            `} 
                        />
                        {eliminated.includes(p.id) && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <span className="text-red-600 font-black text-5xl -rotate-12 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] border-4 border-red-600 px-4 py-1 rounded-xl bg-black/30 backdrop-blur-sm">DIED</span>
                            </div>
                        )}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap text-gray-300 pointer-events-none z-20 font-bold">
                            Started as: {ROLE_METADATA[p.originalRole]?.name}
                        </div>
                     </div>
                     <div className="mt-3 text-center">
                         <div className="font-black text-white text-lg leading-none tracking-wide drop-shadow-[0_0_8px_rgba(232,213,163,0.15)]">{p.name}</div>
                         <div className={`flex items-center justify-center gap-1.5 text-xs font-bold mt-1 uppercase tracking-wider
                            ${ROLE_METADATA[p.currentRole]?.team === Team.GOOD ? 'text-good' : 
                              ROLE_METADATA[p.currentRole]?.team === Team.EVIL ? 'text-evil' : 'text-independent'}
                         `}>
                             <RoleIcon role={p.currentRole} className="w-5 h-5" />
                             {ROLE_METADATA[p.currentRole]?.name}
                         </div>
                     </div>
                 </div>
             ))}
         </div>
      );
  }

  return (
      <div className="min-h-screen relative flex flex-col items-center p-6 overflow-y-auto overflow-x-hidden"
        style={{ background: 'linear-gradient(160deg, #080b14 0%, #0d1228 30%, #12082a 60%, #080b14 100%)' }}
      >
          
          <div className={`absolute inset-0 transition-opacity duration-1000 fixed ${stage >= 1 ? 'opacity-40' : 'opacity-0'}
             ${game.winningTeam === Team.GOOD ? 'bg-gradient-to-br from-[#0a2a3a] via-[#080b14] to-[#0d1a30]' : 
               game.winningTeam === Team.EVIL ? 'bg-gradient-to-br from-[#2a0515] via-[#080b14] to-[#1a0820]' : 
               'bg-gradient-to-br from-[#2a1f08] via-[#080b14] to-[#1a1530]'}
          `}></div>

          <div className={`absolute inset-0 opacity-[0.04] pointer-events-none animate-mist`}
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(120,100,200,0.2), transparent 70%)' }}
          ></div>
          <div className={`absolute inset-0 opacity-[0.03] pointer-events-none animate-fog`}
            style={{ background: 'radial-gradient(ellipse at 70% 60%, rgba(90,70,180,0.15), transparent 60%)' }}
          ></div>

          <div className={`relative z-10 transition-all duration-500 transform
               ${stage >= 1 ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}
               mt-8 mb-8 text-center
          `}>
              <h1 className={`text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b tracking-wide
                 ${game.winningTeam === Team.GOOD ? 'from-good to-[#4a8a9a]' : 
                   game.winningTeam === Team.EVIL ? 'from-evil to-[#6a1010]' : 'from-independent to-[#a07820]'}
              `}
                style={{ 
                  filter: 'drop-shadow(0 0 40px rgba(232,213,163,0.25)) drop-shadow(0 0 80px rgba(196,93,44,0.15))',
                  textShadow: '0 0 60px rgba(232,213,163,0.2)'
                }}
              >
                  {headerText}
              </h1>
              <p className="text-moon/50 text-sm font-bold uppercase tracking-[0.5em] mt-2 animate-pulse drop-shadow-[0_0_10px_rgba(232,213,163,0.1)]">
                  {game.winner?.replace(/!.*$/, '')}
              </p>
          </div>

          {stage >= 2 && eliminated.length > 0 && (
              <div className="relative z-10 mb-10 animate-fade-in-up">
                  <div className="bg-[#1a1530]/60 border border-evil/30 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_25px_rgba(139,26,26,0.25),0_0_50px_rgba(90,70,180,0.1)] backdrop-blur-md">
                      <span className="text-evil font-bold text-sm uppercase tracking-wider drop-shadow-[0_0_6px_rgba(185,28,28,0.4)]">Eliminated:</span>
                      <div className="flex gap-2">
                          {eliminated.map(id => (
                              <span key={id} className="text-white font-bold bg-evil/80 px-3 py-0.5 rounded-md text-sm shadow-[0_0_10px_rgba(185,28,28,0.3)]">
                                  {game.players[id].name}
                              </span>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {stage >= 3 && (
              <div className="relative z-10 w-full max-w-6xl flex flex-col gap-12 mb-16 animate-fade-in">
                   
                   {winners.length > 0 && (
                       <div className="flex flex-col items-center">
                           <h2 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-moon to-primary mb-8 tracking-widest"
                             style={{ filter: 'drop-shadow(0 0 20px rgba(232,213,163,0.2))' }}
                           >
                               WINNERS 👑
                           </h2>
                           {renderPlayerList(winners, 0)}
                       </div>
                   )}

                   {losers.length > 0 && (
                       <div className="flex flex-col items-center opacity-80 scale-95">
                           <h2 className="text-3xl font-display font-black text-gray-500 mb-8 tracking-widest mt-8 drop-shadow-[0_0_10px_rgba(100,100,120,0.15)]">
                               LOSERS 💀
                           </h2>
                           {renderPlayerList(losers, 50)} 
                       </div>
                   )}

              </div>
          )}

          {stage >= 4 && (
              <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in-up mb-12">
                  
                  <div className="w-full rounded-xl p-4 backdrop-blur-md"
                    style={{
                      background: 'rgba(26, 21, 48, 0.5)',
                      border: '1px solid rgba(232, 213, 163, 0.12)',
                      boxShadow: '0 4px 30px rgba(0,0,0,0.4), 0 0 20px rgba(232,213,163,0.04), inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}
                  >
                        <h3 className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            🗳️ Vote History
                        </h3>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-xs text-white/90 max-h-24 overflow-y-auto custom-scrollbar">
                            {players.filter(p => p.votedFor).map((p, i, arr) => {
                                const target = game.players[p.votedFor!];
                                const isLast = i === arr.length - 1;
                                return (
                                    <span key={p.id} className="whitespace-nowrap mb-1">
                                        <span className="text-white font-bold">{p.name}</span>
                                        <span className="mx-1 text-white/50">→</span>
                                        <span className="text-evil">{target ? target.name : 'Unknown'}</span>
                                        {!isLast && <span className="ml-6 text-white/30 hidden sm:inline">|</span>}
                                    </span>
                                );
                            })}
                        </div>
                  </div>

                  <div className="w-full max-w-2xl rounded-2xl p-6 backdrop-blur-md"
                    style={{
                      background: 'rgba(17, 26, 46, 0.7)',
                      border: '1px solid rgba(232, 213, 163, 0.1)',
                      boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 25px rgba(232,213,163,0.03), inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}
                  >
                      <h3 className="text-white/80 font-bold uppercase tracking-widest mb-4 flex justify-between text-xs">
                          <span>Night Phase Log</span>
                      </h3>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                          {game.logs.length > 0 ? game.logs.map((log, i) => (
                              <div key={i} className="text-xs text-white/90 font-mono border-l-2 border-primary/30 pl-3 py-0.5">
                                  {log}
                              </div>
                          )) : <div className="text-white/50 italic text-xs">No actions taken.</div>}
                      </div>
                  </div>
              </div>
          )}

          <div className="relative z-20 mt-4 flex flex-col md:flex-row gap-4 mb-8">
              {me.isHost && (
                 <button 
                   onClick={handleReset}
                   className="px-10 py-4 text-white font-black text-xl rounded-2xl transition-all hover:scale-105 active:scale-95"
                   style={{
                     background: 'linear-gradient(135deg, #c45d2c 0%, #d4783f 50%, #c45d2c 100%)',
                     boxShadow: '0 0 25px rgba(196,93,44,0.4), 0 0 50px rgba(196,93,44,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                     border: '1px solid rgba(232,213,163,0.2)'
                   }}
                 >
                   NEXT GAME
                 </button>
              )}
              <button 
                 onClick={handleLeave}
                 className="px-8 py-4 font-bold rounded-2xl transition-all hover:scale-105 backdrop-blur-md"
                 style={{
                   background: 'rgba(15, 22, 40, 0.7)',
                   color: 'rgba(232, 213, 163, 0.5)',
                   border: '1px solid rgba(232, 213, 163, 0.1)',
                   boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
                 }}
              >
                 LEAVE ROOM
              </button>
          </div>
          
          <style>{`
            @keyframes flip-in {
                0% { transform: perspective(1000px) rotateY(90deg) scale(0.9); opacity: 0; }
                100% { transform: perspective(1000px) rotateY(0) scale(1); opacity: 1; }
            }
            .animate-flip-in {
                animation: flip-in 0.2s ease-out forwards;
                opacity: 0; 
                transform-style: preserve-3d;
            }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(232,213,163,0.15); border-radius: 10px; }
          `}</style>
      </div>
  );
};

export default ResultsPage;
