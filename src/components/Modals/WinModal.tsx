import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import { SFX } from '../../lib/audio';

interface WinModalProps {
  isOpen: boolean;
  stats: { shards: number, score: number };
  mistakes: number;
  onNext: () => void;
}

const WinModal: React.FC<WinModalProps> = ({ isOpen, stats, mistakes, onNext }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [displayShards, setDisplayShards] = useState(0);

  useEffect(() => {
    if (isOpen) {
      SFX.winChord();
      // Animate counts
      let start = 0;
      const scoreInterval = setInterval(() => {
        start += Math.ceil(stats.score / 20);
        if (start >= stats.score) {
          setDisplayScore(stats.score);
          clearInterval(scoreInterval);
        } else {
          setDisplayScore(start);
          SFX.countTick();
        }
      }, 50);
      
      setTimeout(() => {
        let sStart = 0;
        const shardInterval = setInterval(() => {
          sStart += Math.ceil(stats.shards / 20);
          if (sStart >= stats.shards) {
            setDisplayShards(stats.shards);
            clearInterval(shardInterval);
          } else {
            setDisplayShards(sStart);
            SFX.starPop();
          }
        }, 50);
      }, 1000);
    } else {
      setDisplayScore(0);
      setDisplayShards(0);
    }
  }, [isOpen, stats]);

  let stars = 3;
  let praise = "FLAWLESS!";
  let titleColor = "from-yellow-300 via-yellow-400 to-amber-500";
  if (mistakes === 1) {
    stars = 2;
    praise = "BRILLIANT!";
    titleColor = "from-blue-300 via-blue-400 to-indigo-500";
  } else if (mistakes >= 2) {
    stars = 1;
    praise = "NARROW ESCAPE!";
    titleColor = "from-emerald-300 via-emerald-400 to-teal-500";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[120]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center w-full max-w-sm px-6"
          >
            <div className="flex justify-center gap-3 mb-6 h-16">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={i < stars ? { scale: 1, rotate: 0 } : { scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
                >
                  <Star 
                    size={48} 
                    className={i < stars ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" : "text-zinc-800 opacity-50"} 
                  />
                </motion.div>
              ))}
            </div>

            <h2 className={`text-5xl font-black mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${titleColor} drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]`}>
              {praise}
            </h2>

            <div className="bg-zinc-900/80 rounded-2xl p-6 mb-4 border border-zinc-700/50 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-400 font-bold text-sm tracking-wider uppercase">Mission Points</span>
                <span className="text-white font-mono text-xl font-bold">{displayScore}</span>
              </div>
              
              <hr className="border-zinc-800 mb-4" />
              
              <div className="flex justify-between items-center">
                <span className="text-sky-300 font-black text-sm tracking-widest flex items-center gap-2">
                   SHARDS ACQUIRED
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-sky-400 rotate-45 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                  <span className="text-sky-400 font-mono text-2xl font-black">{displayShards}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={onNext}
              className="w-full py-4 bg-white text-black font-black tracking-widest rounded-full hover:bg-yellow-400 transition-all transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 mt-8"
            >
              NEXT STAGE <ChevronRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinModal;
