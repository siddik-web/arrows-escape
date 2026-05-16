import { useState, useEffect, useCallback } from 'react';
import { usePlayerState } from './hooks/usePlayerState';
import { useGameEngine } from './hooks/useGameEngine';
import GameCanvas from './components/Canvas/GameCanvas';
import TopHUD from './components/HUD/TopHUD';
import LivesHUD from './components/HUD/LivesHUD';
import WinModal from './components/Modals/WinModal';
import FailModal from './components/Modals/FailModal';
import ShopModal from './components/Modals/ShopModal';
import SettingsModal from './components/Modals/SettingsModal';
import LevelsModal from './components/Modals/LevelsModal';
import { THEMES, REVIVE_COST } from './constants/config';

const App: React.FC = () => {
  const { playerState, updatePlayerState, loading } = usePlayerState();
  const [themeIndex, setThemeIndex] = useState(0);
  const [settings, setSettings] = useState({
    sound: true,
    haptics: true,
    particles: true,
  });

  const [modals, setModals] = useState({
    shop: false,
    settings: false,
    levels: false,
    win: false,
    fail: false,
  });

  const [winStats, setWinStats] = useState({ shards: 0, score: 0 });

  const handleWin = useCallback((shards: number, score: number, level: number) => {
    setWinStats({ shards, score });
    setModals(prev => ({ ...prev, win: true }));
    
    updatePlayerState({
      shards: playerState.shards + shards,
      maxUnlockedLevel: Math.max(playerState.maxUnlockedLevel, level + 1)
    });
  }, [playerState.shards, playerState.maxUnlockedLevel, updatePlayerState]);

  const handleFail = useCallback(() => {
    setModals(prev => ({ ...prev, fail: true }));
  }, []);

  const { gameState, initLevel, handleTap, triggerHint } = useGameEngine(
    playerState,
    themeIndex,
    handleWin,
    handleFail,
    settings
  );

  useEffect(() => {
    if (!loading) {
      initLevel(playerState.maxUnlockedLevel);
    }
  }, [loading, initLevel]);



  if (loading) return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <div className="text-white font-black tracking-widest animate-pulse text-2xl">LOADING ENGINE...</div>
    </div>
  );

  const theme = THEMES[themeIndex];
  const gridDim = Math.min(3 + Math.floor(gameState.currentLevel / 4), 6);
  const cellSize = Math.min(window.innerWidth / (gridDim + 2), window.innerHeight / (gridDim + 4), 90);
  const offset = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden" style={{ backgroundColor: theme.bg }}>
      <div id="glitch-overlay" className={`fixed inset-0 pointer-events-none opacity-0 transition-opacity duration-100 z-0 ${gameState.isDeadlockShuffling ? 'opacity-100 bg-yellow-500/10' : ''}`} />

      <TopHUD 
        level={gameState.currentLevel}
        shards={playerState.shards}
        combo={gameState.comboMultiplier}
        onOpenShop={() => setModals(m => ({ ...m, shop: true }))}
        onOpenSettings={() => setModals(m => ({ ...m, settings: true }))}
        onOpenLevels={() => setModals(m => ({ ...m, levels: true }))}
        onHint={triggerHint}
        timeLeft={gameState.timeLeft}
        isTimerActive={gameState.isTimerActive}
      />

      <main className="flex-grow relative flex items-center justify-center">
        <GameCanvas 
          gameState={gameState}
          theme={theme}
          skin={playerState.equippedSkin}
          cellSize={cellSize}
          offset={offset}
          onTap={(x, y) => handleTap(x, y, offset, cellSize)}
        />
        <LivesHUD mistakes={gameState.mistakes} />
      </main>

      <ShopModal 
        isOpen={modals.shop}
        onClose={() => setModals(m => ({ ...m, shop: false }))}
        playerState={playerState}
        onUpdate={updatePlayerState}
      />

      <SettingsModal 
        isOpen={modals.settings}
        onClose={() => setModals(m => ({ ...m, settings: false }))}
        settings={settings}
        onUpdate={setSettings}
        themeIndex={themeIndex}
        onThemeChange={setThemeIndex}
      />

      <LevelsModal 
        isOpen={modals.levels}
        onClose={() => setModals(m => ({ ...m, levels: false }))}
        maxUnlocked={playerState.maxUnlockedLevel}
        currentLevel={gameState.currentLevel}
        onSelect={(lvl) => {
          initLevel(lvl);
          setModals(m => ({ ...m, levels: false }));
        }}
      />

      <WinModal 
        isOpen={modals.win}
        stats={winStats}
        mistakes={gameState.mistakes}
        onNext={() => {
          initLevel(gameState.currentLevel + 1);
          setModals(m => ({ ...m, win: false }));
        }}
      />

      <FailModal 
        isOpen={modals.fail}
        canRevive={playerState.shards >= REVIVE_COST}
        onRevive={() => {
            updatePlayerState({ shards: playerState.shards - REVIVE_COST });
            // Logic to revive game state...
            setModals(m => ({ ...m, fail: false }));
        }}
        onRetry={() => {
          initLevel(gameState.currentLevel);
          setModals(m => ({ ...m, fail: false }));
        }}
      />
    </div>
  );
};

export default App;
