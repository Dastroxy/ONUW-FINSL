
import { RoleID, Team } from './types';

// Metadata with Expansion grouping based on file.txt
// Wake orders derived from file text ("-8", "-7", "-6", "0", "2", etc.)
export const ROLE_METADATA: Record<RoleID, { name: string, team: Team, description: string, wakeOrder: number, expansion: string, icon: string }> = {
  // Base Game
  [RoleID.DOPPELGANGER]: { 
    name: 'Doppelgänger', 
    team: Team.GOOD, // Technically "Depends", defaulting to Good for UI color
    description: 'View a card. Become that role. Action depends on role viewed.', 
    wakeOrder: -7, // "wakes up at -7" (Vampire rules) or 1 (Base). Using -7 to fit sequence.
    expansion: 'Base',
    icon: '👤'
  },
  [RoleID.WEREWOLF]: { 
    name: 'Werewolf', 
    team: Team.EVIL, 
    description: 'See other wolves. If Lone Wolf: view 1 center card.', 
    wakeOrder: 2, 
    expansion: 'Base',
    icon: '🐺'
  },
  [RoleID.WEREWOLF_2]: { 
    name: 'Werewolf', 
    team: Team.EVIL, 
    description: 'See other wolves. If Lone Wolf: view 1 center card.', 
    wakeOrder: 2, 
    expansion: 'Base',
    icon: '🐺'
  },
  [RoleID.MINION]: { 
    name: 'Minion', 
    team: Team.EVIL, 
    description: 'See the names of all werewolves.', 
    wakeOrder: 3, 
    expansion: 'Base',
    icon: '👹'
  },
  [RoleID.MASON]: { 
    name: 'Mason', 
    team: Team.GOOD, 
    description: 'See other Masons. If none, other Mason is in center.', 
    wakeOrder: 4, 
    expansion: 'Base',
    icon: '🧱'
  },
  [RoleID.MASON_2]: { 
    name: 'Mason', 
    team: Team.GOOD, 
    description: 'See other Masons. If none, other Mason is in center.', 
    wakeOrder: 4, 
    expansion: 'Base',
    icon: '🧱'
  },
  [RoleID.SEER]: { 
    name: 'Seer', 
    team: Team.GOOD, 
    description: 'Look at a player\'s card OR 2 center cards.', 
    wakeOrder: 5, 
    expansion: 'Base',
    icon: '👁️'
  },
  [RoleID.ROBBER]: { 
    name: 'Robber', 
    team: Team.GOOD, 
    description: 'Swap your card with another player\'s card, then look at your new card.', 
    wakeOrder: 6, 
    expansion: 'Base',
    icon: '💰'
  },
  [RoleID.TROUBLEMAKER]: { 
    name: 'Troublemaker', 
    team: Team.GOOD, 
    description: 'Switch 2 other player\'s cards, without looking at them.', 
    wakeOrder: 7, 
    expansion: 'Base',
    icon: '😈'
  },
  [RoleID.DRUNK]: { 
    name: 'Drunk', 
    team: Team.GOOD, 
    description: 'Exchange your card with a center card. DO NOT look at new card.', 
    wakeOrder: 8, 
    expansion: 'Base',
    icon: '🍺'
  },
  [RoleID.INSOMNIAC]: { 
    name: 'Insomniac', 
    team: Team.GOOD, 
    description: 'Look at your card to see if it has changed.', 
    wakeOrder: 9, 
    expansion: 'Base',
    icon: '💤'
  },
  [RoleID.HUNTER]: { 
    name: 'Hunter', 
    team: Team.GOOD, 
    description: 'If voted out, kills whoever they are voting.', 
    wakeOrder: 999, 
    expansion: 'Base',
    icon: '🏹'
  },
  [RoleID.TANNER]: { 
    name: 'Tanner', 
    team: Team.INDEPENDENT, 
    description: 'Only wins if he dies.', 
    wakeOrder: 999, 
    expansion: 'Base',
    icon: '👺'
  },
  [RoleID.VILLAGER]: { 
    name: 'Villager', 
    team: Team.GOOD, 
    description: 'No ability.', 
    wakeOrder: 999, 
    expansion: 'Base',
    icon: '🧑'
  },

  // Daybreak
  [RoleID.SENTINEL]: { 
    name: 'Sentinel', 
    team: Team.GOOD, 
    description: 'Place a Shield Token on any player\'s card but your own.', 
    wakeOrder: 0, 
    expansion: 'Daybreak',
    icon: '🛡️'
  },
  [RoleID.APPRENTICE_SEER]: { 
    name: 'Apprentice Seer', 
    team: Team.GOOD, 
    description: 'Look at one card in the center.', 
    wakeOrder: 5.1, 
    expansion: 'Daybreak',
    icon: '🔮'
  },
  [RoleID.PARANORMAL_INVESTIGATOR]: { 
    name: 'P.I.', 
    team: Team.GOOD, 
    description: 'Look at up to 2 cards. If not Village/Good, become that role.', 
    wakeOrder: 5.2, 
    expansion: 'Daybreak',
    icon: '🕵️'
  },
  [RoleID.WITCH]: { 
    name: 'Witch', 
    team: Team.GOOD, 
    description: 'Look at a center card, then MUST switch it with someone\'s card.', 
    wakeOrder: 6.1, 
    expansion: 'Daybreak',
    icon: '🧙‍♀️'
  },
  [RoleID.VILLAGE_IDIOT]: { 
    name: 'Village Idiot', 
    team: Team.GOOD, 
    description: 'Move everyone\'s card (except own/shielded) to left or right.', 
    wakeOrder: 7.1, 
    expansion: 'Daybreak',
    icon: '🤪'
  },
  [RoleID.REVEALER]: { 
    name: 'Revealer', 
    team: Team.GOOD, 
    description: 'Flip one player\'s card face up. If not Village, flip back.', 
    wakeOrder: 10, 
    expansion: 'Daybreak',
    icon: '🔆'
  },
  [RoleID.CURATOR]: { 
    name: 'Curator', 
    team: Team.GOOD, 
    description: 'Place an Artifact Token on any player\'s card.', 
    wakeOrder: 11, 
    expansion: 'Daybreak',
    icon: '🏺'
  },
  [RoleID.BODYGUARD]: { 
    name: 'Bodyguard', 
    team: Team.GOOD, 
    description: 'Whoever Bodyguard votes for cannot die.', 
    wakeOrder: 999, 
    expansion: 'Daybreak',
    icon: '🦍'
  },
  [RoleID.ALPHA_WOLF]: { 
    name: 'Alpha Wolf', 
    team: Team.EVIL, 
    description: 'Exchange center Wolf card with another player\'s card.', 
    wakeOrder: 2.1, 
    expansion: 'Daybreak',
    icon: '🐺👑'
  },
  [RoleID.MYSTIC_WOLF]: { 
    name: 'Mystic Wolf', 
    team: Team.EVIL, 
    description: 'Look at another player\'s card.', 
    wakeOrder: 2.2, 
    expansion: 'Daybreak',
    icon: '🐺🔮'
  },
  [RoleID.DREAM_WOLF]: { 
    name: 'Dream Wolf', 
    team: Team.EVIL, 
    description: 'Does not wake up. Wolves see you as ally.', 
    wakeOrder: 999, 
    expansion: 'Daybreak',
    icon: '🐺💤'
  },

  // Vampire (Dusk Roles: -8 to -1)
  [RoleID.COPYCAT]: { 
    name: 'Copycat', 
    team: Team.INDEPENDENT, 
    description: 'View center card and become that role.', 
    wakeOrder: -8, 
    expansion: 'Vampire',
    icon: '🎭'
  },
  [RoleID.VAMPIRE]: { 
    name: 'Vampire', 
    team: Team.EVIL, 
    description: 'Choose one non-vampire player to give Mark of the Vampire.', 
    wakeOrder: -6, 
    expansion: 'Vampire',
    icon: '🧛'
  },
  [RoleID.THE_MASTER]: { 
    name: 'The Master', 
    team: Team.EVIL, 
    description: 'Saved from death if at least 1 vampire votes for him.', 
    wakeOrder: -6, // Wakes with Vampires
    expansion: 'Vampire',
    icon: '🧛‍♂️'
  },
  [RoleID.THE_COUNT]: { 
    name: 'The Count', 
    team: Team.EVIL, 
    description: 'Place Mark of Fear on any non-Vampire player.', 
    wakeOrder: -6.1, 
    expansion: 'Vampire',
    icon: '🧛👑'
  },
  [RoleID.RENFIELD]: { 
    name: 'Renfield', 
    team: Team.MINORITY, 
    description: 'Give Mark of the Bat to yourself.', 
    wakeOrder: -6.2, 
    expansion: 'Vampire',
    icon: '🦇'
  },
  [RoleID.CUPID]: { 
    name: 'Cupid', 
    team: Team.GOOD, 
    description: 'Give Mark of Love to 2 other players.', 
    wakeOrder: -4, 
    expansion: 'Vampire',
    icon: '💘'
  },
  [RoleID.DISEASED]: { 
    name: 'Diseased', 
    team: Team.GOOD, 
    description: 'Place Mark of Disease to a neighbor.', 
    wakeOrder: -5, 
    expansion: 'Vampire',
    icon: '🤢'
  },
  [RoleID.INSTIGATOR]: { 
    name: 'Instigator', 
    team: Team.GOOD, 
    description: 'Give Mark of the Traitor to any player.', 
    wakeOrder: -3, 
    expansion: 'Vampire',
    icon: '🗡️'
  },
  [RoleID.PRIEST]: { 
    name: 'Priest', 
    team: Team.GOOD, 
    description: 'Place Mark of Clarity on self and optional other.', 
    wakeOrder: -2, 
    expansion: 'Vampire',
    icon: '⛪'
  },
  [RoleID.ASSASSIN]: { 
    name: 'Assassin', 
    team: Team.GOOD, 
    description: 'Place Mark of the Assassin on any player.', 
    wakeOrder: -1, 
    expansion: 'Vampire',
    icon: '🥷'
  },
  [RoleID.APPRENTICE_ASSASSIN]: { 
    name: 'Appr. Assassin', 
    team: Team.GOOD, 
    description: 'If Assassin exists, help them. If not, place Mark.', 
    wakeOrder: -1.1, 
    expansion: 'Vampire',
    icon: '🗡️👶'
  },
  [RoleID.MARKSMAN]: { 
    name: 'Marksman', 
    team: Team.GOOD, 
    description: 'View card from one player and Mark from another.', 
    wakeOrder: 5.3, 
    expansion: 'Vampire',
    icon: '🎯'
  },
  [RoleID.PICKPOCKET]: { 
    name: 'Pickpocket', 
    team: Team.GOOD, 
    description: 'Steal a Mark from a player and replace with own.', 
    wakeOrder: 6.2, 
    expansion: 'Vampire',
    icon: '🤏'
  },
  [RoleID.GREMLIN]: { 
    name: 'Gremlin', 
    team: Team.GOOD, 
    description: 'Exchange cards OR marks between any two players.', 
    wakeOrder: 7.3, 
    expansion: 'Vampire',
    icon: '👾'
  },

  // Alien
  [RoleID.PSYCHIC]: { 
    name: 'Psychic', 
    team: Team.GOOD, 
    description: 'The Psychic learns one neighbor\'s role at random, but does not know which neighbor it belongs to.', 
    wakeOrder: 5.5, 
    expansion: 'Alien',
    icon: '🧠'
  },
  [RoleID.EXPOSER]: { 
    name: 'Exposer', 
    team: Team.GOOD, 
    description: 'Reveal one card from the center publicly.', 
    wakeOrder: 10.1, 
    expansion: 'Alien',
    icon: '📸'
  },
  [RoleID.MORTICIAN]: { 
    name: 'Mortician', 
    team: Team.INDEPENDENT, 
    description: 'Look at a neighbor or your own card.', 
    wakeOrder: 13, 
    expansion: 'Alien',
    icon: '⚰️'
  },

  // Bonus
  [RoleID.AURA_SEER]: { 
    name: 'Aura Seer', 
    team: Team.GOOD, 
    description: 'See who moved or viewed any card.', 
    wakeOrder: 7.2, 
    expansion: 'Bonus',
    icon: '🧿'
  },
  [RoleID.PRINCE]: { 
    name: 'Prince', 
    team: Team.GOOD, 
    description: 'Votes against Prince do not count.', 
    wakeOrder: 999, 
    expansion: 'Bonus',
    icon: '👑'
  },
  [RoleID.CURSED]: { 
    name: 'Cursed', 
    team: Team.GOOD, 
    description: 'You are on the village team, unless at least one Werewolf or Vampire votes for you, then you convert to either of these roles.', 
    wakeOrder: 999, 
    expansion: 'Bonus',
    icon: '☠️'
  },
  [RoleID.APPRENTICE_TANNER]: { 
    name: 'Appr. Tanner', 
    team: Team.INDEPENDENT, 
    description: 'Wins if Tanner dies.', 
    wakeOrder: 3.1, 
    expansion: 'Bonus',
    icon: '👺👶'
  },
  [RoleID.BEHOLDER]: { 
    name: 'Beholder', 
    team: Team.GOOD, 
    description: 'Knows who Seer and Apprentice Seer are.', 
    wakeOrder: 9.2, 
    expansion: 'Bonus',
    icon: '👁️👁️'
  },
  [RoleID.SQUIRE]: { 
    name: 'Squire', 
    team: Team.EVIL, 
    description: 'See werewolves. Check their cards.', 
    wakeOrder: 9.1, 
    expansion: 'Bonus',
    icon: '⚔️'
  },
  [RoleID.THING]: { 
    name: 'Thing', 
    team: Team.GOOD, 
    description: 'Tap a player card adjacent to you.', 
    wakeOrder: 4.1, 
    expansion: 'Bonus',
    icon: '👻'
  },
  [RoleID.NOSTRADAMUS]: { 
    name: 'Nostradamus', 
    team: Team.INDEPENDENT, 
    description: 'View up to 2-3 cards. Become last team viewed.', 
    wakeOrder: 5.4, 
    expansion: 'Bonus',
    icon: '🔮'
  },
};

// Sort sequence based on wakeOrder from ROLE_METADATA
export const NIGHT_SEQUENCE = Object.keys(ROLE_METADATA)
  .filter(key => ROLE_METADATA[key as RoleID].wakeOrder < 100 && key !== RoleID.WEREWOLF_2 && key !== RoleID.MASON_2)
  .sort((a, b) => ROLE_METADATA[a as RoleID].wakeOrder - ROLE_METADATA[b as RoleID].wakeOrder) as RoleID[];
