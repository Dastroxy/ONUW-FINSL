import React from 'react';
import { MARK_METADATA, MarkID } from '../constants/marks';

interface MarkTokenProps {
  markId?: string | null;
  revealed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
}

export const MarkToken: React.FC<MarkTokenProps> = ({
  markId,
  revealed = true,
  size = 'md',
  onClick,
  className = '',
  showLabel = false
}) => {
  const meta = markId ? MARK_METADATA[markId as MarkID] : null;

  const sizeStyles = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-14 h-14 text-xl'
  };

  if (!markId) return null;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div
        onClick={onClick}
        className={`
          relative rounded-full flex items-center justify-center font-bold select-none transition-transform
          ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
          ${sizeStyles[size]}
        `}
        style={{
          background: revealed && meta ? meta.badgeBg : 'rgba(26, 18, 46, 0.9)',
          border: `2px solid ${revealed && meta ? meta.badgeBorder : 'rgba(168, 85, 247, 0.6)'}`,
          boxShadow: revealed && meta 
            ? `0 0 14px ${meta.badgeBorder}` 
            : '0 0 10px rgba(168, 85, 247, 0.4)'
        }}
        title={revealed && meta ? `${meta.name}: ${meta.description}` : 'Secret Mark'}
      >
        {revealed && meta ? (
          <span className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {meta.icon}
          </span>
        ) : (
          <span className="text-[10px] sm:text-xs text-purple-300 font-serif drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            🎴
          </span>
        )}
      </div>

      {showLabel && revealed && meta && (
        <span 
          className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: meta.color, background: meta.badgeBg, border: `1px solid ${meta.badgeBorder}` }}
        >
          {meta.shortName}
        </span>
      )}
    </div>
  );
};

export default MarkToken;
