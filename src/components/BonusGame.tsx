import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Trophy, RefreshCw, Sparkles, User, MapPin, Package, Book } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BonusGameProps {
  onClose: () => void;
}

interface GridItem {
  id: string;
  type: 'character' | 'item' | 'place' | 'poem';
  label: string;
  color: string;
}

const GRID_SIZE = 7;
const TYPE_POOL = [
  { type: 'character', labels: ['李白', '杜甫', '孙悟空', '唐僧', '刘备', '贾宝玉', '林黛玉', '宋江'], color: '#3b82f6', icon: User },
  { type: 'item', labels: ['金箍棒', '九齿钉耙', '袈裟', '金玉良缘', '墨宝', '诗集'], color: '#f59e0b', icon: Package },
  { type: 'place', labels: ['长安', '大观园', '梁山泊', '赤壁', '蜀汉', '东海'], color: '#10b981', icon: MapPin },
  { type: 'poem', labels: ['静夜思', '春望', '赠汪伦', '侠客行', '将进酒'], color: '#a855f7', icon: Book },
];

export const BonusGame: React.FC<BonusGameProps> = ({ onClose }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [grid, setGrid] = useState<(GridItem | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [combo, setCombo] = useState(0);

  const generateRandomItem = useCallback((): GridItem => {
    const config = TYPE_POOL[Math.floor(Math.random() * TYPE_POOL.length)];
    const label = config.labels[Math.floor(Math.random() * config.labels.length)];
    return {
      id: Math.random().toString(36).substring(2, 11),
      type: config.type as any,
      label,
      color: config.color
    };
  }, []);

  const initGrid = useCallback(() => {
    const newGrid: (GridItem | null)[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: (GridItem | null)[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(generateRandomItem());
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, [generateRandomItem]);

  const findMatches = (currentGrid: (GridItem | null)[][]) => {
    const matches: { r: number; c: number }[] = [];
    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      let count = 1;
      for (let c = 1; c <= GRID_SIZE; c++) {
        if (c < GRID_SIZE && currentGrid[r][c]?.type === currentGrid[r][c - 1]?.type) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = 1; i <= count; i++) matches.push({ r, c: c - i });
          }
          count = 1;
        }
      }
    }
    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      let count = 1;
      for (let r = 1; r <= GRID_SIZE; r++) {
        if (r < GRID_SIZE && currentGrid[r][c]?.type === currentGrid[r - 1][c]?.type) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = 1; i <= count; i++) matches.push({ r: r - i, c });
          }
          count = 1;
        }
      }
    }
    return Array.from(new Set(matches.map(m => `${m.r}-${m.c}`))).map(s => {
      const [r, c] = s.split('-').map(Number);
      return { r, c };
    });
  };

  const processMatches = async (initialGrid?: (GridItem | null)[][]) => {
    setIsProcessing(true);
    let currentGrid = [...(initialGrid || grid).map(row => [...row])];
    let turnCombo = 0;

    const runTurn = async (): Promise<boolean> => {
      const matches = findMatches(currentGrid);
      if (matches.length === 0) return false;

      turnCombo++;
      setCombo(turnCombo);
      setScore(s => s + matches.length * 10 * turnCombo);

      // Clear
      matches.forEach(({ r, c }) => {
        currentGrid[r][c] = null;
      });
      setGrid([...currentGrid]);
      await new Promise(res => setTimeout(res, 250));

      // Gravity
      for (let c = 0; c < GRID_SIZE; c++) {
        let emptySpot = GRID_SIZE - 1;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (currentGrid[r][c] !== null) {
            currentGrid[emptySpot][c] = currentGrid[r][c];
            if (emptySpot !== r) currentGrid[r][c] = null;
            emptySpot--;
          }
        }
        for (let r = emptySpot; r >= 0; r--) {
          currentGrid[r][c] = generateRandomItem();
        }
      }
      setGrid([...currentGrid]);
      await new Promise(res => setTimeout(res, 250));
      return await runTurn();
    };

    await runTurn();
    setIsProcessing(false);
    setCombo(0);
  };

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    const nextGrid = [...grid.map(row => [...row])];
    const item1 = nextGrid[r1][c1];
    const item2 = nextGrid[r2][c2];
    
    nextGrid[r1][c1] = item2;
    nextGrid[r2][c2] = item1;
    
    setGrid(nextGrid);
    await new Promise(res => setTimeout(res, 200));

    const matches = findMatches(nextGrid);
    if (matches.length > 0) {
      processMatches(nextGrid);
    } else {
      // Swap back
      setGrid(grid);
    }
  };

  const handleClick = (r: number, c: number) => {
    if (isProcessing || gameState !== 'playing') return;
    if (!selectedPos) {
      setSelectedPos({ r, c });
    } else {
      const dr = Math.abs(r - selectedPos.r);
      const dc = Math.abs(c - selectedPos.c);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        handleSwap(selectedPos.r, selectedPos.c, r, c);
        setSelectedPos(null);
      } else {
        setSelectedPos({ r, c });
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      initGrid();
      setScore(0);
      setTimeLeft(60);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, initGrid]);

  useEffect(() => {
    if (gameState === 'end' && score > 0) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [gameState, score]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1e1b4b_0%,_#050510_100%)] opacity-50 pointer-events-none" />
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all z-50"
      >
        <X size={24} />
      </button>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center z-10"
          >
            <div className="w-24 h-24 bg-blue-600/20 border border-blue-600/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Sparkles size={48} className="text-blue-400" />
            </div>
            <h1 className="text-5xl font-serif text-white mb-4 tracking-tight">知识消消乐</h1>
            <p className="text-blue-200/60 mb-10 font-serif max-w-sm px-6">
              交换知识节点，将 3 个相同属性的实体对齐以释放能量！
            </p>
            <button 
              onClick={() => setGameState('playing')}
              className="px-16 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl shadow-2xl transition-all active:scale-95"
            >
              开始同步
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 z-10 w-full max-w-lg"
          >
            <div className="w-full flex justify-between items-end px-4">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 min-w-[120px]">
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">能量值</div>
                <div className="text-3xl font-serif text-white tabular-nums">{score}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-serif tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>
                  {timeLeft}s
                </div>
                {combo > 1 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-amber-500 font-serif italic text-lg">
                    连击 x{combo}!
                  </motion.div>
                )}
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/10 min-w-[120px] text-right">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">同步率</div>
                <div className="text-3xl font-serif text-white uppercase italic">High</div>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
              <div 
                className="grid gap-1.5"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                  width: 'min(90vw, 400px)',
                  height: 'min(90vw, 400px)'
                }}
              >
                {grid.map((row, r) => row.map((item, c) => {
                  const Icon = item ? TYPE_POOL.find(p => p.type === item.type)?.icon : null;
                  return (
                    <motion.div
                      key={item?.id || `empty-${r}-${c}`}
                      layoutId={item?.id}
                      onClick={() => handleClick(r, c)}
                      className={`relative rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${
                        selectedPos?.r === r && selectedPos?.c === c ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-20 scale-105' : ''
                      }`}
                      style={{ 
                        backgroundColor: item ? `${item.color}15` : 'transparent',
                        border: item ? `1px solid ${item.color}40` : 'none'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {item && Icon && (
                        <div className="flex flex-col items-center gap-1">
                          <Icon size={18} style={{ color: item.color }} strokeWidth={2.5} />
                          <span className="text-[8px] md:text-[9px] text-white/80 font-serif leading-none tracking-tighter text-center px-0.5">
                            {item.label}
                          </span>
                        </div>
                      )}
                      {item && (
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundColor: item.color }} />
                      )}
                    </motion.div>
                  );
                }))}
              </div>
            </div>
            
            <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold">
              交换节点 • 匹配属性 • 激活图谱
            </p>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-[#0d0d1f] p-12 rounded-[4rem] border border-white/10 shadow-2xl z-10 max-w-sm w-full mx-6"
          >
            <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-6 shadow-xl">
              <Trophy size={40} className="text-amber-500" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-2">同步任务完成</h2>
            <p className="text-blue-200/40 mb-10 font-serif text-sm italic">这些知识已被你永久收录</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">同步点</div>
                <div className="text-4xl font-serif text-white">{score}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">成就级别</div>
                <div className="text-3xl font-serif text-amber-500">
                  {score > 3000 ? '大师' : score > 1500 ? '专家' : '学者'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setGameState('playing')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> 再次挑战
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                返回
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
