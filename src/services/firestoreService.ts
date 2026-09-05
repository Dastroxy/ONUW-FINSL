
import { db } from '../config/firebase';
import { collection, doc, setDoc, updateDoc, getDoc, onSnapshot, arrayUnion, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { GameState, GamePhase, RoleID, Player, CenterCard, NightActionPayload, Team } from '../types';
import { ROLE_METADATA, NIGHT_SEQUENCE } from '../constants';
import { ArtifactID, ARTIFACT_METADATA, DEFAULT_CURATOR_ARTIFACTS } from '../constants/artifacts';

const GAMES_COLLECTION = 'games';

export const COPYCAT_DEFERRED_ROLES = new Set<RoleID>([
  RoleID.MINION, RoleID.SQUIRE, RoleID.BEHOLDER, RoleID.INSOMNIAC,
  RoleID.MORTICIAN, RoleID.MASON, RoleID.MASON_2, RoleID.APPRENTICE_TANNER,
  RoleID.DREAM_WOLF, RoleID.AURA_SEER,
]);

export const DOPPELGANGER_IMMEDIATE_ROLES = new Set<RoleID>([
  RoleID.SEER, RoleID.ROBBER, RoleID.TROUBLEMAKER, RoleID.DRUNK,
  RoleID.SENTINEL, RoleID.ALPHA_WOLF, RoleID.MYSTIC_WOLF, RoleID.APPRENTICE_SEER,
  RoleID.PARANORMAL_INVESTIGATOR, RoleID.WITCH, RoleID.VILLAGE_IDIOT,
  RoleID.DISEASED, RoleID.CUPID, RoleID.INSTIGATOR, RoleID.THING
]);

export const DOPPELGANGER_DEFERRED_ROLES = new Set<RoleID>([
  RoleID.MASON, RoleID.MASON_2, RoleID.WEREWOLF, RoleID.WEREWOLF_2,
  RoleID.MINION, RoleID.INSOMNIAC, RoleID.REVEALER, RoleID.CURATOR,
  RoleID.VAMPIRE, RoleID.THE_COUNT, RoleID.RENFIELD, RoleID.PRIEST,
  RoleID.ASSASSIN, RoleID.APPRENTICE_ASSASSIN, RoleID.MARKSMAN,
  RoleID.PICKPOCKET, RoleID.GREMLIN, RoleID.PSYCHIC, RoleID.EXPOSER,
  RoleID.MORTICIAN, RoleID.AURA_SEER, RoleID.APPRENTICE_TANNER,
  RoleID.SQUIRE, RoleID.BEHOLDER
]);

const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

// Helper to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  return array.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

export const createGame = async (hostName: string, hostUid: string, icon?: string) => {
  const roomCode = generateRoomCode();
  const gameRef = doc(db, GAMES_COLLECTION, roomCode);
  
  const hostPlayer: Player = {
    id: hostUid,
    name: hostName,
    icon: icon,
    seatId: null,
    originalRole: RoleID.VILLAGER, // Placeholder
    currentRole: RoleID.VILLAGER,
    marks: [],
    artifact: null,
    shielded: false,
    isRevealed: false,
    isHost: true,
    votedFor: null,
    joined: Date.now()
  };

  const initialGameState: GameState = {
    id: roomCode,
    phase: GamePhase.LOBBY,
    players: { [hostUid]: hostPlayer },
    selectedRoles: [],
    centerCards: [],
    nightQueue: [],
    currentNightRoleIndex: -1,
    timerEnd: null,
    logs: [],
    createdAt: Date.now(),
    winner: null,
    winningTeam: null,
    dealReadyPlayers: [],
    masonReadyPlayers: [],
    discussionReadyPlayers: [],
    exposedCenterCardIds: [],
    eliminatedIds: [],
    voteCounts: {},
    nostradamusAnnouncement: null,
    thingTarget: null,
    nightActors: []
  };

  await setDoc(gameRef, initialGameState);
  return roomCode;
};

export const joinGame = async (gameId: string, playerName: string, playerUid: string, icon?: string, baseUid?: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) throw new Error("Game not found");
  
  const game = snap.data() as GameState;
  
  let existingPlayerId = null;
  if (game.players[playerUid]) {
    existingPlayerId = playerUid;
  } else if (baseUid) {
    const players = Object.values(game.players) as Player[];
    const match = players.find(p => p.id.startsWith(baseUid + '_'));
    if (match) existingPlayerId = match.id;
  }

  if (existingPlayerId) {
    // If player rejoins in lobby, update their icon and name
    if (game.phase === GamePhase.LOBBY) {
      await updateDoc(gameRef, {
        [`players.${existingPlayerId}.name`]: playerName,
        [`players.${existingPlayerId}.icon`]: icon || null
      });
    }
    return existingPlayerId;
  }

  if (game.phase !== GamePhase.LOBBY) throw new Error("Game already started");

  const newPlayer: Player = {
    id: playerUid,
    name: playerName,
    icon: icon,
    seatId: null,
    originalRole: RoleID.VILLAGER,
    currentRole: RoleID.VILLAGER,
    marks: [],
    artifact: null,
    shielded: false,
    isRevealed: false,
    isHost: false,
    votedFor: null,
    joined: Date.now()
  };

  await updateDoc(gameRef, {
    [`players.${playerUid}`]: newPlayer
  });
};

export const claimSeat = async (gameId: string, playerId: string, seatId: number | null) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    [`players.${playerId}.seatId`]: seatId
  });
};

export const advanceToSeating = async (gameId: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
      phase: GamePhase.SEATING
  });
};

export const advanceToRoles = async (gameId: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
      phase: GamePhase.ROLES
  });
};

// Replaced updateRoles with a real-time toggle
export const toggleRoleSelection = async (gameId: string, role: RoleID, isAdding: boolean) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    if (isAdding) {
        await updateDoc(gameRef, { selectedRoles: arrayUnion(role) });
    } else {
        const snap = await getDoc(gameRef);
        const roles = snap.data()?.selectedRoles || [];
        const newRoles = roles.filter((r: RoleID) => r !== role);
        await updateDoc(gameRef, { selectedRoles: newRoles });
    }
}

// Deprecated in favor of toggleRoleSelection, but kept for compatibility if needed
export const updateRoles = async (gameId: string, roles: RoleID[]) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, { selectedRoles: roles });
};

export const updateCuratorArtifacts = async (gameId: string, artifacts: string[]) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, { curatorArtifacts: artifacts });
};

