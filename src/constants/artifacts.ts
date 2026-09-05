import { RoleID } from '../types';

export enum ArtifactID {
  CLAW_OF_THE_WEREWOLF = 'CLAW_OF_THE_WEREWOLF',
  CUDGEL_OF_THE_TANNER = 'CUDGEL_OF_THE_TANNER',
  BRAND_OF_THE_VILLAGER = 'BRAND_OF_THE_VILLAGER',
  MASK_OF_MUTING = 'MASK_OF_MUTING',
  VOID_OF_NOTHINGNESS = 'VOID_OF_NOTHINGNESS',
  BOW_OF_THE_HUNTER = 'BOW_OF_THE_HUNTER',
  SWORD_OF_THE_BODYGUARD = 'SWORD_OF_THE_BODYGUARD',
  CLOAK_OF_THE_PRINCE = 'CLOAK_OF_THE_PRINCE',
  MIST_OF_THE_VAMPIRE = 'MIST_OF_THE_VAMPIRE',
  DAGGER_OF_THE_TRAITOR = 'DAGGER_OF_THE_TRAITOR'
}

export interface ArtifactMetadata {
  id: ArtifactID;
  name: string;
  shortName: string;
  icon: string;
  expansion: 'Daybreak' | 'Bonus';
  description: string;
  associatedRole: RoleID | null;
  isRoleChanging: boolean;
  effectSummary: string;
}

export const ARTIFACT_METADATA: Record<ArtifactID, ArtifactMetadata> = {
  [ArtifactID.CLAW_OF_THE_WEREWOLF]: {
    id: ArtifactID.CLAW_OF_THE_WEREWOLF,
    name: 'The Claw of the Werewolf',
    shortName: 'Claw of Werewolf',
    icon: '🐾',
    expansion: 'Daybreak',
    description: 'Turns you into a Werewolf! Overwrites your card and marks. You are now on the Evil / Werewolf team.',
    associatedRole: RoleID.WEREWOLF,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Werewolf (Evil team)'
  },
  [ArtifactID.CUDGEL_OF_THE_TANNER]: {
    id: ArtifactID.CUDGEL_OF_THE_TANNER,
    name: 'The Cudgel of the Tanner',
    shortName: 'Cudgel of Tanner',
    icon: '🪵',
    expansion: 'Daybreak',
    description: 'Turns you into a Tanner! Overwrites your card and marks. You only win if you are eliminated.',
    associatedRole: RoleID.TANNER,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Tanner (Wins if eliminated)'
  },
  [ArtifactID.BRAND_OF_THE_VILLAGER]: {
    id: ArtifactID.BRAND_OF_THE_VILLAGER,
    name: 'The Brand of the Villager',
    shortName: 'Brand of Villager',
    icon: '🌾',
    expansion: 'Daybreak',
    description: 'Turns you into a Villager! Overwrites your card and marks. You are on the Good / Village team.',
    associatedRole: RoleID.VILLAGER,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Villager (Good team)'
  },
  [ArtifactID.MASK_OF_MUTING]: {
    id: ArtifactID.MASK_OF_MUTING,
    name: 'The Mask of Muting',
    shortName: 'Mask of Muting',
    icon: '🤐',
    expansion: 'Daybreak',
    description: 'Makes it so that you cannot speak during the discussion phase! You must remain silent.',
    associatedRole: null,
    isRoleChanging: false,
    effectSummary: 'You cannot speak during discussion'
  },
  [ArtifactID.VOID_OF_NOTHINGNESS]: {
    id: ArtifactID.VOID_OF_NOTHINGNESS,
    name: 'The Void of Nothingness',
    shortName: 'Void of Nothingness',
    icon: '🕳️',
    expansion: 'Daybreak',
    description: 'Does nothing! You remain your current role and team condition.',
    associatedRole: null,
    isRoleChanging: false,
    effectSummary: 'Does nothing (no effect)'
  },
  [ArtifactID.BOW_OF_THE_HUNTER]: {
    id: ArtifactID.BOW_OF_THE_HUNTER,
    name: 'Bow of the Hunter',
    shortName: 'Bow of Hunter',
    icon: '🏹',
    expansion: 'Bonus',
    description: 'Turns you into a Hunter! Overwrites your card and marks. If you are eliminated, the player you voted for is also eliminated.',
    associatedRole: RoleID.HUNTER,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Hunter'
  },
  [ArtifactID.SWORD_OF_THE_BODYGUARD]: {
    id: ArtifactID.SWORD_OF_THE_BODYGUARD,
    name: 'Sword of the Bodyguard',
    shortName: 'Sword of Bodyguard',
    icon: '🛡️',
    expansion: 'Bonus',
    description: 'Turns you into a Bodyguard! Overwrites your card and marks.',
    associatedRole: RoleID.BODYGUARD,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Bodyguard'
  },
  [ArtifactID.CLOAK_OF_THE_PRINCE]: {
    id: ArtifactID.CLOAK_OF_THE_PRINCE,
    name: 'Cloak of the Prince',
    shortName: 'Cloak of Prince',
    icon: '👑',
    expansion: 'Bonus',
    description: 'Turns you into a Prince! Overwrites your card and marks. You cannot be eliminated by vote.',
    associatedRole: RoleID.PRINCE,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Prince (Immune to lynch)'
  },
  [ArtifactID.MIST_OF_THE_VAMPIRE]: {
    id: ArtifactID.MIST_OF_THE_VAMPIRE,
    name: 'Mist of the Vampire',
    shortName: 'Mist of Vampire',
    icon: '🦇',
    expansion: 'Bonus',
    description: 'Turns you into a Vampire! Overwrites your card and marks. You win with the Vampire team.',
    associatedRole: RoleID.VAMPIRE,
    isRoleChanging: true,
    effectSummary: 'Turns you into a Vampire'
  },
  [ArtifactID.DAGGER_OF_THE_TRAITOR]: {
    id: ArtifactID.DAGGER_OF_THE_TRAITOR,
    name: 'Dagger of the Traitor',
    shortName: 'Dagger of Traitor',
    icon: '🩸',
    expansion: 'Bonus',
    description: 'Turns you into a Traitor who wants to kill someone on your own initial team! If anyone on your starting team is eliminated, you win.',
    associatedRole: null,
    isRoleChanging: false,
    effectSummary: 'Traitor: wins if someone on your initial team dies'
  }
};

export const DEFAULT_CURATOR_ARTIFACTS: ArtifactID[] = [
  ArtifactID.CLAW_OF_THE_WEREWOLF,
  ArtifactID.CUDGEL_OF_THE_TANNER,
  ArtifactID.BRAND_OF_THE_VILLAGER,
  ArtifactID.MASK_OF_MUTING,
  ArtifactID.VOID_OF_NOTHINGNESS
];

export const ALL_ARTIFACT_IDS = Object.values(ArtifactID);
