import React from 'react';
import Modal from './Modal';
import { TOTAL_LEVELS } from '../../constants/config';
import { Lock } from 'lucide-react';
import { SFX } from '../../lib/audio';

interface LevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxUnlocked: number;
  currentLevel: number;
  onSelect: (lvl: number) => void;
}

const LevelsModal: React.FC<LevelsModalProps> = ({ isOpen, onClose, maxUnlocked, currentLevel, onSelect }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="STAGES"
    >
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 py-4">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvl) => {
          const isUnlocked = lvl <= maxUnlocked;
          const isCurrent = lvl === currentLevel;
          
          return (
            <button
              key={lvl}
              disabled={!isUnlocked}
              onClick={() => {
                SFX.tapSuccess(1);
                onSelect(lvl);
              }}
              className={`relative aspect-square rounded-2xl flex items-center justify-center font-black text-xl transition-all overflow-hidden ${
                isUnlocked 
                  ? (isCurrent 
                      ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] border-2 border-white scale-105 z-10" 
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50") 
                  : "bg-zinc-900/50 text-zinc-700 cursor-not-allowed border border-zinc-800/50"
              }`}
            >
              {isUnlocked ? lvl : <Lock size={20} className="opacity-50" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default LevelsModal;
