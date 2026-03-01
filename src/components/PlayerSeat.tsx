import React from 'react';

interface Props {
  x: number;
  y: number;
  label: string | number;
  playername?: string;
  isTaken: boolean;
  isMe: boolean;
  onClick: () => void;
}

const PlayerSeat: React.FC<Props> = ({ x, y, label, playername, isTaken, isMe, onClick }) => {
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={isTaken && !isMe}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 relative
          ${isMe 
            ? 'bg-primary border-moon text-white scale-110 shadow-[0_0_20px_rgba(196,93,44,0.8)] ring-2 ring-primary-light z-40' 
            : isTaken 
              ? 'bg-surface border-forest text-moon/50 cursor-not-allowed opacity-70' 
              : 'bg-forest/80 border-moon/30 text-moon/70 hover:scale-110 hover:border-primary hover:text-white hover:bg-forest animate-pulse shadow-lg cursor-pointer'}
        `}
      >
        {isTaken ? (playername?.[0].toUpperCase()) : label}
        
        {/* Selection Indicator Ring */}
        {isMe && <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-20"></div>}
      </button>
      
      {playername && (
        <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap z-50 transition-colors pointer-events-none
          ${isMe ? 'bg-primary text-white ring-1 ring-moon/50' : 'bg-bark text-moon/80 border border-forest'}`}>
          {playername}
        </span>
      )}
    </div>
  );
};

export default PlayerSeat;