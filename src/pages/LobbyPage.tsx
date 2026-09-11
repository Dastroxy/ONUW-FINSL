import React, { useState } from 'react';
import { GameState, Player, RoleID, GamePhase } from '../types';
import { 
  claimSeat, 
  toggleRoleSelection, 
  startGameSetup, 
  toggleDealReady, 
  advanceToRoles, 
  advanceToSeating,
  returnToLobby, 
  updateCuratorArtifacts 
} from '../services/firestoreService';
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
  const [activeRoleCategory, setActiveRoleCategory] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const selectedRoles = game.selectedRoles || [];
  const players = (Object.values(game.players) as Player[]).sort((a, b) => a.joined - b.joined);
  const isHost = me.isHost;

  const handleSeatClick = async (seatId: number) => {
    if (game.phase !== GamePhase.SEATING) return;

    const isTakenByOther = players.some(
      p => p.seatId !== null && p.seatId !== undefined && Number(p.seatId) === seatId && p.id !== me.id
    );
    if (isTakenByOther) return;

    const isMyCurrentSeat = me.seatId !== null && me.seatId !== undefined && Number(me.seatId) === seatId;
    const newSeatId = isMyCurrentSeat ? null : seatId;
    try {
      await claimSeat(game.id, me.id, newSeatId);
    } catch (err) {
      console.error("Failed to claim seat:", err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/game/${game.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 10;
  const seatedPlayersList = players.filter(p => p.seatId !== null && p.seatId !== undefined);

  // ==========================================
  // PHASE 1: LOBBY PAGE (Villagers Gathering)
  // ==========================================
  if (game.phase === GamePhase.LOBBY) {
    const canStartSeating = players.length >= 1; // Allows testing, while showing recommended count
    const emptySlotsCount = Math.max(0, Math.min(MAX_PLAYERS, Math.max(players.length + 1, 4)) - players.length);

    return (
      <div className="flex flex-col items-center justify-between min-h-[100dvh] pt-4 pb-8 px-4 bg-[#0a0e16] font-sans text-white">
        
        {/* Top Header / Room Information */}
        <header className="w-full max-w-lg flex items-center justify-between py-2 border-b border-white/10 z-20">
          {/* Room Code Badge */}
          <button 
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-[#121926] hover:bg-[#192436] border border-white/10 hover:border-[#00e575]/40 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-md"
            title="Click to copy room code"
          >
            <span className="text-gray-400 text-xs font-mono">ROOM</span>
            <span className="text-[#00e575] font-mono font-bold tracking-widest text-sm">
              {game.id}
            </span>
            <span className="text-xs text-gray-400">
              {copiedCode ? '✓ Copied' : '⎘'}
            </span>
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e575] animate-pulse"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-gray-300 uppercase">
              LOBBY ({players.length}/{MAX_PLAYERS})
            </span>
          </div>
        </header>

        {/* Gathering Hero */}
        <div className="w-full max-w-lg text-center mt-4 mb-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121c2b] border border-[#00e575]/20 text-[#00e575] text-xs font-mono font-bold tracking-wider uppercase mb-2 shadow-sm">
            <span>✦</span>
            <span>VILLAGE GATHERING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-wide uppercase text-white">
            GAME LOBBY
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Gather your fellow villagers. The host will initiate council seating once everyone arrives.
          </p>

          {/* Share Link Banner */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131d2c] hover:bg-[#1a273a] border border-[#00e575]/30 text-xs text-[#00e575] font-mono font-bold cursor-pointer transition-all shadow-sm"
            >
              <span>{copiedLink ? '✓ LINK COPIED' : '🔗 SHARE INVITE LINK'}</span>
            </button>
          </div>
        </div>

        {/* Villagers Roster Grid */}
        <main className="w-full max-w-md flex-1 overflow-y-auto my-3 px-2 z-10">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-xs font-mono font-bold tracking-wider text-gray-400 uppercase">
              VILLAGERS IN ROOM ({players.length})
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              {players.length < MIN_PLAYERS ? `${MIN_PLAYERS - players.length} more needed` : 'Ready to seat'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p) => {
              const isCurrent = p.id === me.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#121e2a] to-[#0c141e] border-[#00e575]/60 shadow-[0_0_15px_rgba(0,229,117,0.15)] ring-1 ring-[#00e575]/30'
                      : 'bg-[#111824] border-white/10'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative w-11 h-11 rounded-full flex-shrink-0 bg-[#162234] border border-white/10 overflow-hidden flex items-center justify-center">
                    {p.icon && p.icon.includes('/') ? (
                      <img src={p.icon} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm text-white">
                        {p.icon || p.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                    {p.isHost && (
                      <div className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-amber-400 text-black text-[9px] font-black rounded-full flex items-center justify-center shadow">
                        ★
                      </div>
                    )}
                  </div>

                  {/* Player Name and Badges */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">
                        {p.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00e575]/20 text-[#00e575] border border-[#00e575]/30">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      {p.isHost ? 'Host • Ready' : 'Villager • Ready'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty Placeholders */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-white/10 bg-[#0c121c]/40 text-gray-500 select-none"
              >
                <div className="w-11 h-11 rounded-full border border-dashed border-white/10 flex items-center justify-center font-mono text-xs text-gray-600">
                  +
                </div>
                <span className="text-xs font-mono italic text-gray-500">
                  Waiting for villager...
                </span>
              </div>
            ))}
          </div>
        </main>

        {/* Footer Action Bar */}
        <footer className="w-full max-w-sm flex flex-col items-center gap-3 z-20">
          {isHost ? (
            <button 
              type="button"
              onClick={() => advanceToSeating(game.id)}
              disabled={!canStartSeating}
              className="btn-primary-neon w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
            >
              <span>START SEATING</span>
              <span className="font-mono text-xs">
                ({players.length}/{MIN_PLAYERS} min) ➔
              </span>
            </button>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-[#111824] border border-white/10 text-center shadow-lg">
              <p className="text-[#00e575] font-bold text-xs uppercase tracking-widest animate-pulse font-mono">
                WAITING FOR HOST
              </p>
              <p className="text-gray-400 text-xs mt-1">
                The host will initiate council seating once all players have joined.
              </p>
            </div>
          )}
        </footer>

      </div>
    );
  }

  // ==========================================
  // PHASE 2: SEATING PAGE (Circular Table UI)
  // ==========================================
  if (game.phase === GamePhase.SEATING) {
    const seatedPlayersCount = seatedPlayersList.length;
    // Calculate total seats based on players count and any claimed seat IDs
    const maxClaimedSeat = players.reduce((max, p) => (p.seatId != null ? Math.max(max, Number(p.seatId) + 1) : max), 0);
    const totalSeats = Math.max(3, Math.min(MAX_PLAYERS, Math.max(players.length, maxClaimedSeat)));
    const canStartGame = seatedPlayersCount >= 1 && (seatedPlayersCount === players.length || seatedPlayersCount >= MIN_PLAYERS);

    return (
      <div className="flex flex-col items-center justify-between min-h-[100dvh] pt-4 pb-8 px-4 bg-[#0a0e16] font-sans text-white">
        
        {/* Top Header / Room Information */}
        <header className="w-full max-w-lg flex items-center justify-between py-2 border-b border-white/10 z-20">
          {/* Room Code Badge */}
          <button 
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-[#121926] hover:bg-[#192436] border border-white/10 hover:border-[#00e575]/40 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-md"
            title="Click to copy room code"
          >
            <span className="text-gray-400 text-xs font-mono">ROOM</span>
            <span className="text-[#00e575] font-mono font-bold tracking-widest text-sm">
              {game.id}
            </span>
            <span className="text-xs text-gray-400">
              {copiedCode ? '✓' : '⎘'}
            </span>
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e575] animate-pulse"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-gray-300 uppercase">
              SEATING ({seatedPlayersCount}/{players.length})
            </span>
          </div>
        </header>

        {/* Phase Subtitle / Instructions */}
        <div className="w-full max-w-lg text-center mt-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121c2b] border border-[#00e575]/20 text-[#00e575] text-xs font-mono font-bold tracking-wider uppercase mb-1 shadow-sm">
            <span>✦</span>
            <span>CHOOSE YOUR SEAT AT THE COUNCIL</span>
          </div>
          <p className="text-xs text-gray-400">
            Tap any glowing empty seat (+) to take your place. Tap again to stand up.
          </p>
        </div>

        {/* Circular Game Board */}
        <main className="w-full max-w-md flex-1 flex items-center justify-center my-2 relative z-10">
          <GameBoard 
            totalSeats={totalSeats} 
            players={players} 
            myId={me.id} 
            onSeatClick={handleSeatClick} 
          />
        </main>

        {/* Bottom Control Bar */}
        <footer className="w-full max-w-sm flex flex-col items-center gap-2.5 z-20">
          {isHost ? (
            <div className="w-full flex flex-col gap-2">
              <button 
                type="button"
                disabled={!canStartGame}
                onClick={() => advanceToRoles(game.id)}
                className="btn-primary-neon w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
              >
                <span>CHOOSE ROLES</span>
                <span className="font-mono text-xs">➔</span>
              </button>

              <button
                type="button"
                onClick={() => returnToLobby(game.id)}
                className="w-full py-2.5 rounded-xl bg-[#111824] hover:bg-[#16202f] border border-white/10 text-xs font-mono font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                ← BACK TO LOBBY
              </button>
            </div>
          ) : (
            <div className="w-full p-3.5 rounded-2xl bg-[#111824] border border-white/10 text-center shadow-lg">
              <p className="text-[#00e575] font-bold text-xs uppercase tracking-widest animate-pulse font-mono">
                {me.seatId !== null && me.seatId !== undefined ? `SEATED IN SEAT #${Number(me.seatId) + 1}` : 'CLAIM YOUR SEAT'}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {me.seatId !== null && me.seatId !== undefined 
                  ? 'Waiting for host to proceed to role selection' 
                  : 'Tap any open circle (+) above to sit down'}
              </p>
            </div>
          )}

          {/* Seating modal helper trigger */}
          <SeatingButton players={seatedPlayersList} />
        </footer>

      </div>
    );
  }

  // ==========================================
  // PHASE 3: ROLE SELECTION (Matching Image 2)
  // ==========================================
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
    const categories = ['ALL', 'BASE', 'DAYBREAK', 'VAMPIRE', 'ALIEN', 'BONUS'];
    
    // Filter roles based on active tab
    const allRoleKeys = Object.keys(ROLE_METADATA) as RoleID[];
    const filteredRoles = allRoleKeys.filter((roleKey) => {
      const meta = ROLE_METADATA[roleKey];
      if (activeRoleCategory === 'ALL') return true;
      return meta.expansion?.toUpperCase() === activeRoleCategory;
    });

    return (
      <div className="flex flex-col h-[100dvh] bg-[#0a0e16] text-white font-sans overflow-hidden">
        
        {/* Top App Bar */}
        <header className="px-4 py-3 bg-[#0d131e] border-b border-white/10 z-30 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-base sm:text-lg font-display font-black tracking-wider text-white uppercase">
              SELECT ROLES
            </h2>
            <p className="text-xs text-gray-400">
              Need {requiredRolesCount} roles ({players.length} players + 3 center)
            </p>
          </div>

          {/* Progress Pill */}
          <div className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider border transition-all ${
            selectedRoles.length === requiredRolesCount
              ? 'bg-[#00e575]/20 border-[#00e575] text-[#00e575] shadow-[0_0_15px_rgba(0,229,117,0.3)] animate-pulse'
              : 'bg-[#141b29] border-white/10 text-gray-300'
          }`}>
            {selectedRoles.length} / {requiredRolesCount} SELECTED
          </div>
        </header>

        {/* Category Filter Tabs (Matching Image 2) */}
        <nav className="px-4 py-2.5 bg-[#090d15] border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar z-20">
          {categories.map((cat) => {
            const isActive = activeRoleCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveRoleCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#00e575] text-[#091118] shadow-[0_0_12px_rgba(0,229,117,0.4)]'
                    : 'bg-[#121926] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>

        {/* Role Cards Grid (Matching Image 2) */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRoles.map((role) => {
              const meta = ROLE_METADATA[role];
              const isSelected = selectedRoles.includes(role);

              return (
                <div
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col select-none group cursor-pointer ${
                    isSelected
                      ? 'border-[#00e575] bg-gradient-to-b from-[#00e575]/20 via-[#111e28] to-[#0c131c] shadow-[0_0_20px_rgba(0,229,117,0.25)] ring-1 ring-[#00e575]/50 scale-[1.02]'
                      : 'border-white/10 bg-[#111824] hover:border-white/30 hover:bg-[#16202f]'
                  }`}
                >
                  {/* Top Team Color Accent Line */}
                  <div className={`h-1 w-full ${
                    meta.team === 'GOOD' ? 'bg-[#3b82f6]' :
                    meta.team === 'EVIL' ? 'bg-[#ef4444]' :
                    'bg-[#f59e0b]'
                  }`} />

                  {/* Artwork / Icon Area */}
                  <div className="h-28 sm:h-32 flex items-center justify-center p-3 relative overflow-hidden">
                    <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 ${
                      isSelected ? 'scale-105' : 'group-hover:scale-105'
                    }`}>
                      <RoleIcon role={role} className="w-full h-full object-contain drop-shadow-md" />
                    </div>

                    {/* Selection Pill Indicator (e.g. 1/1 or checkmark) */}
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all shadow-md ${
                      isSelected 
                        ? 'bg-[#00e575] text-[#091118]' 
                        : 'bg-black/50 text-gray-400 border border-white/10'
                    }`}>
                      {isSelected ? '✓' : '0/1'}
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-2.5 bg-[#0d1420]/90 border-t border-white/5 flex flex-col items-center text-center">
                    <span className={`font-display font-bold text-xs uppercase tracking-wide truncate w-full ${
                      isSelected ? 'text-[#00e575]' : 'text-white'
                    }`}>
                      {meta.name}
                    </span>

                    {/* Team Pill */}
                    <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.2 rounded mt-1 ${
                      meta.team === 'GOOD' ? 'bg-blue-500/20 text-blue-400' :
                      meta.team === 'EVIL' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {meta.team === 'GOOD' ? 'VILLAGE' : meta.team === 'EVIL' ? 'WEREWOLF' : 'SOLO'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Curator Artifact Selector (Preserved logic & matching style) */}
          {selectedRoles.includes(RoleID.CURATOR) && (
            <div className="mt-6 p-4 rounded-2xl bg-[#111824] border border-amber-500/30 shadow-lg animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏺</span>
                  <div>
                    <h3 className="text-sm font-display font-bold text-amber-300 uppercase">
                      Curator Artifact Tokens
                    </h3>
                    <p className="text-xs text-gray-400">
                      Tokens available for the Curator night ability
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isHost && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateCuratorArtifacts(game.id, DEFAULT_CURATOR_ARTIFACTS)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold cursor-pointer"
                      >
                        Default (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCuratorArtifacts(game.id, ALL_ARTIFACT_IDS)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold cursor-pointer"
                      >
                        All (10)
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedArtifactInfo(null); setShowArtifactModal(true); }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white/10 text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Info</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px]">i</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-950/30 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/40' 
                          : 'bg-[#0e141f] border-white/5 opacity-50'
                      }`}
                    >
                      <span className="text-xl my-1">{meta.icon}</span>
                      <span className="text-xs font-bold line-clamp-1">{meta.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>

        {/* Floating Modals for Role / Artifact Info */}
        <RolesInfoButton roles={selectedRoles} />

        {showArtifactModal && (
          <ArtifactsInfoModal 
            selectedArtifact={selectedArtifactInfo}
            onClose={() => { setShowArtifactModal(false); setSelectedArtifactInfo(null); }}
          />
        )}

        {/* Sticky Bottom Action Bar (Matching Image 2) */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#0c1119]/95 backdrop-blur-xl border-t border-white/10 z-40">
          <div className="max-w-md mx-auto">
            {isHost ? (
              <button 
                disabled={selectedRoles.length !== requiredRolesCount}
                onClick={async () => {
                  await startGameSetup(game.id);
                }}
                className="btn-primary-neon w-full py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
              >
                <span>{selectedRoles.length === requiredRolesCount ? 'DEAL CARDS' : `${selectedRoles.length} / ${requiredRolesCount} ROLES SELECTED`}</span>
                <span className="text-base font-bold">➔</span>
              </button>
            ) : (
              <div className="text-center py-2">
                <div className="text-[#00e575] font-bold text-xs uppercase tracking-widest font-mono animate-pulse">
                  HOST IS CHOOSING ROLES
                </div>
                <p className="text-gray-400 text-xs mt-0.5">
                  {selectedRoles.length} of {requiredRolesCount} selected so far
                </p>
              </div>
            )}
          </div>
        </footer>

        <SeatingButton players={seatedPlayersList} />
      </div>
    );
  }

  // ==========================================
  // PHASE 3: DEAL PHASE (View Role)
  // ==========================================
  const dealReady = game.dealReadyPlayers || [];
  const isDealReady = dealReady.includes(me.id);
  const dealReadyCount = dealReady.length;
  const totalPlayers = Object.keys(game.players).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 sm:p-6 bg-[#0a0e16] font-sans relative overflow-y-auto text-white">
      
      {/* Glow aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,229,117,0.08)_0%,_transparent_65%)] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center my-auto">
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-wider text-white uppercase mb-2">
          YOUR ROLE
        </h2>
        <p className="text-xs font-mono text-gray-400 tracking-wider uppercase mb-6">
          Tap card to reveal secret identity
        </p>

        {/* Card Component */}
        <div className="my-2">
          <RoleCard 
            role={me.originalRole} 
            flipped={cardFlipped} 
            onClick={() => setCardFlipped(!cardFlipped)} 
            size="lg" 
            className="shadow-[0_0_40px_rgba(0,229,117,0.25)] rounded-2xl" 
          />
        </div>

        {/* Role Explanation (when flipped) */}
        <div className={`mt-6 w-full p-4 rounded-2xl bg-[#111824] border border-white/10 shadow-xl transition-all duration-300 ${
          cardFlipped ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <RoleIcon role={me.originalRole} className="w-8 h-8 drop-shadow-md" />
            <h3 className="font-display font-bold text-lg text-[#00e575] uppercase">
              {ROLE_METADATA[me.originalRole].name}
            </h3>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            {ROLE_METADATA[me.originalRole].description}
          </p>
        </div>

        {/* Ready Button */}
        <div className="mt-8 w-full">
          {isDealReady ? (
            <div className="w-full py-3.5 rounded-2xl bg-[#00e575]/20 border border-[#00e575] text-[#00e575] font-mono font-bold text-sm uppercase tracking-widest animate-pulse shadow-[0_0_20px_rgba(0,229,117,0.2)]">
              READY ({dealReadyCount}/{totalPlayers})
            </div>
          ) : (
            <button
              onClick={() => toggleDealReady(game.id, me.id)}
              className="btn-primary-neon w-full py-4 rounded-2xl font-display font-bold text-sm sm:text-base uppercase tracking-wider cursor-pointer shadow-lg"
            >
              I AM READY ({dealReadyCount}/{totalPlayers})
            </button>
          )}
        </div>
      </div>

      <SeatingButton players={seatedPlayersList} />
    </div>
  );
};

export default LobbyPage;
