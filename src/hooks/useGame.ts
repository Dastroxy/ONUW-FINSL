import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GameState } from '../types';

export function useGame(gameId: string | null) {
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'games', gameId), (doc) => {
      if (doc.exists()) {
        setGame(doc.data() as GameState);
      }
      setLoading(false);
    });

    return unsub;
  }, [gameId]);

  return { game, loading };
}