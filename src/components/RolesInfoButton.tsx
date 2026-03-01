
import React, { useState } from 'react';
import { RoleID, Team } from '../types';
import { ROLE_METADATA } from '../constants';
import RoleIcon from './RoleIcons';

interface Props {
  roles: RoleID[];
}

const RolesInfoButton: React.FC<Props> = ({ roles }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary/85 border-2 border-white/30 backdrop-blur-md text-white font-black text-lg shadow-[0_4px_20px_rgba(196,93,44,0.5)] transition-all hover:scale-110 hover:shadow-[0_6px_30px_rgba(196,93,44,0.7)] flex items-center justify-center"
        aria-label="Show Roles Info"
      >
        i
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" 
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="w-full max-w-md max-h-[70vh] flex flex-col bg-gradient-to-br from-[#0a0f0d] via-[#111a15] to-[#1a2e20] border border-white/15 rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10">
              <h2 
                className="text-xl font-black text-white tracking-widest font-display"
              >
                ROLES IN PLAY
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-primary/50 hover:bg-primary text-white flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Roles List */}
            <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {roles.length === 0 ? (
                <p className="text-gray-400 text-center italic">No roles selected yet.</p>
              ) : (
                roles.map((roleId) => {
                  const meta = ROLE_METADATA[roleId];
                  if (!meta) return null;
                  
                  const teamColor = {
                    [Team.GOOD]: 'text-good bg-good/10',
                    [Team.EVIL]: 'text-evil bg-evil/10',
                    [Team.INDEPENDENT]: 'text-independent bg-independent/10',
                    [Team.MINORITY]: 'text-minority bg-minority/10'
                  }[meta.team] || 'text-gray-400 bg-gray-500/10';

                  return (
                    <div key={roleId} className="flex gap-4 items-start border-b border-white/5 pb-6 last:border-0 last:pb-0 animate-fade-in">
                      <div className="shrink-0 mt-1">
                        <RoleIcon role={roleId} className="w-12 h-12 drop-shadow-md filter brightness-110" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 
                            className="text-lg font-bold text-white uppercase leading-none font-display"
                          >
                            {meta.name}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${teamColor}`}>
                            {meta.team}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed font-sans opacity-90">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes scale-up {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scale-up 0.2s ease-out forwards; }
      `}</style>
    </>
  );
};

export default RolesInfoButton;
