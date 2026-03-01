
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

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-primary">Loading...</div>;
  if (!game) return <div className="min-h-screen flex items-center justify-center text-red-500">Game Not Found</div>;

  const effectiveId = localPlayerId || user.uid;
  const me = game.players[effectiveId] || (Object.values(game.players) as Player[]).find(p => p.id === user.uid);

  if (!me) return <div className="text-center mt-20">You are not in this game. <a href="/" className="text-primary underline">Go Home</a></div>;

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