export const applyArtifactRoleChanges = (game: GameState, updates: any) => {
  Object.values(game.players).forEach((p: Player) => {
    const artifact = updates[`players.${p.id}.artifact`] !== undefined 
      ? updates[`players.${p.id}.artifact`] 
      : p.artifact;
    if (artifact && ARTIFACT_METADATA[artifact as ArtifactID]) {
      const meta = ARTIFACT_METADATA[artifact as ArtifactID];
      if (meta.isRoleChanging && meta.associatedRole) {
        updates[`players.${p.id}.currentRole`] = meta.associatedRole;
        updates[`players.${p.id}.marks`] = []; // Overwrite cards and marks
      }
    }
  });
};

export const startGameSetup = async (gameId: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  const game = snap.data() as GameState;

  // 1. Assign Roles
  const playerIds = Object.keys(game.players);
  const shuffledRoles = shuffle([...game.selectedRoles]);
  
  if (shuffledRoles.length !== playerIds.length + 3) {
    throw new Error("Invalid number of roles");
  }

  const updates: any = {
    phase: GamePhase.DEAL,
    centerCards: [],
    logs: [],
    winner: null,
    winningTeam: null,
    dealReadyPlayers: [],
    masonReadyPlayers: [],
    exposedCenterCardIds: [],
    eliminatedIds: [],
    voteCounts: {},
    nostradamusAnnouncement: null,
    thingTarget: null,
    nightActors: []
  };

  if (game.selectedRoles.includes(RoleID.CURATOR)) {
    updates.curatorArtifacts = (game.curatorArtifacts && game.curatorArtifacts.length > 0)
      ? game.curatorArtifacts
      : DEFAULT_CURATOR_ARTIFACTS;
  }

  playerIds.forEach((pid, index) => {
    const role = shuffledRoles[index];
    updates[`players.${pid}.originalRole`] = role;
    updates[`players.${pid}.currentRole`] = role;
    updates[`players.${pid}.votedFor`] = null;
    updates[`players.${pid}.marks`] = ['MARK_OF_CLARITY']; // "all players automatically receive a Mark of Clarity"
    updates[`players.${pid}.shielded`] = false;
    updates[`players.${pid}.isRevealed`] = false;
    updates[`players.${pid}.artifact`] = null;
    updates[`players.${pid}.nostradamusRole`] = null;
  });

  // Center cards
  let nostradamusInCenter = false;
  for (let i = 0; i < 3; i++) {
    const role = shuffledRoles[playerIds.length + i];
    if (role === RoleID.NOSTRADAMUS) nostradamusInCenter = true;
    updates.centerCards.push({
      id: `center-${i}`,
      role: role,
      marks: []
    });
  }

  // ALPHA WOLF EXTRA CARD LOGIC
  // If Alpha Wolf is in the game (either in player hand or center), we add a 4th "Center Werewolf" card.
  if (game.selectedRoles.includes(RoleID.ALPHA_WOLF)) {
      updates.centerCards.push({
          id: 'center-alpha',
          role: RoleID.WEREWOLF,
          marks: []
      });
  }

  // Handle Nostradamus in Center: "shows random team if Nostradamus is in the center"
  if (nostradamusInCenter) {
     const teams = ["Village", "Werewolf", "Independent"];
     const randomTeam = teams[Math.floor(Math.random() * teams.length)];
     updates.nostradamusAnnouncement = `Nostradamus saw ${randomTeam} Team`;
  }

  // Calculate Night Queue
  const playerRolesList = shuffledRoles.slice(0, playerIds.length);
  const playerRolesSet = new Set(playerRolesList);
  
  // Filter the NIGHT_SEQUENCE
  // Important: Ensure base roles trigger if variants are present
  const queue = NIGHT_SEQUENCE.filter(r => {
      if (r === RoleID.WEREWOLF) return playerRolesSet.has(RoleID.WEREWOLF) || playerRolesSet.has(RoleID.WEREWOLF_2);
      if (r === RoleID.MASON) return playerRolesSet.has(RoleID.MASON) || playerRolesSet.has(RoleID.MASON_2);
      return playerRolesSet.has(r);
  });
  
  updates.nightQueue = queue;
  updates.currentNightRoleIndex = -1;
  updates.discussionReadyPlayers = [];

  await updateDoc(gameRef, updates);
};

export const startNight = async (gameId: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  const game = snap.data() as GameState;
  
  // If no roles have night actions (e.g. all Villagers/Tanners), skip to discussion
  if (game.nightQueue.length === 0) {
      await updateDoc(gameRef, {
        phase: GamePhase.DISCUSSION,
        timerEnd: Date.now() + 5 * 60 * 1000,
        discussionReadyPlayers: []
      });
  } else {
      await updateDoc(gameRef, {
        phase: GamePhase.NIGHT,
        currentNightRoleIndex: 0
      });
  }
};

export const toggleDealReady = async (gameId: string, playerId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const shouldStartNight = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(gameRef);
        const game = snap.data() as GameState;
        if (game.phase !== GamePhase.DEAL) return false;

        const readyList = game.dealReadyPlayers || [];
        if (readyList.includes(playerId)) return false;

        const newList = [...readyList, playerId];
        if (newList.length === Object.keys(game.players).length) {
            return true;
        } else {
            transaction.update(gameRef, { dealReadyPlayers: newList });
            return false;
        }
    });

    if (shouldStartNight) {
        await startNight(gameId);
    }
};

export const toggleMasonReady = async (gameId: string, playerId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const shouldAdvance = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(gameRef);
        const game = snap.data() as GameState;

        const readyList = game.masonReadyPlayers || [];
        if (readyList.includes(playerId)) return false;

        const newList = [...readyList, playerId];
        const players = Object.values(game.players) as Player[];
        const totalMasons = players.filter(p =>
            p.originalRole === RoleID.MASON || p.originalRole === RoleID.MASON_2 ||
            (p.originalRole === RoleID.COPYCAT && (p.currentRole === RoleID.MASON || p.currentRole === RoleID.MASON_2))
        ).length;

        if (newList.length >= totalMasons) {
            return true;
        } else {
            transaction.update(gameRef, { masonReadyPlayers: newList });
            return false;
        }
    });

    if (shouldAdvance) {
        const gameRef2 = doc(db, GAMES_COLLECTION, gameId);
        const snap = await getDoc(gameRef2);
        const game = snap.data() as GameState;
        const updates: any = { masonReadyPlayers: [], thingTarget: null };
        let nextIndex = game.currentNightRoleIndex + 1;
        updates.currentNightRoleIndex = nextIndex;
        if (nextIndex >= game.nightQueue.length) {
            updates.phase = GamePhase.DISCUSSION;
            updates.timerEnd = Date.now() + 5 * 60 * 1000;
            updates.discussionReadyPlayers = [];
            applyArtifactRoleChanges(game, updates);
        }
        await updateDoc(gameRef2, updates);
    }
};

