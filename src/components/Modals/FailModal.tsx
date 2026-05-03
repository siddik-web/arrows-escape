import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SFX } from '../../lib/audio';

interface FailModalProps {
  isOpen: boolean;
  canRevive: boolean;
  onRevive: () => void;
  onRetry: () => void;
}

const FailModal: React.FC<FailModalProps> = ({ isOpen, canRevive, onRevive, onRetry }) => {
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      SFX.gameOver();
      setButtonsEnabled(false);
      const timer = setTimeout(() => setButtonsEnabled(true), 1500); // 1.5s delay for safety
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-[120] flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center w-full max-w-sm px-6"
          >
            <div className="mb-4">
              <AlertTriangle size={64} className="text-red-500 mx-auto drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>
            
            <h2 className="text-4xl font-black mb-2 tracking-widest text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              SYSTEM FAIL
            </h2>
            <p className="text-red-200/70 mb-8 font-mono tracking-widest text-sm uppercase">
              Maximum mistake threshold reached
            </p>

            <div className="space-y-4">
              <button 
                onClick={onRevive}
                disabled={!buttonsEnabled || !canRevive}
                className="w-full py-4 bg-sky-600 text-white font-black tracking-widest rounded-xl hover:bg-sky-500 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(2,132,199,0.4)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="w-4 h-4 bg-white rotate-45 mr-1" />
                REVIVE (500)
              </button>
              
              <button 
                onClick={onRetry}
                disabled={!buttonsEnabled}
                className="w-full py-4 bg-zinc-800 text-white font-black tracking-widest rounded-xl hover:bg-zinc-700 transition-all border border-zinc-700 flex justify-center items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RefreshCw size={20} /> REBOOT STAGE
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FailModal;
