import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, subtitle }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col"
        >
          <div className="p-6 pb-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <div>
              <h2 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                {title}
              </h2>
              {subtitle && <div className="mt-1">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto px-6 pb-20">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
