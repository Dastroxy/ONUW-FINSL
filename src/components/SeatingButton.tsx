import React, { useState } from 'react';
import { Player } from '../types';
import SeatingModal from './SeatingModal';

interface Props {
  players: Player[];
  className?: string;
}

const SeatingButton: React.FC<Props> = ({ players, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const seatedCount = players.filter(p => p.seatId !== null && p.seatId !== undefined).length;

  if (seatedCount < 2) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "fixed bottom-24 left-4 sm:bottom-24 sm:left-6 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0d1222]/90 border border-primary/40 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"}
        title="View Seating"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-moon">
          <path d="M5 11a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />
          <path d="M19 11v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5" />
          <path d="M5 16v3" />
          <path d="M19 16v3" />
          <path d="M3 11h18" />
        </svg>
      </button>

      {isOpen && (
        <SeatingModal players={players} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default SeatingButton;
