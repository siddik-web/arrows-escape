import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Fingerprint, Sparkles, Palette } from 'lucide-react';
import { THEMES } from '../../constants/config';
import { initAudio } from '../../lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: { sound: boolean; haptics: boolean; particles: boolean };
  onUpdate: (settings: any) => void;
  themeIndex: number;
  onThemeChange: (index: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate, themeIndex, onThemeChange }) => {
  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    onUpdate({ ...settings, [key]: newValue });
    if (key === 'sound' && newValue) initAudio();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex flex-col items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-700/50 rounded-3xl p-6 w-[90%] max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black tracking-widest text-white">SETTINGS</h2>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-800 rounded-full text-white/50 hover:text-white transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <ToggleRow 
                icon={<Volume2 size={18} />} 
                label="SOUND EFFECTS" 
                checked={settings.sound} 
                onChange={() => toggleSetting('sound')} 
              />
              <ToggleRow 
                icon={<Fingerprint size={18} />} 
                label="HAPTIC FEEDBACK" 
                checked={settings.haptics} 
                onChange={() => toggleSetting('haptics')} 
              />
              <ToggleRow 
                icon={<Sparkles size={18} />} 
                label="PARTICLE EFFECTS" 
                checked={settings.particles} 
                onChange={() => toggleSetting('particles')} 
              />
            </div>

            <hr className="border-zinc-800 mb-6" />

            <div className="mb-2">
              <span className="font-semibold text-sm tracking-wider text-zinc-300 block mb-3 flex items-center gap-2">
                <Palette size={16} /> COLOR THEME
              </span>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((theme, i) => (
                  <button
                    key={theme.name}
                    onClick={() => onThemeChange(i)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border-2 ${
                      themeIndex === i 
                        ? 'bg-blue-600 text-white border-white shadow-lg' 
                        : 'bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700'
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ToggleRow = ({ icon, label, checked, onChange }: { icon: React.ReactNode, label: string, checked: boolean, onChange: () => void }) => (
  <div className="flex items-center justify-between">
    <span className="font-semibold text-sm tracking-wider text-zinc-300 flex items-center gap-2">
      {icon} {label}
    </span>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-sky-600' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default SettingsModal;
