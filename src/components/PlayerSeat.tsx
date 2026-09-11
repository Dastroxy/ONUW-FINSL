import React from 'react';

interface Props {
  x: number;
  y: number;
  label: string | number;
  playername?: string;
  icon?: string;
  isHost?: boolean;
  isTaken: boolean;
  isMe: boolean;
  onClick: () => void;
}

const PlayerSeat: React.FC<Props> = ({
  x,
  y,
  label,
  playername,
  icon,
  isHost,
  isTaken,
  isMe,
  onClick
}) => {
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={isTaken && !isMe}
        className={`
          w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center relative transition-all duration-300 cursor-pointer
          ${isMe 
            ? 'bg-[#121c2b] border-2 border-[#00e575] shadow-[0_0_20px_rgba(0,229,117,0.5)] ring-2 ring-[#00e575]/30 scale-105 z-40' 
            : isTaken 
              ? 'bg-[#101723] border border-white/20 text-gray-300 shadow-md cursor-default' 
              : 'bg-[#0c131e]/90 border-2 border-dashed border-[#00e575]/40 hover:border-[#00e575] text-[#00e575] hover:scale-105 shadow-[0_0_12px_rgba(0,229,117,0.15)] animate-pulse'}
        `}
      >
        {isTaken ? (
          icon && icon.includes('/') ? (
            <img src={icon} alt={playername || 'seat'} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="font-bold text-white text-base sm:text-lg">
              {icon || playername?.[0]?.toUpperCase() || '?'}
            </span>
          )
        ) : (
          <span className="text-[#00e575] text-xl sm:text-2xl font-bold leading-none">+</span>
        )}

        {/* Seat Number Tag */}
        <div className={`
          absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold shadow-md z-10
          ${isMe ? 'bg-[#00e575] text-[#091118]' : 'bg-[#1a2536] text-gray-300 border border-white/10'}
        `}>
          #{label}
        </div>

        {/* Host Crown / Star Indicator */}
        {isHost && (
          <div className="absolute -top-1 -left-1 px-1 py-0.2 bg-amber-400 text-black text-[9px] font-black rounded-full shadow-sm z-10" title="Host">
            ★
          </div>
        )}

        {/* Pulsing ring for current user */}
        {isMe && (
          <div className="absolute inset-0 rounded-full border border-[#00e575] animate-ping opacity-25 pointer-events-none"></div>
        )}
      </button>
      
      {/* Player name label underneath */}
      {playername ? (
        <span className={`
          mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap z-50 pointer-events-none truncate max-w-[85px] sm:max-w-[100px] text-center border
          ${isMe 
            ? 'bg-[#00e575]/20 text-[#00e575] border-[#00e575]/40 font-mono' 
            : 'bg-[#0d1420]/95 text-gray-200 border-white/10'}
        `}>
          {playername}
        </span>
      ) : (
        <span className="mt-1 text-[10px] font-mono tracking-wider text-gray-500 uppercase">
          OPEN
        </span>
      )}
    </div>
  );
};

export default PlayerSeat;
