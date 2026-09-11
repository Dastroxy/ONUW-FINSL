import React from 'react';
import { Player } from '../types';

interface Props {
  players: Player[];
  onClose: () => void;
}

const SeatingModal: React.FC<Props> = ({ players, onClose }) => {
  const seatedPlayers = players.filter(p => p.seatId !== null && p.seatId !== undefined).sort((a, b) => a.seatId! - b.seatId!);
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

  const polygonPoints = seatedPlayers.map((_, i) => {
    const { x, y } = getCoordinates(i, totalSeats);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transform-gpu" />
      <div
        className="relative z-10 w-[90vw] max-w-md p-6 rounded-2xl bg-gray-900/95 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-lg font-bold z-20"
        >
          ✕
        </button>

        <h3 className="text-center text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mb-4 font-display">Seating</h3>

        <div className="relative w-full aspect-square max-w-sm mx-auto">
          <div className="absolute inset-0 rounded-full bg-black/30 shadow-2xl border border-white/5 transform scale-110" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
            <polygon
              points={polygonPoints}
              fill="none"
              stroke="#12b886"
              strokeWidth="0.5"
              className="drop-shadow-[0_0_5px_rgba(18,184,134,0.5)]"
            />
            {seatedPlayers.map((_, i) => {
              const { x, y } = getCoordinates(i, totalSeats);
              return (
                <line
                  key={`line-${i}`}
                  x1="50" y1="50"
                  x2={x} y2={y}
                  stroke="#12b886"
                  strokeWidth="0.2"
                  opacity="0.5"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center bg-gradient-to-br from-surface to-background shadow-[0_0_25px_rgba(18,184,134,0.15)]">
              <span className="text-white/20 font-display text-lg tracking-widest font-bold">ONUW</span>
            </div>
          </div>

          {seatedPlayers.map((p, i) => {
            const { x, y } = getCoordinates(i, totalSeats);
            return (
              <div
                key={p.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 bg-surface border-primary/50 text-moon font-bold text-sm">
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-moon/80 border border-primary/30 whitespace-nowrap pointer-events-none">
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
