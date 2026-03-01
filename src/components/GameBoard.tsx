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
  const radius = 38; // Slightly reduced to fit padding inside container
  const center = 50;

  // Helper to get coordinates for a seat index
  const getCoordinates = (index: number, total: number) => {
    // Start from -90 degrees (top)
    const angle = (index * (360 / total)) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };

  // Generate polygon points string for SVG: "x1,y1 x2,y2 ..."
  const polygonPoints = Array.from({ length: totalSeats }).map((_, i) => {
    const { x, y } = getCoordinates(i, totalSeats);
    return `${x},${y}`;
  }).join(' ');

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
        isTaken={!!playerInSeat}
        isMe={isMe}
        onClick={() => onSeatClick(i)}
      />
    );
  });

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
       {/* Background Decoration */}
       <div className="absolute inset-0 rounded-full bg-black/20 shadow-2xl backdrop-blur-sm border border-white/5 transform scale-110"></div>
       
       {/* Dynamic Polygon SVG */}
       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
          <polygon 
            points={polygonPoints} 
            fill="none" 
            stroke="#c45d2c" 
            strokeWidth="0.5" 
            className="drop-shadow-[0_0_5px_rgba(196,93,44,0.5)] transition-all duration-500 ease-in-out"
          />
          {/* Optional: Lines to center for more structure */}
          {Array.from({ length: totalSeats }).map((_, i) => {
            const { x, y } = getCoordinates(i, totalSeats);
            return (
               <line 
                 key={`line-${i}`}
                 x1="50" y1="50"
                 x2={x} y2={y}
                 stroke="#c45d2c"
                 strokeWidth="0.2"
                 opacity="0.5"
                 className="transition-all duration-500 ease-in-out"
               />
            );
          })}
       </svg>

       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
         <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-br from-bark to-background shadow-[0_0_25px_rgba(196,93,44,0.15)]">
            <span className="text-moon/20 font-display text-xl tracking-widest font-bold">ONUW</span>
         </div>
       </div>
       
       {seats}
    </div>
  );
};

export default GameBoard;