
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import NightPhase from './pages/NightPhase';
import DiscussionPage from './pages/DiscussionPage';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';
import { useGame } from './hooks/useGame';
import { useAuth } from './hooks/useAuth';
import { GamePhase, Player } from './types';

const GlobalRoomHeader: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    const url = `${window.location.origin}/#/game/${gameId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
       <button onClick={copyToClipboard} className="flex items-center gap-2 bg-[#130e26]/80 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-[#12b886]/30 shadow-lg hover:bg-[#130e26] transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#12b886]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="text-[#dcf5eb]/70 text-[10px] uppercase tracking-widest font-bold">ROOM</span>
          <span className="font-mono font-bold text-[#12b886] tracking-wider text-xs sm:text-sm">{gameId}</span>
          <span className="text-[8px] sm:text-[10px]s ml-1 opacity-60 group-hover:opacity-100 transition-opacity text-[#dcf5eb]">
            {copied ? '✓' : '🔗'}
          </span>
       </button>
    </div>
  )
};

const GameContainer: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { game, loading } = useGame(gameId || null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      const stored = localStorage.getItem(`onuw_player_id_${gameId}`);
      if (stored) setLocalPlayerId(stored);
    }
  }, [gameId]);

  if (loading || !user) return <div className="min-h-[100dvh] pt-20 sm:pt-16 flex items-center justify-center text-[8px] sm:text-[10px]rimary">Loading...</div>;
  if (!game) return <div className="min-h-[100dvh] pt-20 sm:pt-16 flex items-center justify-center text-red-500">Game Not Found</div>;

  const effectiveId = localPlayerId || user.uid;
  const me = game.players[effectiveId] || (Object.values(game.players) as Player[]).find(p => p.id === user.uid);

  if (!me) return <div className="text-center mt-20">You are not in this game. <a href="/" className="text-[8px] sm:text-[10px]rimary underline">Go Home</a></div>;

  const renderPhase = () => {
    switch (game.phase) {
      case GamePhase.LOBBY:
      case GamePhase.SEATING:
      case GamePhase.ROLES:
      case GamePhase.DEAL:
        return <LobbyPage game={game} me={me} />;
      case GamePhase.NIGHT:
        return <NightPhase game={game} me={me} />;
      case GamePhase.DISCUSSION:
        return <DiscussionPage game={game} me={me} />;
      case GamePhase.VOTING:
        return <VotingPage game={game} me={me} />;
      case GamePhase.RESULTS:
        return <ResultsPage game={game} me={me} />;
      default:
        return <div>Unknown Phase</div>;
    }
  };

  return (
    <>
      <GlobalRoomHeader gameId={game.id} />
      {renderPhase()}
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GameContainer />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
