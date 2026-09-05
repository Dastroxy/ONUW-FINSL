
import React, { useState } from 'react';
import { GameState, Player, RoleID, GamePhase } from '../types';
import { claimSeat, toggleRoleSelection, startGameSetup, toggleDealReady, advanceToRoles, advanceToSeating, updateCuratorArtifacts } from '../services/firestoreService';
import GameBoard from '../components/GameBoard';
import RoleCard from '../components/RoleCard';
import RoleIcon from '../components/RoleIcons';
import RolesInfoButton from '../components/RolesInfoButton';
import SeatingButton from '../components/SeatingButton';
import { ROLE_METADATA } from '../constants';
import { ARTIFACT_METADATA, ArtifactID, DEFAULT_CURATOR_ARTIFACTS, ALL_ARTIFACT_IDS } from '../constants/artifacts';
import ArtifactsInfoModal from '../components/ArtifactsInfoModal';

interface Props {
  game: GameState;
  me: Player;
}

const LobbyPage: React.FC<Props> = ({ game, me }) => {
  const [cardFlipped, setCardFlipped] = useState(false);
  const [selectedArtifactInfo, setSelectedArtifactInfo] = useState<string | null>(null);
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  
  const selectedRoles = game.selectedRoles || [];
  
  const players = (Object.values(game.players) as Player[]).sort((a, b) => a.joined - b.joined);
  const isHost = me.isHost;

  const handleSeatClick = async (seatId: number) => {
    const isTakenByOther = players.some(p => p.seatId === seatId && p.id !== me.id);
    if (isTakenByOther) return;

    const newSeatId = me.seatId === seatId ? null : seatId;
    if (game.phase === GamePhase.SEATING) {
        await claimSeat(game.id, me.id, newSeatId);
    }
  };


  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 10;

  // LOBBY PHASE
  if (game.phase === GamePhase.LOBBY) {
    const canStartSeating = players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] pt-20 sm:pt-16 p-4 sm:p-6 relative">
         <div className="absolute inset-0 bg-gradient-to-b from-[#0d0818] via-[#0d1228] to-[#090614] pointer-events-none"></div>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(100,60,180,0.08)_0%,_transparent_60%)] pointer-events-none"></div>

         <div className="relative z-10 w-full max-w-xs sm:max-w-sm sm:max-w-sm mb-8 flex-1 overflow-y-auto">
             <div className="flex justify-between items-end mb-4 px-2">
                 <h2 className="text-base sm:text-lg sm:text-xl font-bold text-moon font-display" style={{ textShadow: '0 0 10px rgba(220, 245, 235, 0.2)' }}>Lobby</h2>
                 <span className={`text-sm px-2 py-1 rounded font-mono ${players.length >= MIN_PLAYERS ? 'text-green-400 bg-green-500/10 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'text-gray-500 bg-bark'}`}>
                    {players.length} / {MAX_PLAYERS} Players
                 </span>
             </div>
             
             <ul className="space-y-3">
                {players.map((p) => (
                  <li key={p.id} className="bg-forest/60 border border-moon/15 p-3.5 rounded-xl flex items-center gap-2 sm:gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transform-gpu animate-fade-in hover:border-primary/40 hover:bg-forest/80 hover:-translate-y-0.5 transition-all duration-300">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden font-black ${p.isHost ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_0_15px_rgba(18,184,134,0.6)]' : 'bg-surface border-2 border-moon/15 text-moon/80'}`}>
                         {p.icon && p.icon.includes('/') ? (
                           <img src={p.icon} alt={p.name} className="w-full h-full object-cover" />
                         ) : (
                           <span className={p.icon ? 'text-base sm:text-lg sm:text-xl sm:text-2xl' : 'text-sm'}>{p.icon || p.name.charAt(0).toUpperCase()}</span>
                         )}
                      </div>
                      <span className="text-white font-semibold tracking-wide text-base sm:text-lg">{p.name}</span>
                      {p.isHost && <span className="ml-auto text-[10px] tracking-widest font-black bg-primary/20 text-primary-light border border-primary/40 px-2 py-1 rounded shadow-[0_0_10px_rgba(18,184,134,0.3)]">HOST</span>}
                  </li>
                ))}
                {Array.from({ length: Math.max(0, MIN_PLAYERS - players.length) }).map((_, i) => (
                   <li key={`empty-${i}`} className="border-2 border-dashed border-forest/60 p-3.5 rounded-xl flex items-center gap-2 sm:gap-4 opacity-50 bg-black/10">
                       <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface/50 border border-forest/50"></div>
                       <span className="text-moon/30 text-sm italic tracking-wide">Waiting for players...</span>
                   </li>
                ))}
             </ul>
         </div>

         <div className="relative z-10 w-full max-w-xs sm:max-w-sm sm:max-w-sm mt-4">
             {isHost ? (
               <button 
                 onClick={() => advanceToSeating(game.id)}
                 disabled={!canStartSeating}
                 className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-300
                    ${canStartSeating 
                      ? 'bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:scale-[1.02] text-white shadow-[0_0_30px_rgba(18,184,134,0.3)] border border-primary/30' 
                      : 'bg-bark text-moon/30 cursor-not-allowed border border-forest'}`}
               >
                 {canStartSeating ? 'Seat Selection' : `Waiting for ${MIN_PLAYERS - players.length} more...`}
               </button>
             ) : (
               <div className="text-center p-4 glass-panel rounded-xl animate-pulse" style={{ border: '1px solid rgba(18, 184, 134, 0.15)' }}>
                  <p className="text-primary font-bold text-sm uppercase tracking-wider">Waiting for host</p>
                  <p className="text-moon/30 text-xs mt-1">The game will start soon...</p>
               </div>
             )}
         </div>
      </div>
    );
  }

  // SEATING PHASE
  if (game.phase === GamePhase.SEATING) {
     const seatedPlayersCount = players.filter(p => p.seatId !== null).length;
     const canProceedToRoles = seatedPlayersCount >= MIN_PLAYERS && seatedPlayersCount <= MAX_PLAYERS;
     const totalSeats = Math.max(3, Math.min(MAX_PLAYERS, players.length));
     
     return (
        <div className="p-4 flex flex-col items-center min-h-[100dvh] pt-20 sm:pt-16 relative">
           <div className="absolute inset-0 bg-gradient-to-b from-[#0d0818] via-[#10162c] to-[#090614] pointer-events-none"></div>
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(120,60,200,0.06)_0%,_transparent_50%)] pointer-events-none"></div>
           
           <header className="mb-6 text-center pt-4 relative z-10">
               <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-moon mb-2" style={{ filter: 'drop-shadow(0 0 12px rgba(18, 184, 134, 0.3))' }}>Select Your Seat</h2>
               <p className="text-moon/40 text-sm">Tap an open seat to join the game</p>
           </header>
           
           <div className="mb-8 w-full flex-grow flex items-center justify-center relative z-10">
             <GameBoard 
               totalSeats={totalSeats} 
               players={players} 
               myId={me.id} 
               onSeatClick={handleSeatClick} 
             />
           </div>
           
           <div className="mt-4 w-full max-w-xs sm:max-w-md sm:max-w-md glass-panel p-4 rounded-xl mb-24 relative z-10" style={{ border: '1px solid rgba(220, 245, 235, 0.1)' }}>
             <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-moon/50 text-sm font-bold uppercase tracking-wider">Players</span>
                <span className={`font-mono text-sm px-2 py-1 rounded ${canProceedToRoles ? 'bg-green-500/20 text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.15)]' : 'bg-bark text-moon/30'}`}>
                  {seatedPlayersCount} / {MAX_PLAYERS} Seated
                </span>
             </div>
             <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm max-h-40 overflow-y-auto">
               {players.map(p => (
                 <li key={p.id} className={`px-3 py-2 rounded border flex items-center justify-between transition-colors ${p.seatId !== null ? 'bg-primary/10 border-primary/50 text-moon shadow-[0_0_12px_rgba(18,184,134,0.2)]' : 'bg-surface/60 border-forest/50 text-moon/30 opacity-60'}`} style={p.seatId !== null ? { boxShadow: '0 0 12px rgba(220, 245, 235, 0.06), inset 0 1px 0 rgba(220, 245, 235, 0.05)' } : {}}>
                    <span className="truncate max-w-[100px]">{p.name}</span>
                    {p.seatId !== null ? 
                      <span className="text-[10px] font-bold bg-primary px-1.5 py-0.5 rounded text-white ml-2 shadow-[0_0_6px_rgba(18,184,134,0.4)]">#{p.seatId + 1}</span> :
                      <span className="text-[10px] font-bold bg-bark px-1.5 py-0.5 rounded text-moon/40 ml-2">--</span>
                    }
                 </li>
               ))}
             </ul>
           </div>

           {isHost ? (
              <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50">
                  <button 
                    disabled={!canProceedToRoles}
                    className={`w-full max-w-xs sm:max-w-md sm:max-w-md py-4 rounded-xl font-bold text-base sm:text-lg shadow-2xl transition-all duration-300 relative overflow-hidden group
                        ${canProceedToRoles 
                            ? 'bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 text-white shadow-[0_0_35px_rgba(18,184,134,0.4)] transform hover:scale-[1.02] border border-moon/15' 
                            : 'bg-bark text-moon/30 cursor-not-allowed border border-forest'}`}
                    onClick={() => advanceToRoles(game.id)}
                    style={canProceedToRoles ? { boxShadow: '0 0 35px rgba(18, 184, 134, 0.4), 0 0 60px rgba(220, 245, 235, 0.08)' } : {}}
                  >
                    <span className="relative z-10">{canProceedToRoles ? 'Start Game' : `Waiting for seats (${seatedPlayersCount}/${players.length})`}</span>
                    {canProceedToRoles && <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>}
                  </button>
              </div>
           ) : (
             <div className="fixed bottom-6 left-0 right-0 px-6 text-center z-50">
                <div className="bg-[#0d0818]/80 backdrop-blur-md transform-gpu px-6 py-3 rounded-full inline-block border border-moon/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <span className="text-moon/50 italic animate-pulse">Waiting for host to start game...</span>
                </div>
             </div>
           )}
        </div>
     );
  }

  const seatedPlayersList = players.filter(p => p.seatId !== null && p.seatId !== undefined);

  // ROLE SELECTION PHASE
  const requiredRolesCount = players.length + 3;
  
  const toggleRole = async (role: RoleID) => {
    if (!isHost) return;
    const isSelected = selectedRoles.includes(role);
    if (isSelected) {
      await toggleRoleSelection(game.id, role, false);
    } else if (selectedRoles.length < requiredRolesCount) {
      await toggleRoleSelection(game.id, role, true);
    }
  };

  if (game.phase === GamePhase.ROLES) {
     const expansions = ['Base', 'Daybreak', 'Vampire', 'Alien', 'Bonus'];
     
     return (
        <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(180deg, #090614 0%, #0d1228 50%, #0d0818 100%)' }}>
          <header className="flex justify-between items-center p-4 border-b border-moon/8 sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(20px)' }}>
             <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-moon" style={{ textShadow: '0 0 10px rgba(220, 245, 235, 0.2)' }}>Select Roles</h2>
                <p className="text-xs text-moon/40">Select {requiredRolesCount} cards (Players + 3)</p>
             </div>
             <div className={`
                 px-4 py-2 rounded-lg font-mono font-bold shadow-lg transition-all
                 ${selectedRoles.length === requiredRolesCount 
                    ? 'bg-green-500 text-white animate-pulse shadow-green-500/30' 
                    : 'bg-bark border border-moon/10 text-moon/60'}
             `}>
               {selectedRoles.length} / {requiredRolesCount}
             </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-36 sm:pb-40">
             {expansions.map(exp => {
                 const expRoles = Object.keys(ROLE_METADATA)
                    .filter(key => ROLE_METADATA[key as RoleID].expansion === exp)
                    .map(key => key as RoleID);
                 
                 if (expRoles.length === 0) return null;

                 return (
                     <div key={exp} className="mb-7 sm:mb-8 animate-fade-in">
                         <h3 className="text-sm sm:text-base md:text-lg font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-moon mb-3 sm:mb-4 px-1 uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                             <span className="w-8 sm:w-10 h-[2px] bg-gradient-to-r from-primary to-moon/40 rounded-full"></span>
                             {exp}
                             <span className="flex-1 h-[1px] bg-gradient-to-r from-moon/15 to-transparent rounded-full"></span>
                         </h3>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                             {expRoles.map(r => {
                                 const meta = ROLE_METADATA[r];
                                 const isSelected = selectedRoles.includes(r);
                                 return (
                                     <div 
                                         key={r}
                                         onClick={() => toggleRole(r)}
                                         className={`
                                             relative min-h-[108px] sm:min-h-[128px] rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group
                                             backdrop-blur-sm transform-gpu
                                             ${isSelected 
                                                 ? 'border-primary/60 bg-primary/20 shadow-[0_0_20px_rgba(18,184,134,0.3)] ring-2 ring-primary/50' 
                                                 : 'border-white/8 bg-white/[0.03] hover:bg-primary/10 hover:border-primary/40 hover:shadow-[0_4px_20px_rgba(18,184,134,0.15)]'}
                                         `}
                                     >
                                         <div className={`h-1.5 w-full ${meta.team === 'GOOD' ? 'bg-good shadow-[0_0_12px_rgba(126,184,201,0.5)]' : meta.team === 'EVIL' ? 'bg-evil shadow-[0_0_12px_rgba(185,28,28,0.5)]' : 'bg-independent shadow-[0_0_12px_rgba(212,168,71,0.5)]'}`}></div>
                                         <div className="flex-1 flex flex-col items-center justify-center p-2 text-center relative z-10">
                                             <div className={`mb-1.5 transition-all duration-300 ${isSelected ? 'scale-105 drop-shadow-[0_0_10px_rgba(220,245,235,0.5)]' : 'group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'} grayscale-[0.2] group-hover:grayscale-0`}>
                                                 <RoleIcon role={r} className="w-9 h-9 sm:w-12 sm:h-12" />
                                             </div>
                                             <span className={`text-[11px] sm:text-xs font-bold leading-tight uppercase tracking-wide transition-colors line-clamp-1 ${isSelected ? 'text-moon' : 'text-moon/50 group-hover:text-moon/90'}`}>
                                                 {meta.name}
                                             </span>
                                         </div>
                                         <div className={`
                                            absolute top-1.5 right-1.5 w-4.5 h-4.5 sm:w-5 sm:h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(18,184,134,0.5)] flex items-center justify-center text-[10px] text-white transition-all duration-200
                                            ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                                         `}>
                                             ✓
                                         </div>
                                         <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 );
             })}

             {/* CURATOR ARTIFACT TOKENS SELECTION (Inside scroll container) */}
             {selectedRoles.includes(RoleID.CURATOR) && (
               <div className="mt-4 mb-8 p-3.5 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/25 shadow-[0_0_25px_rgba(245,158,11,0.12)] backdrop-blur-md animate-fade-in">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                   <div className="flex items-center gap-2">
                     <span className="text-2xl">🏺</span>
                     <div>
                       <h3 className="text-sm sm:text-base font-display font-bold text-amber-200">
                         Curator Artifact Tokens
                       </h3>
                       <p className="text-xs text-amber-200/60">
                         {isHost 
                           ? `Select tokens for the Curator to choose from (${(game.curatorArtifacts || DEFAULT_CURATOR_ARTIFACTS).length} selected)` 
                           : `Host selected ${(game.curatorArtifacts || DEFAULT_CURATOR_ARTIFACTS).length} artifact tokens`}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 flex-wrap">
                     {isHost && (
                       <>
                         <button
                           type="button"
                           onClick={() => updateCuratorArtifacts(game.id, DEFAULT_CURATOR_ARTIFACTS)}
                           className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all font-semibold"
                         >
                           Daybreak (5)
                         </button>
                         <button
                           type="button"
                           onClick={() => updateCuratorArtifacts(game.id, ALL_ARTIFACT_IDS)}
                           className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all font-semibold"
                         >
                           All (10)
                         </button>
                       </>
                     )}
                     <button
                       type="button"
                       onClick={() => { setSelectedArtifactInfo(null); setShowArtifactModal(true); }}
                       className="px-2.5 py-1 text-xs rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all font-semibold flex items-center gap-1.5"
                     >
                       <span>Token Info</span>
                       <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">i</span>
                     </button>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                   {ALL_ARTIFACT_IDS.map((artId) => {
                     const meta = ARTIFACT_METADATA[artId];
                     const currentSelected = game.curatorArtifacts && game.curatorArtifacts.length > 0 
                       ? game.curatorArtifacts 
                       : DEFAULT_CURATOR_ARTIFACTS;
                     const isSelected = currentSelected.includes(artId);

                     return (
                       <div
                         key={artId}
                         onClick={async () => {
                           if (!isHost) return;
                           let next: string[];
                           if (isSelected) {
                             if (currentSelected.length <= 1) return;
                             next = currentSelected.filter(id => id !== artId);
                           } else {
                             next = [...currentSelected, artId];
                           }
                           await updateCuratorArtifacts(game.id, next);
                         }}
                         className={`
                           relative p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex flex-col items-center text-center
                           ${isHost ? 'cursor-pointer hover:border-amber-400/80 hover:scale-[1.02]' : 'cursor-default'}
                           ${isSelected
                             ? 'bg-amber-900/30 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                             : 'bg-black/40 border-white/10 opacity-50 hover:opacity-75'}
                         `}
                       >
                         <div className="flex items-center justify-between w-full mb-1">
                           <span className="text-[10px] uppercase font-bold text-amber-300/70">
                             {meta.expansion}
                           </span>
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedArtifactInfo(artId);
                               setShowArtifactModal(true);
                             }}
                             className="w-4 h-4 rounded-full bg-white/15 hover:bg-amber-400 hover:text-black text-white/80 flex items-center justify-center text-[10px] font-bold transition-all"
                             title="View Token Info"
                           >
                             i
                           </button>
                         </div>
                         <div className="text-2xl sm:text-3xl my-1 drop-shadow-md">
                           {meta.icon}
                         </div>
                         <span className="text-xs font-bold text-moon line-clamp-1">
                           {meta.name}
                         </span>
                         <span className="text-[10px] text-amber-200/70 mt-0.5 line-clamp-1 font-mono">
                           {meta.category === 'ROLE_CHANGING' ? 'Role Shift' : meta.category === 'MUTING' ? 'Mute' : meta.category === 'TRAITOR' ? 'Traitor' : 'No Effect'}
                         </span>
                         {isSelected && (
                           <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-black font-black shadow-sm">
                             ✓
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}
          </div>

          <RolesInfoButton roles={selectedRoles} />

          {showArtifactModal && (
            <ArtifactsInfoModal 
              selectedArtifact={selectedArtifactInfo}
              onClose={() => { setShowArtifactModal(false); setSelectedArtifactInfo(null); }}
            />
          )}

          {isHost ? (
             <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-20" style={{ background: 'linear-gradient(to top, #090614 0%, rgba(9, 6, 20, 0.95) 75%, transparent 100%)' }}>
               <button 
                 disabled={selectedRoles.length !== requiredRolesCount}
                 onClick={async () => {
                    await startGameSetup(game.id);
                 }}
                 className={`
                    w-full max-w-xs sm:max-w-md mx-auto block py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all transform
                    ${selectedRoles.length === requiredRolesCount
                        ? 'bg-gradient-to-tr from-accent to-evil border-2 border-accent/60 text-white shadow-[0_8px_30px_rgba(139,17,59,0.4),_0_0_50px_rgba(220,245,235,0.06)] hover:shadow-[0_8px_40px_rgba(139,17,59,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-95'
                        : 'bg-bark text-moon/30 cursor-not-allowed border border-forest'}
                 `}
               >
                 {selectedRoles.length === requiredRolesCount ? 'DEAL CARDS' : `${selectedRoles.length} / ${requiredRolesCount} SELECTED`}
               </button>
             </div>
          ) : (
             <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-20 text-center" style={{ background: 'linear-gradient(to top, #090614 0%, rgba(9, 6, 20, 0.95) 75%, transparent 100%)' }}>
                 <div className="text-primary font-bold animate-pulse mb-1" style={{ textShadow: '0 0 15px rgba(18, 184, 134, 0.3)' }}>HOST IS SELECTING ROLES</div>
                 <p className="text-moon/30 text-xs">Sit tight, the game will start soon.</p>
             </div>
          )}
          <SeatingButton players={seatedPlayersList} />
        </div>
     );
  }
  
  // DEAL PHASE (VIEW ROLE)
  return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] pt-20 sm:pt-16 p-4 sm:p-6 relative overflow-y-auto overflow-x-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-[#0d0818] via-[#10162c] to-[#090614] pointer-events-none"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(100,60,200,0.1)_0%,_rgba(18,184,134,0.05)_30%,_transparent_60%)] pointer-events-none"></div>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,245,235,0.04)_0%,_transparent_50%)] pointer-events-none"></div>
         
         <h2 className="text-2xl sm:text-3xl font-display font-bold mb-8 text-moon relative z-10 tracking-wide" style={{ textShadow: '0 0 20px rgba(220, 245, 235, 0.3), 0 2px 10px rgba(0, 0, 0, 0.5)' }}>Your Role</h2>
         
         <div className="z-20">
            <RoleCard role={me.originalRole} flipped={cardFlipped} onClick={() => setCardFlipped(!cardFlipped)} size="lg" className="card-glow shadow-[0_0_40px_rgba(18,184,134,0.2),_0_0_80px_rgba(100,60,200,0.08)]" />
         </div>
         
         {!cardFlipped && (
           <p className="mt-4 text-moon/40 text-sm animate-pulse tracking-widest uppercase relative z-10">Tap to reveal</p>
         )}

         <div className={`mt-8 text-center max-w-xs relative z-10 transition-all duration-500 ${cardFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             <div className="mb-4 flex justify-center">
                 <RoleIcon role={me.originalRole} className="w-16 h-16 drop-shadow-[0_0_20px_rgba(18,184,134,0.4)]" />
             </div>
             <h3 className="text-base sm:text-lg sm:text-xl sm:text-2xl font-display font-bold text-primary mb-2" style={{ textShadow: '0 0 15px rgba(18, 184, 134, 0.4)' }}>{ROLE_METADATA[me.originalRole].name}</h3>
             <p className="text-moon/70 text-sm leading-relaxed glass-panel p-4 rounded-xl shadow-xl" style={{ border: '1px solid rgba(220, 245, 235, 0.1)' }}>
                {ROLE_METADATA[me.originalRole].description}
             </p>
         </div>
         
         {(() => {
            const dealReady = game.dealReadyPlayers || [];
            const isDealReady = dealReady.includes(me.id);
            const dealReadyCount = dealReady.length;
            const totalPlayers = Object.keys(game.players).length;
            return (
              <div className="mt-10 flex flex-col items-center gap-2 sm:gap-3 relative z-30">
                {isDealReady ? (
                  <div className="bg-primary/15 border border-moon/20 text-primary-light px-5 py-2 sm:px-8 sm:py-3 rounded-full font-bold text-sm sm:text-base sm:text-lg tracking-wider animate-pulse shadow-[0_0_20px_rgba(220,245,235,0.08)]">
                    READY
                  </div>
                ) : (
                  <button
                    onClick={() => toggleDealReady(game.id, me.id)}
                    className="bg-gradient-to-r from-accent to-evil hover:from-accent/90 hover:to-evil/90 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-full font-display font-bold text-sm sm:text-base sm:text-lg shadow-[0_0_35px_rgba(139,17,59,0.5),_0_0_60px_rgba(220,245,235,0.06)] transition-all transform hover:scale-105 active:scale-95 tracking-wider border border-moon/10"
                  >
                    READY
                  </button>
                )}
                <span className="text-moon/40 text-xs font-mono tracking-widest">{dealReadyCount} / {totalPlayers} READY</span>
              </div>
            );
         })()}
         <SeatingButton players={seatedPlayersList} />
      </div>
  );
};

export default LobbyPage;
