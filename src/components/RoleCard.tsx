
import React from 'react';
import { RoleID, Team } from '../types';
import { ROLE_METADATA } from '../constants';
import RoleIcon from './RoleIcons';

interface Props {
  role: RoleID;
  revealed?: boolean;
  flipped?: boolean;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RoleCard: React.FC<Props> = ({ role, revealed = false, flipped, onClick, selected, className = '', size = 'md' }) => {
  const metadata = ROLE_METADATA[role] || { name: 'Unknown', team: Team.INDEPENDENT, description: '' };
  
  const sizeClasses = {
    sm: 'w-16 h-24 text-xs',
    md: 'w-24 h-32 sm:w-28 sm:h-40 text-xs sm:text-sm',
    lg: 'w-40 h-60 sm:w-48 sm:h-72 text-sm sm:text-lg'
  };
  
  const iconClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-32 sm:h-32'
  };

  const teamBorderColor = {
    [Team.GOOD]: '#7eb8c9',
    [Team.EVIL]: '#b91c1c',
    [Team.INDEPENDENT]: '#d4a847',
    [Team.MINORITY]: '#7c3aed'
  }[metadata.team];

  const teamColor = {
    [Team.GOOD]: 'text-good',
    [Team.EVIL]: 'text-evil',
    [Team.INDEPENDENT]: 'text-independent',
    [Team.MINORITY]: 'text-minority'
  }[metadata.team];

  const teamDotColor = {
    [Team.GOOD]: 'bg-good',
    [Team.EVIL]: 'bg-evil',
    [Team.INDEPENDENT]: 'bg-independent',
    [Team.MINORITY]: 'bg-minority'
  }[metadata.team];

  const revealedBg = 'linear-gradient(145deg, #0e0f1a 0%, #1a122e 40%, #0d0e18 100%)';
  const unrevealedBg = 'linear-gradient(145deg, #0c0d18 0%, #151228 50%, #0a0b14 100%)';

  const noiseOverlay = (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.04,
        mixBlendMode: 'overlay' as const
      }}
    />
  );

  const cardBack = (
    <div
      className={`absolute inset-0 rounded-2xl overflow-hidden ${sizeClasses[size]}`}
      style={{
        background: unrevealedBg,
        border: '2px solid rgba(220, 245, 235, 0.15)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6), inset 0 2px 10px rgba(220,245,235,0.06)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)'
      }}
    >
      {noiseOverlay}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <svg viewBox="0 0 40 50" className={size === 'sm' ? 'w-6 h-8' : size === 'md' ? 'w-8 h-10' : 'w-16 h-20'} fill="none" stroke="#12b886" strokeWidth="1.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px rgba(18,184,134,0.4))' }}>
          <path d="M10 5 L8 20 L6 35" opacity="0.7" />
          <path d="M18 3 L16 22 L15 40" opacity="0.8" />
          <path d="M26 6 L25 18 L23 32" opacity="0.6" />
          <path d="M33 8 L30 25 L28 38" opacity="0.5" />
        </svg>
      </div>
    </div>
  );

  const cardFront = (
    <div
      className={`absolute inset-0 rounded-2xl overflow-hidden ${sizeClasses[size]}`}
      style={{
        background: revealedBg,
        border: `2px solid ${teamBorderColor}`,
        boxShadow: `0 12px 40px ${teamBorderColor}44, 0 0 40px ${teamBorderColor}22, inset 0 2px 10px rgba(255,255,255,0.08)`,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(0)',
        WebkitTransform: 'rotateY(180deg) translateZ(0)'
      }}
    >
      {noiseOverlay}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center h-full z-10">
        <div className="mb-2 drop-shadow-md transition-transform duration-300 hover:scale-110">
          <RoleIcon role={role} className={iconClasses[size]} />
        </div>
        <div className="font-bold uppercase tracking-wider text-moon mb-2 leading-tight font-display" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{metadata.name}</div>
        {size === 'lg' && <p className="text-gray-400 text-xs mt-2 px-2">{metadata.description}</p>}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${teamDotColor}`} style={{ boxShadow: `0 0 6px ${teamBorderColor}66` }}></div>
      </div>
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <RoleIcon role={role} className="w-full h-full transform scale-150 rotate-12" />
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
      }} />
    </div>
  );

  if (flipped !== undefined) {
    return (
      <div
        onClick={onClick}
        className={`relative cursor-pointer ${sizeClasses[size]} ${selected ? 'scale-125 ring-4 ring-white z-10' : 'scale-110 hover:scale-115'} ${className}`}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg) translateZ(0)' : 'rotateY(0deg) translateZ(0)',
            WebkitTransform: flipped ? 'rotateY(180deg) translateZ(0)' : 'rotateY(0deg) translateZ(0)',
            willChange: 'transform'
          }}
        >
          {cardBack}
          {cardFront}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`
        relative rounded-xl transition-all duration-300 transform cursor-pointer overflow-hidden
        ${sizeClasses[size]}
        ${selected ? 'scale-125 ring-4 ring-white z-10' : 'scale-110 hover:scale-115'}
        ${className}
      `}
      style={{
        background: revealed ? revealedBg : unrevealedBg,
        border: `2px solid ${revealed ? teamBorderColor : '#2a2545'}`,
        boxShadow: revealed
          ? `0 0 12px ${teamBorderColor}33, 0 0 30px ${teamBorderColor}11, inset 0 1px 0 rgba(255,255,255,0.05)`
          : '0 0 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(220,245,235,0.04)'
      }}
    >
      {noiseOverlay}

      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center h-full z-10">
        {revealed ? (
          <>
             <div className="mb-2 drop-shadow-md transition-transform duration-300 hover:scale-110">
                <RoleIcon role={role} className={iconClasses[size]} />
             </div>
             <div className="font-bold uppercase tracking-wider text-moon mb-2 leading-tight font-display" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{metadata.name}</div>
             {size === 'lg' && <p className="text-gray-400 text-xs mt-2 px-2">{metadata.description}</p>}
             <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${teamDotColor}`} style={{ boxShadow: `0 0 6px ${teamBorderColor}66` }}></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
             <svg viewBox="0 0 40 50" className={size === 'sm' ? 'w-6 h-8' : size === 'md' ? 'w-8 h-10' : 'w-16 h-20'} fill="none" stroke="#12b886" strokeWidth="1.5" strokeLinecap="round">
               <path d="M10 5 L8 20 L6 35" opacity="0.7" />
               <path d="M18 3 L16 22 L15 40" opacity="0.8" />
               <path d="M26 6 L25 18 L23 32" opacity="0.6" />
               <path d="M33 8 L30 25 L28 38" opacity="0.5" />
             </svg>
          </div>
        )}
      </div>

      {revealed && (
         <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
             <RoleIcon role={role} className="w-full h-full transform scale-150 rotate-12" />
         </div>
      )}

      {revealed && (
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
        }} />
      )}
    </div>
  );
};

export default RoleCard;
