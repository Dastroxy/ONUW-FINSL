
export enum GamePhase {
  LOBBY = 'LOBBY',
  SEATING = 'SEATING',
  ROLES = 'ROLES',
  DEAL = 'DEAL', // Brief phase to show "Deal" animation
  NIGHT = 'NIGHT',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS'
}

export enum RoleID {
  DOPPELGANGER = 'DOPPELGANGER',
  WEREWOLF = 'WEREWOLF',
  WEREWOLF_2 = 'WEREWOLF_2', // Added variant
  MINION = 'MINION',
  MASON = 'MASON',
  MASON_2 = 'MASON_2', // Added variant
  SEER = 'SEER',
  ROBBER = 'ROBBER',
  TROUBLEMAKER = 'TROUBLEMAKER',
  DRUNK = 'DRUNK',
  INSOMNIAC = 'INSOMNIAC',
  HUNTER = 'HUNTER',
  TANNER = 'TANNER',
  VILLAGER = 'VILLAGER',
  // Daybreak
  SENTINEL = 'SENTINEL',
  APPRENTICE_SEER = 'APPRENTICE_SEER',
  PARANORMAL_INVESTIGATOR = 'PARANORMAL_INVESTIGATOR',
  WITCH = 'WITCH',
  VILLAGE_IDIOT = 'VILLAGE_IDIOT',
  REVEALER = 'REVEALER',
  CURATOR = 'CURATOR',
  BODYGUARD = 'BODYGUARD',
  ALPHA_WOLF = 'ALPHA_WOLF',
  MYSTIC_WOLF = 'MYSTIC_WOLF',
  DREAM_WOLF = 'DREAM_WOLF',
  // Vampire
  COPYCAT = 'COPYCAT',
  VAMPIRE = 'VAMPIRE',
  THE_MASTER = 'THE_MASTER',
  THE_COUNT = 'THE_COUNT',
  RENFIELD = 'RENFIELD',
  CUPID = 'CUPID',
  DISEASED = 'DISEASED',
  INSTIGATOR = 'INSTIGATOR',
  PRIEST = 'PRIEST',
  ASSASSIN = 'ASSASSIN',
  APPRENTICE_ASSASSIN = 'APPRENTICE_ASSASSIN',
  MARKSMAN = 'MARKSMAN',
  PICKPOCKET = 'PICKPOCKET',
  GREMLIN = 'GREMLIN',
  // Alien
  PSYCHIC = 'PSYCHIC',
  EXPOSER = 'EXPOSER',
  MORTICIAN = 'MORTICIAN',
  // Bonus
  AURA_SEER = 'AURA_SEER',
  PRINCE = 'PRINCE',
  CURSED = 'CURSED',
  APPRENTICE_TANNER = 'APPRENTICE_TANNER',
  BEHOLDER = 'BEHOLDER',
  SQUIRE = 'SQUIRE',
  THING = 'THING',
  NOSTRADAMUS = 'NOSTRADAMUS'
}

export enum Team {
  GOOD = 'GOOD',
  EVIL = 'EVIL',
  INDEPENDENT = 'INDEPENDENT',
  MINORITY = 'MINORITY' // Renfield
}

export interface Player {
  id: string;
  name: string;
  icon?: string;
  seatId: number | null;
  originalRole: RoleID;
  currentRole: RoleID;
  marks: string[]; // e.g., "MARK_OF_VAMPIRE"
  artifact: string | null;
  shielded: boolean; // Sentinel shield
  isRevealed: boolean; // True if revealed by Revealer/Exposer
  isHost: boolean;
  votedFor: string | null; // player ID
  joined: number; // Timestamp for sorting
  nostradamusRole?: RoleID; // Track the role Nostradamus adopted
}

export interface CenterCard {
  id: string; // 'center-0', 'center-1', 'center-2', 'center-alpha'
  role: RoleID;
  marks: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Record<string, Player>;
  selectedRoles: RoleID[]; // The N+3 roles
  centerCards: CenterCard[];
  nightQueue: RoleID[]; // The ordered list of roles that wake up
  currentNightRoleIndex: number;
  timerEnd: number | null;
  logs: string[]; // Chronological log of actions (revealed at end)
  createdAt: number;
  winner: string | null; // Description of who won
  winningTeam: Team | null;
  dealReadyPlayers: string[]; // IDs of players ready to start night
  masonReadyPlayers: string[]; // IDs of masons who pressed continue
  discussionReadyPlayers: string[]; // IDs of players ready to skip discussion
  exposedCenterCardIds: string[]; // Center card IDs revealed publicly by Exposer
  eliminatedIds: string[]; // IDs of players who died
  voteCounts: Record<string, number>; // Tally of votes
  nostradamusAnnouncement?: string | null; // Public announcement for discussion phase
  thingTarget?: string | null; // ID of player tapped by Thing
  nightActors?: string[]; // IDs of players who moved or viewed cards (for Aura Seer)
}

export interface NightActionPayload {
  actorId: string;
  targetPlayerId?: string;
  targetCenterId?: string; // 'center-0', etc.
  secondTargetPlayerId?: string;
  secondTargetCenterId?: string;
  thirdTargetPlayerId?: string; // For Nostradamus > 6 players
  actionType: 'VIEW' | 'SWAP' | 'COPY' | 'MARK' | 'PLACE_TOKEN' | 'REVEAL' | 'TAP' | 'ROTATE';
  direction?: 'CLOCKWISE' | 'ANTI-CLOCKWISE';
}
