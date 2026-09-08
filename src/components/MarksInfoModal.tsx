import React from 'react';
import { MARK_METADATA, ALL_MARK_IDS, MarkID } from '../constants/marks';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
  selectedMark?: string | null;
}

export const MarksInfoModal: React.FC<Props> = ({
  isOpen = true,
  onClose,
  selectedMark
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-b from-[#130e26] via-[#0f0a20] to-[#090614] border border-[#dcf5eb]/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-moon"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">🎴</span>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-200">
                Marks System (Mini-Tokens)
              </h2>
              <p className="text-xs text-moon/50">
                Secret tokens placed during the night phase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-moon/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs sm:text-sm text-moon/80 leading-relaxed mb-4">
            💡 <strong>How Marks Work:</strong> When any Mark-related role is in the game, all players start with the <span className="text-cyan-300 font-bold">Mark of Clarity</span>. During dusk and night, roles may place, swap, or steal marks. Marks are kept secret until after the night phase, when each player may check their own mark.
          </div>

          {ALL_MARK_IDS.map(id => {
            const m = MARK_METADATA[id];
            const isHighlighted = selectedMark === id;
            return (
              <div 
                key={id}
                className={`p-3.5 rounded-xl transition-all border ${
                  isHighlighted 
                    ? 'bg-purple-900/30 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-2 ring-purple-400/50'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 rounded-lg" style={{ background: m.badgeBg }}>{m.icon}</span>
                    <h3 className="font-bold text-sm sm:text-base text-white" style={{ color: m.color }}>
                      {m.name}
                    </h3>
                  </div>
                  <span 
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                    style={{ background: m.badgeBg, color: m.color, border: `1px solid ${m.badgeBorder}` }}
                  >
                    {m.shortName}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-moon/75 pl-9 leading-relaxed">
                  {m.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-lg shadow-purple-600/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarksInfoModal;
