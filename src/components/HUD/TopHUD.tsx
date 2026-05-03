import React from 'react';
import { LayoutGrid, ShoppingCart, Settings, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopHUDProps {
  level: number;
  shards: number;
  combo: number;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenLevels: () => void;
  onHint: () => void;
}

const TopHUD: React.FC<TopHUDProps> = ({ level, shards, combo, onOpenShop, onOpenSettings, onOpenLevels, onHint }) => {
  return (
    <header className="p-4 flex flex-col gap-4 fixed top-0 w-full z-10 select-none">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-2">
          <button 
            onClick={onOpenLevels}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <LayoutGrid size={24} strokeWidth={2.5} />
          </button>
          
          <div 
            onClick={onOpenShop}
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 cursor-pointer hover:bg-black/60 transition-colors"
          >
            <div className="w-3.5 h-3.5 bg-sky-400 rotate-45 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            <span className="font-bold text-sm tracking-wider text-sky-400">{shards}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold tracking-widest text-white drop-shadow-md">
            LEVEL {level}
          </h1>
          <AnimatePresence>
            {combo > 1 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                className="text-xs font-black tracking-widest text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] mt-1"
              >
                COMBO x{combo}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={onOpenShop}
            className="p-2 text-white/70 hover:text-sky-400 transition-colors"
          >
            <ShoppingCart size={22} strokeWidth={2} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <Settings size={22} strokeWidth={2} />
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center w-full px-1 mt-[-10px]">
        <div className="w-20" /> {/* Spacer for symmetry */}
        <button 
          onClick={onHint}
          className="p-2 text-white/70 hover:text-yellow-400 transition-colors"
        >
          <Lightbulb size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};

export default TopHUD;