export const performNightAction = async (gameId: string, payload: NightActionPayload) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  const game = snap.data() as GameState;
  
  const updates: any = {};
  const logs: string[] = [...game.logs];
  const actor = { ...game.players[payload.actorId] };
  // Copycat acting as copied role: override originalRole so downstream handlers trigger
  if (((actor.originalRole === RoleID.COPYCAT || actor.originalRole === RoleID.DOPPELGANGER) && actor.currentRole !== actor.originalRole)) {
      actor.originalRole = (actor as any).copiedRole || actor.currentRole;
  }
  const roleName = ROLE_METADATA[actor.originalRole]?.name || 'Unknown';
  
  // --- BASE GAME ---
  
  if (payload.actionType === 'SWAP') {
    // SHIELD CHECK (Server-side safety)
    if ((payload.targetPlayerId && game.players[payload.targetPlayerId].shielded) || 
        (payload.secondTargetPlayerId && game.players[payload.secondTargetPlayerId].shielded)) {
         logs.push(`${actor.name} (${roleName}) tried to swap but was blocked by a shield 🛡️`);
         updates.logs = logs;
         await updateDoc(gameRef, updates);
         return;
    }

    // TROUBLEMAKER: Swap two other players
    if (payload.targetPlayerId && payload.secondTargetPlayerId && payload.actorId !== payload.targetPlayerId && payload.actorId !== payload.secondTargetPlayerId) {
       const p1 = game.players[payload.targetPlayerId];
       const p2 = game.players[payload.secondTargetPlayerId];
       updates[`players.${p1.id}.currentRole`] = p2.currentRole;
       updates[`players.${p2.id}.currentRole`] = p1.currentRole;
       logs.push(`${actor.name} (Troublemaker) swapped ${p1.name} ↔ ${p2.name} 🔄`);
    } 
    // ROBBER: Swap self with target
    else if (payload.targetPlayerId && !payload.secondTargetPlayerId && actor.originalRole === RoleID.ROBBER) {
      const target = game.players[payload.targetPlayerId];
      const stolenRole = target.currentRole;
      const stolenMeta = ROLE_METADATA[stolenRole];
      
      updates[`players.${actor.id}.currentRole`] = stolenRole;
      updates[`players.${target.id}.currentRole`] = actor.currentRole;
      logs.push(`${actor.name} (Robber) swapped with ${target.name} → ${stolenMeta.name} ${stolenMeta.icon}`);
    }
    // DRUNK: Swap self with center
    else if (payload.targetCenterId && actor.originalRole === RoleID.DRUNK) {
        const centerIndex = game.centerCards.findIndex(c => c.id === payload.targetCenterId);
        if (centerIndex !== -1) {
            const centerCard = game.centerCards[centerIndex];
            const playerRole = actor.currentRole;
            const newRoleMeta = ROLE_METADATA[centerCard.role];
            
            // Update center card role
            const newCenterCards = [...game.centerCards];
            newCenterCards[centerIndex] = { ...centerCard, role: playerRole };
            updates.centerCards = newCenterCards;

            // Update player role
            updates[`players.${actor.id}.currentRole`] = centerCard.role;
            logs.push(`${actor.name} (Drunk) swapped with Center Card → ${newRoleMeta.name} ${newRoleMeta.icon}`);
        }
    }
    // WITCH: Swap center with player (must switch)
    else if (payload.targetCenterId && payload.targetPlayerId && actor.originalRole === RoleID.WITCH) {
         const centerIndex = game.centerCards.findIndex(c => c.id === payload.targetCenterId);
         const target = game.players[payload.targetPlayerId];
         if (centerIndex !== -1 && target) {
             const centerCard = game.centerCards[centerIndex];
             const centerMeta = ROLE_METADATA[centerCard.role];
             const targetRole = target.currentRole;
             
             // Update center
             const newCenterCards = [...game.centerCards];
             newCenterCards[centerIndex] = { ...centerCard, role: targetRole };
             updates.centerCards = newCenterCards;

             // Update player
             updates[`players.${target.id}.currentRole`] = centerCard.role;
             logs.push(`${actor.name} (Witch) viewed Center (${centerMeta.name} ${centerMeta.icon}) → swapped with ${target.name}`);
         }
    }
    // ALPHA WOLF: Swap center Wolf with player
    else if (payload.targetPlayerId && actor.originalRole === RoleID.ALPHA_WOLF) {
         // Find center-alpha
         const centerIndex = game.centerCards.findIndex(c => c.id === 'center-alpha');
         if (centerIndex !== -1) {
             const centerCard = game.centerCards[centerIndex];
             const target = game.players[payload.targetPlayerId];
             const targetRole = target.currentRole;

             // Update center with player's role
             const newCenterCards = [...game.centerCards];
             newCenterCards[centerIndex] = { ...centerCard, role: targetRole };
             updates.centerCards = newCenterCards;

             // Update player with CENTER WOLF role (Explicitly Werewolf if it's the perp card)
             updates[`players.${target.id}.currentRole`] = centerCard.role;
             
             logs.push(`${actor.name} (Alpha Wolf) converted ${target.name} → Werewolf 🐺`);
         }
    }
  }
  
  if (payload.actionType === 'VIEW') {
     // SHIELD CHECK for View (Except PI who has custom logic below)
     if (payload.targetPlayerId && game.players[payload.targetPlayerId].shielded && actor.originalRole !== RoleID.PARANORMAL_INVESTIGATOR) {
         logs.push(`${actor.name} (${roleName}) tried to view but was blocked by a shield 🛡️`);
         updates.logs = logs;
         await updateDoc(gameRef, updates);
         return;
     }

     // Generic VIEW Logic for Seer, Insomniac, Apprentice Seer, etc.
     if (payload.targetPlayerId) {
         // SPECIAL HANDLING FOR PSYCHIC (Avoid generic log revealing name)
         if (actor.originalRole === RoleID.PSYCHIC) {
             const t = game.players[payload.targetPlayerId];
             const tm = ROLE_METADATA[t.currentRole];
             logs.push(`${actor.name} (Psychic) saw one neighbor's role: ${tm.name} ${tm.icon}`);
         } else {
             const t = game.players[payload.targetPlayerId];
             const tm = ROLE_METADATA[t.currentRole];
             logs.push(`${actor.name} (${roleName}) viewed ${t.name} → ${tm.name} ${tm.icon}`);
             
             if (payload.secondTargetPlayerId) {
                 const t2 = game.players[payload.secondTargetPlayerId];
                 const tm2 = ROLE_METADATA[t2.currentRole];
                 logs.push(`${actor.name} (${roleName}) viewed ${t2.name} → ${tm2.name} ${tm2.icon}`);
             }
         }
     } 
     
     if (payload.targetCenterId) {
         const c = game.centerCards.find(card => card.id === payload.targetCenterId);
         if (c) {
             const cm = ROLE_METADATA[c.role];
             logs.push(`${actor.name} (${roleName}) viewed Center Card → ${cm.name} ${cm.icon}`);
         }
         
         if (payload.secondTargetCenterId) {
             const c2 = game.centerCards.find(card => card.id === payload.secondTargetCenterId);
             if (c2) {
                 const cm2 = ROLE_METADATA[c2.role];
                 logs.push(`${actor.name} (${roleName}) viewed Center Card → ${cm2.name} ${cm2.icon}`);
             }
         }
     }
     
     if (actor.originalRole === RoleID.SQUIRE && !payload.targetPlayerId && !payload.targetCenterId) {
         logs.push(`${actor.name} (Squire) checked the Evil team.`);
     } else if (actor.originalRole === RoleID.BEHOLDER && !payload.targetPlayerId && !payload.targetCenterId) {
         logs.push(`${actor.name} (Beholder) checked Seers.`);
     }
  }

  // DOPPELGANGER
  if (actor.originalRole === RoleID.DOPPELGANGER && payload.targetPlayerId) {
      if (game.players[payload.targetPlayerId].shielded) {
          logs.push(`${actor.name} (Doppelgänger) blocked by shield 🛡️`);
      } else {
          const target = game.players[payload.targetPlayerId];
          const role = target.currentRole;
          const displayRole = target.originalRole === RoleID.COPYCAT ? RoleID.COPYCAT : role;
          const targetMeta = ROLE_METADATA[displayRole];
          updates[`players.${actor.id}.currentRole`] = role;
          updates[`players.${actor.id}.copiedRole`] = role;
          logs.push(`${actor.name} (Doppelgänger) viewed ${target.name} → ${targetMeta.name} ${targetMeta.icon}`);
          
          const queueRole = (role === RoleID.WEREWOLF_2) ? RoleID.WEREWOLF : (role === RoleID.MASON_2) ? RoleID.MASON : role;
          if (DOPPELGANGER_DEFERRED_ROLES.has(role) && !game.nightQueue.includes(queueRole) && target.originalRole !== RoleID.COPYCAT) {
              const copiedWakeOrder = ROLE_METADATA[queueRole].wakeOrder;
              const newQueue = [...game.nightQueue];
              let insertIdx = newQueue.length;
              for (let i = 0; i < newQueue.length; i++) {
                  if (ROLE_METADATA[newQueue[i]].wakeOrder > copiedWakeOrder) {
                      insertIdx = i;
                      break;
                  }
              }
              newQueue.splice(insertIdx, 0, queueRole);
              updates.nightQueue = newQueue;
          }
      }
  }

  // COPYCAT
  if (actor.originalRole === RoleID.COPYCAT && payload.targetCenterId) {
      const centerIndex = game.centerCards.findIndex(c => c.id === payload.targetCenterId);
      if (centerIndex !== -1) {
          const role = game.centerCards[centerIndex].role;
          const meta = ROLE_METADATA[role];
          updates[`players.${actor.id}.currentRole`] = role;
          updates[`players.${actor.id}.copiedRole`] = role;
          logs.push(`${actor.name} (Copycat) viewed Center → ${meta.name} ${meta.icon}`);

          const queueRole = (role === RoleID.WEREWOLF_2) ? RoleID.WEREWOLF : (role === RoleID.MASON_2) ? RoleID.MASON : role;
          if (COPYCAT_DEFERRED_ROLES.has(role) && !game.nightQueue.includes(queueRole)) {
              const copiedWakeOrder = ROLE_METADATA[queueRole].wakeOrder;
              const newQueue = [...game.nightQueue];
              let insertIdx = newQueue.length;
              for (let i = 0; i < newQueue.length; i++) {
                  if (ROLE_METADATA[newQueue[i]].wakeOrder > copiedWakeOrder) {
                      insertIdx = i;
                      break;
                  }
              }
              newQueue.splice(insertIdx, 0, queueRole);
              updates.nightQueue = newQueue;
          }
      }
  }

  // PARANORMAL_INVESTIGATOR
  if (actor.originalRole === RoleID.PARANORMAL_INVESTIGATOR && payload.targetPlayerId) {
      const target = game.players[payload.targetPlayerId];
      if (target.shielded) {
          logs.push(`${actor.name} (P.I.) checked ${target.name} but was SHIELDED 🛡️`);
      } else {
          // Logic: If NOT Good (Village), become.
          const targetMeta = ROLE_METADATA[target.currentRole];
          if (targetMeta.team !== Team.GOOD) { 
              updates[`players.${actor.id}.currentRole`] = target.currentRole;
              logs.push(`${actor.name} (P.I.) checked ${target.name} → ${targetMeta.name} ${targetMeta.icon} (Became EVIL 👹)`);
          } else {
              logs.push(`${actor.name} (P.I.) checked ${target.name} → ${targetMeta.name} ${targetMeta.icon} (Stays Good)`);
          }
      }
  }

  // REVEALER
  if (actor.originalRole === RoleID.REVEALER && payload.targetPlayerId) {
      if (game.players[payload.targetPlayerId].shielded) {
          logs.push(`${actor.name} (Revealer) tried to reveal ${game.players[payload.targetPlayerId].name} but was SHIELDED 🛡️`);
      } else {
          const target = game.players[payload.targetPlayerId];
          const targetMeta = ROLE_METADATA[target.currentRole];
          
          if (targetMeta.team === Team.GOOD) { 
              updates[`players.${payload.targetPlayerId}.isRevealed`] = true;
              logs.push(`${actor.name} (Revealer) revealed ${target.name} → ${targetMeta.name} ${targetMeta.icon} (Stays Face Up)`);
          } else {
              logs.push(`${actor.name} (Revealer) revealed ${target.name} → ${targetMeta.name} ${targetMeta.icon} (Hidden/Flipped back)`);
          }
      }
  }

  // EXPOSER (Uses REVEAL action too but for center)
  if (actor.originalRole === RoleID.EXPOSER && payload.targetCenterId) {
     const c = game.centerCards.find(c => c.id === payload.targetCenterId);
     const meta = c ? ROLE_METADATA[c.role] : { name: 'Unknown', icon: '' };
     logs.push(`${actor.name} (Exposer) exposed Center Card → ${meta.name} ${meta.icon}`);
     updates.exposedCenterCardIds = arrayUnion(payload.targetCenterId);
  }

  // NOSTRADAMUS
  if (actor.originalRole === RoleID.NOSTRADAMUS) {
      const targets = [payload.targetPlayerId, payload.secondTargetPlayerId, payload.thirdTargetPlayerId].filter(t => t);
      if (targets.length > 0) {
          const lastTargetId = targets[targets.length - 1]!;
          const lastTargetRole = game.players[lastTargetId].currentRole;
          const lastTargetMeta = ROLE_METADATA[lastTargetRole];
          
          updates[`players.${actor.id}.nostradamusRole`] = lastTargetRole;
          
          let teamName = "Independent";
          if (lastTargetMeta.team === Team.GOOD) teamName = "Village";
          else if (lastTargetMeta.team === Team.EVIL) teamName = "Werewolf";
          else if (lastTargetMeta.team === Team.MINORITY) teamName = "Vampire";

          updates.nostradamusAnnouncement = `Nostradamus saw ${teamName} Team`;
          
          logs.push(`${actor.name} (Nostradamus) viewed ${targets.length} cards. Last was ${lastTargetMeta.name} ${lastTargetMeta.icon}`);
      }
  }

  // THING
  if (actor.originalRole === RoleID.THING && payload.actionType === 'TAP' && payload.targetPlayerId) {
      updates.thingTarget = payload.targetPlayerId;
      logs.push(`${actor.name} (Thing) tapped ${game.players[payload.targetPlayerId].name} 👻`);
  }

  // CURATOR ARTIFACT PLACEMENT
  const isCurator = actor.originalRole === RoleID.CURATOR || 
    (actor.originalRole === RoleID.COPYCAT && actor.currentRole === RoleID.CURATOR) || 
    (actor.originalRole === RoleID.DOPPELGANGER && (actor as any).copiedRole === RoleID.CURATOR);

  if (isCurator && (payload.actionType === 'PLACE_TOKEN' || payload.actionType === 'MARK') && payload.targetPlayerId) {
      const targetPlayer = game.players[payload.targetPlayerId];
      if (targetPlayer?.shielded) {
          logs.push(`${actor.name} (Curator) tried to place an Artifact Token, but ${targetPlayer.name} was shielded 🛡️`);
      } else if (targetPlayer) {
          const chosenArtifact = (payload.artifactToken as ArtifactID) || ArtifactID.VOID_OF_NOTHINGNESS;
          updates[`players.${payload.targetPlayerId}.artifact`] = chosenArtifact;

          const meta = ARTIFACT_METADATA[chosenArtifact];
          const artName = meta?.name || 'Artifact Token';
          const artIcon = meta?.icon || '🏺';
          const targetName = targetPlayer.name;

          if (meta?.isRoleChanging && meta?.associatedRole) {
              const newRoleName = ROLE_METADATA[meta.associatedRole]?.name || meta.associatedRole;
              updates[`players.${payload.targetPlayerId}.currentRole`] = meta.associatedRole;
              updates[`players.${payload.targetPlayerId}.marks`] = []; // Overwrite cards and marks
              logs.push(`${actor.name} (Curator) placed ${artName} on ${targetName} ${artIcon} — converted ${targetName} into a ${newRoleName}!`);
          } else if (chosenArtifact === ArtifactID.MASK_OF_MUTING) {
              logs.push(`${actor.name} (Curator) placed ${artName} on ${targetName} ${artIcon} — ${targetName} is silenced and cannot speak!`);
          } else if (chosenArtifact === ArtifactID.DAGGER_OF_THE_TRAITOR) {
              logs.push(`${actor.name} (Curator) placed ${artName} on ${targetName} ${artIcon} — turned ${targetName} into a Traitor to their initial team!`);
          } else if (chosenArtifact === ArtifactID.VOID_OF_NOTHINGNESS) {
              logs.push(`${actor.name} (Curator) placed ${artName} on ${targetName} ${artIcon} — has no effect.`);
          } else {
              logs.push(`${actor.name} (Curator) placed ${artName} on ${targetName} ${artIcon} — ${meta?.effectSummary || 'special artifact effect applied'}.`);
          }
      }
  }

  // MARK PLACEMENT
  if (payload.actionType === 'MARK' && payload.targetPlayerId && !isCurator) {
      if (game.players[payload.targetPlayerId].shielded) {
          logs.push(`${actor.name} (${roleName}) tried to mark but target was shielded 🛡️`);
      } else {
          let markEmoji = '❌';
          if (actor.originalRole === RoleID.VAMPIRE) markEmoji = '🧛';
          if (actor.originalRole === RoleID.ASSASSIN) markEmoji = '🗡️';
          
          logs.push(`${actor.name} (${roleName}) marked ${game.players[payload.targetPlayerId].name} ${markEmoji}`);
          await updateDoc(gameRef, {
              [`players.${payload.targetPlayerId}.marks`]: arrayUnion("MARKED")
          });
      }
  }

  // SENTINEL
  if (actor.originalRole === RoleID.SENTINEL && payload.targetPlayerId) {
      if (payload.targetPlayerId !== payload.actorId) {
        updates[`players.${payload.targetPlayerId}.shielded`] = true;
        logs.push(`${actor.name} (Sentinel) shielded ${game.players[payload.targetPlayerId].name} 🛡️`);
      }
  }
  
  // VILLAGE IDIOT
  if (actor.originalRole === RoleID.VILLAGE_IDIOT && payload.actionType === 'ROTATE' && payload.direction) {
      const sortedPlayers = Object.values(game.players)
          .filter(p => p.seatId !== null)
          .sort((a, b) => a.seatId! - b.seatId!);
      
      const shiftable = sortedPlayers.filter(p => p.id !== actor.id && !p.shielded);
      
      if (shiftable.length > 1) {
          const roles = shiftable.map(p => p.currentRole);
          
          if (payload.direction === 'CLOCKWISE') {
              // Right Shift: P2 gets P1's role. P(i) gets P(i-1)'s role.
              const lastRole = roles[roles.length - 1];
              for (let i = shiftable.length - 1; i > 0; i--) {
                  updates[`players.${shiftable[i].id}.currentRole`] = roles[i-1];
              }
              updates[`players.${shiftable[0].id}.currentRole`] = lastRole;
              logs.push(`${actor.name} (Village Idiot) shifted Clockwise ↻`);
          } else {
              // Left Shift: P1 gets P2's role. P(i) gets P(i+1)'s role.
              const firstRole = roles[0];
              for (let i = 0; i < shiftable.length - 1; i++) {
                  updates[`players.${shiftable[i].id}.currentRole`] = roles[i+1];
              }
              updates[`players.${shiftable[shiftable.length-1].id}.currentRole`] = firstRole;
               logs.push(`${actor.name} (Village Idiot) shifted Anti-Clockwise ↺`);
          }
      } else {
          logs.push(`${actor.name} (Village Idiot) tried to shift but not enough targets.`);
      }
  }

  const TRACKED_ACTION_TYPES = new Set(['VIEW', 'SWAP', 'COPY', 'REVEAL', 'TAP', 'ROTATE', 'PLACE_TOKEN']);
  const PASSIVE_OBSERVER_ROLES = new Set([
      RoleID.INSOMNIAC, RoleID.SQUIRE, RoleID.BEHOLDER, RoleID.MINION,
      RoleID.MASON, RoleID.MASON_2, RoleID.DREAM_WOLF, RoleID.APPRENTICE_TANNER,
      RoleID.AURA_SEER,
  ]);
  if (TRACKED_ACTION_TYPES.has(payload.actionType) && !PASSIVE_OBSERVER_ROLES.has(actor.originalRole)) {
      updates.nightActors = arrayUnion(payload.actorId);
  }

  updates.logs = logs;
  await updateDoc(gameRef, updates);
};

