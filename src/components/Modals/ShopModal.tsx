import React from 'react';
import Modal from './Modal';
import type { PlayerState } from '../../types/game';
import { SHOP_ITEMS } from '../../constants/config';
import { SFX } from '../../lib/audio';
import { ShoppingBag } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onUpdate: (updates: Partial<PlayerState>) => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, playerState, onUpdate }) => {
  const handleBuy = (id: string, type: 'skin' | 'trail', cost: number) => {
    if (playerState.shards >= cost) {
      const updates: Partial<PlayerState> = { shards: playerState.shards - cost };
      if (type === 'skin') {
        updates.unlockedSkins = [...playerState.unlockedSkins, id];
        updates.equippedSkin = id;
      } else {
        updates.unlockedTrails = [...playerState.unlockedTrails, id];
        updates.equippedTrail = id;
      }
      onUpdate(updates);
      SFX.purchase();
    } else {
      SFX.tapError();
    }
  };

  const handleEquip = (id: string, type: 'skin' | 'trail') => {
    onUpdate(type === 'skin' ? { equippedSkin: id } : { equippedTrail: id });
    SFX.tapSuccess(1);
  };

  const renderItem = (item: any, type: 'skin' | 'trail') => {
    const isUnlocked = type === 'skin' ? playerState.unlockedSkins.includes(item.id) : playerState.unlockedTrails.includes(item.id);
    const isEquipped = type === 'skin' ? playerState.equippedSkin === item.id : playerState.equippedTrail === item.id;
    const canAfford = playerState.shards >= item.cost;

    return (
      <div key={item.id} className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-xl flex flex-col justify-between h-full hover:border-sky-500/30 transition-colors">
        <div>
          <h4 className="font-bold text-sm tracking-wider text-white">{item.name}</h4>
          <p className="text-xs text-zinc-400 mt-1 mb-4 h-8">{item.desc}</p>
        </div>
        
        {isEquipped ? (
          <button disabled className="w-full py-2 bg-zinc-800 text-sky-400 font-bold rounded-lg opacity-50 cursor-default text-xs tracking-widest border border-sky-500/30">
            EQUIPPED
          </button>
        ) : isUnlocked ? (
          <button 
            onClick={() => handleEquip(item.id, type)}
            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg text-xs tracking-widest transition-colors border border-zinc-600"
          >
            EQUIP
          </button>
        ) : (
          <button 
            onClick={() => handleBuy(item.id, type, item.cost)}
            disabled={!canAfford}
            className={`w-full py-2 flex items-center justify-center gap-1 font-bold rounded-lg text-xs tracking-widest transition-all ${
              canAfford 
                ? "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]" 
                : "bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="w-3 h-3 bg-current rotate-45 mr-1" />
            {item.cost}
          </button>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ARMORY"
      subtitle={
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-3.5 h-3.5 bg-sky-400 rotate-45 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
          <span className="font-bold text-sm tracking-wider text-sky-400">{playerState.shards}</span>
        </div>
      }
    >
      <h3 className="text-xs font-black tracking-widest text-zinc-500 mb-3 mt-4 flex items-center gap-2">
        <ShoppingBag size={14} /> ARROW SKINS
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {SHOP_ITEMS.skins.map(item => renderItem(item, 'skin'))}
      </div>
      
      <h3 className="text-xs font-black tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
        <ShoppingBag size={14} /> TRAIL EFFECTS
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {SHOP_ITEMS.trails.map(item => renderItem(item, 'trail'))}
      </div>
    </Modal>
  );
};

export default ShopModal;
