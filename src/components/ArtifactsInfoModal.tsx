import React, { useEffect, useRef } from 'react';
import { ARTIFACT_METADATA, ArtifactID, ALL_ARTIFACT_IDS } from '../constants/artifacts';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
  selectedArtifact?: string | null;
  highlightArtifactId?: string | null;
  allowedArtifactIds?: string[];
}

export const ArtifactsInfoModal: React.FC<Props> = ({
  isOpen = true,
  onClose,
  selectedArtifact,
  highlightArtifactId,
  allowedArtifactIds
}) => {
  if (isOpen === false) return null;

  const activeHighlight = highlightArtifactId || selectedArtifact;
  const highlightedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeHighlight && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeHighlight]);

  const displayIds = allowedArtifactIds && allowedArtifactIds.length > 0
    ? allowedArtifactIds
    : ALL_ARTIFACT_IDS;

  const daybreakArtifacts = displayIds.filter(id => ARTIFACT_METADATA[id as ArtifactID]?.expansion === 'Daybreak');
  const bonusArtifacts = displayIds.filter(id => ARTIFACT_METADATA[id as ArtifactID]?.expansion === 'Bonus');

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
            <span className="text-2xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">🏺</span>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Artifact Tokens
              </h2>
              <p className="text-xs text-moon/50">
                Curator relics and their mysterious effects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-moon/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Notice Banner */}
        <div className="px-5 py-2.5 bg-amber-900/20 border-b border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>Rule Note:</strong> Role changing Artifacts overwrite Cards and Marks!</span>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Daybreak */}
          {daybreakArtifacts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400">Daybreak Tokens</span>
                <span className="h-[1px] flex-1 bg-amber-500/20"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {daybreakArtifacts.map(id => {
                  const meta = ARTIFACT_METADATA[id as ArtifactID];
                  if (!meta) return null;
                  const isHighlighted = activeHighlight === id;
                  return (
                    <div
                      key={id}
                      ref={isHighlighted ? highlightedRef : undefined}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isHighlighted
                          ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.02]'
                          : 'bg-forest/60 border-white/10 hover:border-amber-500/30 hover:bg-forest/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{meta.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{meta.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            meta.isRoleChanging ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-gray-700/50 text-gray-300'
                          }`}>
                            {meta.isRoleChanging ? 'Role Change' : 'Special Effect'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-moon/70 leading-relaxed">{meta.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bonus Roles */}
          {bonusArtifacts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Bonus Expansion Tokens</span>
                <span className="h-[1px] flex-1 bg-cyan-500/20"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bonusArtifacts.map(id => {
                  const meta = ARTIFACT_METADATA[id as ArtifactID];
                  if (!meta) return null;
                  const isHighlighted = activeHighlight === id;
                  return (
                    <div
                      key={id}
                      ref={isHighlighted ? highlightedRef : undefined}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isHighlighted
                          ? 'bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400/70 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-[1.02]'
                          : 'bg-forest/60 border-white/10 hover:border-cyan-500/30 hover:bg-forest/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{meta.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{meta.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            meta.isRoleChanging ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-gray-700/50 text-gray-300'
                          }`}>
                            {meta.isRoleChanging ? 'Role Change' : 'Special Effect'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-moon/70 leading-relaxed">{meta.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-primary-light text-white shadow-lg hover:brightness-110 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactsInfoModal;