export const advanceNightTurn = async (gameId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const snap = await getDoc(gameRef);
    const game = snap.data() as GameState;
    
    const updates: any = { thingTarget: null };
    const players = Object.values(game.players) as Player[];

    let nextIndex = game.currentNightRoleIndex + 1;

    while (nextIndex < game.nightQueue.length) {
        const queueRole = game.nightQueue[nextIndex];
        const hasActivePlayer = players.some(p => {
            if (p.originalRole === queueRole) return true;
            if (queueRole === RoleID.WEREWOLF && p.originalRole === RoleID.WEREWOLF_2) return true;
            if (queueRole === RoleID.MASON && p.originalRole === RoleID.MASON_2) return true;
            
            const copiedRole = (p as any).copiedRole || p.currentRole;
            
            if (p.originalRole === RoleID.COPYCAT && p.currentRole !== RoleID.COPYCAT && COPYCAT_DEFERRED_ROLES.has(copiedRole) && copiedRole === queueRole) return true;
            if (p.originalRole === RoleID.COPYCAT && p.currentRole !== RoleID.COPYCAT && COPYCAT_DEFERRED_ROLES.has(copiedRole) && queueRole === RoleID.WEREWOLF && copiedRole === RoleID.WEREWOLF_2) return true;
            if (p.originalRole === RoleID.COPYCAT && p.currentRole !== RoleID.COPYCAT && COPYCAT_DEFERRED_ROLES.has(copiedRole) && queueRole === RoleID.MASON && copiedRole === RoleID.MASON_2) return true;
            
            if (p.originalRole === RoleID.DOPPELGANGER && p.currentRole !== RoleID.DOPPELGANGER && DOPPELGANGER_DEFERRED_ROLES.has(copiedRole) && copiedRole === queueRole) return true;
            if (p.originalRole === RoleID.DOPPELGANGER && p.currentRole !== RoleID.DOPPELGANGER && DOPPELGANGER_DEFERRED_ROLES.has(copiedRole) && queueRole === RoleID.WEREWOLF && copiedRole === RoleID.WEREWOLF_2) return true;
            if (p.originalRole === RoleID.DOPPELGANGER && p.currentRole !== RoleID.DOPPELGANGER && DOPPELGANGER_DEFERRED_ROLES.has(copiedRole) && queueRole === RoleID.MASON && copiedRole === RoleID.MASON_2) return true;
            
            return false;
        });
        if (hasActivePlayer) break;
        nextIndex++;
    }

    updates.currentNightRoleIndex = nextIndex;
    if (nextIndex >= game.nightQueue.length) {
      updates.phase = GamePhase.DISCUSSION;
      updates.timerEnd = Date.now() + 5 * 60 * 1000; // 5 mins
      updates.discussionReadyPlayers = [];
      applyArtifactRoleChanges(game, updates);
    }
    await updateDoc(gameRef, updates);
};

