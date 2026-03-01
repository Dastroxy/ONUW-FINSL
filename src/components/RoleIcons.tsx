
import React from 'react';
import { RoleID } from '../types';

interface Props {
  role: RoleID;
  className?: string;
}

const ROLE_IMAGE_MAP: Record<string, string> = {
  [RoleID.DOPPELGANGER]: '/roles/doppelganger.webp',
  [RoleID.WEREWOLF]: '/roles/werewolf.webp',
  [RoleID.WEREWOLF_2]: '/roles/werewolf.webp',
  [RoleID.MINION]: '/roles/minion.webp',
  [RoleID.MASON]: '/roles/mason.webp',
  [RoleID.MASON_2]: '/roles/mason.webp',
  [RoleID.SEER]: '/roles/seer.webp',
  [RoleID.ROBBER]: '/roles/robber.webp',
  [RoleID.TROUBLEMAKER]: '/roles/troublemaker.webp',
  [RoleID.DRUNK]: '/roles/drunk.webp',
  [RoleID.INSOMNIAC]: '/roles/insomniac.webp',
  [RoleID.HUNTER]: '/roles/hunter.webp',
  [RoleID.TANNER]: '/roles/tanner.webp',
  [RoleID.VILLAGER]: '/roles/villager.webp',
  [RoleID.SENTINEL]: '/roles/sentinel.webp',
  [RoleID.APPRENTICE_SEER]: '/roles/apprentice_seer.webp',
  [RoleID.PARANORMAL_INVESTIGATOR]: '/roles/paranormal_investigator.webp',
  [RoleID.WITCH]: '/roles/witch.webp',
  [RoleID.VILLAGE_IDIOT]: '/roles/village_idiot.webp',
  [RoleID.REVEALER]: '/roles/revealer.webp',
  [RoleID.CURATOR]: '/roles/curator.webp',
  [RoleID.BODYGUARD]: '/roles/bodyguard.webp',
  [RoleID.ALPHA_WOLF]: '/roles/alpha_wolf.webp',
  [RoleID.MYSTIC_WOLF]: '/roles/mystic_wolf.webp',
  [RoleID.DREAM_WOLF]: '/roles/dream_wolf.webp',
  [RoleID.COPYCAT]: '/roles/copycat.webp',
  [RoleID.VAMPIRE]: '/roles/vampire.webp',
  [RoleID.THE_MASTER]: '/roles/the_master.webp',
  [RoleID.THE_COUNT]: '/roles/the_count.webp',
  [RoleID.RENFIELD]: '/roles/renfield.webp',
  [RoleID.CUPID]: '/roles/cupid.webp',
  [RoleID.DISEASED]: '/roles/diseased.webp',
  [RoleID.INSTIGATOR]: '/roles/instigator.webp',
  [RoleID.PRIEST]: '/roles/priest.webp',
  [RoleID.ASSASSIN]: '/roles/assassin.webp',
  [RoleID.APPRENTICE_ASSASSIN]: '/roles/apprentice_assassin.webp',
  [RoleID.MARKSMAN]: '/roles/marksman.webp',
  [RoleID.PICKPOCKET]: '/roles/pickpocket.webp',
  [RoleID.GREMLIN]: '/roles/gremlin.webp',
  [RoleID.PSYCHIC]: '/roles/psychic.webp',
  [RoleID.EXPOSER]: '/roles/exposer.webp',
  [RoleID.MORTICIAN]: '/roles/mortician.webp',
  [RoleID.AURA_SEER]: '/roles/aura_seer.webp',
  [RoleID.PRINCE]: '/roles/prince.webp',
  [RoleID.CURSED]: '/roles/cursed.webp',
  [RoleID.APPRENTICE_TANNER]: '/roles/apprentice_tanner.webp',
  [RoleID.BEHOLDER]: '/roles/beholder.webp',
  [RoleID.SQUIRE]: '/roles/squire.webp',
  [RoleID.THING]: '/roles/thing.webp',
  [RoleID.NOSTRADAMUS]: '/roles/nostradamus.webp',
};

const RoleIcon: React.FC<Props> = ({ role, className = "w-12 h-12" }) => {
  const src = ROLE_IMAGE_MAP[role] || '/roles/villager.webp';
  return (
    <img
      src={src}
      alt={role}
      className={`${className} object-contain`}
      draggable={false}
    />
  );
};

export default RoleIcon;
