
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, RoleID, Team } from '../types';
import { performNightAction, advanceNightTurn, toggleMasonReady, COPYCAT_DEFERRED_ROLES, DOPPELGANGER_IMMEDIATE_ROLES, DOPPELGANGER_DEFERRED_ROLES } from '../services/firestoreService';
import { ROLE_METADATA } from '../constants';
import RoleCard from '../components/RoleCard';
import RoleIcon from '../components/RoleIcons';
import SeatingButton from '../components/SeatingButton';

interface Props {
  game: GameState;
  me: Player;
}

const NightPhase: React.FC<Props> = ({ game, me }) => {
  const [step, setStep] = useState<'SELECTING' | 'ANIMATING' | 'FINISHED'>('SELECTING');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string[]>([]);
  
  // Visual states
  const [revealedIds, setRevealedIds] = useState<Record<string, RoleID>>({}); // Map ID -> RoleID
  const [swappingIds, setSwappingIds] = useState<string[]>([]); // IDs involved in swap
  const [infoMessage, setInfoMessage] = useState<string>('');
  
  // Robber specific states
  const [robberState, setRobberState] = useState<'IDLE' | 'SWAPPING' | 'REVEALED'>('IDLE');
  const [robberNewRole, setRobberNewRole] = useState<RoleID | null>(null);

  // PI specific states
  const [piState, setPiState] = useState({ checks: 0, becomeEvil: false, finished: false });

  // Witch specific states
  const [witchState, setWitchState] = useState<{ centerId: string | null, centerRole: RoleID | null, swapped: boolean }>({ centerId: null, centerRole: null, swapped: false });

  // Village Idiot specific states
  const [viDirection, setViDirection] = useState<'CLOCKWISE' | 'ANTI-CLOCKWISE' | null>(null);

  // Psychic specific states
  const [psychicSeenRole, setPsychicSeenRole] = useState<RoleID | null>(null);
  const [psychicNeighborId, setPsychicNeighborId] = useState<string | null>(null);

  // Copycat immediate-action states
  const [copycatCopiedRole, setCopycatCopiedRole] = useState<RoleID | null>(null);
  const [copycatPhase, setCopycatPhase] = useState<'COPY' | 'ACTION' | null>(null);
  const [copycatTransitionRole, setCopycatTransitionRole] = useState<RoleID | null>(null);

  // Troublemaker/Generic Swap specific states
  const [tmStyles, setTmStyles] = useState<Record<string, React.CSSProperties>>({});
  const itemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Insomniac specific ref
  const autoRevealed = useRef(false);

  const currentRoleID = game.nightQueue[game.currentNightRoleIndex];
  const activeRoleID = (copycatPhase === 'ACTION' && copycatCopiedRole) ? copycatCopiedRole : currentRoleID;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Force visual sync on role change
  useEffect(() => {
    setStep('SELECTING');
    setSelectedPlayers([]);
    setSelectedCenter([]);
    setRevealedIds({});
    setSwappingIds([]);
    setInfoMessage('');
    setRobberState('IDLE');
    setRobberNewRole(null);
    setTmStyles({});
    setPiState({ checks: 0, becomeEvil: false, finished: false });
    setWitchState({ centerId: null, centerRole: null, swapped: false });
    setViDirection(null);
    setPsychicSeenRole(null);
    setPsychicNeighborId(null);
    autoRevealed.current = false;
    setCopycatCopiedRole(null);
    setCopycatPhase(null);
    setCopycatTransitionRole(null);
  }, [game.currentNightRoleIndex]);

  // Visual Sync Check
  useEffect(() => {
    // If we are not animating, ensure no lingering transform styles exist
    if (step !== 'ANIMATING' && Object.keys(tmStyles).length > 0) {
        setTmStyles({});
    }
  }, [step, game.players, game.centerCards]);

  // INSOMNIAC AUTO-REVEAL LOGIC
  const isInsomniac = activeRoleID === RoleID.INSOMNIAC;
  useEffect(() => {
    if (isInsomniac && step === 'SELECTING' && !autoRevealed.current) {
        autoRevealed.current = true;
        // Auto-select self for glow
        setSelectedPlayers([me.id]);
        
        const timer = setTimeout(async () => {
            setStep('ANIMATING');
            
            await performNightAction(game.id, {
                actorId: me.id,
                actionType: 'VIEW',
                targetPlayerId: me.id
            });

            setRevealedIds({ [me.id]: me.currentRole });
            
            const isUnchanged = me.currentRole === RoleID.INSOMNIAC;
            setInfoMessage(isUnchanged ? "✓ Unchanged" : "❌ Changed");
            
            setStep('FINISHED');
        }, 800); // 0.8s delay
        return () => clearTimeout(timer);
    }
  }, [isInsomniac, step, me.id, me.currentRole, game.id]);

  // PSYCHIC LOGIC - CALCULATE RANDOM NEIGHBOR
  useEffect(() => {
    if (activeRoleID === RoleID.PSYCHIC && !psychicSeenRole) {
        const sortedPlayers = Object.values(game.players)
            .filter(p => p.seatId !== null)
            .sort((a, b) => (a.seatId ?? 0) - (b.seatId ?? 0));
        
        const myIdx = sortedPlayers.findIndex(p => p.id === me.id);
        if (myIdx !== -1 && sortedPlayers.length > 1) {
            const leftIdx = (myIdx - 1 + sortedPlayers.length) % sortedPlayers.length;
            const rightIdx = (myIdx + 1) % sortedPlayers.length;
            const neighbors = [sortedPlayers[leftIdx], sortedPlayers[rightIdx]];
            // Randomly pick one neighbor
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            setPsychicSeenRole(randomNeighbor.currentRole);
            setPsychicNeighborId(randomNeighbor.id);
        } else if (sortedPlayers.length > 0) {
             // Fallback for single player testing or weird state
             const other = sortedPlayers.find(p => p.id !== me.id) || sortedPlayers[0];
             setPsychicSeenRole(other.currentRole);
             setPsychicNeighborId(other.id);
        }
    }
  }, [activeRoleID, game.players, me.id, psychicSeenRole]);

  if (!currentRoleID) return <div className="min-h-[100dvh] pt-20 sm:pt-16 bg-black flex items-center justify-center text-primary">Loading Night...</div>;

  // ------------------------------------------------------------------
  // WAITING SCREEN
  // ------------------------------------------------------------------
  // Logic: Check if "My" role matches "Current" role group
  const isMyTurn = (() => {
      if (me.originalRole === currentRoleID) return true;
      // Handle Grouped Roles
      if (currentRoleID === RoleID.WEREWOLF && me.originalRole === RoleID.WEREWOLF_2) return true;
      if (currentRoleID === RoleID.MASON && me.originalRole === RoleID.MASON_2) return true;
      
      const copiedRole = (me as any).copiedRole || me.currentRole;
      
      if (me.originalRole === RoleID.COPYCAT && me.currentRole !== RoleID.COPYCAT && COPYCAT_DEFERRED_ROLES.has(copiedRole)) {
          if (copiedRole === currentRoleID) return true;
          if (currentRoleID === RoleID.WEREWOLF && copiedRole === RoleID.WEREWOLF_2) return true;
          if (currentRoleID === RoleID.MASON && copiedRole === RoleID.MASON_2) return true;
      }
      if (me.originalRole === RoleID.DOPPELGANGER && me.currentRole !== RoleID.DOPPELGANGER && DOPPELGANGER_DEFERRED_ROLES.has(copiedRole)) {
          if (copiedRole === currentRoleID) return true;
          if (currentRoleID === RoleID.WEREWOLF && copiedRole === RoleID.WEREWOLF_2) return true;
          if (currentRoleID === RoleID.MASON && copiedRole === RoleID.MASON_2) return true;
      }
      return false;
  })();

  if (!isMyTurn) {
     const isThingTarget = currentRoleID === RoleID.THING && game.thingTarget === me.id;

     return (
        <div className="min-h-[100dvh] pt-20 sm:pt-16 flex flex-col items-center justify-center bg-[#06030c] text-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden relative">
            <style>{`
                

                @keyframes glow {
                  from { filter: drop-shadow(0 0 20px #8b113b) saturate(1.5); }
                  to { filter: drop-shadow(0 0 40px #8b113b) saturate(1.5); }
                }

                @keyframes alertPulse {
                  0%, 100% {
                      transform: translate(-50%, -50%) scale(1);
                      opacity: 0.95;
                  }
                  50% {
                      transform: translate(-50%, -50%) scale(1.02);
                      opacity: 1;
                      box-shadow: 0 25px 60px rgba(139,17,59,0.8);
                  }
                }
                
                @keyframes bgPulse {
                  0%, 100% { background: rgba(139,17,59,0.95); }
                  50% { background: rgba(185,28,28,0.98); }
                }

                .thing-alert {
                  position: fixed;
                  top: 50%; left: 50%;
                  transform: translate(-50%, -50%);
                  z-index: 9999;
                  
                  background: rgba(139,17,59,0.95);
                  backdrop-filter: blur(20px);
                  -webkit-backdrop-filter: blur(20px);
                  transform: translateZ(0);
                  will-change: transform, backdrop-filter;
                  border: 3px solid rgba(18,184,134,0.4);
                  border-radius: 24px;
                  padding: 3rem 2rem;
                  
                  animation: alertPulse 1.2s ease-in-out infinite, bgPulse 1.2s ease-in-out infinite;
                  
                  text-align: center;
                  min-width: 320px;
                  max-width: 90vw;
                }

                .alert-emoji {
                  font-size: 4rem;
                  animation: glow 1.5s ease-in-out infinite alternate;
                  display: block;
                  margin-bottom: 1rem;
                }

                .alert-title {
                  font-family: 'Cinzel', serif !important;
                  font-weight: 800 !important;
                  font-size: clamp(1.8rem, 5vw, 2.5rem);
                  color: white !important;
                  letter-spacing: 0.05em;
                  margin: 0.5rem 0 0.5rem 0;
                  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                  line-height: 1.1;
                }
            `}</style>

            {/* THING ALERT OVERLAY */}
            {isThingTarget && (
                <div className="thing-alert">
                    <div className="alert-emoji">🚨</div>
                    <div className="alert-title">
                        THING TAPPED YOU
                    </div>
                </div>
            )}

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(12,8,24,0.5)_0%,_rgba(5,8,16,1)_70%)] pointer-events-none"></div>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(100,80,160,0.06) 0%, transparent 60%)' }}></div>
            <div className="relative z-10 flex flex-col items-center animate-pulse">
                <div className="w-28 h-28 mb-6 rounded-full bg-[#0d0818] border-2 border-[#dcf5eb]/20 flex items-center justify-center shadow-[0_0_40px_rgba(220,245,235,0.1),_0_0_80px_rgba(100,80,160,0.08)]">
                    <span className="text-5xl opacity-80">🌙</span>
                </div>
                <h2 className="text-base sm:text-lg sm:text-xl sm:text-2xl font-display font-bold text-moon mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(220,245,235,0.3)]">Night Phase</h2>
                <p className="text-[#8090b0] mb-8">
                    <span className="text-primary font-bold">Someone</span> is waking up...
                </p>
                <div className="w-36 sm:w-48 h-1.5 bg-[#151a30] rounded-full overflow-hidden border border-[#2a2545]/50">
                    <div className="bg-gradient-to-r from-primary to-primary-light h-full transition-all duration-1000 shadow-[0_0_10px_rgba(18,184,134,0.5)]" style={{ width: `${((game.currentNightRoleIndex) / game.nightQueue.length) * 100}%` }}></div>
                </div>
            </div>
        </div>
     );
  }

  // ------------------------------------------------------------------
  // ACTION LOGIC
  // ------------------------------------------------------------------
  const roleMeta = ROLE_METADATA[activeRoleID];
  let maxPlayers = 0;
  let maxCenter = 0;
  let actionBtnText = "CONFIRM";

  const otherEvilPlayers = (Object.values(game.players) as Player[]).filter(p => 
      p.id !== me.id && 
      (ROLE_METADATA[p.currentRole].team === Team.EVIL || (p.originalRole === RoleID.COPYCAT && ROLE_METADATA[p.currentRole].team === Team.EVIL)) &&
      (activeRoleID === RoleID.MINION || p.currentRole !== RoleID.MINION)
  );

  const otherMasons = (Object.values(game.players) as Player[]).filter(p => 
      p.id !== me.id && 
      (p.originalRole === RoleID.MASON || p.originalRole === RoleID.MASON_2)
  );

  switch (activeRoleID) {
    case RoleID.SEER: maxPlayers = 1; maxCenter = 2; actionBtnText = "REVEAL"; break;
    case RoleID.ROBBER: maxPlayers = 1; actionBtnText = "ROB & VIEW"; break;
    case RoleID.TROUBLEMAKER: maxPlayers = 2; actionBtnText = "SWAP"; break;
    case RoleID.DRUNK: maxCenter = 1; actionBtnText = "SWAP"; break;
    case RoleID.WEREWOLF: maxCenter = 1; actionBtnText = "VIEW CENTER"; break;
    case RoleID.WITCH: maxCenter = 0; maxPlayers = 0; actionBtnText = "INTERACT"; break;
    case RoleID.APPRENTICE_SEER: maxCenter = 1; actionBtnText = "REVEAL"; break;
    case RoleID.PARANORMAL_INVESTIGATOR: maxPlayers = 2; actionBtnText = "CONTINUE"; break; 
    case RoleID.DOPPELGANGER: maxPlayers = 1; actionBtnText = "COPY"; break;
    case RoleID.COPYCAT: maxCenter = 1; actionBtnText = "COPY"; break;
    case RoleID.MYSTIC_WOLF: maxPlayers = 1; actionBtnText = "REVEAL"; break;
    case RoleID.SENTINEL: maxPlayers = 1; actionBtnText = "SHIELD"; break;
    case RoleID.REVEALER: maxPlayers = 1; actionBtnText = "REVEAL"; break;
    case RoleID.CURATOR: maxPlayers = 1; actionBtnText = "PLACE ARTIFACT"; break;
    case RoleID.ALPHA_WOLF: maxPlayers = 1; actionBtnText = "SWAP W/ WOLF"; break;
    case RoleID.CUPID: maxPlayers = 2; actionBtnText = "LINK"; break;
    case RoleID.DISEASED: maxPlayers = 1; actionBtnText = "INFECT"; break;
    case RoleID.INSTIGATOR: maxPlayers = 1; actionBtnText = "BETRAY"; break;
    case RoleID.PRIEST: maxPlayers = 1; actionBtnText = "BLESS"; break;
    case RoleID.ASSASSIN: maxPlayers = 1; actionBtnText = "MARK"; break;
    case RoleID.PICKPOCKET: maxPlayers = 1; actionBtnText = "STEAL MARK"; break;
    case RoleID.GREMLIN: maxPlayers = 2; actionBtnText = "SWAP CARDS"; break;
    case RoleID.EXPOSER: maxCenter = 1; actionBtnText = "REVEAL"; break;
    case RoleID.THING: maxPlayers = 1; actionBtnText = "TAP"; break;
    case RoleID.NOSTRADAMUS: maxPlayers = 3; actionBtnText = "VIEW FUTURE"; break;
    case RoleID.VILLAGE_IDIOT: maxPlayers = 0; actionBtnText = "ROTATE"; break;
    case RoleID.SQUIRE: maxPlayers = 0; actionBtnText = "CONTINUE"; break; 
    case RoleID.BEHOLDER: maxPlayers = 0; actionBtnText = "CONTINUE"; break;
    case RoleID.MORTICIAN: maxPlayers = 1; actionBtnText = "VIEW"; break;
    case RoleID.PSYCHIC: maxPlayers = 0; actionBtnText = "READ MINDS"; break;
    case RoleID.AURA_SEER: maxPlayers = 0; actionBtnText = "CONTINUE"; break;
    case RoleID.INSOMNIAC: maxPlayers = 0; actionBtnText = "REVEALING..."; break;
    case RoleID.MASON: case RoleID.MINION: case RoleID.APPRENTICE_TANNER: case RoleID.DREAM_WOLF:
      maxPlayers = 0; actionBtnText = "REVEAL INFO"; break;
    default: 
      if (['VAMPIRE', 'THE_COUNT', 'MARKSMAN'].includes(activeRoleID)) { maxPlayers = 1; actionBtnText = "ACT"; }
      break;
  }

  // OVERRIDE FOR WEREWOLF & MINION
  if (activeRoleID === RoleID.WEREWOLF) {
      if (otherEvilPlayers.length > 0) {
          maxCenter = 0;
          actionBtnText = "CONTINUE";
      } else {
          maxCenter = 1;
          actionBtnText = "VIEW CENTER";
      }
  }

  if (activeRoleID === RoleID.MINION || activeRoleID === RoleID.MASON) {
      maxPlayers = 0;
      maxCenter = 0;
      actionBtnText = "CONTINUE";
  }

  const isSquire = activeRoleID === RoleID.SQUIRE;
  const squireEvilPlayers = isSquire 
    ? (Object.values(game.players) as Player[]).filter(p => 
        p.id !== me.id && 
        (ROLE_METADATA[p.originalRole].team === Team.EVIL || (p.originalRole === RoleID.COPYCAT && ROLE_METADATA[p.currentRole].team === Team.EVIL)) &&
        p.originalRole !== RoleID.SQUIRE && 
        p.originalRole !== RoleID.MINION &&
        !(p.originalRole === RoleID.COPYCAT && (p.currentRole === RoleID.MINION || p.currentRole === RoleID.SQUIRE))
      )
    : [];

  const isBeholder = activeRoleID === RoleID.BEHOLDER;

  const handlePlayerClick = async (pid: string) => {
      if (step !== 'SELECTING') return;
      if (pid === me.id && ![RoleID.INSOMNIAC, RoleID.GREMLIN, RoleID.PRIEST, RoleID.ASSASSIN, RoleID.MORTICIAN].includes(activeRoleID)) return; 
      
      const targetPlayer = game.players[pid];
      
      // SHIELD BLOCKING LOGIC
      if (targetPlayer.shielded && activeRoleID !== RoleID.SENTINEL) {
          // If PI, we still consume a "check" even if blocked? Usually yes.
          if (activeRoleID === RoleID.PARANORMAL_INVESTIGATOR) {
              if (piState.finished || piState.becomeEvil) return;
              
              const newChecks = piState.checks + 1;
              const isFinished = newChecks >= 2;
              setPiState(prev => ({ ...prev, checks: newChecks, finished: isFinished }));
              
              setInfoMessage("🛡️ Blocked! Target is shielded.");
              
              // Log the attempt
              await performNightAction(game.id, {
                  actorId: me.id,
                  actionType: 'VIEW',
                  targetPlayerId: pid
              });
              return;
          }
          setInfoMessage("🛡️ Blocked! Target is shielded.");
          return;
      }

      // ALPHA WOLF SPECIAL LOGIC
      if (activeRoleID === RoleID.ALPHA_WOLF) {
          setStep('ANIMATING');
          setSwappingIds(['center-alpha', pid]);
          setInfoMessage("Exchanged with Center Wolf");

          requestAnimationFrame(async () => {
              await performNightAction(game.id, {
                  actorId: me.id,
                  actionType: 'SWAP',
                  targetPlayerId: pid
              });
          });

          setTimeout(() => {
              setStep('FINISHED');
          }, 800);
          return;
      }

      // PI SPECIAL LOGIC
      if (activeRoleID === RoleID.PARANORMAL_INVESTIGATOR) {
          if (piState.finished || piState.becomeEvil) return;
          if (revealedIds[pid]) return; // Already checked

          // Optimistic local reveal & check
          const targetRole = targetPlayer.currentRole;
          const targetMeta = ROLE_METADATA[targetRole];
          const turnedEvil = targetMeta.team !== Team.GOOD;

          // Reveal locally
          setRevealedIds(prev => ({ ...prev, [pid]: targetRole }));
          
          if (turnedEvil) {
              setPiState({ checks: piState.checks + 1, becomeEvil: true, finished: true });
              setInfoMessage(`You became ${targetMeta.name}!`);
          } else {
              const newChecks = piState.checks + 1;
              setPiState({ checks: newChecks, becomeEvil: false, finished: newChecks >= 2 });
              // Message update handled in render via piState
          }

          // Send to server
          await performNightAction(game.id, {
              actorId: me.id,
              actionType: 'VIEW', // handled as PI specific view in backend
              targetPlayerId: pid
          });
          return;
      }

      // WITCH SPECIAL LOGIC
      if (activeRoleID === RoleID.WITCH) {
          if (!witchState.centerId) return; // Must view center first
          if (witchState.swapped) return; 

          // Animation & Action
          const centerId = witchState.centerId;
          const node1 = itemsRef.current.get(centerId);
          const node2 = itemsRef.current.get(pid);
          
          if (node1 && node2) {
               const r1 = node1.getBoundingClientRect();
               const r2 = node2.getBoundingClientRect();
               const tx1 = r2.left - r1.left;
               const ty1 = r2.top - r1.top;
               const tx2 = r1.left - r2.left;
               const ty2 = r1.top - r2.top;

              setTmStyles({
                  [centerId]: { '--tx': `${tx1}px`, '--ty': `${ty1}px` } as React.CSSProperties,
                  [pid]: { '--tx': `${tx2}px`, '--ty': `${ty2}px` } as React.CSSProperties
              });
              setStep('ANIMATING');
              
              requestAnimationFrame(async () => {
                  await performNightAction(game.id, {
                      actorId: me.id,
                      actionType: 'SWAP',
                      targetCenterId: centerId,
                      targetPlayerId: pid
                  });
              });
              
              setInfoMessage("Swapped!");
              setSwappingIds([centerId, pid]);
              setWitchState(prev => ({ ...prev, swapped: true }));
              
              setTimeout(() => {
                  setStep('FINISHED');
                  setTmStyles({});
              }, 800);
          }
          return;
      }

      if (isSquire) {
          if (!squireEvilPlayers.find(p => p.id === pid)) return;
          setRevealedIds(prev => ({ 
              ...prev, 
              [pid]: prev[pid] ? undefined : game.players[pid].currentRole 
          }));
          return;
      }

      if (activeRoleID === RoleID.NOSTRADAMUS) {
          if (selectedPlayers.includes(pid)) return;
          if (selectedPlayers.length >= 2) return; 

          const newSelected = [...selectedPlayers, pid];
          setSelectedPlayers(newSelected);
          
          const p = game.players[pid];
          setRevealedIds(prev => ({ ...prev, [pid]: p.currentRole }));
          
          return;
      }

      if (maxPlayers > 0) {
          if (activeRoleID === RoleID.SEER) setSelectedCenter([]);
          if (selectedPlayers.includes(pid)) setSelectedPlayers(s => s.filter(id => id !== pid));
          else if (selectedPlayers.length < maxPlayers) setSelectedPlayers(s => [...s, pid]);
          else if (maxPlayers === 1) setSelectedPlayers([pid]);
      }
  };
  
  const handleCenterClick = (cid: string) => {
      if (step !== 'SELECTING') return;
      
      // WITCH LOGIC
      if (activeRoleID === RoleID.WITCH) {
          if (witchState.centerId) return; // Already viewed one
          
          // Execute View
          const c = game.centerCards.find(card => card.id === cid);
          if (c) {
              setRevealedIds(prev => ({ ...prev, [cid]: c.role }));
              setWitchState({ centerId: cid, centerRole: c.role, swapped: false });
              setSelectedCenter([cid]);
              
              performNightAction(game.id, {
                  actorId: me.id,
                  actionType: 'VIEW',
                  targetCenterId: cid
              });
          }
          return;
      }

      if (activeRoleID === RoleID.NOSTRADAMUS || activeRoleID === RoleID.SQUIRE || activeRoleID === RoleID.BEHOLDER || activeRoleID === RoleID.PARANORMAL_INVESTIGATOR) return; 

      if (maxCenter > 0) {
          if (activeRoleID === RoleID.SEER) setSelectedPlayers([]);
          if (selectedCenter.includes(cid)) setSelectedCenter(s => s.filter(id => id !== cid));
          else if (selectedCenter.length < maxCenter) setSelectedCenter(s => [...s, cid]);
          else if (maxCenter === 1) setSelectedCenter([cid]);
      }
  };

  const handleVillageIdiotRotate = async (direction: 'CLOCKWISE' | 'ANTI-CLOCKWISE') => {
      setViDirection(direction);
      setStep('ANIMATING');

      // Calculate logic for animation
      // Filter players who are visible and shiftable
      const sortedPlayers = Object.values(game.players)
          .filter(p => p.seatId !== null)
          .sort((a, b) => a.seatId! - b.seatId!);
      
      const shiftable = sortedPlayers.filter(p => p.id !== me.id && !p.shielded);

      if (shiftable.length > 1) {
          const newStyles: Record<string, React.CSSProperties> = {};
          
          shiftable.forEach((p, i) => {
              const node = itemsRef.current.get(p.id);
              if (!node) return;
              
              let targetIdx;
              if (direction === 'CLOCKWISE') {
                  // Move to NEXT person's spot (Right shift in circle)
                  // Array: [0, 1, 2]. 0 goes to 1's spot. 1 goes to 2's spot. 2 goes to 0's spot.
                  targetIdx = (i + 1) % shiftable.length;
              } else {
                  // Move to PREV person's spot (Left shift in circle)
                  // Array: [0, 1, 2]. 0 goes to 2's spot. 2 goes to 1's spot. 1 goes to 0's spot.
                  targetIdx = (i - 1 + shiftable.length) % shiftable.length;
              }
              
              const targetNode = itemsRef.current.get(shiftable[targetIdx].id);
              
              if (node && targetNode) {
                  const r1 = node.getBoundingClientRect();
                  const r2 = targetNode.getBoundingClientRect();
                  const tx = r2.left - r1.left;
                  const ty = r2.top - r1.top;
                  
                  newStyles[p.id] = { '--tx': `${tx}px`, '--ty': `${ty}px` } as React.CSSProperties;
              }
          });
          
          setTmStyles(newStyles);
          
          // Trigger actual backend after animation start
          requestAnimationFrame(async () => {
              await performNightAction(game.id, {
                  actorId: me.id,
                  actionType: 'ROTATE',
                  direction: direction
              });
          });
          
          setSwappingIds(shiftable.map(p => p.id));
          setInfoMessage(`Rotating ${direction === 'CLOCKWISE' ? 'Clockwise' : 'Counter-Clockwise'}...`);
          
          setTimeout(() => {
              setStep('FINISHED');
              setTmStyles({});
          }, 800);
      } else {
          // Not enough players to rotate
          await performNightAction(game.id, {
              actorId: me.id,
              actionType: 'ROTATE',
              direction: direction
          });
          setInfoMessage("Not enough players to rotate.");
          setStep('FINISHED');
      }
  };

  const handlePsychicReveal = async () => {
      setStep('ANIMATING');
      await performNightAction(game.id, {
          actorId: me.id,
          targetPlayerId: psychicNeighborId!,
          actionType: 'VIEW', 
      });
      setTimeout(() => setStep('FINISHED'), 800);
  };

  const isSelectionValid = () => {
      if (activeRoleID === RoleID.SEER) return selectedPlayers.length === 1 || selectedCenter.length === 2;
      if (activeRoleID === RoleID.NOSTRADAMUS) return selectedPlayers.length === 2; 
      if (activeRoleID === RoleID.SQUIRE) return true; 
      if (activeRoleID === RoleID.BEHOLDER) return true;
      if (activeRoleID === RoleID.PARANORMAL_INVESTIGATOR) return piState.finished || piState.becomeEvil || piState.checks >= 2;
      if (activeRoleID === RoleID.WITCH) return false; // Handled by interactions
      if (activeRoleID === RoleID.VILLAGE_IDIOT) return false; // Handled by buttons
      if (activeRoleID === RoleID.WEREWOLF) {
          if (otherEvilPlayers.length === 0) return selectedCenter.length === 1;
          return true; 
      }
      if (activeRoleID === RoleID.MINION) return true;
      if (activeRoleID === RoleID.MASON) return true;
      if (activeRoleID === RoleID.ALPHA_WOLF) return true; // Just click to swap
      if (activeRoleID === RoleID.PSYCHIC) return true;
      if (maxPlayers > 0) return selectedPlayers.length === maxPlayers;
      if (maxCenter > 0) return selectedCenter.length === maxCenter;
      return true;
  };

  const executeAction = async () => {
      if (!isSelectionValid()) return;
      
      // PI just advances turn since actions are immediate
      if (activeRoleID === RoleID.PARANORMAL_INVESTIGATOR) {
          setStep('FINISHED');
          return;
      }

      // ALPHA WOLF handled by click event directly
      if (activeRoleID === RoleID.ALPHA_WOLF) {
          setStep('FINISHED');
          return;
      }

      // SENTINEL uses PLACE_TOKEN to avoid MARKED string
      const actionType = activeRoleID === RoleID.SENTINEL ? 'PLACE_TOKEN' : 
                      (['SEER', 'WEREWOLF', 'MINION', 'MASON', 'INSOMNIAC', 'APPRENTICE_SEER', 'MYSTIC_WOLF', 'EXPOSER', 'BEHOLDER', 'SQUIRE', 'APPRENTICE_TANNER', 'NOSTRADAMUS', 'MORTICIAN'].includes(activeRoleID)) ? 'VIEW' :
                      (['CURATOR', 'VAMPIRE', 'THE_COUNT', 'RENFIELD', 'CUPID', 'DISEASED', 'INSTIGATOR', 'PRIEST', 'ASSASSIN', 'PICKPOCKET'].includes(activeRoleID)) ? 'MARK' :
                      (['REVEALER'].includes(activeRoleID)) ? 'REVEAL' :
                      (activeRoleID === RoleID.THING) ? 'TAP' : 'SWAP';

      // TROUBLEMAKER ANIMATION LOGIC (Optimized)
      if (activeRoleID === RoleID.TROUBLEMAKER) {
        const [id1, id2] = selectedPlayers;
        const node1 = itemsRef.current.get(id1);
        const node2 = itemsRef.current.get(id2);

        if (node1 && node2) {
            const r1 = node1.getBoundingClientRect();
            const r2 = node2.getBoundingClientRect();
            const tx1 = r2.left - r1.left;
            const ty1 = r2.top - r1.top;
            const tx2 = r1.left - r2.left;
            const ty2 = r1.top - r2.top;

            setTmStyles({
                [id1]: { '--tx': `${tx1}px`, '--ty': `${ty1}px` } as React.CSSProperties,
                [id2]: { '--tx': `${tx2}px`, '--ty': `${ty2}px` } as React.CSSProperties
            });
            
            // Trigger animation
            setStep('ANIMATING');

            // Force RAF sync to ensure animation starts smoothly before network hit
            requestAnimationFrame(async () => {
                const payload = {
                    actorId: me.id,
                    targetPlayerId: id1,
                    secondTargetPlayerId: id2,
                    actionType: 'SWAP'
                };
                await performNightAction(game.id, payload as any);
            });
            
            setInfoMessage("Swap complete");
            setSwappingIds(selectedPlayers);

            setTimeout(() => {
                setStep('FINISHED');
                setTmStyles({});
            }, 800);
        }
        return;
      }
      
      setStep('ANIMATING');

      // ROBBER UI LOGIC
      if (activeRoleID === RoleID.ROBBER) {
          const targetId = selectedPlayers[0];
          const targetPlayer = game.players[targetId];
          setRobberNewRole(targetPlayer.currentRole); 
          
          const payload = {
              actorId: me.id,
              targetPlayerId: targetId,
              actionType: 'SWAP'
          };

          await performNightAction(game.id, payload as any);
          
          setRobberState('SWAPPING');
          setTimeout(() => {
              setRobberState('REVEALED');
          }, 600); 
          return;
      }

      // STANDARD ACTION
      const payload = {
          actorId: me.id,
          targetPlayerId: selectedPlayers[0],
          secondTargetPlayerId: selectedPlayers[1],
          thirdTargetPlayerId: selectedPlayers[2],
          targetCenterId: selectedCenter[0],
          secondTargetCenterId: selectedCenter[1],
          actionType: actionType
      };

      try {
          await performNightAction(game.id, payload as any);
      } catch (err) {
          setStep('SELECTING');
          return;
      }

      // Visual Feedback Logic
      const newRevealed: Record<string, RoleID> = {};
      const newSwapping: string[] = [];
      let msg = "";

      if (['SEER', 'WEREWOLF', 'INSOMNIAC', 'APPRENTICE_SEER', 'MYSTIC_WOLF', 'EXPOSER', 'PARANORMAL_INVESTIGATOR', 'COPYCAT', 'DOPPELGANGER', 'REVEALER', 'MORTICIAN'].includes(activeRoleID)) {
          selectedPlayers.forEach(pid => {
             const p = game.players[pid];
             if (p) newRevealed[pid] = p.currentRole;
          });
          selectedCenter.forEach(cid => {
             const c = game.centerCards.find(card => card.id === cid);
             if (c) newRevealed[cid] = c.role;
          });
          if (activeRoleID === RoleID.INSOMNIAC) newRevealed[me.id] = me.currentRole;

          if (activeRoleID === RoleID.REVEALER) {
             const target = game.players[selectedPlayers[0]];
             const targetMeta = ROLE_METADATA[target.currentRole];
             if (targetMeta.team === Team.GOOD) {
                 msg = `Revealed ${target.name} (${targetMeta.name}). Stays face up!`;
             } else {
                 msg = `Revealed ${target.name} (${targetMeta.name}). Flips back over.`;
             }
          }
      }
      
      if (['TROUBLEMAKER', 'DRUNK', 'WITCH', 'GREMLIN'].includes(activeRoleID)) {
          newSwapping.push(...selectedPlayers, ...selectedCenter);
          if (activeRoleID === RoleID.DRUNK) {
             newSwapping.push(me.id);
             setInfoMessage("Swapped with Center");
          } else {
             setInfoMessage("Cards Swapped!");
          }
      }
      
      if (activeRoleID === RoleID.SENTINEL) {
          setInfoMessage("Shield Deployed 🛡️");
      }

      setSwappingIds(newSwapping);
      setRevealedIds(newRevealed);
      if (msg) setInfoMessage(msg);

      if (activeRoleID === RoleID.COPYCAT && selectedCenter.length === 1) {
          const c = game.centerCards.find(card => card.id === selectedCenter[0]);
          if (c && !COPYCAT_DEFERRED_ROLES.has(c.role)) {
              const normalizedRole = c.role === RoleID.WEREWOLF_2 ? RoleID.WEREWOLF : c.role === RoleID.MASON_2 ? RoleID.MASON : c.role;
              setCopycatPhase('COPY');
              setCopycatTransitionRole(normalizedRole);
              setTimeout(() => {
                  setCopycatCopiedRole(normalizedRole);
                  setCopycatPhase('ACTION');
                  setStep('SELECTING');
                  setSelectedPlayers([]);
                  setSelectedCenter([]);
                  setRevealedIds({});
                  setSwappingIds([]);
                  setInfoMessage('');
                  setRobberState('IDLE');
                  setRobberNewRole(null);
                  setTmStyles({});
                  setPiState({ checks: 0, becomeEvil: false, finished: false });
                  setWitchState({ centerId: null, centerRole: null, swapped: false });
                  setViDirection(null);
              }, 1200);
              return;
          }
      }

      if (activeRoleID === RoleID.DOPPELGANGER && selectedPlayers.length === 1) {
          const p = game.players[selectedPlayers[0]];
          if (p && !p.shielded && DOPPELGANGER_IMMEDIATE_ROLES.has(p.currentRole) && p.originalRole !== RoleID.COPYCAT) {
              const normalizedRole = p.currentRole === RoleID.WEREWOLF_2 ? RoleID.WEREWOLF : p.currentRole === RoleID.MASON_2 ? RoleID.MASON : p.currentRole;
              setCopycatPhase('COPY');
              setCopycatTransitionRole(normalizedRole);
              setTimeout(() => {
                  setCopycatCopiedRole(normalizedRole);
                  setCopycatPhase('ACTION');
                  setStep('SELECTING');
                  setSelectedPlayers([]);
                  setSelectedCenter([]);
                  setRevealedIds({});
                  setSwappingIds([]);
                  setInfoMessage('');
                  setRobberState('IDLE');
                  setRobberNewRole(null);
                  setTmStyles({});
                  setPiState({ checks: 0, becomeEvil: false, finished: false });
                  setWitchState({ centerId: null, centerRole: null, swapped: false });
                  setViDirection(null);
              }, 1200);
              return;
          }
      }

      setTimeout(() => setStep('FINISHED'), 1200);
  };

  const handleNostraFinish = async () => {
      setStep('ANIMATING');
      const payload = {
          actorId: me.id,
          targetPlayerId: selectedPlayers[0],
          secondTargetPlayerId: selectedPlayers[1],
          actionType: 'VIEW'
      };
      await performNightAction(game.id, payload as any);
      setStep('FINISHED');
  };

  const handleSquireFinish = async () => {
      setStep('ANIMATING');
      await performNightAction(game.id, {
          actorId: me.id,
          actionType: 'VIEW', 
      } as any);
      setStep('FINISHED');
  };

  const handleFinish = async () => {
      if (copycatPhase === 'COPY') return;
      await advanceNightTurn(game.id);
  };

  // ------------------------------------------------------------------
  // INLINE CARD COMPONENT
  // ------------------------------------------------------------------
  const NightCard: React.FC<{ 
      id: string, label: string, role?: RoleID, isCenter?: boolean, 
      isSelected: boolean, isRevealed: boolean, isSwapping: boolean, isShielded?: boolean,
      onClick: () => void, disabled: boolean, innerRef?: React.Ref<HTMLButtonElement>, style?: React.CSSProperties,
      className?: string
  }> = ({ 
      id, label, role, isCenter, isSelected, isRevealed, isSwapping, isShielded, onClick, disabled, innerRef, style, className 
  }) => {
      const revealedRole = isRevealed && role ? role : null;
      const meta = revealedRole ? ROLE_METADATA[revealedRole] : null;

      // Special rotation for Alpha Wolf Center Card
      const isAlphaCenter = id === 'center-alpha';

      return (
          <div className="flex flex-col items-center relative group-container">
            <button
                ref={innerRef}
                onClick={onClick}
                disabled={disabled}
                style={style}
                className={`
                    relative w-28 h-40 rounded-xl transition-all duration-500 transform-style-3d cursor-pointer group
                    ${isSelected 
                        ? 'ring-4 ring-primary scale-110 -translate-y-2 z-10 shadow-[0_0_20px_rgba(18,184,134,0.5)]' 
                        : 'scale-110 hover:scale-115 z-0'
                    }
                    ${style ? 'troublemaker-card' : isSwapping ? 'animate-swap' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isAlphaCenter ? 'rotate-90 scale-90 border-2 border-red-500' : ''}
                    ${className || ''}
                `}
            >
                {/* Shield Token */}
                {isShielded && (
                     <div key={`shield-${id}-${isShielded ? 'on' : 'off'}`} className="shield-token">🛡️</div>
                )}
                
                <div className={`
                    w-full h-full relative transition-transform duration-700 transform-style-3d
                    ${isRevealed ? 'rotate-y-180' : ''}
                `}>
                    {/* FRONT (Hidden State) */}
                    <div className="absolute inset-0 backface-hidden bg-[#0c0e1a] border-2 border-[#2a2545] rounded-xl flex items-center justify-center shadow-lg" style={{ boxShadow: 'inset 0 1px 0 rgba(220,245,235,0.04), 0 0 8px rgba(0,0,0,0.5)' }}>
                        <span className="text-3xl sm:text-4xl font-display text-[#3a3555] font-bold opacity-60">?</span>
                        {isSelected && <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs text-white">✓</div>}
                    </div>

                    {/* BACK (Revealed State) */}
                    <div className={`
                        absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-[#0e0f1a] border-2 flex flex-col items-center justify-center p-2 shadow-xl
                        ${meta?.team === Team.GOOD ? 'border-good shadow-good/20' : meta?.team === Team.EVIL ? 'border-evil shadow-evil/20' : 'border-independent shadow-independent/20'}
                    `}>
                        {meta && (
                            <>
                                <RoleIcon role={revealedRole!} className="w-16 h-16 mb-1" />
                                <span className="text-sm font-bold text-center leading-tight text-white">{meta.name}</span>
                            </>
                        )}
                    </div>
                </div>
            </button>
            <span 
                className={`
                    relative z-20 mt-3 font-bold transition-colors text-center whitespace-nowrap
                    ${isSelected ? 'text-primary' : 'text-gray-200'}
                `}
                style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.2',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
            >
                {label}
            </span>
          </div>
      );
  };

  // ------------------------------------------------------------------
  // ROBBER SPECIAL UI & HEADER/RENDER HELPERS
  // ------------------------------------------------------------------
  
  if (activeRoleID === RoleID.ROBBER && robberState !== 'IDLE') {
      const targetName = selectedPlayers.length > 0 ? game.players[selectedPlayers[0]].name : "Target";
      return (
          <div className="min-h-[100dvh] pt-20 sm:pt-16 bg-background flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden">
               <style>{`
                  @keyframes cardSwapRight { 0% { transform: translateX(0); z-index: 20; } 50% { transform: translateX(50%) scale(1.1); z-index: 20; } 100% { transform: translateX(100%); z-index: 20; } }
                  @keyframes cardSwapLeft { 0% { transform: translateX(0); z-index: 10; } 50% { transform: translateX(-50%) scale(0.9); z-index: 10; } 100% { transform: translateX(-100%); z-index: 10; } }
                  .animate-swap-right { animation: cardSwapRight 0.6s ease-in-out forwards; }
                  .animate-swap-left { animation: cardSwapLeft 0.6s ease-in-out forwards; }
                  .glow-text { text-shadow: 0 0 20px rgba(18,184,134,0.6); }
               `}</style>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[200px] bg-primary/10 blur-[80px] pointer-events-none"></div>
               <div className="flex gap-2 sm:gap-4 sm:gap-2 sm:gap-4 sm:p-6 sm:p-8 relative mb-12">
                   <div className="flex flex-col items-center">
                       <div className={`relative w-28 h-40 ${robberState === 'SWAPPING' ? 'animate-swap-right' : 'translate-x-[100%]'}`}>
                           {robberState === 'REVEALED' ? (
                               <RoleCard role={robberNewRole!} revealed={true} size="md" className="border-4 border-primary shadow-[0_0_30px_rgba(18,184,134,0.6)] animate-flip-in" />
                           ) : (
                               <div className="w-full h-full bg-gray-800 border-2 border-gray-600 rounded-xl flex items-center justify-center">
                                   <span className="text-3xl sm:text-4xl text-gray-500 font-display">?</span>
                               </div>
                           )}
                       </div>
                       {robberState === 'SWAPPING' && <span className="mt-4 text-gray-400 text-sm font-bold">You</span>}
                   </div>
                   <div className="flex flex-col items-center">
                       <div className={`relative w-28 h-40 ${robberState === 'SWAPPING' ? 'animate-swap-left' : 'translate-x-[-100%]'}`}>
                            <div className="w-full h-full bg-gray-800 border-2 border-gray-600 rounded-xl flex items-center justify-center">
                                <span className="text-3xl sm:text-4xl text-gray-500 font-display">?</span>
                            </div>
                       </div>
                       {robberState === 'SWAPPING' && <span className="mt-4 text-gray-400 text-sm font-bold">{targetName}</span>}
                   </div>
               </div>
               {robberState === 'REVEALED' && (
                   <div className="text-center animate-fade-in-up z-20">
                       <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-2 glow-text">
                           Your new role is {ROLE_METADATA[robberNewRole!].name}
                           <RoleIcon role={robberNewRole!} className="inline-block w-8 h-8 ml-2 -mt-1" />
                       </h2>
                       <button onClick={handleFinish} className="mt-8 px-10 py-2 sm:py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-base sm:text-lg shadow-lg hover:scale-105 transition-transform">CONTINUE →</button>
                   </div>
               )}
          </div>
      );
  }

  let headerTitle = roleMeta.name;
  let headerDesc = step === 'FINISHED' ? infoMessage || "Complete" : roleMeta.description;

  if (copycatPhase === 'ACTION' && copycatCopiedRole) {
      const copiedMeta = ROLE_METADATA[copycatCopiedRole];
      headerTitle = `COPYCAT → ${copiedMeta.name}`;
      if (step !== 'FINISHED') headerDesc = copiedMeta.description;
  }
  let nostradamusResult = null;

  if (activeRoleID === RoleID.NOSTRADAMUS) {
      if (selectedPlayers.length === 0) headerDesc = "Tap first player card";
      else if (selectedPlayers.length === 1) {
          const p1 = game.players[selectedPlayers[0]];
          const r1 = revealedIds[selectedPlayers[0]] || p1.currentRole;
          headerDesc = `${p1.name}: ${ROLE_METADATA[r1].name} - Tap second player`;
      } else if (selectedPlayers.length === 2) {
          const p1 = game.players[selectedPlayers[0]];
          const p2 = game.players[selectedPlayers[1]];
          const r1 = revealedIds[p1.id];
          const r2 = revealedIds[p2.id];
          headerDesc = `${p1.name}: ${ROLE_METADATA[r1].name} | ${p2.name}: ${ROLE_METADATA[r2].name}`;
          const lastTeam = ROLE_METADATA[r2].team;
          const teamText = lastTeam === Team.GOOD ? 'GOOD' : lastTeam === Team.EVIL ? 'EVIL' : 'INDEPENDENT';
          nostradamusResult = (<div className="mt-4 text-center animate-fade-in-up"><div className="nostradamus-result uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-moon font-black text-base sm:text-lg sm:text-xl drop-shadow-sm">Your last viewed card team is {teamText}</div></div>);
      }
  }

  // PI HEADER UPDATES
  if (activeRoleID === RoleID.PARANORMAL_INVESTIGATOR) {
      if (piState.becomeEvil) {
          headerTitle = "YOU TURNED EVIL! 👹";
          headerDesc = infoMessage || "You are now part of the bad team.";
      } else if (piState.finished) {
          headerDesc = "Investigation complete. No threats found.";
      } else if (piState.checks === 1) {
          headerDesc = "First was safe. Tap second player...";
      } else {
          headerDesc = "Tap a player to investigate role.";
      }
  }

  // WITCH HEADER UPDATES
  if (activeRoleID === RoleID.WITCH) {
      if (witchState.swapped) {
          headerDesc = "Card swapped! Waiting to finish...";
      } else if (witchState.centerId) {
          const centerRoleName = witchState.centerRole ? ROLE_METADATA[witchState.centerRole].name : "Card";
          headerDesc = `You found ${centerRoleName}. Tap a player to SWAP it with.`;
      } else {
          headerDesc = "Tap a center card to reveal it.";
      }
  }
  
  // VILLAGE IDIOT HEADER
  if (activeRoleID === RoleID.VILLAGE_IDIOT) {
      if (step === 'FINISHED') headerDesc = "Rotation complete.";
      else headerDesc = "Choose a direction to rotate everyone's cards.";
  }

  // MORTICIAN HEADER
  if (activeRoleID === RoleID.MORTICIAN) {
      headerTitle = "MORTICIAN ⚰️";
      headerDesc = "Look at a neighbor's card or your own card.";
  }

  // ALPHA WOLF HEADER
  if (activeRoleID === RoleID.ALPHA_WOLF) {
      headerTitle = "PERPENDICULAR WEREWOLF 🐺";
      headerDesc = "Tap a player to exchange with the center Wolf card.";
  }

  if (isSquire) {
      if (squireEvilPlayers.length > 0) { headerTitle = "EVIL DETECTED! 👿"; headerDesc = "Tap ONLY evil players to inspect"; } 
      else { headerTitle = "Squire"; headerDesc = "No evil detected"; }
  }

  // PSYCHIC UI
  let psychicUI = null;
  if (activeRoleID === RoleID.PSYCHIC) {
      headerTitle = "PSYCHIC 🧠";
      headerDesc = "Read the minds of your neighbors...";
      
      psychicUI = (
          <div className="flex flex-col items-center justify-center animate-fade-in mt-8 w-full">
            <style>{`
            `}</style>
            <h3 className="text-base sm:text-lg sm:text-xl md:text-base sm:text-lg sm:text-xl sm:text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-moon to-primary-light mb-8 tracking-widest text-center leading-relaxed">
                One of your neighbors is a...
            </h3>
            
            <div className="relative mb-8">
                {(step === 'FINISHED' || step === 'ANIMATING') ? (
                    <div className="animate-flip-in">
                        <RoleCard 
                            role={psychicSeenRole || RoleID.VILLAGER} 
                            revealed={true} 
                            size="lg" 
                            className="shadow-[0_0_50px_rgba(18,184,134,0.6)] border-4 border-primary scale-110"
                        />
                    </div>
                ) : (
                    <div className="w-36 sm:w-48 h-72 bg-gray-900 border-4 border-primary/30 rounded-xl flex items-center justify-center shadow-2xl">
                        <span className="text-4xl sm:text-6xl animate-pulse grayscale opacity-50">🧠</span>
                    </div>
                )}
            </div>

            {(step === 'FINISHED' || step === 'ANIMATING') && (
                <p className="text-gray-400 font-bold tracking-widest uppercase text-sm mt-4 animate-fade-in text-center max-w-xs">
                    You don't know which neighbor.
                </p>
            )}
        </div>
      );
  }

  let beholderUI = null;
  if (isBeholder) {
      headerTitle = "BEHOLDER INFO"; headerDesc = "Review Seer locations";
      const seer = (Object.values(game.players) as Player[]).find(p => p.originalRole === RoleID.SEER || (p.originalRole === RoleID.COPYCAT && p.currentRole === RoleID.SEER));
      const appSeer = (Object.values(game.players) as Player[]).find(p => p.originalRole === RoleID.APPRENTICE_SEER || (p.originalRole === RoleID.COPYCAT && p.currentRole === RoleID.APPRENTICE_SEER));
      beholderUI = (
          <div className="w-full max-w-md mt-6 space-y-4 animate-fade-in">
             <div className="bg-gray-800/60 p-4 rounded-xl border border-good/30 flex items-center justify-between shadow-lg">
                 <div className="flex items-center gap-2 sm:gap-3"><RoleIcon role={RoleID.SEER} className="w-8 h-8 sm:w-10 sm:h-10" /><div className="flex flex-col"><span className="font-bold text-gray-300 text-sm uppercase tracking-wider">Seer</span>{seer ? <span className="text-white font-bold text-base sm:text-lg">{seer.name}</span> : <span className="text-gray-500 italic">Not in game</span>}</div></div>
                 {seer && (<div className="text-right"><div className="text-[10px] text-gray-400 uppercase tracking-wide">Current Role</div><div className={`font-bold flex items-center gap-2 justify-end text-sm ${ROLE_METADATA[seer.currentRole].team === Team.EVIL ? 'text-red-400' : 'text-green-400'}`}>{ROLE_METADATA[seer.currentRole].name}<RoleIcon role={seer.currentRole} className="w-5 h-5" /></div></div>)}
             </div>
             <div className="bg-gray-800/60 p-4 rounded-xl border border-primary/30 flex items-center justify-between shadow-lg">
                 <div className="flex items-center gap-2 sm:gap-3"><RoleIcon role={RoleID.APPRENTICE_SEER} className="w-8 h-8 sm:w-10 sm:h-10" /><div className="flex flex-col"><span className="font-bold text-gray-300 text-sm uppercase tracking-wider">Apprentice</span>{appSeer ? <span className="text-white font-bold text-base sm:text-lg">{appSeer.name}</span> : <span className="text-gray-500 italic">Not in game</span>}</div></div>
                 {appSeer && (<div className="text-right"><div className="text-[10px] text-gray-400 uppercase tracking-wide">Current Role</div><div className={`font-bold flex items-center gap-2 justify-end text-sm ${ROLE_METADATA[appSeer.currentRole].team === Team.EVIL ? 'text-red-400' : 'text-green-400'}`}>{ROLE_METADATA[appSeer.currentRole].name}<RoleIcon role={appSeer.currentRole} className="w-5 h-5" /></div></div>)}
             </div>
          </div>
      );
  }

  let auraSeerUI = null;
  if (activeRoleID === RoleID.AURA_SEER) {
      headerTitle = "AURA SEER"; headerDesc = "Players who moved or viewed a card";
      const actorIds = game.nightActors || [];
      const actorPlayers = actorIds
          .map(id => game.players[id])
          .filter(Boolean);
      auraSeerUI = (
          <div className="w-full max-w-md mt-6 animate-fade-in">
              <h2 className="text-cyan-400 font-bold text-base sm:text-lg sm:text-xl mb-4 tracking-widest text-center">AURA DETECTED</h2>
              <div className="bg-cyan-900/20 border-2 border-cyan-500/40 p-4 sm:p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  {actorPlayers.length > 0 ? (
                      <div className="space-y-3">
                          {actorPlayers.map(p => (
                              <div key={p.id} className="flex items-center gap-2 sm:gap-3 bg-gray-800/60 p-3 rounded-lg border border-cyan-500/20">
                                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-base sm:text-lg">🧿</div>
                                  <span className="text-white font-bold text-base sm:text-lg">{p.name}</span>
                                  <span className="ml-auto text-cyan-400 text-sm italic">moved or viewed a card</span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-gray-400 italic text-center">No players moved or viewed any cards.</p>
                  )}
              </div>
          </div>
      );
  }

  if (activeRoleID === RoleID.WEREWOLF) { if (otherEvilPlayers.length > 0) headerDesc = "Allies revealed below"; else headerDesc = "No other evil - check center"; }
  if (activeRoleID === RoleID.MINION) headerDesc = "Review evil players";
  if (activeRoleID === RoleID.MASON) headerDesc = "Find your brother";

  // APPRENTICE TANNER HEADER
  if (activeRoleID === RoleID.APPRENTICE_TANNER) {
      headerTitle = "APPRENTICE TANNER 🎭";
      const tannerPlayer = (Object.values(game.players) as Player[]).find(p => p.originalRole === RoleID.TANNER || (p.originalRole === RoleID.COPYCAT && p.currentRole === RoleID.TANNER));
      if (tannerPlayer) {
          headerDesc = `The Tanner is: ${tannerPlayer.name}`;
      } else {
          headerDesc = "There is no Tanner in this game. You win only if you die.";
      }
  }

  // INSOMNIAC HEADER OVERRIDE
  if (isInsomniac) {
      headerTitle = "INSOMNIAC CHECK";
      headerDesc = step === 'FINISHED' ? (infoMessage.includes("Unchanged") ? "You are still the Insomniac" : "You have been swapped!") : "Checking your role...";
  }

  let visiblePlayers = (Object.values(game.players) as Player[]);
  
  // Sort by seatId for Village Idiot visual clarity
  if (activeRoleID === RoleID.VILLAGE_IDIOT) {
      visiblePlayers = visiblePlayers.sort((a, b) => (a.seatId ?? 0) - (b.seatId ?? 0));
  }
  
  if (activeRoleID === RoleID.THING) {
      const sorted = (Object.values(game.players) as Player[]).sort((a, b) => (a.seatId ?? 0) - (b.seatId ?? 0));
      const myIdx = sorted.findIndex(p => p.id === me.id);
      if (myIdx !== -1 && sorted.length >= 2) {
          const l = (myIdx - 1 + sorted.length) % sorted.length;
          const r = (myIdx + 1) % sorted.length;
          visiblePlayers = [sorted[l], sorted[r]];
      } else visiblePlayers = visiblePlayers.filter(p => p.id !== me.id);
  } else if (activeRoleID === RoleID.MORTICIAN) {
      const sorted = (Object.values(game.players) as Player[]).sort((a, b) => (a.seatId ?? 0) - (b.seatId ?? 0));
      const myIdx = sorted.findIndex(p => p.id === me.id);
      if (myIdx !== -1 && sorted.length >= 2) {
          const l = (myIdx - 1 + sorted.length) % sorted.length;
          const r = (myIdx + 1) % sorted.length;
          visiblePlayers = [sorted[l], me, sorted[r]];
      } else visiblePlayers = [me];
  } else if (isSquire) {
      if (squireEvilPlayers.length > 0) visiblePlayers = squireEvilPlayers; else visiblePlayers = [];
  } else if (isInsomniac) {
      visiblePlayers = [me];
  }

  // Alpha Wolf separate Center Cards
  const standardCenterCards = game.centerCards.filter(c => c.id !== 'center-alpha');
  const alphaCenterCard = game.centerCards.find(c => c.id === 'center-alpha');

  return (
      <div className="min-h-[100dvh] pt-20 sm:pt-16 flex flex-col bg-background text-white relative overflow-y-auto overflow-x-hidden">
          <style>{`
            .transform-style-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
            @keyframes swap-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px) rotate(-2deg); }
                50% { transform: translateX(5px) rotate(2deg); }
                75% { transform: translateX(-5px) rotate(-2deg); }
            }
            .animate-swap { animation: swap-shake 0.5s ease-in-out; border-color: #facc15 !important; }
            @keyframes flip-in { 0% { transform: rotateY(90deg); opacity: 0; } 100% { transform: rotateY(0); opacity: 1; } }
            .animate-flip-in { animation: flip-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            .nostradamus-result { font-family: 'Inter', 'SF Pro', -apple-system, sans-serif; text-shadow: 0 0 20px rgba(18,184,134,0.4); }
            
            @keyframes troublemaker-swap {
              0% { transform: translate(0, 0) rotate(0deg); }
              40% { transform: translate(calc(var(--tx) * 0.4), calc(var(--ty) * 0.4 - 20px)) rotate(8deg); z-index: 100; }
              60% { transform: translate(calc(var(--tx) * 0.6), calc(var(--ty) * 0.6)) rotate(-8deg); z-index: 100; }
              100% { transform: translate(var(--tx), var(--ty)) rotate(0deg); }
            }
            .troublemaker-card {
                will-change: transform;
                backface-visibility: hidden;
                animation: troublemaker-swap 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            /* NEW SHIELD STYLES */
            .shield-token {
                position: absolute;
                top: 8px; 
                right: 8px;
                width: 56px; 
                height: 56px;
                z-index: 50; /* Ensure on top */
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                
                background: rgba(59, 130, 246, 0.25);
                border: 3px solid #3b82f6;
                border-radius: 12px;
                box-shadow: 
                  0 0 20px rgba(59, 130, 246, 0.7),
                  inset 0 0 10px rgba(255,255,255,0.2);
                animation: shieldPulse 2s infinite ease-in-out;
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
                transform: translateZ(0);
                pointer-events: none;
            }
            @keyframes shieldPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.05); }
            }
          `}</style>
          
          <div className="absolute inset-0 bg-gradient-to-b from-[#06030c] via-background to-[#06030c] z-0"></div>
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(100,80,160,0.04) 0%, transparent 50%)' }}></div>

          <div className={`relative z-10 pt-4 pb-2 px-4 text-center border-b border-[#dcf5eb]/8 backdrop-blur-md transform-gpu flex flex-col items-center
             ${(isSquire && squireEvilPlayers.length > 0) || activeRoleID === RoleID.WEREWOLF || activeRoleID === RoleID.MINION || piState.becomeEvil ? 'bg-red-900/20 shadow-[0_0_30px_rgba(153,27,27,0.3)]' : 'bg-[#0d0818]/60'}
          `}>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <RoleIcon role={activeRoleID} className="w-8 h-8" />
                  <h1 className={`text-base sm:text-lg sm:text-xl font-display font-bold ${(isSquire && squireEvilPlayers.length > 0) || activeRoleID === RoleID.WEREWOLF || activeRoleID === RoleID.MINION || piState.becomeEvil ? 'text-red-500 animate-pulse' : 'text-white'}`}>{headerTitle}</h1>
              </div>
              <p className="text-gray-400 text-xs">{headerDesc}</p>
          </div>

          <div className="flex-1 relative z-10 flex flex-col items-center p-4 overflow-y-auto" ref={containerRef}>
              {nostradamusResult}
              {beholderUI}
              {auraSeerUI}
              {psychicUI}

              {activeRoleID === RoleID.WEREWOLF && otherEvilPlayers.length > 0 && (
                  <div className="mt-10 text-center animate-fade-in">
                      <h2 className="text-red-500 font-bold text-base sm:text-lg sm:text-xl sm:text-2xl mb-4 tracking-widest">EVIL ALIGNMENT</h2>
                      <div className="bg-red-900/20 border-2 border-red-600/50 p-4 sm:p-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                          <p className="text-gray-400 text-sm uppercase mb-2">Your Allies</p>
                          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">{otherEvilPlayers.map(p => (<span key={p.id} className="text-base sm:text-lg sm:text-xl font-bold text-white flex items-center gap-2">{p.name} <span className="text-base sm:text-lg sm:text-xl sm:text-2xl">👹</span></span>))}</div>
                      </div>
                  </div>
              )}

              {activeRoleID === RoleID.MINION && (
                  <div className="mt-10 text-center animate-fade-in w-full max-w-md">
                      <h2 className="text-red-500 font-bold text-base sm:text-lg sm:text-xl sm:text-2xl mb-4 tracking-widest">EVIL PLAYERS</h2>
                      <div className="bg-red-900/20 border-2 border-red-600/50 p-4 sm:p-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] mb-6">
                          {otherEvilPlayers.length > 0 ? (<div className="flex flex-wrap gap-2 sm:gap-4 justify-center">{otherEvilPlayers.map(p => (<span key={p.id} className="text-base sm:text-lg sm:text-xl font-bold text-white bg-red-950/50 px-3 py-1 rounded-lg border border-red-500/30">{p.name}</span>))}</div>) : (<p className="text-gray-400 italic">No other evil players found.</p>)}
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 text-sm text-gray-300 leading-relaxed text-left"><strong className="text-primary block mb-1 uppercase text-xs">Winning Conditions</strong>Win if: No evil die OR you’re sole survivor (no Werewolf) OR you die and evil survive.</div>
                  </div>
              )}

              {activeRoleID === RoleID.MASON && (
                  <div className="mt-10 text-center animate-fade-in w-full max-w-md">
                      <h2 className="text-blue-400 font-bold text-base sm:text-lg sm:text-xl sm:text-2xl mb-4 tracking-widest">Ally</h2>
                      <div className="bg-blue-900/20 border-2 border-blue-600/50 p-4 sm:p-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] mb-6">
                          {otherMasons.length > 0 ? (<div className="flex flex-wrap gap-2 sm:gap-4 justify-center">{otherMasons.map(p => (<span key={p.id} className="text-base sm:text-lg sm:text-xl font-bold text-white bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-500/30">{p.name}</span>))}</div>) : (<p className="text-gray-400 italic">No other Masons found.</p>)}
                      </div>
                  </div>
              )}

              {activeRoleID === RoleID.APPRENTICE_TANNER && (() => {
                  const tannerPlayer = (Object.values(game.players) as Player[]).find(p => p.originalRole === RoleID.TANNER || (p.originalRole === RoleID.COPYCAT && p.currentRole === RoleID.TANNER));
                  return (
                      <div className="mt-10 text-center animate-fade-in w-full max-w-md">
                          <h2 className="text-amber-400 font-bold text-base sm:text-lg sm:text-xl sm:text-2xl mb-4 tracking-widest">THE TANNER</h2>
                          <div className="bg-amber-900/20 border-2 border-amber-600/50 p-4 sm:p-6 rounded-xl shadow-[0_0_20px_rgba(217,164,71,0.3)] mb-6">
                              {tannerPlayer ? (
                                  <span className="text-base sm:text-lg sm:text-xl sm:text-2xl font-black text-white bg-amber-950/50 px-4 py-2 rounded-lg border border-amber-500/30">{tannerPlayer.name}</span>
                              ) : (
                                  <div>
                                      <p className="text-base sm:text-lg sm:text-xl font-bold text-amber-300">No Tanner in this game</p>
                                      <p className="text-gray-400 text-sm mt-2">You win only if you die.</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })()}

              {isSquire && squireEvilPlayers.length === 0 && (<div className="mt-20 flex flex-col items-center animate-fade-in"><div className="text-4xl sm:text-6xl mb-4 grayscale opacity-50">🛡️</div><h3 className="text-base sm:text-lg sm:text-xl sm:text-2xl font-bold text-gray-500">No Evil Detected</h3><p className="text-gray-600 text-sm mt-2">The village seems safe... for now.</p></div>)}

              {/* Center Cards Section - NOW INCLUDES ALPHA WOLF */}
              {(maxCenter > 0 || activeRoleID === RoleID.ALPHA_WOLF) && !isSquire && !isBeholder && activeRoleID !== RoleID.NOSTRADAMUS && !isInsomniac && activeRoleID !== RoleID.PARANORMAL_INVESTIGATOR && activeRoleID !== RoleID.WITCH && (
                  <div className="mb-8 w-full">
                      <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest mb-3">Center Cards</p>
                      <div className="flex justify-center items-center gap-2 sm:gap-4">
                          {standardCenterCards.map(c => (
                              <NightCard 
                                key={`${c.id}-${c.role}`} // Force refresh on role change
                                id={c.id} label="Center" role={c.role} isCenter={true}
                                isSelected={selectedCenter.includes(c.id)} isRevealed={!!revealedIds[c.id]} isSwapping={swappingIds.includes(c.id)}
                                disabled={step === 'FINISHED'} onClick={() => handleCenterClick(c.id)}
                                innerRef={(el) => { if (el) itemsRef.current.set(c.id, el); }}
                                style={tmStyles[c.id]}
                              />
                          ))}

                          {/* ALPHA WOLF PERPENDICULAR CARD */}
                          {activeRoleID === RoleID.ALPHA_WOLF && alphaCenterCard && (
                              <div className="ml-8 border-l border-white/10 pl-8">
                                <NightCard 
                                    key={`${alphaCenterCard.id}-${alphaCenterCard.role}`}
                                    id={alphaCenterCard.id} label="Alpha Wolf" role={alphaCenterCard.role} isCenter={true}
                                    isSelected={false} isRevealed={step === 'SELECTING'} isSwapping={swappingIds.includes(alphaCenterCard.id)}
                                    disabled={true} 
                                    onClick={() => {}}
                                    innerRef={(el) => { if (el) itemsRef.current.set(alphaCenterCard.id, el); }}
                                    style={tmStyles[alphaCenterCard.id]}
                                />
                              </div>
                          )}
                      </div>
                  </div>
              )}
              
              {/* WITCH CENTER CARDS (With special selection logic) */}
              {activeRoleID === RoleID.WITCH && (
                  <div className="mb-8 w-full">
                      <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest mb-3">Center Cards</p>
                      <div className="flex justify-center gap-2 sm:gap-4">
                          {standardCenterCards.map(c => (
                              <NightCard 
                                key={`${c.id}-witch`}
                                id={c.id} label="Center" role={revealedIds[c.id] || c.role} isCenter={true}
                                isSelected={witchState.centerId === c.id} 
                                isRevealed={witchState.centerId === c.id} 
                                isSwapping={swappingIds.includes(c.id)}
                                disabled={step === 'FINISHED' || (!!witchState.centerId && witchState.centerId !== c.id)} 
                                onClick={() => handleCenterClick(c.id)}
                                innerRef={(el) => { if (el) itemsRef.current.set(c.id, el); }}
                                style={tmStyles[c.id]}
                              />
                          ))}
                      </div>
                  </div>
              )}

              {((maxPlayers > 0 || activeRoleID === RoleID.NOSTRADAMUS) || (isSquire && squireEvilPlayers.length > 0) || isInsomniac || activeRoleID === RoleID.PARANORMAL_INVESTIGATOR || (activeRoleID === RoleID.WITCH && witchState.centerId) || activeRoleID === RoleID.VILLAGE_IDIOT || activeRoleID === RoleID.ALPHA_WOLF) && (
                  <div className={`w-full max-w-lg mt-4 ${isSquire ? 'p-4 rounded-3xl bg-red-900/10 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : ''}`}>
                      {!isInsomniac && <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest mb-3">Players</p>}
                      <div className={`grid ${isInsomniac ? 'grid-cols-1 justify-center' : 'grid-cols-3'} gap-x-2 gap-y-6 place-items-center`}>
                          {visiblePlayers.map(p => {
                              const roleToReveal = revealedIds[p.id] || p.currentRole; 
                              // Visual check: Show shield if DB says so, OR if Sentinel just selected them (instant feedback)
                              const showShield = p.shielded || (activeRoleID === RoleID.SENTINEL && selectedPlayers.includes(p.id));

                              return (
                                  <NightCard 
                                    key={`${p.id}-${p.currentRole}`} // Force refresh on role change to clear animation artifacts
                                    id={p.id} label={p.name} role={roleToReveal}
                                    isSelected={selectedPlayers.includes(p.id)} isRevealed={!!revealedIds[p.id]} isSwapping={swappingIds.includes(p.id)}
                                    isShielded={showShield}
                                    disabled={step === 'FINISHED' || (p.id === me.id && ![RoleID.INSOMNIAC, RoleID.GREMLIN, RoleID.PRIEST, RoleID.ASSASSIN, RoleID.MORTICIAN].includes(activeRoleID)) || activeRoleID === RoleID.VILLAGE_IDIOT}
                                    onClick={() => handlePlayerClick(p.id)}
                                    innerRef={(el) => { if (el) itemsRef.current.set(p.id, el); }}
                                    style={tmStyles[p.id]}
                                    // Add glow for Alpha Wolf
                                    className={activeRoleID === RoleID.ALPHA_WOLF && p.id !== me.id ? "hover:ring-2 hover:ring-primary hover:shadow-[0_0_15px_rgba(18,184,134,0.5)]" : ""}
                                  />
                              );
                          })}
                      </div>
                  </div>
              )}

              {maxPlayers === 0 && maxCenter === 0 && !isBeholder && infoMessage && activeRoleID !== RoleID.MINION && activeRoleID !== RoleID.WEREWOLF && activeRoleID !== RoleID.MASON && !witchState.swapped && activeRoleID !== RoleID.VILLAGE_IDIOT && activeRoleID !== RoleID.ALPHA_WOLF && activeRoleID !== RoleID.PSYCHIC && (
                   <div className="mt-10 p-4 sm:p-6 bg-gray-800/50 rounded-xl border border-white/10 text-center animate-fade-in">
                       <h3 className="text-primary font-bold mb-2">Information</h3>
                       <p className="text-white">{infoMessage}</p>
                   </div>
              )}
          </div>

          <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-[#06030c] via-[#06030c]/90 to-transparent border-t border-[#dcf5eb]/5">
              {step === 'SELECTING' ? (
                  activeRoleID === RoleID.NOSTRADAMUS ? (
                      <button onClick={handleNostraFinish} disabled={selectedPlayers.length < 2} className={`w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest shadow-lg transition-all transform ${selectedPlayers.length === 2 ? 'bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.02] shadow-primary/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>{selectedPlayers.length < 2 ? 'SELECT 2 CARDS' : 'CONTINUE →'}</button>
                  ) : isSquire ? (
                      <button onClick={handleSquireFinish} className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg transition-all transform hover:scale-[1.02] shadow-red-500/30">CONTINUE →</button>
                  ) : activeRoleID === RoleID.PARANORMAL_INVESTIGATOR ? (
                        <button 
                            onClick={handleFinish} 
                            disabled={!piState.finished && !piState.becomeEvil} 
                            className={`w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest shadow-lg transition-all transform 
                                ${piState.finished || piState.becomeEvil 
                                    ? 'bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.02] shadow-primary/30 animate-pulse' 
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {piState.becomeEvil ? 'END TURN (EVIL)' : piState.finished ? 'CONTINUE' : 'INVESTIGATE...'}
                        </button>
                  ) : activeRoleID === RoleID.WITCH ? (
                        <button 
                            disabled={true} 
                            className={`w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest shadow-lg transition-all bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5`}
                        >
                            {witchState.swapped ? 'SWAPPING...' : witchState.centerId ? 'TAP PLAYER TO SWAP' : 'TAP CENTER CARD'}
                        </button>
                  ) : activeRoleID === RoleID.VILLAGE_IDIOT ? (
                        <div className="flex gap-2 sm:gap-4">
                           <button onClick={() => handleVillageIdiotRotate('CLOCKWISE')} className="flex-1 py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg tracking-widest bg-gradient-to-r from-primary to-primary-light text-white shadow-lg transition-all transform hover:scale-[1.02]">
                               CLOCKWISE ⭕
                           </button>
                           <button onClick={() => handleVillageIdiotRotate('ANTI-CLOCKWISE')} className="flex-1 py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg tracking-widest bg-gradient-to-r from-accent to-evil text-white shadow-lg transition-all transform hover:scale-[1.02]">
                               COUNTER-CLOCK ↺
                           </button>
                        </div>
                  ) : activeRoleID === RoleID.ALPHA_WOLF ? (
                      <button 
                        disabled={true}
                        className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5 shadow-lg"
                      >
                          TAP PLAYER TO SWAP
                      </button>
                  ) : activeRoleID === RoleID.PSYCHIC ? (
                      <button 
                        onClick={handlePsychicReveal}
                        className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gradient-to-r from-primary to-primary-light text-white shadow-lg transition-all transform hover:scale-[1.02] shadow-primary/30"
                      >
                          READ MINDS
                      </button>
                  ) : (
                      activeRoleID === RoleID.MASON ? (
                          (game.masonReadyPlayers || []).includes(me.id) ? (
                              <button disabled className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gray-800 text-gray-400 cursor-not-allowed shadow-lg">Waiting for other Mason...</button>
                          ) : (
                              <button onClick={() => toggleMasonReady(game.id, me.id)} className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gradient-to-r from-primary to-accent text-white shadow-lg transition-all transform hover:scale-[1.02] shadow-primary/30">CONTINUE</button>
                          )
                      ) : (
                          <button onClick={actionBtnText === "CONTINUE" ? handleFinish : executeAction} disabled={!isSelectionValid() || isInsomniac} className={`w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest shadow-lg transition-all transform ${isSelectionValid() && !isInsomniac ? 'bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.02] shadow-primary/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>{actionBtnText}</button>
                      )
                  )
              ) : copycatPhase === 'COPY' ? (
                  <button disabled className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gray-800 text-gray-400 cursor-not-allowed shadow-lg animate-pulse">
                      Becoming {copycatTransitionRole ? ROLE_METADATA[copycatTransitionRole]?.name : ''}...
                  </button>
              ) : (
                  <button onClick={handleFinish} className="w-full py-2 sm:py-4 rounded-2xl font-black text-base sm:text-lg sm:text-xl tracking-widest bg-gray-700 hover:bg-gray-600 text-white shadow-lg transition-all animate-bounce">CONTINUE →</button>
              )}
          </div>
          <SeatingButton players={Object.values(game.players) as Player[]} />
      </div>
  );
};

export default NightPhase;