// --- VOTING & RESULTS LOGIC ---

export const toggleDiscussionReady = async (gameId: string, playerId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const shouldAdvance = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(gameRef);
        const game = snap.data() as GameState;
        if (game.phase !== GamePhase.DISCUSSION) return false;

        const readyList = game.discussionReadyPlayers || [];
        if (readyList.includes(playerId)) return false;

        const newList = [...readyList, playerId];
        if (newList.length === Object.keys(game.players).length) {
            return true;
        } else {
            transaction.update(gameRef, { discussionReadyPlayers: newList });
            return false;
        }
    });

    if (shouldAdvance) {
        await advanceToVoting(gameId);
    }
};

export const advanceToVoting = async (gameId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
        phase: GamePhase.VOTING,
        timerEnd: null // clear timer
    });
};

export const submitVote = async (gameId: string, playerId: string, targetId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
        [`players.${playerId}.votedFor`]: targetId
    });
};

export const finalizeGame = async (gameId: string) => {
   const gameRef = doc(db, GAMES_COLLECTION, gameId);
   const snap = await getDoc(gameRef);
   const game = snap.data() as GameState;
   
   const players = Object.values(game.players);
   const votes: Record<string, number> = {};
   
   // Identify Prince
   const prince = players.find(p => p.currentRole === RoleID.PRINCE);
   const princeId = prince ? prince.id : null;

   // 1. Tally Votes
   const eliminationVotes: Record<string, number> = {};
   
   players.forEach(p => {
       if (p.votedFor) {
           votes[p.votedFor] = (votes[p.votedFor] || 0) + 1;
           
           // Prince Logic: Votes against Prince don't count for elimination tally
           if (p.votedFor !== princeId) {
               eliminationVotes[p.votedFor] = (eliminationVotes[p.votedFor] || 0) + 1;
           }
       }
   });

   // 2. Identify Bodyguard Protection
   const bodyguard = players.find(p => p.currentRole === RoleID.BODYGUARD);
   const protectedId = bodyguard ? bodyguard.votedFor : null;

   // 3. Cursed Conversion Logic
   // If Cursed is voted for by any evil team member, they convert.
   const werewolfRoles = [RoleID.WEREWOLF, RoleID.WEREWOLF_2, RoleID.ALPHA_WOLF, RoleID.MYSTIC_WOLF, RoleID.DREAM_WOLF];
   const vRoles = [RoleID.VAMPIRE, RoleID.THE_MASTER, RoleID.THE_COUNT, RoleID.RENFIELD];
   const evilConversionRoles = [...werewolfRoles, ...vRoles, RoleID.MINION, RoleID.SQUIRE];
   
   players.forEach(p => {
       if (p.currentRole === RoleID.CURSED) {
           const voters = players.filter(voter => voter.votedFor === p.id);
           const hasEvilVoter = voters.some(v => evilConversionRoles.includes(v.currentRole));
           if (hasEvilVoter) {
               const hasWolfVoter = voters.some(v => werewolfRoles.includes(v.currentRole));
               const hasVampVoter = voters.some(v => vRoles.includes(v.currentRole));
               const newRole = hasWolfVoter ? RoleID.WEREWOLF : hasVampVoter ? RoleID.VAMPIRE : RoleID.WEREWOLF;
               p.currentRole = newRole;
               game.players[p.id].currentRole = newRole;
           }
       }
   });

   // 4. Determine Max Votes (using eliminationVotes)
   let maxVotes = 0;
   Object.values(eliminationVotes).forEach(v => {
      if (v > maxVotes) maxVotes = v;
   });
   
   let eliminatedIds: string[] = [];
   let bodyguardSaveOccurred = false;
   
   // 4. Identify Potential Victims (Standard Rule: > 1 vote to die)
   let lynchVictims: string[] = [];
   
   const princeRawVotes = princeId ? (votes[princeId] || 0) : 0;
   let rawMaxVotes = 0;
   Object.values(votes).forEach(v => { if (v > rawMaxVotes) rawMaxVotes = v; });
   const princeSaved = princeId && princeRawVotes > 0 && princeRawVotes >= rawMaxVotes;
   const voteThreshold = princeSaved ? 1 : 2;

   if (maxVotes >= voteThreshold) {
       Object.keys(eliminationVotes).forEach(pid => {
           if (eliminationVotes[pid] === maxVotes) lynchVictims.push(pid);
       });
       
       // 5. Apply Bodyguard Protection
       if (protectedId && lynchVictims.includes(protectedId)) {
           bodyguardSaveOccurred = true;
           // Protected player survives
           lynchVictims = lynchVictims.filter(id => id !== protectedId);
           
           // If protection saved the ONLY victim(s), check for 2nd highest
           if (lynchVictims.length === 0) {
               let secondMax = 0;
               // Find second highest vote count
               Object.entries(eliminationVotes).forEach(([pid, count]) => {
                   if (pid !== protectedId && count < maxVotes && count > secondMax) {
                       secondMax = count;
                   }
               });
               
               // If second highest is >= 1, they die
               if (secondMax >= 1) {
                   Object.entries(eliminationVotes).forEach(([pid, count]) => {
                       if (pid !== protectedId && count === secondMax) {
                           lynchVictims.push(pid);
                       }
                   });
               }
               // Else no one dies (lynchVictims remains empty)
           }
       }
       eliminatedIds = [...lynchVictims];
   }
   
   // 6. Hunter Logic (Iterative to handle chains)
   // Hunter fires if eliminated. Target dies unless protected.
   // Note: Hunter can kill Prince (Prince immunity is only for voting)
   let newlyEliminated = [...eliminatedIds];
   // Prevent infinite loop if circular voting
   const processedHunters = new Set<string>();

   while (newlyEliminated.length > 0) {
       const currentBatch = [...newlyEliminated];
       newlyEliminated = []; 
       
       for (const pid of currentBatch) {
           const player = game.players[pid];
           // If player is hunter and hasn't fired yet
           if (player.currentRole === RoleID.HUNTER && player.votedFor && !processedHunters.has(pid)) {
               processedHunters.add(pid);
               const targetId = player.votedFor;
               
               // Check if target is already dead
               if (!eliminatedIds.includes(targetId)) {
                   // Check protection
                   if (targetId !== protectedId) {
                       eliminatedIds.push(targetId);
                       newlyEliminated.push(targetId);
                   }
               }
           }
       }
   }
   
   // 7. WIN CALCULATION
   let winningTeam = Team.GOOD;
   let winnerDescription = "Villagers Win";
   
   // Identify if any Evil roles are present in the game (at the end of the night)
   const greaterEvilRoles = [
       RoleID.WEREWOLF, RoleID.WEREWOLF_2, RoleID.ALPHA_WOLF, RoleID.MYSTIC_WOLF, RoleID.DREAM_WOLF,
       RoleID.SQUIRE,
   ];
   const vampireRoles = [RoleID.VAMPIRE, RoleID.THE_MASTER, RoleID.THE_COUNT];
   
   const activeEvil = players.filter(p => greaterEvilRoles.includes(p.currentRole));
   const activeVampires = players.filter(p => vampireRoles.includes(p.currentRole));
   
   // MINION Logic:
   const minions = players.filter(p => {
       if (p.currentRole === RoleID.MINION) return true;
       return false;
   });

   // CURSED WIN LOGIC PRE-CHECK:
   const cursedPlayer = players.find(p => p.originalRole === RoleID.CURSED);
   const cursedConverted = cursedPlayer && (cursedPlayer.currentRole === RoleID.WEREWOLF || cursedPlayer.currentRole === RoleID.VAMPIRE);

   // 0. Bodyguard Save Override (if save occurred and NO ONE died)
   if (bodyguardSaveOccurred && eliminatedIds.length === 0) {
       winningTeam = Team.GOOD;
       winnerDescription = "Villagers Win! (Bodyguard protected the target)";
   } else {
       // 1. Tanner check (Overrides everything)
       const tannerDied = eliminatedIds.some(id => game.players[id].currentRole === RoleID.TANNER);
       const apprenticeTannerPlayer = players.find(p => p.currentRole === RoleID.APPRENTICE_TANNER);
       const noTannerExists = !players.some(p => p.currentRole === RoleID.TANNER);
       const apprenticeTannerDiedAlone = apprenticeTannerPlayer && noTannerExists && eliminatedIds.includes(apprenticeTannerPlayer.id);
       
       if (tannerDied) {
           winningTeam = Team.INDEPENDENT;
           winnerDescription = "Tanner Wins!";
       } else if (apprenticeTannerDiedAlone) {
           winningTeam = Team.INDEPENDENT;
           winnerDescription = "Apprentice Tanner Wins! (Died with no Tanner in game)";
       } else {
           // 2. Main Win Logic
           if (eliminatedIds.length === 0) {
               winningTeam = Team.GOOD;
               winnerDescription = "Villagers Win! (No one eliminated)";
           } else {
               const evilDied = eliminatedIds.some(id => activeEvil.find(e => e.id === id));
               const vampireDied = eliminatedIds.some(id => activeVampires.find(v => v.id === id));
               const minionDied = eliminatedIds.some(id => minions.find(m => m.id === id));

               const hasEvilTeam = activeEvil.length > 0 || minions.length > 0;
               const hasVampireTeam = activeVampires.length > 0;

               if (hasEvilTeam || hasVampireTeam) {
                   if (evilDied || vampireDied || (minionDied && activeEvil.length === 0)) {
                       winningTeam = Team.GOOD;
                       winnerDescription = "Villagers Win! (Evil eliminated)";
                   } else {
                       winningTeam = Team.EVIL;
                       winnerDescription = "Evil Wins! (No Evil eliminated)";
                   }
               } else {
                   winningTeam = Team.EVIL;
                   winnerDescription = "Village Loses! (Innocent eliminated)";
               }
           }
       }
   }
   
   // Final overrides for special roles
   if (cursedConverted) {
       const cursedDied = eliminatedIds.includes(cursedPlayer.id);
       if (cursedDied) {
           winningTeam = Team.GOOD;
           winnerDescription = "Villagers Win! (Cursed turned evil and was eliminated)";
       } else if (winningTeam === Team.EVIL) {
           winnerDescription = "Evil Wins! (Including the converted Cursed)";
       }
   }
   
   // NOSTRADAMUS WIN/LOSS CHECK
   const nostradamus = players.find(p => p.originalRole === RoleID.NOSTRADAMUS);
   if (nostradamus) {
       const died = eliminatedIds.includes(nostradamus.id);
       if (died) {
           winnerDescription += " (Nostradamus Died & Lost)";
       }
   }

   // MORTICIAN WIN CHECK (additive — wins in addition to other teams)
   const mortician = players.find(p => p.currentRole === RoleID.MORTICIAN);
   if (mortician) {
       const morticianDied = eliminatedIds.includes(mortician.id);
       const sortedBySeats = players.filter(p => p.seatId !== null).sort((a, b) => a.seatId! - b.seatId!);
       const mortIdx = sortedBySeats.findIndex(p => p.id === mortician.id);
       if (mortIdx !== -1 && sortedBySeats.length >= 2) {
           const leftIdx = (mortIdx - 1 + sortedBySeats.length) % sortedBySeats.length;
           const rightIdx = (mortIdx + 1) % sortedBySeats.length;
           const neighborDied = eliminatedIds.includes(sortedBySeats[leftIdx].id) || eliminatedIds.includes(sortedBySeats[rightIdx].id);
           if (!morticianDied && neighborDied) {
               winnerDescription += " | Mortician also wins! ⚰️";
           } else {
               winnerDescription += " | Mortician loses ⚰️";
           }
       }
   }

   // APPRENTICE TANNER WIN CHECK
   const apprenticeTanner = players.find(p => p.currentRole === RoleID.APPRENTICE_TANNER);
   if (apprenticeTanner) {
       const tannerExists = players.some(p => p.currentRole === RoleID.TANNER);
       const tannerDiedFinal = eliminatedIds.some(id => game.players[id].currentRole === RoleID.TANNER);
       const apprenticeDied = eliminatedIds.includes(apprenticeTanner.id);
       if (tannerExists && tannerDiedFinal) {
           winnerDescription += " | Apprentice Tanner also wins! 🎭";
       } else if (!tannerExists && apprenticeDied) {
           winnerDescription += " | Apprentice Tanner wins (died with no Tanner)! 🎭";
       } else {
           winnerDescription += " | Apprentice Tanner loses 🎭";
       }
   }

   // PRINCE IMMUNITY MESSAGE
   if (princeSaved) {
        const lynchNames = lynchVictims.map(id => game.players[id].name).join(", ");
        const deathMsg = lynchNames ? `${lynchNames} died` : "No one died";
        winnerDescription += ` (Prince immune → ${deathMsg})`;
   }

   // TRAITOR ARTIFACT WIN CHECK (Dagger of the Traitor)
   const traitorPlayer = players.find(p => p.artifact === ArtifactID.DAGGER_OF_THE_TRAITOR);
   if (traitorPlayer) {
       const initialTeam = ROLE_METADATA[traitorPlayer.originalRole]?.team;
       const teamMateDied = players.some(p => p.id !== traitorPlayer.id && ROLE_METADATA[p.originalRole]?.team === initialTeam && eliminatedIds.includes(p.id));
       if (teamMateDied) {
           winnerDescription += ` | ${traitorPlayer.name} (Traitor) wins! 🩸`;
       } else {
           winnerDescription += ` | ${traitorPlayer.name} (Traitor) loses 🩸`;
       }
   }
   
   const finalUpdates: any = {
       phase: GamePhase.RESULTS,
       winner: winnerDescription,
       winningTeam: winningTeam,
       eliminatedIds: eliminatedIds,
       voteCounts: votes
   };

   if (cursedConverted && cursedPlayer) {
       finalUpdates[`players.${cursedPlayer.id}.currentRole`] = cursedPlayer.currentRole;
   }

   await updateDoc(gameRef, finalUpdates);
}

