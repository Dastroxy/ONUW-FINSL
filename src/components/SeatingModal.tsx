import React from 'react';
import { Player } from '../types';

interface Props {
  players: Player[];
  onClose: () => void;
}

const SeatingModal: React.FC<Props> = ({ players, onClose }) => {
  const seatedPlayers = players
    .filter(p => p.seatId !== null && p.seatId !== undefined)
    .sort((a, b) => a.seatId! - b.seatId!);
  const totalSeats = seatedPlayers.length;
  const radius = 38;
  const center = 50;

  const getCoordinates = (index: number, total: number) => {
    const angle = (index * (360 / total)) - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-sm p-6 rounded-3xl bg-[#0c121c] border border-white/10 shadow-2xl text-white select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-sm font-bold z-20 cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <h3 className="text-xs font-mono font-bold tracking-[0.25em] text-[#00e575] uppercase">
            SEATING ARRANGEMENT
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Council seating in clockwise order
          </p>
        </div>

        <div className="relative w-full aspect-square max-w-[280px] mx-auto my-2">
          {/* Concentric ambient circles */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#00e575]/20 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />

          {/* SVG connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            {seatedPlayers.map((_, i) => {
              const { x, y } = getCoordinates(i, totalSeats);
              return (
                <line
                  key={`line-${i}`}
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="rgba(0, 229, 117, 0.2)"
                  strokeWidth="0.5"
                  strokeDasharray="1, 1.5"
                />
              );
            })}
          </svg>

          {/* Center Table Element */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-20 h-20 rounded-full border border-[#00e575]/30 flex flex-col items-center justify-center bg-gradient-to-br from-[#121c2b] to-[#0a0e16] shadow-[0_0_20px_rgba(0,229,117,0.15)]">
              <span className="text-gray-300 font-mono text-[9px] tracking-widest font-bold">COUNCIL</span>
              <span className="text-[#00e575] font-mono text-[9px] font-bold mt-0.5">TABLE</span>
            </div>
          </div>

          {/* Seated Players */}
          {seatedPlayers.map((p, i) => {
            const { x, y } = getCoordinates(i, totalSeats);
            return (
              <div
                key={p.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-[#111927] border-2 border-[#00e575] shadow-[0_0_12px_rgba(0,229,117,0.3)]">
                  {p.icon && p.icon.includes('/') ? (
                    <img src={p.icon} alt={p.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="font-bold text-white text-xs">
                      {p.icon || p.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full font-mono text-[8px] font-bold bg-[#00e575] text-[#091118] shadow-sm">
                    #{p.seatId! + 1}
                  </div>
                </div>
                <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0d1420] text-gray-200 border border-white/10 whitespace-nowrap pointer-events-none truncate max-w-[70px]">
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeatingModal;
