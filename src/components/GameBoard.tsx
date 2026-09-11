import React from 'react';
import PlayerSeat from './PlayerSeat';
import { Player } from '../types';

interface Props {
  totalSeats: number;
  players: Player[];
  myId: string;
  onSeatClick: (seatId: number) => void;
}

const GameBoard: React.FC<Props> = ({ totalSeats, players, myId, onSeatClick }) => {
  const radius = 38; // Percentage from center
  const center = 50;

  // Helper to get coordinates for a seat index (starting from top -90deg)
  const getCoordinates = (index: number, total: number) => {
    const angle = (index * (360 / total)) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };

  const seats = Array.from({ length: totalSeats }).map((_, i) => {
    const { x, y } = getCoordinates(i, totalSeats);
    const playerInSeat = players.find(p => p.seatId === i);
    const isMe = playerInSeat?.id === myId;
    
    return (
      <PlayerSeat
        key={i}
        x={x}
        y={y}
        label={i + 1}
        playername={playerInSeat?.name}
        icon={playerInSeat?.icon}
        isHost={playerInSeat?.isHost}
        isTaken={!!playerInSeat}
        isMe={isMe}
        onClick={() => onSeatClick(i)}
      />
    );
  });

  return (
    <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[420px] mx-auto select-none my-2">
      {/* Outer ambient glow */}
      <div className="absolute inset-4 rounded-full bg-[#00e575]/5 filter blur-2xl pointer-events-none"></div>

      {/* Concentric rings matching Image 1 */}
      <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none"></div>
      <div className="absolute inset-6 rounded-full border border-dashed border-[#00e575]/20 pointer-events-none"></div>
      <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none"></div>

      {/* SVG Connecting lines / web */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        {Array.from({ length: totalSeats }).map((_, i) => {
          const { x, y } = getCoordinates(i, totalSeats);
          return (
            <line 
              key={`line-${i}`}
              x1="50" y1="50"
              x2={x} y2={y}
              stroke="rgba(0, 229, 117, 0.15)"
              strokeWidth="0.4"
              strokeDasharray="1, 1.5"
            />
          );
        })}
      </svg>

      {/* Center Table Element (matching Image 1) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-[#00e575]/30 bg-gradient-to-b from-[#111927] to-[#090e17] flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,229,117,0.15)] p-2 text-center">
          
          {/* 3 mini cards graphic */}
          <div className="flex items-center justify-center gap-1 mb-1.5 opacity-85">
            <div className="w-3.5 h-5 rounded-sm bg-[#162334] border border-[#00e575]/40 -rotate-12 shadow-sm"></div>
            <div className="w-4 h-5.5 rounded-sm bg-[#1a2b40] border border-[#00e575]/70 z-10 shadow-md"></div>
            <div className="w-3.5 h-5 rounded-sm bg-[#162334] border border-[#00e575]/40 rotate-12 shadow-sm"></div>
          </div>

          <span className="text-gray-300 font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold">
            CENTER CARDS
          </span>
          <span className="text-[#00e575] font-mono text-[9px] sm:text-[10px] tracking-wider font-bold mt-0.5">
            3 REMAINING
          </span>
        </div>
      </div>
      
      {/* Player Seats */}
      {seats}
    </div>
  );
};

export default GameBoard;