export const resetGame = async (gameId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    
    // Reset players for new round but keep them in room
    const snap = await getDoc(gameRef);
    const game = snap.data() as GameState;
    const players = game.players;
    
    const updatedPlayers: any = {};
    Object.keys(players).forEach(pid => {
        updatedPlayers[pid] = {
            ...players[pid],
            originalRole: RoleID.VILLAGER,
            currentRole: RoleID.VILLAGER,
            votedFor: null,
            marks: [],
            shielded: false,
            isRevealed: false,
            artifact: null,
            nostradamusRole: null
        };
    });
    
    await updateDoc(gameRef, {
        phase: GamePhase.LOBBY,
        players: updatedPlayers,
        winner: null,
        winningTeam: null,
        logs: [],
        nightQueue: [],
        centerCards: [],
        eliminatedIds: [],
        voteCounts: {},
        dealReadyPlayers: [],
        masonReadyPlayers: [],
        discussionReadyPlayers: [],
        exposedCenterCardIds: [],
        nostradamusAnnouncement: null,
        thingTarget: null,
        nightActors: []
    });
}

export const sendChatMessage = async (gameId: string, senderId: string, senderName: string, text: string) => {
    const chatRef = collection(db, GAMES_COLLECTION, gameId, 'messages');
    await addDoc(chatRef, {
        senderId,
        senderName,
        text,
        timestamp: serverTimestamp()
    });
}
