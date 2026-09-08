import { RoleID, MarkID } from '../types';

export { MarkID };

export interface MarkMetadata {
  id: MarkID;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  roleAssociated: RoleID;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export const MARK_METADATA: Record<MarkID, MarkMetadata> = {
  [MarkID.VAMPIRE]: {
    id: MarkID.VAMPIRE,
    name: 'Mark of the Vampire',
    shortName: 'Vampire',
    icon: '🧛',
    description: 'Placed by the Vampires. Converts you into a Vampire! You are now on the Vampire team and win with them.',
    roleAssociated: RoleID.VAMPIRE,
    color: '#e11d48',
    badgeBg: 'rgba(225, 29, 72, 0.2)',
    badgeBorder: 'rgba(225, 29, 72, 0.6)'
  },
  [MarkID.FEAR]: {
    id: MarkID.FEAR,
    name: 'Mark of Fear',
    shortName: 'Fear',
    icon: '😱',
    description: 'Placed by The Count. Paralyzes you with dread! You stay asleep and cannot speak or participate in discussion, but can still vote.',
    roleAssociated: RoleID.THE_COUNT,
    color: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.2)',
    badgeBorder: 'rgba(168, 85, 247, 0.6)'
  },
  [MarkID.BAT]: {
    id: MarkID.BAT,
    name: 'Mark of the Bat',
    shortName: 'Bat',
    icon: '🦇',
    description: 'Placed by Renfield on himself. Does nothing. Renfield wins as long as no Vampires are killed.',
    roleAssociated: RoleID.RENFIELD,
    color: '#6366f1',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeBorder: 'rgba(99, 102, 241, 0.6)'
  },
  [MarkID.LOVE]: {
    id: MarkID.LOVE,
    name: 'Mark of Love',
    shortName: 'Love',
    icon: '💘',
    description: 'Placed by Cupid on 2 players. If one of you is eliminated during voting, the other dies as well! You remain on your original team.',
    roleAssociated: RoleID.CUPID,
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.2)',
    badgeBorder: 'rgba(236, 72, 153, 0.6)'
  },
  [MarkID.TRAITOR]: {
    id: MarkID.TRAITOR,
    name: 'Mark of the Traitor',
    shortName: 'Traitor',
    icon: '🗡️',
    description: 'Placed by the Instigator. You will only win if someone on your own team is killed! If you are the only person on your team, the mark has no effect. You will not win if you die.',
    roleAssociated: RoleID.INSTIGATOR,
    color: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    badgeBorder: 'rgba(249, 115, 22, 0.6)'
  },
  [MarkID.DISEASE]: {
    id: MarkID.DISEASE,
    name: 'Mark of the Disease',
    shortName: 'Disease',
    icon: '🤢',
    description: 'Placed by the Diseased on an adjacent neighbor. Anyone who votes for you or the Diseased cannot win, even if their team wins!',
    roleAssociated: RoleID.DISEASED,
    color: '#84cc16',
    badgeBg: 'rgba(132, 204, 22, 0.2)',
    badgeBorder: 'rgba(132, 204, 22, 0.6)'
  },
  [MarkID.CLARITY]: {
    id: MarkID.CLARITY,
    name: 'Mark of Clarity',
    shortName: 'Clarity',
    icon: '✨',
    description: 'Default starting mark for all players when the Marks system is active. Placed by the Priest to cleanse prior marks. Has no negative effects.',
    roleAssociated: RoleID.PRIEST,
    color: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.2)',
    badgeBorder: 'rgba(6, 182, 212, 0.6)'
  },
  [MarkID.ASSASSIN]: {
    id: MarkID.ASSASSIN,
    name: 'Mark of the Assassin',
    shortName: 'Assassin',
    icon: '🎯',
    description: 'Placed by the Assassin (or Apprentice Assassin if Assassin is in the Center). The Assassin wins if the player with this mark is eliminated!',
    roleAssociated: RoleID.ASSASSIN,
    color: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    badgeBorder: 'rgba(239, 68, 68, 0.6)'
  }
};

export const ALL_MARK_IDS: MarkID[] = [
  MarkID.VAMPIRE,
  MarkID.FEAR,
  MarkID.BAT,
  MarkID.LOVE,
  MarkID.TRAITOR,
  MarkID.DISEASE,
  MarkID.CLARITY,
  MarkID.ASSASSIN
];

export const ROLES_REQUIRING_MARKS = new Set<RoleID>([
  RoleID.VAMPIRE,
  RoleID.THE_MASTER,
  RoleID.THE_COUNT,
  RoleID.RENFIELD,
  RoleID.CUPID,
  RoleID.DISEASED,
  RoleID.INSTIGATOR,
  RoleID.PRIEST,
  RoleID.ASSASSIN,
  RoleID.APPRENTICE_ASSASSIN,
  RoleID.MARKSMAN,
  RoleID.PICKPOCKET,
  RoleID.GREMLIN
]);

export const isMarksSystemActive = (selectedRoles: RoleID[]): boolean => {
  return selectedRoles.some(r => ROLES_REQUIRING_MARKS.has(r));
};
