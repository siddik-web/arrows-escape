import React from 'react';
import { Droplet } from 'lucide-react';

interface LivesHUDProps {
  mistakes: number;
}

const LivesHUD: React.FC<LivesHUDProps> = ({ mistakes }) => {
  return (
    <div className="fixed top-[4.5rem] left-5 flex gap-1 z-10">
      {[0, 1, 2].map((i) => (
        <Droplet
          key={i}
          size={18}
          className={`transition-colors duration-300 ${
            i < 3 - mistakes 
              ? 'text-blue-400 fill-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' 
              : 'text-zinc-700 opacity-30'
          }`}
        />
      ))}
    </div>
  );
};

export default LivesHUD;
