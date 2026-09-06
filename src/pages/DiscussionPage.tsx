
import React, { useEffect, useState } from 'react';
import { GameState, Player, RoleID, Team, sortPlayersStably } from '../types';
import { toggleDiscussionReady, advanceToVoting } from '../services/firestoreService';
import RoleCard from '../components/RoleCard';
import RoleIcon from '../components/RoleIcons';
import RolesInfoButton from '../components/RolesInfoButton';
import SeatingButton from '../components/SeatingButton';
import { ROLE_METADATA } from '../constants';
import { ARTIFACT_METADATA, ArtifactID } from '../constants/artifacts';
import ArtifactsInfoModal from '../components/ArtifactsInfoModal';

interface Props {
  game: GameState;
  me: Player;
}

const DiscussionPage: React.FC<Props> = ({ game, me }) => {
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [showArtifactModal, setShowArtifactModal] = useState<boolean>(false);
  const [selectedArtifactForModal, setSelectedArtifactForModal] = useState<string | null>(null);
  
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
  const allPlayers = sortPlayersStably(Object.values(game.players) as Player[]);
  const revealedPlayers = allPlayers.filter(p => p.isRevealed);
  const playersWithArtifact = allPlayers.filter(p => !!p.artifact);
  const myArtifact = me.artifact as ArtifactID | undefined;
  const myArtifactMeta = myArtifact ? ARTIFACT_METADATA[myArtifact] : null;
  const myRoleMeta = ROLE_METADATA[me.currentRole];

  // Particle generation
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 10
  }));

  return (
      <div className="min-h-[100dvh] pt-20 sm:pt-16 relative flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#090614] via-[#130e26] to-[#0d0818]">
          
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(100,80,180,0.2) 0%, rgba(60,40,140,0.12) 40%, rgba(18,184,134,0.06) 70%, transparent 100%)', animation: 'dawn-glow 8s ease-in-out infinite' }}></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[300px] h-[300px] bg-[#6050b0]/10 rounded-full blur-[80px] pointer-events-none"></div>

          {/* Mist Particles */}
          {particles.map(p => (
            <div 
              key={p.id}
              className="absolute w-1 h-1 rounded-full pointer-events-none"
              style={{
                left: `${p.left}%`,
                background: p.id % 3 === 0 ? 'rgba(18,184,134,0.5)' : p.id % 3 === 1 ? 'rgba(100,80,180,0.5)' : 'rgba(220,245,235,0.4)',
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
                   text-7xl font-mono font-bold text-[#dcf5eb] transition-all
                   ${timeLeft < 10 ? 'text-[#b91c1c] animate-pulse' : ''}
                `}
                style={{ animation: timeLeft > 0 ? 'tick 1s infinite' : 'none', textShadow: timeLeft < 10 ? '0 0 20px rgba(185,28,28,0.6)' : '0 0 20px rgba(220,245,235,0.4), 0 0 40px rgba(18,184,134,0.2)' }}
              >
                  {formatTime(timeLeft)}
              </div>
              <p className="text-[#7eb8c9]/50 text-sm mt-2 uppercase tracking-widest">Until Voting</p>
          </div>
          
          {/* NOSTRADAMUS ANNOUNCEMENT */}
          {game.nostradamusAnnouncement && (
              <div className="relative z-20 mt-6 animate-bounce">
                  <div className="bg-[#130e26]/90 border-2 border-[#1a122e] px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(100,80,180,0.3),0_0_10px_rgba(220,245,235,0.1)] text-center">
                      <h3 className="text-[#7eb8c9] text-xs font-display font-bold uppercase tracking-widest mb-1">Public Announcement</h3>
                      <p className="text-[#dcf5eb] font-bold text-base sm:text-lg">{game.nostradamusAnnouncement}</p>
                  </div>
              </div>
          )}

          {/* CURATOR ARTIFACT TOKEN - PERSONAL NOTIFICATION */}
          {myArtifact && myArtifactMeta && (
              <div className="relative z-20 mt-6 w-full max-w-xl animate-fade-in px-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] text-center relative backdrop-blur-md">
                      <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-2xl">{myArtifactMeta.icon}</span>
                          <h3 className="text-amber-300 text-sm font-display font-black uppercase tracking-wider">
                              Curator Placed An Artifact On You!
                          </h3>
                          <button
                              type="button"
                              onClick={() => { setSelectedArtifactForModal(myArtifact); setShowArtifactModal(true); }}
                              className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-bold hover:scale-110 ml-1"
                              title="Artifact details"
                          >
                              i
                          </button>
                      </div>

                      <div className="text-white font-bold text-base sm:text-lg mb-1">
                          {myArtifactMeta.name}
                      </div>

                      {myArtifact === ArtifactID.MASK_OF_MUTING ? (
                          <p className="text-red-300 text-xs sm:text-sm font-semibold bg-red-950/60 py-1.5 px-3 rounded-lg border border-red-500/40 inline-block">
                              🤐 You are Muted! You cannot speak, whisper, or make noise during this discussion phase.
                          </p>
                      ) : myArtifact === ArtifactID.VOID_OF_NOTHINGNESS ? (
                          <p className="text-amber-200/80 text-xs sm:text-sm">
                              The void has no effect on you.
                          </p>
                      ) : myArtifact === ArtifactID.DAGGER_OF_THE_TRAITOR ? (
                          <p className="text-red-400 text-xs sm:text-sm font-semibold">
                              🗡️ You are a Traitor! You win ONLY if a member of your team is eliminated.
                          </p>
                      ) : (
                          <p className="text-amber-200 text-xs sm:text-sm">
                              Your role has changed! You are now on team <span className="font-bold uppercase text-white">{myRoleMeta?.team}</span> as <span className="font-bold text-amber-300">{myRoleMeta?.name}</span>.
                          </p>
                      )}
                  </div>
              </div>
          )}

          {/* ARTIFACT TOKENS ON CARDS (Visible to all, identity hidden except for owner) */}
          {playersWithArtifact.length > 0 && (
              <div className="relative z-20 mt-6 w-full max-w-xl flex flex-col items-center animate-fade-in-up px-2">
                  <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🏺</span>
                      <h3 className="text-amber-300 font-bold text-xs uppercase tracking-widest">
                          Artifact Tokens on Cards
                      </h3>
                      <button
                          type="button"
                          onClick={() => { setSelectedArtifactForModal(null); setShowArtifactModal(true); }}
                          className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-bold hover:scale-110 transition-transform ml-1"
                          title="View all artifact token rules"
                      >
                          i
                      </button>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 w-full">
                      {playersWithArtifact.map(p => {
                          const isOwner = p.id === me.id;
                          const artId = p.artifact as ArtifactID;
                          const meta = ARTIFACT_METADATA[artId];

                          return (
                              <div
                                  key={p.id}
                                  className={`
                                      relative p-3 rounded-xl border flex items-center gap-3 backdrop-blur-md transition-all
                                      ${isOwner 
                                          ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40' 
                                          : 'bg-[#130e26]/80 border-amber-500/30 shadow-[0_0_10px_rgba(0,0,0,0.5)]'}
                                  `}
                              >
                                  <div className="relative">
                                      <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-400/50 flex items-center justify-center font-bold text-amber-200 text-sm overflow-hidden">
                                          {p.icon && p.icon.includes('/') ? (
                                              <img src={p.icon} alt={p.name} className="w-full h-full object-cover" />
                                          ) : (
                                              <span>{p.icon || p.name.charAt(0).toUpperCase()}</span>
                                          )}
                                      </div>
                                      <span className="absolute -bottom-1 -right-1 text-sm drop-shadow">🏺</span>
                                  </div>

                                  <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                          <span className="text-white font-bold text-sm">
                                              {p.name} {isOwner && <span className="text-amber-300 text-xs font-semibold">(You)</span>}
                                          </span>
                                      </div>

                                      {isOwner ? (
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                              <span className="text-sm">{meta?.icon}</span>
                                              <span className="text-xs font-bold text-amber-200">
                                                  {meta?.name}
                                              </span>
                                              <button
                                                  type="button"
                                                  onClick={() => {
                                                      setSelectedArtifactForModal(artId);
                                                      setShowArtifactModal(true);
                                                  }}
                                                  className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] font-bold hover:scale-110 ml-0.5"
                                                  title="View Token Details"
                                              >
                                                  i
                                              </button>
                                          </div>
                                      ) : (
                                          <span className="text-xs text-amber-200/60 font-mono mt-0.5">
                                              Mystery Artifact Attached
                                          </span>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* REVEALED PLAYERS (Revealer/Exposer) */}
          {revealedPlayers.length > 0 && (
              <div className="relative z-20 mt-6 w-full max-w-2xl flex flex-col items-center animate-fade-in-up">
                  <h3 className="text-[#12b886] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-[#12b886] animate-pulse"></span>
                     Revealed Players
                     <span className="w-2 h-2 rounded-full bg-[#12b886] animate-pulse"></span>
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-4 sm:p-6">
                      {revealedPlayers.map(p => {
                          const meta = ROLE_METADATA[p.currentRole];
                          return (
                              <div key={p.id} className="flex flex-col items-center">
                                  <div className="relative">
                                      <RoleCard role={p.currentRole} revealed={true} size="sm" className="shadow-[0_0_20px_rgba(18,184,134,0.4)] ring-2 ring-[#12b886]" />
                                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#12b886] text-black font-bold rounded-full flex items-center justify-center text-xs animate-bounce">!</div>
                                  </div>
                                  <div className="mt-2 text-center">
                                      <span className="block text-[#dcf5eb] font-bold text-sm">{p.name}</span>
                                      <span className="block text-[10px] text-[#12b886] uppercase tracking-wide">is {meta.name}</span>
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
                            className={isExposed ? 'shadow-[0_0_20px_rgba(18,184,134,0.4)] ring-2 ring-[#12b886]' : 'shadow-[0_0_20px_rgba(0,0,0,0.5)] border-[#0c0818]/50'}
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
                    w-full py-4 rounded-xl font-bold text-base sm:text-lg shadow-xl transition-all duration-300 transform border
                    ${isReady 
                        ? 'bg-[#12b886]/20 border-[#12b886] text-[#20c997] cursor-default animate-pulse shadow-[0_0_20px_rgba(18,184,134,0.2)]' 
                        : 'bg-gradient-to-r from-[#130e26]/80 to-[#0c0818]/80 backdrop-blur-sm transform-gpu border-[#dcf5eb]/15 hover:border-[#dcf5eb]/40 text-[#dcf5eb] hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(220,245,235,0.1)]'}
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
                             className={`h-2 w-8 rounded-full transition-all duration-500 ${i < readyCount ? 'bg-[#12b886] shadow-[0_0_8px_rgba(18,184,134,0.6)]' : 'bg-[#0c0818]'}`}
                          ></div>
                      ))}
                  </div>
              </div>
          </div>

          <SeatingButton players={allPlayers} />

          {showArtifactModal && (
              <ArtifactsInfoModal
                  selectedArtifact={selectedArtifactForModal}
                  onClose={() => { setShowArtifactModal(false); setSelectedArtifactForModal(null); }}
              />
          )}
      </div>
  );
};

export default DiscussionPage;
